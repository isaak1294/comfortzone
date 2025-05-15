const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
module.exports = router;
const users = {};

router.post('/register', async (req, res) => {
  const { email, username, password, profilePicture } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  const existingUsername = await prisma.user.findUnique({ where: { username } });

  if (existingEmail || existingUsername) {
    return res.status(400).json({ error: 'Email or username already in use' });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      username,
      password: hashed,
      profilePicture: profilePicture || null,
    },
  });

  res.status(201).json({ message: 'User created' });
});


router.post('/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  return res.json({
    token,
    email: user.email,
    username: user.username,
    profilePicture: user.profilePicture,
    id: user.id,
  });
});

