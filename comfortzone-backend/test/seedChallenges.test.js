const { PrismaClient } = require('@prisma/client');
const cuid = require('cuid');

const prisma = new PrismaClient();

const BASE_DATE = new Date('2025-06-01');
const DAYS_IN_MONTH = 30;

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

beforeAll(async () => {
  await prisma.globalChallengeCompletion.deleteMany({
    where: {
      challenge: {
        date: {
          gte: BASE_DATE,
          lte: new Date('2025-06-30'),
        },
      },
    },
  });

  await prisma.globalChallenge.deleteMany({
    where: {
      date: {
        gte: BASE_DATE,
        lte: new Date('2025-06-30'),
      },
    },
  });
});


afterAll(async () => {
  await prisma.$disconnect();
});

test('Populate June 2025 with test challenges', async () => {
  for (let i = 0; i < DAYS_IN_MONTH; i++) {
    const date = addDays(BASE_DATE, i);
    await prisma.globalChallenge.create({
      data: {
        id: cuid(),
        title: `Challenge ${i + 1}`,
        description: `This is test challenge ${i + 1}`,
        date,
      },
    });
  }

  const inserted = await prisma.globalChallenge.count({
    where: {
      date: {
        gte: BASE_DATE,
        lte: new Date('2025-06-30'),
      },
    },
  });

  expect(inserted).toBe(DAYS_IN_MONTH);
});
