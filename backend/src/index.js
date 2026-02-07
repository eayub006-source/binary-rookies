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
  res.json({ ok: true, demo: !!process.env.USE_DEMO_STORE });
});

async function start() {
  const forceDemo = process.env.USE_DEMO_STORE === '1';
  if (forceDemo) {
    console.log('Using in-memory demo store (USE_DEMO_STORE=1). No database required.');
  } else {
    try {
      await prisma.user.findFirst();
      console.log('Database connected (Prisma).');
    } catch (e) {
      if (e.code === 'P1017' || (e.message && e.message.includes('closed the connection'))) {
        process.env.USE_DEMO_STORE = '1';
        console.log('Database unreachable; using in-memory demo store. Set USE_DEMO_STORE=1 in .env to skip DB check.');
      } else {
        console.error('Database connection check failed:', e.message);
        process.env.USE_DEMO_STORE = '1';
        console.log('Falling back to in-memory demo store.');
      }
    }
  }
  if (!process.env.USE_DEMO_STORE) {
    runFinalizationJob().catch((e) => console.error('Initial finalization run:', e));
    setInterval(() => runFinalizationJob().catch((e) => console.error('Finalization job:', e)), FINALIZATION_JOB_INTERVAL_MS);
  }
  const host = '0.0.0.0';
  app.listen(PORT, host, () => {
    console.log(`Backend listening on http://localhost:${PORT} (and on network)`);
  });
}
start();
