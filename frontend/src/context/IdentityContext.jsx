import { createContext, useContext, useState, useCallback } from 'react';
import { getVisitorId } from '../lib/fingerprint.js';
import { registerOrLookupIdentity } from '../lib/api.js';

const STORAGE_KEY = 'anonymous_id';

const IdentityContext = createContext(null);

export function IdentityProvider({ children }) {
  const [anonymousId, setAnonymousId] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const ensureIdentity = useCallback(async (captchaToken) => {
    if (anonymousId) return anonymousId;
    setLoading(true);
    setError(null);
    try {
      const fingerprint = await getVisitorId();
      const { anonymous_id } = await registerOrLookupIdentity(fingerprint, captchaToken);
      localStorage.setItem(STORAGE_KEY, anonymous_id);
      setAnonymousId(anonymous_id);
      return anonymous_id;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [anonymousId]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    anonymousId,
    error,
    loading,
    ensureIdentity,
    clearError,
    isReady: !!anonymousId,
  };

  return (
    <IdentityContext.Provider value={value}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}
