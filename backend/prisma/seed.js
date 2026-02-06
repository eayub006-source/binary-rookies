import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString ? new PrismaPg({ connectionString }) : undefined;
const prisma = new PrismaClient(adapter ? { adapter } : {});

const R1 = 'a0000001-0001-4000-8000-000000000001';
const R2 = 'a0000001-0001-4000-8000-000000000002';
const R3 = 'a0000001-0001-4000-8000-000000000003';
const R4 = 'a0000001-0001-4000-8000-000000000004';
const R5 = 'a0000001-0001-4000-8000-000000000005';

async function main() {
  await prisma.user.createMany({
    data: [
      { anonymous_id: 'seed_anon_1', reputation_score: 0.1 },
      { anonymous_id: 'seed_anon_2', reputation_score: 0.5 },
      { anonymous_id: 'seed_anon_3', reputation_score: 0.8 },
      { anonymous_id: 'seed_anon_4', reputation_score: 0.3 },
      { anonymous_id: 'seed_anon_5', reputation_score: 0.1 },
    ],
    skipDuplicates: true,
  });

  const eightDaysAgo = new Date(Date.now() - 8 * 86400000);
  const oneDayAgo = new Date(Date.now() - 86400000);

  await prisma.rumor.createMany({
    data: [
      { id: R1, content: 'The new library opens next Monday.', creator_id: 'seed_anon_1', created_at: eightDaysAgo, final_trust_score: 0.72, finalized_at: oneDayAgo },
      { id: R2, content: 'Campus cafe is raising prices next week.', creator_id: 'seed_anon_2' },
      { id: R3, content: 'There will be a guest lecture on AI this Friday.', creator_id: 'seed_anon_1' },
      { id: R4, content: 'Dorms will get new WiFi in March.', creator_id: 'seed_anon_3' },
      { id: R5, content: 'This rumor was removed by creator (soft-delete demo).', creator_id: 'seed_anon_4', deleted_at: new Date() },
    ],
    skipDuplicates: true,
  });

  await prisma.vote.createMany({
    data: [
      { rumor_id: R1, voter_id: 'seed_anon_2', vote: 'true' },
      { rumor_id: R1, voter_id: 'seed_anon_3', vote: 'true' },
      { rumor_id: R1, voter_id: 'seed_anon_4', vote: 'false' },
      { rumor_id: R2, voter_id: 'seed_anon_1', vote: 'true' },
      { rumor_id: R2, voter_id: 'seed_anon_3', vote: 'neutral' },
      { rumor_id: R3, voter_id: 'seed_anon_2', vote: 'true' },
      { rumor_id: R3, voter_id: 'seed_anon_5', vote: 'true' },
      { rumor_id: R4, voter_id: 'seed_anon_1', vote: 'false' },
      { rumor_id: R4, voter_id: 'seed_anon_2', vote: 'neutral' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
