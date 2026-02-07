import { useState, useCallback, useRef, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useIdentity } from '../context/IdentityContext.jsx';

const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY || '').trim();
const WIDGET_LOAD_TIMEOUT_MS = 6000;
const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1';
};

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
    if (!token && RECAPTCHA_SITE_KEY && isLocalhost()) return;
    try {
      await ensureIdentity(token || null);
    } catch (_) {
      recaptchaRef.current?.reset();
    }
  }, [ensureIdentity]);

  const handleSubmit = useCallback(() => {
    if (RECAPTCHA_SITE_KEY && recaptchaRef.current && isLocalhost()) {
      const token = recaptchaRef.current.getValue();
      if (token) handleVerify(token);
    } else {
      handleVerify(null);
    }
  }, [handleVerify]);

  const handleContinueWithoutCaptcha = useCallback(() => {
    handleVerify(null);
  }, [handleVerify]);

  if (anonymousId) return children;

  return (
    <div className="identity-gate">
      <h2>One-time verification</h2>
      <p>No signup or login. You get an anonymous identifier from fingerprint + salt—no personal data is ever stored.</p>
      <p className="identity-gate-bot">Bot protection: one-time CAPTCHA ensures real users; rate limits and reputation limit manipulation.</p>
      {error && (
        <div className="identity-gate-error-block">
          <p className="identity-gate-error">{error}</p>
          <button type="button" className="identity-gate-retry" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}
      {RECAPTCHA_SITE_KEY && isLocalhost() ? (
        <>
          <p className="identity-gate-captcha-label">Bot manipulation protection (CAPTCHA)</p>
          <div className="identity-gate-captcha" role="region" aria-label="reCAPTCHA verification">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => { setCaptchaLoadError(null); setWidgetTimeout(false); handleVerify(token); }}
              onExpired={() => recaptchaRef.current?.reset()}
              onErrored={() => setCaptchaLoadError('script or widget failed to load')}
              asyncScriptOnLoad={() => { setCaptchaLoadError(null); setWidgetTimeout(false); }}
              theme="light"
            />
          </div>
          {(captchaLoadError || widgetTimeout) && (
            <div className="identity-gate-recaptcha-help">
              <p className="identity-gate-error">
                {captchaLoadError ? `CAPTCHA could not load: ${captchaLoadError}.` : "If you don't see the \"I'm not a robot\" checkbox above:"}
              </p>
              <ul>
                <li>In <a href="https://www.google.com/recaptcha/admin" target="_blank" rel="noopener noreferrer">reCAPTCHA admin</a> → your site → Domains, add <strong>localhost</strong> and <strong>127.0.0.1</strong>.</li>
                <li>Disable ad blockers or privacy extensions for this page.</li>
              </ul>
            </div>
          )}
          <p className="identity-gate-hint">Check the box above, then click Continue.</p>
          <button type="button" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </>
      ) : RECAPTCHA_SITE_KEY && !isLocalhost() ? (
        <>
          <div className="identity-gate-shared-link">
            <p>You’re using the <strong>shared link</strong>. Verification uses your device fingerprint only (no CAPTCHA). Click below to continue and submit rumors.</p>
            <button type="button" className="identity-gate-continue-demo" onClick={handleContinueWithoutCaptcha} disabled={loading}>
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </div>
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
