import prisma from '../db/prisma.js';
import { rumorById, rumorByIdAny, rumorsAll } from '../db/queries.js';
import { enrichRumor, enrichRumors } from './trustEnrich.js';
import * as demo from '../db/demoStore.js';

function useDemo() {
  return process.env.USE_DEMO_STORE === '1';
}

export async function createRumor(content, creatorId) {
  if (useDemo()) return demo.demoCreateRumor(String(content).trim(), creatorId);
  return prisma.rumor.create({
    data: { content: String(content).trim(), creator_id: creatorId },
  });
}

export async function listRumors(includeDeleted = false) {
  if (useDemo()) return demo.demoListRumors(includeDeleted);
  const list = await rumorsAll(includeDeleted);
  return enrichRumors(list);
}

export async function getRumor(id) {
  if (useDemo()) return demo.demoGetRumor(id);
  const data = await rumorById(id);
  return data ? enrichRumor(data) : null;
}

export async function softDeleteRumor(id, creatorId) {
  if (useDemo()) return demo.demoSoftDeleteRumor(id, creatorId);
  const rumor = await rumorByIdAny(id);
  if (!rumor) return null;
  if (rumor.creator_id !== creatorId) {
    const e = new Error('Only the creator can delete this rumor');
    e.statusCode = 403;
    throw e;
  }
  if (rumor.deleted_at) return rumor;
  return prisma.rumor.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}
