import { Router } from 'express';
import prisma from '../db/prisma.js';

const router = Router();

router.get('/db', async (_, res) => {
  try {
    await prisma.user.findFirst();
    res.json({ ok: true, db: 'connected' });
  } catch (e) {
    const hint = e.message?.includes('schema') || e.message?.includes('relation') || e.message?.includes('table') || e.message?.includes('exist')
      ? ' Run: npm run db:push (and set DATABASE_URL + DIRECT_URL in .env from Supabase Connect → ORMs → Prisma).'
      : '';
    res.status(503).json({
      ok: false,
      db: 'error',
      message: e.message + hint,
    });
  }
});

export default router;
