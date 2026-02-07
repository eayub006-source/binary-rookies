import { useState } from 'react';
import { useIdentity } from '../context/IdentityContext.jsx';
import { createRumor } from '../lib/api.js';

export function RumorForm({ onCreated }) {
  const { anonymousId } = useIdentity();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !anonymousId) return;
    setLoading(true);
    setError(null);
    try {
      await createRumor(content.trim(), anonymousId);
      setContent('');
      onCreated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rumor-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="e.g. The library will close early during finals week."
        rows={3}
        maxLength={2000}
        disabled={loading}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading || !content.trim()}>
        {loading ? 'Submitting…' : 'Submit rumor'}
      </button>
    </form>
  );
}
