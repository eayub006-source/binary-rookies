import { Router } from 'express';
import identityRouter from './identity.js';
import rumorsRouter from './rumors.js';
import votesRouter from './votes.js';

const router = Router();
router.use('/identity', identityRouter);
router.use('/rumors', rumorsRouter);
router.use('/votes', votesRouter);
export default router;
