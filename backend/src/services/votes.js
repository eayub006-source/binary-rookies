import { supabase } from '../db/supabase.js';
import { rumorById } from '../db/queries.js';

const VALID_VOTES = new Set(['true', 'false', 'neutral']);

export async function castVote(rumorId, voterId, vote) {
  const v = String(vote).toLowerCase();
  if (!VALID_VOTES.has(v)) {
    const e = new Error('vote must be true, false, or neutral');
    e.statusCode = 400;
    throw e;
  }
  const { data: rumor, error: rumorErr } = await rumorById(rumorId);
  if (rumorErr) throw rumorErr;
  if (!rumor) {
    const e = new Error('Rumor not found or deleted');
    e.statusCode = 404;
    throw e;
  }
  const { data: existing } = await supabase
    .from('votes')
    .select('rumor_id')
    .eq('rumor_id', rumorId)
    .eq('voter_id', voterId)
    .maybeSingle();
  if (existing) {
    const e = new Error('Already voted on this rumor');
    e.statusCode = 409;
    throw e;
  }
  const { data, error } = await supabase
    .from('votes')
    .insert({ rumor_id: rumorId, voter_id: voterId, vote: v })
    .select('*')
    .single();
  if (error) {
    if (error.code === '23505') {
      const e = new Error('Already voted on this rumor');
      e.statusCode = 409;
      throw e;
    }
    throw error;
  }
  return data;
}
