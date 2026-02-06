import { useState, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useIdentity } from '../context/IdentityContext.jsx';

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export function IdentityGate({ children }) {
  const { anonymousId, ensureIdentity, error, loading } = useIdentity();
  const [captchaReady, setCaptchaReady] = useState(false);
  const [recaptchaRef, setRecaptchaRef] = useState(null);

  const handleVerify = useCallback(async (token) => {
    if (!token) return;
    try {
      await ensureIdentity(token);
    } catch (_) {
      recaptchaRef?.reset();
    }
  }, [ensureIdentity, recaptchaRef]);

  const handleSubmit = useCallback(() => {
    if (recaptchaRef) {
      const token = recaptchaRef.getValue();
      if (token) handleVerify(token);
    }
  }, [recaptchaRef, handleVerify]);

  if (anonymousId) return children;

  return (
    <div className="identity-gate">
      <h2>One-time verification</h2>
      <p>Complete the CAPTCHA to participate anonymously. No personal data is stored.</p>
      {error && <p className="identity-gate-error">{error}</p>}
      {RECAPTCHA_SITE_KEY ? (
        <>
          <ReCAPTCHA
            ref={(el) => { setRecaptchaRef(el); if (el) setCaptchaReady(true); }}
            sitekey={RECAPTCHA_SITE_KEY}
            onChange={handleVerify}
            onExpired={() => recaptchaRef?.reset()}
          />
          {captchaReady && (
            <button type="button" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          )}
        </>
      ) : (
        <>
          <p className="identity-gate-dev">
            No VITE_RECAPTCHA_SITE_KEY set. For dev, continue with fingerprint only (CAPTCHA skipped server-side).
          </p>
          <button type="button" onClick={() => ensureIdentity(null)} disabled={loading}>
            {loading ? 'Verifying…' : 'Continue (dev)'}
          </button>
        </>
      )}
    </div>
  );
}
