import { supabase } from '../db/supabase.js';
import { rumorsAll, rumorById, rumorByIdAny } from '../db/queries.js';
import { enrichRumor, enrichRumors } from './trustEnrich.js';

export async function createRumor(content, creatorId) {
  const { data, error } = await supabase
    .from('rumors')
    .insert({ content: String(content).trim(), creator_id: creatorId })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function listRumors(includeDeleted = false) {
  const { data, error } = await rumorsAll(includeDeleted);
  if (error) throw error;
  const list = data ?? [];
  return enrichRumors(list);
}

export async function getRumor(id) {
  const { data, error } = await rumorById(id);
  if (error) throw error;
  return data ? enrichRumor(data) : null;
}

export async function softDeleteRumor(id, creatorId) {
  const { data: rumor, error: fetchErr } = await rumorByIdAny(id);
  if (fetchErr) throw fetchErr;
  if (!rumor) return null;
  if (rumor.creator_id !== creatorId) {
    const e = new Error('Only the creator can delete this rumor');
    e.statusCode = 403;
    throw e;
  }
  if (rumor.deleted_at) return rumor;
  const { data, error } = await supabase
    .from('rumors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
