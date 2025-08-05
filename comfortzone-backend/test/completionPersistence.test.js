const request = require('supertest');
const app = require('../index.js'); // Your Express app
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testUserToken = 'test-token'; // Replace or mock auth

const TEST_DATE = new Date('2025-05-20');

beforeAll(async () => {
  // Optional: create test user + cleanup
});

afterAll(async () => {
  await prisma.globalChallengeCompletion.deleteMany({
    where: { date: TEST_DATE },
  });
  await prisma.$disconnect();
});

test('persists completion across sessions', async () => {
  // Step 1: Submit a completion
  const postRes = await request(app)
    .post('/api/globalCompletions')
    .set('Authorization', `Bearer ${testUserToken}`)
    .send({ date: TEST_DATE, completed: true });

  expect(postRes.status).toBe(200);

  // Step 2: Simulate "relogin" and fetch completions
  const getRes = await request(app)
    .get('/api/globalCompletions')
    .set('Authorization', `Bearer ${testUserToken}`);

  expect(getRes.status).toBe(200);
  expect(getRes.body[TEST_DATE]).toBeDefined();
  expect(getRes.body[TEST_DATE].completed).toBe(true);
});
