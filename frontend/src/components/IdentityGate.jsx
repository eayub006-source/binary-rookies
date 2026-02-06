import { useState, useCallback, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useIdentity } from '../context/IdentityContext.jsx';

const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
const WIDGET_LOAD_TIMEOUT_MS = 6000;

export function IdentityGate({ children }) {
  const { anonymousId, ensureIdentity, error, loading, clearError } = useIdentity();
  const [captchaLoadError, setCaptchaLoadError] = useState(null);
  const [widgetTimeout, setWidgetTimeout] = useState(false);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || anonymousId) return;
    const t = setTimeout(() => setWidgetTimeout(true), WIDGET_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [anonymousId]);

  const handleVerify = useCallback(async (token) => {
    if (!token && RECAPTCHA_SITE_KEY) return;
    try {
      await ensureIdentity(token || null);
    } catch (_) {
      recaptchaRef.current?.reset();
    }
  }, [ensureIdentity]);

  const handleSubmit = useCallback(() => {
    if (RECAPTCHA_SITE_KEY && recaptchaRef.current) {
      const token = recaptchaRef.current.getValue();
      if (token) handleVerify(token);
    } else {
      handleVerify(null);
    }
  }, [handleVerify]);

  if (anonymousId) return children;

  return (
    <div className="identity-gate">
      <h2>One-time verification</h2>
      <p>Complete the CAPTCHA to participate anonymously. No personal data is stored.</p>
      {error && (
        <div className="identity-gate-error-block">
          <p className="identity-gate-error">{error}</p>
          <button type="button" className="identity-gate-retry" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}
      {RECAPTCHA_SITE_KEY ? (
        <>
          <div className="identity-gate-captcha">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => { setCaptchaLoadError(null); setWidgetTimeout(false); handleVerify(token); }}
              onExpired={() => recaptchaRef.current?.reset()}
              onErrored={() => setCaptchaLoadError('script or widget failed to load')}
              theme="light"
            />
          </div>
          {(captchaLoadError || widgetTimeout) && (
            <div className="identity-gate-recaptcha-help">
              <p className="identity-gate-error">
                {captchaLoadError ? `CAPTCHA could not load: ${captchaLoadError}.` : "If you don't see the “I'm not a robot” checkbox above:"}
              </p>
              <ul>
                <li>Add <strong>localhost</strong> in <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">reCAPTCHA admin</a> → your site → Domains.</li>
                <li>Disable ad blockers or privacy extensions (uBlock, Privacy Badger, Brave shield, etc.) for this page.</li>
                <li>Try a private/incognito window or another browser.</li>
              </ul>
            </div>
          )}
          <p className="identity-gate-hint">Check the box above, then click Continue.</p>
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </>
      ) : (
        <>
          <p className="identity-gate-dev">
            Dev mode: no CAPTCHA key set. Continue with fingerprint only (CAPTCHA skipped server-side).
          </p>
          <button type="button" onClick={() => handleSubmit()} disabled={loading}>
            {loading ? 'Verifying…' : 'Continue (dev)'}
          </button>
        </>
      )}
    </div>
  );
}
