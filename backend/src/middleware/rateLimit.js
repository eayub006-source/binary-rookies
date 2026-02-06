/**
 * In-memory rate limit per anonymous_id. Limits:
 * - Rumors: MAX_RUMORS_PER_DAY per anonymous_id per 24h
 * - Votes: MAX_VOTES_PER_HOUR per anonymous_id per 1h
 */
const MAX_RUMORS_PER_DAY = 20;
const MAX_VOTES_PER_HOUR = 60;
const RUMOR_WINDOW_MS = 24 * 60 * 60 * 1000;
const VOTE_WINDOW_MS = 60 * 60 * 1000;

const rumorTimestamps = new Map();
const voteTimestamps = new Map();

function prune(list, windowMs) {
  const cutoff = Date.now() - windowMs;
  return list.filter((t) => t > cutoff);
}

export function checkRumorLimit(anonymousId) {
  if (!anonymousId) return { ok: false, error: 'anonymous_id required' };
  let list = rumorTimestamps.get(anonymousId) ?? [];
  list = prune(list, RUMOR_WINDOW_MS);
  if (list.length >= MAX_RUMORS_PER_DAY) {
    return { ok: false, error: 'Rumor limit reached (max per day). Try again later.' };
  }
  list.push(Date.now());
  rumorTimestamps.set(anonymousId, list);
  return { ok: true };
}

export function checkVoteLimit(anonymousId) {
  if (!anonymousId) return { ok: false, error: 'anonymous_id required' };
  let list = voteTimestamps.get(anonymousId) ?? [];
  list = prune(list, VOTE_WINDOW_MS);
  if (list.length >= MAX_VOTES_PER_HOUR) {
    return { ok: false, error: 'Vote limit reached (max per hour). Try again later.' };
  }
  list.push(Date.now());
  voteTimestamps.set(anonymousId, list);
  return { ok: true };
}

/** Get anonymous_id from req body or X-Anonymous-Id header (for POST /rumors, POST /votes). */
export function getAnonymousId(req) {
  return req.body?.creator_id ?? req.body?.voter_id ?? req.headers['x-anonymous-id'];
}
