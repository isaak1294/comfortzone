const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const { email, username, profilePicture } = user;
    res.json({ email, username, profilePicture });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
