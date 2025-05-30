import { PrismaClient } from '@prisma/client';
import cuid from 'cuid';
import promptSync from 'prompt-sync';

const prisma = new PrismaClient();
const prompt = promptSync();

const BASE_DATE = new Date('2025-05-01');

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  // Find latest challenge date
  const latestChallenge = await prisma.globalChallenge.findFirst({
    orderBy: { date: 'desc' },
  });

  let nextDate = latestChallenge ? addDays(latestChallenge.date, 1) : BASE_DATE;

  console.log(`Starting from ${nextDate.toDateString()}`);
  console.log("Press enter on an empty title to stop.\n");

  while (true) {
    const title = prompt(`Challenge for ${nextDate.toDateString()} - Title: `);
    if (!title.trim()) break;

    const description = prompt('Description: ');
    const challenge = await prisma.globalChallenge.create({
      data: {
        id: cuid(),
        title,
        description,
        date: nextDate,
      },
    });

    console.log(`✅ Added "${title}" for ${nextDate.toDateString()}\n`);

    nextDate = addDays(nextDate, 1);
  }

  console.log('✅ Done adding challenges.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
