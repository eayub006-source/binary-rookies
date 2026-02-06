const API = '/api';

export async function registerOrLookupIdentity(fingerprint, captchaToken) {
  const res = await fetch(`${API}/identity/register-or-lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint, captchaToken: captchaToken || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function createRumor(content, creatorId) {
  const res = await fetch(`${API}/rumors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, creator_id: creatorId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function listRumors(includeDeleted = false) {
  const url = includeDeleted ? `${API}/rumors?include_deleted=1` : `${API}/rumors`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load rumors');
  return res.json();
}

export async function getRumor(id) {
  const res = await fetch(`${API}/rumors/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Failed to load rumor');
  }
  return res.json();
}

export async function deleteRumor(id, creatorId) {
  const res = await fetch(`${API}/rumors/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creator_id: creatorId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function castVote(rumorId, voterId, vote) {
  const res = await fetch(`${API}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rumor_id: rumorId, voter_id: voterId, vote }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}
