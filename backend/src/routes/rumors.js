import { Router } from 'express';
import * as rumorService from '../services/rumors.js';
import { checkRumorLimit, getAnonymousId } from '../middleware/rateLimit.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { content, creator_id } = req.body ?? {};
    if (!content || typeof content !== 'string' || !creator_id) {
      return res.status(400).json({ error: 'content and creator_id required' });
    }
    const id = getAnonymousId(req) ?? creator_id;
    const limit = checkRumorLimit(id);
    if (!limit.ok) return res.status(429).json({ error: limit.error });
    const rumor = await rumorService.createRumor(content.trim(), creator_id);
    res.status(201).json(rumor);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to create rumor' });
  }
});

router.get('/', async (req, res) => {
  try {
    const includeDeleted = req.query.include_deleted === '1';
    const rumors = await rumorService.listRumors(includeDeleted);
    res.json(rumors);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to list rumors' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rumor = await rumorService.getRumor(req.params.id);
    if (!rumor) return res.status(404).json({ error: 'Rumor not found' });
    res.json(rumor);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to get rumor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const creatorId = req.body?.creator_id ?? req.headers['x-creator-id'];
    if (!creatorId) {
      return res.status(400).json({ error: 'creator_id required (body or X-Creator-Id header)' });
    }
    const rumor = await rumorService.softDeleteRumor(req.params.id, creatorId);
    if (!rumor) return res.status(404).json({ error: 'Rumor not found' });
    res.json(rumor);
  } catch (e) {
    const code = e.statusCode || 500;
    res.status(code).json({ error: e.message || 'Failed to delete rumor' });
  }
});

export default router;
