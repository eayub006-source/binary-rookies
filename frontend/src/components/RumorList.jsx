import { useState, useEffect } from 'react';
import { useIdentity } from '../context/IdentityContext.jsx';
import { listRumors, castVote, deleteRumor } from '../lib/api.js';

function TrustBadge({ rumor }) {
  const finalized = rumor.finalized_at != null;
  const score = rumor.trust_score;
  const outcome = rumor.outcome ?? 'neutral';
  if (score == null) return <span className="trust-badge trust-unknown">—</span>;
  const label = finalized ? `Verified ${outcome}` : `Score ${(Number(score).toFixed(2))}`;
  const cls = `trust-badge trust-${outcome}`;
  return (
    <span className={cls} title={finalized ? `Finalized ${new Date(rumor.finalized_at).toLocaleString()}` : 'Current trust score'}>
      {label}
      {finalized && <span className="trust-finalized"> ({new Date(rumor.finalized_at).toLocaleDateString()})</span>}
    </span>
  );
}

export function RumorList() {
  const { anonymousId } = useIdentity();
  const [rumors, setRumors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listRumors(includeDeleted);
      setRumors(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [includeDeleted]);

  async function handleVote(rumorId, vote) {
    if (!anonymousId) return;
    setVotingId(rumorId);
    try {
      await castVote(rumorId, anonymousId, vote);
      await load();
    } catch (_) {
      setVotingId(null);
    }
    setVotingId(null);
  }

  async function handleDelete(rumorId) {
    if (!anonymousId) return;
    try {
      await deleteRumor(rumorId, anonymousId);
      await load();
    } catch (_) {}
  }

  if (loading) return <p>Loading rumors…</p>;
  if (error) return <p className="list-error">Error: {error}</p>;

  return (
    <>
      <div className="rumor-list-actions">
        <label>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          Show archived (deleted)
        </label>
      </div>
      {rumors.length === 0 && (
        <p>{includeDeleted ? 'No rumors (including archived).' : 'No rumors yet. Submit one above.'}</p>
      )}
      <ul className="rumor-list">
        {rumors.map((r) => (
          <li key={r.id} className={`rumor-item ${r.deleted_at ? 'rumor-item-deleted' : ''}`}>
            <p className="rumor-content">{r.content}</p>
            <div className="rumor-meta">
              <span className="rumor-date">{new Date(r.created_at).toLocaleString()}</span>
              <TrustBadge rumor={r} />
              {r.creator_id === anonymousId && !r.deleted_at && (
                <button type="button" className="rumor-delete" onClick={() => handleDelete(r.id)}>
                  Delete
                </button>
              )}
            </div>
            {!r.deleted_at && (
              <div className="rumor-votes">
                <button
                  type="button"
                  onClick={() => handleVote(r.id, 'true')}
                  disabled={votingId === r.id}
                >
                  True
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(r.id, 'neutral')}
                  disabled={votingId === r.id}
                >
                  Neutral
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(r.id, 'false')}
                  disabled={votingId === r.id}
                >
                  False
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
