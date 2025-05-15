const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get current user's groups:
router.get('/my-groups', requireAuth, async (req, res) => {
  try {
    const userGroups = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            challenges: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const groups = userGroups.map((membership) => {
      const { group } = membership;
      return {
        id: group.id,
        name: group.name,
        description: group.description,
        currentChallenge: group.challenges[0] || null
      };
    });

    res.json(groups);
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Create new group:
router.post('/', requireAuth, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const newGroup = await tx.Group.create({
                data: {
                    name,
                    description,
                },
            });

            await tx.groupMember.create({
                data: {
                    userId: req.user.id,
                    groupId: newGroup.id,  
                },
            });

            return newGroup;
        });

        res.status(201).json({
            id: result.id,
            name: result.name,
            description: result.description,
            currentChallenge: null,
        });
    }   catch (err) {
        console.error('Error creating group:', err);
        res.status(500).json({ error: 'Internal server error'});
    }
});

// Accept or decline an invite
router.post('/invites/:inviteId/respond', requireAuth, async (req, res) => {
  const { accepted } = req.body;

  try {
    const invite = await prisma.messageCenter.findUnique({
      where: { id: req.params.inviteId },
      include: { group: true },
    });

    if (!invite || invite.recipientEmail !== req.user.email) {
      return res.status(403).json({ error: 'Invite not found or not addressed to you' });
    }

    if (invite.accepted !== null) {
      return res.status(400).json({ error: 'Invite already responded to' });
    }

    const updatedInvite = await prisma.$transaction(async (tx) => {
      const updated = await tx.messageCenter.update({
        where: { id: req.params.inviteId },
        data: { accepted, read: true },
      });

      if (accepted) {
        await tx.groupMember.create({
          data: {
            userId: req.user.id,
            groupId: invite.groupId,
          },
        });
      }

      return updated;
    });

    res.json(updatedInvite);
  } catch (err) {
    console.error('Error responding to invite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's message center (invites)
router.get('/my-invites', requireAuth, async (req, res) => {
  try {
    const invites = await prisma.messageCenter.findMany({
      where: { recipientEmail: req.user.email },
      include: {
        sender: { select: { username: true, email: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(invites);
  } catch (err) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Get a specific group with its members, challenges, and messages:
router.get('/:groupId', requireAuth, async (req, res) => {
    try {
        // Check if user is a member of this group:
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                }
            }
        });

        if(!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const group = await prisma.group.findUnique({
            where: { id: req.params.groupId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                profilePicture: true
                            }
                        }
                    }
                },
                challenges: {
                    orderBy: {
                        date: 'desc'
                    },
                    take: 1,
                    include: {
                        completions: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        email: true,
                                        profilePicture: true
                                    }
                                }
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                email: true,
                                profilePicture: true
                            }
                        }
                    },
                    take: 100 // Limit to last 100 messages
                }
            }
        });

        if(!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(group);
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new challenge for a group:
router.post('/:groupId/challenges', requireAuth, async (req, res) => {
    const { title, description, date } = req.body;

    if(!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    try {
        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const challenge = await prisma.challenge.create({
            data: {
                title,
                description,
                date: date ? new Date(date) : new Date(),
                groupId: req.params.groupId
            }
        });

        res.status(201).json(challenge);
    } catch (err) {
        console.error('Error creating challenge:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Complete a challenge
router.post('/:groupId/challenges/:challengeId/complete', requireAuth, async (req, res) => {
    try {
        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // Get the challenge
        const challenge = await prisma.challenge.findUnique({
            where: { id: req.params.challengeId }
        });

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        // Create or update completion
        const completion = await prisma.challengeCompletion.upsert({
            where: {
                userId_date: {
                    userId: req.user.id,
                    date: challenge.date
                }
            },
            update: {
                completed: true,
                completedAt: new Date(),
                challengeId: challenge.id
            },
            create: {
                userId: req.user.id,
                date: challenge.date,
                completed: true,
                completedAt: new Date(),
                challengeId: challenge.id
            }
        });

        res.status(200).json(completion);
    } catch (err) {
        console.error('Error completing challenge:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send a message to a group
router.post('/:groupId/messages', requireAuth, async (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
    }

    try {
        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const message = await prisma.groupMessage.create({
            data: {
                content,
                userId: req.user.id,
                groupId: req.params.groupId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });

        res.status(201).json(message);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages for a group
router.get('/:groupId/messages', requireAuth, async (req, res) => {
    try {
        // Check membership
        const membership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: req.user.id,
                    groupId: req.params.groupId
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        const messages = await prisma.groupMessage.findMany({
            where: { groupId: req.params.groupId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        profilePicture: true
                    }
                }
            },
            take: 100 // Limit to last 100 messages
        });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/:groupId/invite', requireAuth, async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check membership
    const membership = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: req.user.id,
          groupId: req.params.groupId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Check if recipient exists and isn't already a member
    const recipient = await prisma.user.findUnique({ where: { email } });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: recipient.id,
          groupId: req.params.groupId,
        },
      },
    });
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this group' });
    }

    const invite = await prisma.messageCenter.create({
      data: {
        senderId: req.user.id,
        recipientEmail: email,
        groupId: req.params.groupId,
      },
      include: {
        group: { select: { name: true } },
        sender: { select: { username: true, email: true } },
      },
    });

    res.status(201).json(invite);
  } catch (err) {
    console.error('Error sending invite:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;