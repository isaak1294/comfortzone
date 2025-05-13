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


//Get a specific group with its members and challenges:
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
                                profilePicture: true
                            }
                        }
                    }
                },
                challenges: {
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        });

        if(!group) {
            return res.status(404).json({ error: 'Group not found' });
        }

        res.json(group);
    }   catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Create a new challenge for a group:
router.post('/:groupId/challenges', requireAuth, async (req, res) => {
    const { title, description } = req.body;

    if(!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    try {
        // Check membership
        const membership = await prisma.groupMember.findUnique( {
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
                groupId: req.params.groupId
            }
        });

        res.status(201).json(challenge);
    }   catch (err) {
        console.error('Error creating challenge:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;