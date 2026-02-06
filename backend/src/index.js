import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { runFinalizationJob } from './services/trust.js';
import prisma from './db/prisma.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
const FINALIZATION_JOB_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api', routes);

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.listen(PORT, async () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  try {
    await prisma.user.findFirst();
    console.log('Database connected (Prisma).');
  } catch (e) {
    console.error('Database connection check failed:', e.message);
  }
  runFinalizationJob().catch((e) => console.error('Initial finalization run:', e));
  setInterval(() => runFinalizationJob().catch((e) => console.error('Finalization job:', e)), FINALIZATION_JOB_INTERVAL_MS);
});
