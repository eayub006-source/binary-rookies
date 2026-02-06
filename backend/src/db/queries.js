import { supabase } from './supabase.js';

/**
 * Query builders that always exclude soft-deleted rumors for trust/reputation (§5.4).
 * Use these for any read that feeds into trust score or reputation updates.
 */

/** Rumors that are not soft-deleted (for listing and trust engine). */
export function rumorsActive() {
  return supabase.from('rumors').select('*').is('deleted_at', null);
}

/** Single rumor by id, only if not deleted. */
export function rumorById(id) {
  return supabase.from('rumors').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
}

/** Single rumor by id (even if deleted; for auth check on delete). */
export function rumorByIdAny(id) {
  return supabase.from('rumors').select('*').eq('id', id).maybeSingle();
}

/** All rumors including deleted (e.g. optional "archived" view). */
export function rumorsAll(includeDeleted = false) {
  const q = supabase.from('rumors').select('*').order('created_at', { ascending: false });
  if (!includeDeleted) return q.is('deleted_at', null);
  return q;
}

/** Votes for a given rumor (use only for non-deleted rumors in trust calc). */
export function votesByRumorId(rumorId) {
  return supabase.from('votes').select('*').eq('rumor_id', rumorId);
}

/** Votes for a given voter. Filter by rumor.finalized_at when computing reputation. */
export function votesByVoterId(voterId) {
  return supabase.from('votes').select('*').eq('voter_id', voterId);
}

/** User by anonymous_id. */
export function userByAnonymousId(anonymousId) {
  return supabase.from('users').select('*').eq('anonymous_id', anonymousId).maybeSingle();
}

/** All users (for batch reputation updates). */
export function usersAll() {
  return supabase.from('users').select('*');
}

/** Rumors that are past finalization window and not yet finalized (for cron). */
export function rumorsToFinalize(finalizationDays = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - finalizationDays);
  return supabase
    .from('rumors')
    .select('*')
    .is('deleted_at', null)
    .is('finalized_at', null)
    .lt('created_at', cutoff.toISOString());
}
