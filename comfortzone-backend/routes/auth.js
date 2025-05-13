const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
module.exports = router;
const users = {};

router.post('/register', async (req, res) => {
    const { email, password, username, profilePicture } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
    data: {
        email,
        password: hashed,
        username: username || 'Anonymous',
        profilePicture: profilePicture || null,
    },
    });
    res.status(201).json({ message: 'User created' });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  return res.json({
    token,
    email: user.email,
    username: user.username,
    profilePicture: user.profilePicture,
  });
});

