/**
 * In-memory demo store when Supabase is unreachable (e.g. project paused).
 * Used so the app is presentable without a live DB.
 */
const rumors = [];
const votes = new Map(); // key: `${rumorId}:${voterId}` -> 'true'|'false'|'neutral'
const users = new Set(); // anonymous_id

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function demoCreateRumor(content, creatorId) {
  const id = uuid();
  const rumor = {
    id,
    content,
    creator_id: creatorId,
    created_at: new Date(),
    deleted_at: null,
    final_trust_score: null,
    finalized_at: null,
  };
  rumors.push(rumor);
  return rumor;
}

export function demoListRumors(includeDeleted = false) {
  let list = rumors.filter((r) => includeDeleted || !r.deleted_at);
  list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list.map((r) => ({
    ...r,
    trust_score: demoTrustScore(r.id),
    outcome: demoOutcome(r),
    finalized_at: r.finalized_at,
  }));
}

function demoTrustScore(rumorId) {
  const rumorVotes = [];
  for (const [key, vote] of votes) {
    if (key.startsWith(rumorId + ':')) rumorVotes.push(vote);
  }
  if (rumorVotes.length === 0) return null;
  const w = { true: 1, false: -1, neutral: 0 };
  const sum = rumorVotes.reduce((s, v) => s + (w[v] ?? 0), 0);
  return Math.max(-1, Math.min(1, sum / rumorVotes.length));
}

function demoOutcome(rumor) {
  const s = demoTrustScore(rumor.id);
  if (s == null) return 'neutral';
  if (s > 0.6) return 'true';
  if (s < -0.6) return 'false';
  return 'neutral';
}

export function demoGetRumor(id) {
  const r = rumors.find((x) => x.id === id && !x.deleted_at);
  if (!r) return null;
  return { ...r, trust_score: demoTrustScore(r.id), outcome: demoOutcome(r), finalized_at: r.finalized_at };
}

export function demoSoftDeleteRumor(id, creatorId) {
  const r = rumors.find((x) => x.id === id);
  if (!r || r.creator_id !== creatorId) return null;
  r.deleted_at = new Date();
  return r;
}

export function demoRegisterUser(anonymousId) {
  users.add(anonymousId);
  return { anonymous_id: anonymousId };
}

export function demoCastVote(rumorId, voterId, vote) {
  const key = `${rumorId}:${voterId}`;
  if (votes.has(key)) return null;
  votes.set(key, vote);
  return { rumor_id: rumorId, voter_id: voterId, vote };
}

export function demoHasVoted(rumorId, voterId) {
  return votes.has(`${rumorId}:${voterId}`);
}

export function demoGetVotesForRumor(rumorId) {
  const out = [];
  for (const [key, vote] of votes) {
    if (key.startsWith(rumorId + ':')) {
      const voterId = key.slice(rumorId.length + 1);
      out.push({ rumor_id: rumorId, voter_id: voterId, vote });
    }
  }
  return out;
}
