# reCAPTCHA v2 setup

This app uses **reCAPTCHA v2 (“I'm not a robot” checkbox)** for the identity gate. You need a **site key** (frontend) and a **secret key** (backend) from Google.

---

## 0. Test keys (no domain setup)

For **local development or demo**, you can use **Google’s official test keys**. They work on **any domain** (localhost, 127.0.0.1, LAN IP) with no admin configuration:

|          | Value |
|----------|--------|
| Site key (frontend) | `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` |
| Secret key (backend) | `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe` |

Set these in `frontend/.env` and `backend/.env`. The CAPTCHA will always pass and the widget will show on any URL. **Do not use test keys in production.**

---

## 1. Create reCAPTCHA keys (production)

1. Open **[Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)** and sign in.
2. Click **“+”** or **“Create”** to register a new site.
3. Fill in:
   - **Label:** e.g. `Binary Rookies (Campus Rumor)`
   - **reCAPTCHA type:** choose **“reCAPTCHA v2”** → **“I'm not a robot” Checkbox**
   - **Domains:** add:
     - `localhost` (for local dev)
     - Your production domain when you deploy (e.g. `your-app.vercel.app`)
4. Accept the terms and click **Submit**.
5. On the next screen you’ll see:
   - **Site key** (public) — used in the frontend
   - **Secret key** (private) — used in the backend (keep it secret)

---

## 2. Frontend (Vite)

1. Open **`frontend/.env`** (create it from `frontend/.env.example` if needed).
2. Set the **site key**:

```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

Example (fake key):

```env
VITE_RECAPTCHA_SITE_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Restart the Vite dev server so it picks up the new env (`Ctrl+C` then `npm run dev`).  
   Vite only reads `VITE_*` variables at startup.

---

## 3. Backend (Node)

1. Open **`backend/.env`**.
2. Set the **secret key**:

```env
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

Example (fake key):

```env
RECAPTCHA_SECRET_KEY=6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Restart the backend (`Ctrl+C` then `npm run dev`).

---

## 4. Check that it works

1. Open the app in the browser (e.g. `http://localhost:5173`).
2. You should see the **“I'm not a robot”** checkbox instead of “Continue (dev)”.
3. Tick the checkbox, then click **Continue**.
4. If something goes wrong:
   - **“CAPTCHA verification failed”** — secret key wrong or not set; or token expired (tokens last ~2 minutes).
   - **“captchaToken required”** — frontend didn’t send a token (check that `VITE_RECAPTCHA_SITE_KEY` is set and the dev server was restarted).
   - Widget doesn’t appear — see **Section 5. Widget not showing** below.

---

## 5. Widget not showing (domain is set)

If **localhost** is already in reCAPTCHA Domains but the checkbox still doesn't appear:

- **Safari** often blocks the reCAPTCHA script (tracking prevention). Use **Chrome** or **Firefox** for local dev.
- **URL:** Use **`http://localhost:5173`**. If you use **`http://127.0.0.1:5173`**, add **`127.0.0.1`** to reCAPTCHA Domains too.
- **Ad blockers** — disable for localhost or try a private window with extensions off.
- **Console:** DevTools → Console; look for errors mentioning `recaptcha` or blocked scripts.

---

## Summary

| Where        | Env variable               | Key from Google |
|-------------|----------------------------|------------------|
| Frontend    | `VITE_RECAPTCHA_SITE_KEY`  | Site key         |
| Backend     | `RECAPTCHA_SECRET_KEY`     | Secret key       |

Both keys must be set for full CAPTCHA. If either is missing, the app falls back to dev mode (no CAPTCHA).
