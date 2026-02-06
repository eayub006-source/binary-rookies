# Anonymous Campus Rumor System — Implementation Plan

**Source:** [SUBMISSION_DAY1.md](./SUBMISSION_DAY1.md)  
**Stack:** Node (backend), React (frontend), **Supabase (Postgres)** for all data, run locally for hackathon.  
**Work style:** Phase-by-phase; one commit per phase (or per logical chunk within a phase).

---

## Phase 0: Project setup & repo structure

**Goal:** Monorepo with backend and frontend runnable locally; no app logic yet.

**Deliverables:**
- `backend/` — Node + Express, env (PORT, DB path, salt, CAPTCHA secret), folder layout (routes, services, db).
- `frontend/` — Vite + React, env for API base URL.
- Root: README (how to run backend + frontend), `.gitignore`.

**Commit:** `chore: initial full-stack setup (Node + React)`

---

## Phase 1: Data layer (Supabase)

**Goal:** Schema and DB access aligned to submission §4.1; no APIs yet.

**Deliverables:**
- **Users:** `anonymous_id` (PK), `reputation_score` (default 0.1), `created_at` (§5.2).
- **Rumors:** `id` (uuid), `content`, `creator_id`, `created_at`, `deleted_at` (soft-delete), `final_trust_score`, `finalized_at` (§5.3).
- **Votes:** `rumor_id`, `voter_id`, `vote` ('true' | 'false' | 'neutral'), `created_at`. Unique on `(rumor_id, voter_id)` (§3, §4.1).
- **Supabase:** Migration in `supabase/migrations/001_initial_schema.sql`. Backend uses `@supabase/supabase-js`; `src/db/` exposes query helpers that **exclude soft-deleted rumors** for all trust/reputation use (§5.4).

**Run migration:** In Supabase Dashboard → SQL Editor, run the contents of `supabase/migrations/001_initial_schema.sql`, or use `supabase db push` if using Supabase CLI.

**Commit:** `feat(db): schema for users, rumors, votes with soft-delete (Supabase)`

---

## Phase 2: Identity layer

**Goal:** Anonymous identity from device fingerprint + CAPTCHA; one identity per device in practice (§3 Identity Layer).

**Deliverables:**
- **Backend:** `POST /api/identity/register-or-lookup`
  - Body: `{ fingerprint, captchaToken }`.
  - Verify CAPTCHA server-side (e.g. reCAPTCHA secret).
  - `anonymous_id = hash(fingerprint + salt)`; store only this hash (§3); create or return user (reputation 0.1 for new).
- **Frontend:**
  - Real client-side fingerprinting (e.g. [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) open-source).
  - Real CAPTCHA (e.g. reCAPTCHA v2) before first request; send token with fingerprint.
  - Call API; persist `anonymous_id` (e.g. localStorage) for subsequent requests.

**Commit:** `feat(identity): anonymous_id from fingerprint + CAPTCHA`

---

## Phase 3: Rumor layer

**Goal:** Submit rumors, list (excluding soft-deleted by default), single vote per (rumor_id, voter_id) (§3 Rumor Layer, §4.2).

**Deliverables:**
- **Backend:**
  - `POST /api/rumors` — body `{ content, creator_id }`; insert Rumor (immutable content).
  - `GET /api/rumors` — list non–soft-deleted (optional `?include_deleted=1` for admin/archived).
  - `GET /api/rumors/:id` — single rumor (exclude if soft-deleted unless explicitly allowed).
  - `DELETE /api/rumors/:id` — soft-delete (set `deleted_at`); caller must be creator or same policy as doc.
- **Backend:** `POST /api/votes` — body `{ rumor_id, voter_id, vote: true|false|neutral }`; insert only if no existing `(rumor_id, voter_id)`; reject if rumor is soft-deleted.
- **Frontend:** Submit rumor form, rumor list, vote controls (true / false / neutral), optional “delete” for creator.

**Commit:** `feat(rumors): CRUD and single vote per (rumor_id, voter_id)`

---

## Phase 4: Trust & reputation engine

**Goal:** Reputation-weighted trust scores, finalization window (7 days), and exclusion of soft-deleted data (§5).

**Deliverables:**
- **Trust score (per rumor, excluding soft-deleted only):**
  - `Trust(r) = Σ (vote_weight(v) × Reputation(voter)) / Σ Reputation(voter)` (§5.1).
  - `vote_weight(true)=1`, `vote_weight(false)=-1`, `vote_weight(neutral)=0`. Score in [-1, 1].
- **Finalization:** After 7 days, set rumor’s “outcome” from current trust: >0.6 ⇒ true, <-0.6 ⇒ false, else neutral. Store `final_trust_score` and `finalized_at`; use this outcome only for reputation updates (§5.2, §5.3).
- **Reputation update:** For each finalized rumor (and only non–soft-deleted), update each voter’s reputation: agree ⇒ ↑, disagree ⇒ ↓, neutral ⇒ small/zero. Never use deleted rumors or their votes (§5.4).
- **Execution:** Periodic job (e.g. cron or setInterval) to finalize due rumors and run reputation updates. On read: compute current trust for non-finalized rumors; for finalized, use `final_trust_score`.
- **API:** `GET /api/rumors` and `GET /api/rumors/:id` return current or final trust score and finalized_at when applicable.

**Commit:** `feat(trust): reputation-weighted trust, 7-day finalization, exclude deleted`

---

## Phase 5: Rate limiting & bot mitigation

**Goal:** Rate limiting per anonymous_id; CAPTCHA at identity; low-rep voters already limited by trust formula (§5.5).

**Deliverables:**
- **Backend:** Rate limits per `anonymous_id` (e.g. max N rumors per day, M votes per hour). Use in-memory or DB-backed store keyed by anonymous_id.
- Optional: log or flag anomalies (e.g. many new IDs voting in lockstep) for later; no change to trust formula required for hackathon.

**Commit:** `feat(api): rate limiting per anonymous_id`

---

## Phase 6: Frontend polish & trust display

**Goal:** UX matches doc: list excludes soft-deleted by default; show verified/outcome and stability; no deviation from submission.

**Deliverables:**
- List view: only non–soft-deleted rumors; optional “Archived” view using `?include_deleted=1` if implemented.
- Display: current trust score for non-finalized; for finalized show “Verified true/false/neutral” and finalized_at so “verified facts” don’t appear to change (§5.3).
- Deleted-rumor bug: already fixed in backend (Phase 1 + 4); ensure UI never shows deleted rumors in main feed and doesn’t use them in any displayed score.

**Commit:** `feat(ui): trust display, finalized outcome, exclude deleted from feed`

---

## Commit order (summary)

| Phase | Commit message |
|-------|----------------|
| 0 | `chore: initial full-stack setup (Node + React)` |
| 1 | `feat(db): schema for users, rumors, votes with soft-delete` |
| 2 | `feat(identity): anonymous_id from fingerprint + CAPTCHA` |
| 3 | `feat(rumors): CRUD and single vote per (rumor_id, voter_id)` |
| 4 | `feat(trust): reputation-weighted trust, 7-day finalization, exclude deleted` |
| 5 | `feat(api): rate limiting per anonymous_id` |
| 6 | `feat(ui): trust display, finalized outcome, exclude deleted from feed` |

---

## Tech choices (aligned to doc)

| Item | Choice | Note |
|------|--------|------|
| Backend | Node + Express | — |
| DB | **Supabase (Postgres)** | All tables and queries use Supabase; run migration from `supabase/migrations/` (Dashboard SQL Editor or `supabase db push`). |
| CAPTCHA | reCAPTCHA v2 | Real integration; site key (frontend) + secret (backend). |
| Fingerprint | FingerprintJS (open-source) | Real client fingerprint; send fingerprint to backend; server hashes with salt. |
| Finalization window | 7 days | As in §5.2, §5.3. |
| New user reputation | 0.1 | As in §5.2. |
| Outcome thresholds | >0.6 true, <-0.6 false | As in §5.2. |

All behavior stays within [SUBMISSION_DAY1.md](./SUBMISSION_DAY1.md); no extra features that contradict the doc.
