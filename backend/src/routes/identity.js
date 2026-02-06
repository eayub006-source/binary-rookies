import { Router } from 'express';
import { verifyCaptcha, registerOrLookup } from '../services/identity.js';

const router = Router();

/**
 * POST /api/identity/register-or-lookup
 * Body: { fingerprint: string, captchaToken: string }
 * Returns: { anonymous_id: string }
 */
router.post('/register-or-lookup', async (req, res) => {
  try {
    const { fingerprint, captchaToken } = req.body ?? {};
    if (!fingerprint || typeof fingerprint !== 'string') {
      return res.status(400).json({ error: 'fingerprint required' });
    }
    const secretSet = process.env.RECAPTCHA_SECRET_KEY && process.env.RECAPTCHA_SECRET_KEY !== 'replace-with-recaptcha-secret';
    if (secretSet && !captchaToken) {
      return res.status(400).json({ error: 'captchaToken required' });
    }
    if (captchaToken && !(await verifyCaptcha(captchaToken))) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' });
    }
    const result = await registerOrLookup(fingerprint);
    res.json(result);
  } catch (e) {
    console.error('Identity error:', e);
    const message = e.message || 'Identity registration failed';
    const code = e.message?.includes('relation') || e.message?.includes('table') || e.message?.includes('does not exist') ? 503 : 500;
    res.status(code).json({ error: message });
  }
});

export default router;
