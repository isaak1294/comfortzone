import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.challenge.createMany({
    data: [
      {
        title: "Do 10 pushups",
        description: "Get your blood flowing!",
        date: new Date("2025-05-11"),
      },
      {
        title: "Talk to a stranger",
        description: "Ask someone how their day is going.",
        date: new Date("2025-05-12"),
      },
      {
        title: "Do a backflip",
        description: "Ask someone how their day is going.",
        date: new Date("2025-05-13"),
      },
      {
        title: "Fight a homeless person",
        description: "Ask someone how their day is going.",
        date: new Date("2025-05-14"),
      },
      // Add more...
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());