import { Router } from 'express';
import identityRouter from './identity.js';
import rumorsRouter from './rumors.js';
import votesRouter from './votes.js';
import healthRouter from './health.js';

const router = Router();
router.use('/health', healthRouter);
router.use('/identity', identityRouter);
router.use('/rumors', rumorsRouter);
router.use('/votes', votesRouter);
export default router;
