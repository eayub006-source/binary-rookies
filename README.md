# Binary Rookies — Anonymous Campus Rumor System

Everything in this repo implements the design in **[SUBMISSION_DAY1.md](./SUBMISSION_DAY1.md)**: problem, assumptions, three layers (Identity, Rumor, Trust), data model, trust formula, finalization, soft-delete exclusion, rate limiting, and gameability.

**Database:** Supabase (PostgreSQL). Backend uses **Prisma** (not the Supabase JS client). See [docs/PRISMA_SUPABASE.md](./docs/PRISMA_SUPABASE.md) for connection steps.

---

## Quick start

1. **Backend env** — In `backend/.env` set:
   - `DATABASE_URL` and `DIRECT_URL` (from Supabase Dashboard → Connect → ORMs → Prisma; use your **database password**, not the API secret).
   - `IDENTITY_SALT` (long random string).
   - `RECAPTCHA_SECRET_KEY` (reCAPTCHA v2 secret).

2. **Create tables and seed:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

3. **Frontend** — In `frontend/.env`: `VITE_RECAPTCHA_SITE_KEY` (and optionally Supabase publishable key for future use). Then:
   ```bash
   cd frontend && npm install && npm run dev
   ```

Backend: `http://localhost:3001` · Frontend: e.g. `http://localhost:5173`

**reCAPTCHA:** [docs/RECAPTCHA_SETUP.md](./docs/RECAPTCHA_SETUP.md).

**Without a database (e.g. Supabase paused):** Set `USE_DEMO_STORE=1` in `backend/.env`; then start backend and frontend without running `db push` or `db:seed`. The app uses an in-memory store.

---

## SUBMISSION_DAY1 alignment

| Doc section | Implementation |
|-------------|----------------|
| §3–4 Identity | Fingerprint + salt → `anonymous_id`; one-time CAPTCHA; hash only stored. |
| §3–4 Rumor | Submit rumor; vote once per (rumor_id, voter_id); true/false/neutral. |
| §4.1 Data model | `User` (anonymous_id, reputation_score, accuracy_metric, created_at), `Rumor` (id, content, creator_id, created_at, deleted_at, final_trust_score, finalized_at), `Vote` (rumor_id, voter_id, vote). |
| §5.1 Trust formula | Reputation-weighted sum; 48h new-account weight 0.25×; variance σ_r; score in [−1, 1]. |
| §5.2 Reputation | Updated from finalized outcomes; agree ↑, disagree ↓; new users start at 0.1. |
| §5.3 Stability | 7-day finalization; outcome fixed; display final score and finalized_at. |
| §5.4 Deleted rumors | Soft-delete; excluded from all trust and reputation. |
| §5.5 Bot/Sybil | CAPTCHA, rate limits (rumors/day, votes/hour), reputation weighting. |
| §6 Gameability | Minority of liars cannot reliably game without building rep (see About in app). |

---

## Stack

| Layer    | Tech |
|----------|------|
| Database | Supabase (PostgreSQL) |
| Backend  | Node + Express, Prisma |
| Frontend | Vite + React, backend API |
