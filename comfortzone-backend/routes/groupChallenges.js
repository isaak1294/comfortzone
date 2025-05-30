const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const prisma = new PrismaClient();

router.get('/groupChallenge/:date', async(req, res) => {
    const date = new Date(req.params.date);
    try{
        const challenge = await prisma.challenge.findUnique({
            where: { date },
        });

        if (!challenge) return res.status(404).json({ error: 'No challenge for this date.'});
        res.json(challenge);
    }   catch (err) {
        console.error('Error fetching challenge:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/groupCompletions', requireAuth, async (req, res) => {
  try {
    const completions = await prisma.groupChallengeCompletion.findMany({
      where: { userId: req.user.id },
    });

    const result = completions.reduce((acc, entry) => {
      const dateStr = entry.date.toISOString().split('T')[0];
      acc[dateStr] = {
        completed: entry.completed,
        completedAt: entry.completedAt.toISOString(),
      };

      return acc;
    }, {});

    res.json(result);
  } catch (err) {
    console.error('Error fetching completions:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});


router.post('/groupCompletions', requireAuth, async (req, res) => {
  const { date, completed = true } = req.body;
  const now = new Date();

  if (!date) return res.status(400).json({ error: 'Missing date' });

  try {
    const existing = await prisma.groupChallengeCompletion.findUnique({
      where: {
        userId_date: {
          userId: req.user.id,
          date: new Date(date),
        },
      },
    });

    if (existing) {
      const updated = await prisma.groupChallengeCompletion.update({
        where: {
          userId_date: {
            userId: req.user.id,
            date: new Date(date),
          },
        },
        data: { 
            completed,
            completedAt: now,
         },
      });

      return res.json({ message: 'Updated completion', result: updated });
    }

    const created = await prisma.groupChallengeCompletion.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        completed,
        completedAt: now,
      },
    });

    res.status(201).json({ message: 'Created completion', result: created });
  } catch (err) {
    console.error('Error toggling completion:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;