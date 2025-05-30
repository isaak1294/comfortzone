// routes/user.js
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        profilePicture: true,
        emailVerified: true,
        bio: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

// Get user's friends
router.get('/friends', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all friendships where the user is either the user or the friend
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: userId },
          { friendId: userId }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        lastMessageTime: 'desc' // Sort by most recent messages first
      }
    });
    
    // Transform the data to get a clean list of friends
    const friends = friendships.map(friendship => {
      // If the current user is the "user" in the friendship, return the "friend"
      if (friendship.userId === userId) {
        return friendship.friend;
      }
      // Otherwise return the "user"
      return friendship.user;
    });
    
    res.json(friends);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/user/:userID', requireAuth, async (req, res) => {
  const { userID } = req.params;
  const { bio } = req.body;

  try {
    const updatedBio = await prisma.user.update({
      where: { id: userID },
      data: {
        ...(bio !== undefined && { bio })
      },
    });

    res.json(updatedBio);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends of a specific user
router.get('/user/:username/friends', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get all friendships where the user is either the user or the friend
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: user.id },
          { friendId: user.id }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        },
        friend: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    });
    
    // Transform the data to get a clean list of friends
    const friends = friendships.map(friendship => {
      // If the requested user is the "user" in the friendship, return the "friend"
      if (friendship.userId === user.id) {
        return friendship.friend;
      }
      // Otherwise return the "user"
      return friendship.user;
    });
    
    res.json(friends);
  } catch (err) {
    console.error('Error fetching user friends:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile by username
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        profilePicture: true,
        bio: true,
        // We'll also get the latest challenge completion to calculate streak
        globalCompletions: {
          orderBy: {
            completedAt: 'desc'
          },
          take: 30 // Get enough completions to calculate streak
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const sortedCompletions = user.completions
      .filter(c => c.completed)
      .map(c => new Date(c.completedAt))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const date of sortedCompletions) {
      const completedDate = new Date(date);
      completedDate.setHours(0, 0, 0, 0);

      const diffInDays = Math.floor((currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        streak++;
      } else if (diffInDays === 1) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    const { completions, ...userProfile } = user;

    res.json({
      ...userProfile,
      streak
    });

  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/dm', requireAuth, async (req, res) => {
  const { recipientId, content } = req.body;
  
  if (!recipientId || !content?.trim()) {
    return res.status(400).json({ error: 'Recipient and message content are required' });
  }
  
  try {
    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId: recipientId },
          { userId: recipientId, friendId: req.user.id }
        ]
      }
    });
    
    if (!friendship) {
      return res.status(403).json({ error: 'You can only message your friends' });
    }
    
    // Create the direct message
    const message = await prisma.directMessage.create({
      data: {
        content,
        senderId: req.user.id,
        recipientId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    });
    
    // Update the last message time in the friendship
    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { lastMessageTime: new Date() }
    });
    
    res.status(201).json(message);
  } catch (err) {
    console.error('Error sending direct message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dm/:friendId', requireAuth, async (req, res) => {
  const { friendId } = req.params;
  
  try {
    // Check if users are friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: req.user.id, friendId },
          { userId: friendId, friendId: req.user.id }
        ]
      }
    });
    
    if (!friendship) {
      return res.status(403).json({ error: 'You can only view messages with your friends' });
    }
    
    // Get messages between the two users
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id, recipientId: friendId },
          { senderId: friendId, recipientId: req.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilePicture: true
          }
        }
      }
    });
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching direct messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;