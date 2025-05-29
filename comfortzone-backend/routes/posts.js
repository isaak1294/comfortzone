// comfortzone-backend/routes/posts.js
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Create a new post
router.post('/', requireAuth, async (req, res) => {
  const { content, image, isPublic } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content is required' });
  }

  try {
    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        content,
        image: image || null,
        isPublic: isPublic !== undefined ? isPublic : true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get posts for the social feed (public or friends-only based on filter)
router.get('/', requireAuth, async (req, res) => {
  const { filter } = req.query; // 'public', 'private', or undefined for all

  try {
    let posts;
    if (filter === 'public') {
      posts = await prisma.post.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        take: 50, // Limit to 50 most recent posts
      });
    } else if (filter === 'private') {
      // Get user's friends
      const friendships = await prisma.friendship.findMany({
        where: { userId: req.user.id },
        select: { friendId: true },
      });
      const friendIds = friendships.map(f => f.friendId);

      posts = await prisma.post.findMany({
        where: {
          OR: [
            { userId: req.user.id }, // User's own posts
            { userId: { in: friendIds }, isPublic: false }, // Friends' private posts
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        take: 50,
      });
    } else {
      // All posts (public + friends' private)
      const friendships = await prisma.friendship.findMany({
        where: { userId: req.user.id },
        select: { friendId: true },
      });
      const friendIds = friendships.map(f => f.friendId);

      posts = await prisma.post.findMany({
        where: {
          OR: [
            { isPublic: true }, // Public posts
            { userId: req.user.id }, // User's own posts
            { userId: { in: friendIds }, isPublic: false }, // Friends' private posts
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilePicture: true,
            },
          },
        },
        take: 50,
      });
    }

    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a friend request
router.post('/friend-request', requireAuth, async (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Find the user by username
    const recipient = await prisma.user.findUnique({ where: { username } });
    if (!recipient) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (recipient.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot add yourself as a friend' });
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: req.user.id,
          friendId: recipient.id,
        },
      },
    });

    if (existingFriendship) {
      return res.status(400).json({ error: 'You are already friends with this user' });
    }

    // Check if a pending request already exists
    const existingRequest = await prisma.messageCenter.findFirst({
      where: {
        senderId: req.user.id,
        recipientEmail: recipient.email,
        type: 'friend_request',
        accepted: null,
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create a friend request message
    const friendRequest = await prisma.messageCenter.create({
      data: {
        senderId: req.user.id,
        recipientEmail: recipient.email,
        message: `${req.user.username || req.user.email} wants to be your friend!`,
        type: 'friend_request',
      },
      include: {
        sender: { select: { username: true, email: true } },
      },
    });

    res.status(201).json(friendRequest);
  } catch (err) {
    console.error('Error sending friend request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's friends
router.get('/friends', requireAuth, async (req, res) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { 
        OR: [
          { userId: req.user.id },
          { friendId: req.user.id }
        ]
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    // Map to get unique friends (could be either the user or friend field)
    const friends = friendships.map(f => 
      f.userId === req.user.id ? f.friend : f.user
    );
    
    // Remove duplicates by creating a Map with id as key
    const uniqueFriends = Array.from(
      new Map(friends.map(friend => [friend.id, friend])).values()
    );
    
    res.json(uniqueFriends);
  } catch (err) {
    console.error('Error fetching friends:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;