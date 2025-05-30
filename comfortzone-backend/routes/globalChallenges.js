const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const prisma = new PrismaClient();

router.get('/globalChallenge/:date', async(req, res) => {
    const date = new Date(req.params.date);
    try{
        const challenge = await prisma.globalChallenge.findUnique({
            where: { date },
        });

        if (!challenge) return res.status(404).json({ error: 'No challenge for this date.'});
        res.json(challenge);
    }   catch (err) {
        console.error('Error fetching challenge:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/globalCompletions', requireAuth, async (req, res) => {
  try {
    const completions = await prisma.globalChallengeCompletion.findMany({
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


router.post('/globalCompletions', requireAuth, async (req, res) => {
  const { date, completed = true } = req.body;

  if (!date) return res.status(400).json({ error: 'Missing date' });

  try {
    const userId = req.user.id;
    const targetDate = new Date(date);
    const challenge = await prisma.globalChallenge.findUnique({
      where: { date: new Date(date) },
    });

    const existing = await prisma.globalChallengeCompletion.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    const now = new Date();

    const result = existing
      ? await prisma.globalChallengeCompletion.update({
          where: {
            userId_date: {
              userId,
              date: targetDate,
            },
          },
          data: { completed, completedAt: now },
        })
      : await prisma.globalChallengeCompletion.create({
        data: {
          userId: req.user.id, // or hardcoded user ID for testing
          challengeId: challenge.id, // required: must exist
          date: new Date(date),
          completed,
          completedAt: new Date(),
        },
      });


    res.status(existing ? 200 : 201).json({ message: existing ? 'Updated' : 'Created', result });
  } catch (err) {
    console.error('Error toggling completion:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;