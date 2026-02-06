import prisma from './prisma.js';

/**
 * Queries that exclude soft-deleted rumors for trust/reputation (§5.4).
 */

export async function rumorsActive() {
  return prisma.rumor.findMany({ where: { deleted_at: null }, orderBy: { created_at: 'desc' } });
}

export async function rumorById(id) {
  return prisma.rumor.findFirst({ where: { id, deleted_at: null } });
}

export async function rumorByIdAny(id) {
  return prisma.rumor.findUnique({ where: { id } });
}

export async function rumorsAll(includeDeleted = false) {
  const where = includeDeleted ? {} : { deleted_at: null };
  return prisma.rumor.findMany({ where, orderBy: { created_at: 'desc' } });
}

export async function votesByRumorId(rumorId) {
  return prisma.vote.findMany({ where: { rumor_id: rumorId } });
}

export async function votesByVoterId(voterId) {
  return prisma.vote.findMany({ where: { voter_id: voterId } });
}

export async function userByAnonymousId(anonymousId) {
  return prisma.user.findUnique({ where: { anonymous_id: anonymousId } });
}

export async function usersAll() {
  return prisma.user.findMany();
}

export async function rumorsToFinalize(finalizationDays = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - finalizationDays);
  return prisma.rumor.findMany({
    where: {
      deleted_at: null,
      finalized_at: null,
      created_at: { lt: cutoff },
    },
  });
}
