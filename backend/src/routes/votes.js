import { Router } from 'express';
import { castVote } from '../services/votes.js';
import { checkVoteLimit, getAnonymousId } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { rumor_id, voter_id, vote } = req.body ?? {};
    if (!rumor_id || !voter_id || vote === undefined) {
      return res.status(400).json({ error: 'rumor_id, voter_id, and vote required' });
    }
    const id = getAnonymousId(req) ?? voter_id;
    const limit = checkVoteLimit(id);
    if (!limit.ok) return res.status(429).json({ error: limit.error });
    const result = await castVote(rumor_id, voter_id, vote);
    res.status(201).json(result);
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ error: e.message || 'Vote failed' });
  }
});

export default router;
