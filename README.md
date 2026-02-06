# Binary Rookies — Anonymous Campus Rumor System

**Database: Supabase (PostgreSQL).** All persistence (users, rumors, votes) lives in Supabase; the backend uses the Supabase JS client with the service role key.

See [SUBMISSION_DAY1.md](./SUBMISSION_DAY1.md) for problem statement and design, and [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for phases.

---

## Supabase setup

1. **Create a project** at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Run the migration:**  
   Dashboard → **SQL Editor** → paste and run the contents of  
   `supabase/migrations/001_initial_schema.sql`
3. **Env (backend):** In `backend/.env` (copy from `backend/.env.example`):
   - `SUPABASE_URL` — Project URL (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (Settings → API; keep secret)
   - `IDENTITY_SALT` — Long random string for `anonymous_id = hash(fingerprint + salt)`
   - `RECAPTCHA_SECRET_KEY` — For CAPTCHA (Phase 2)

Details: [supabase/README.md](./supabase/README.md).

---

## Run locally

```bash
# Backend (Express; talks to Supabase)
cd backend && npm install && npm run dev

# Frontend (Vite + React; calls backend API)
cd frontend && npm install && npm run dev
```

Backend: `http://localhost:3001`  
Frontend: Vite default (e.g. `http://localhost:5173`)

---

## Stack

| Layer        | Tech |
|-------------|------|
| Database    | **Supabase** (Postgres) |
| Backend     | Node + Express, `@supabase/supabase-js` |
| Frontend    | Vite + React, calls backend API |
