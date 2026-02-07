# Documentation vs implementation alignment

**Last check:** Project rechecked against SUBMISSION_DAY1.md, JUDGES_PRESENTATION.md, ALIGNMENT.md, IMPLEMENTATION_PLAN.md, README.md, and supporting docs.

---

## 1. SUBMISSION_DAY1.md

| Section | Requirement | Implementation | Status |
|--------|--------------|----------------|--------|
| §3 Identity | anonymous_id = hash(fingerprint + salt); one-time CAPTCHA; only hash stored | `backend/src/services/identity.js`: `computeAnonymousId`, `verifyCaptcha`, `registerOrLookup`; hash only in DB | ✅ |
| §3 Rumor | One vote per (rumor_id, voter_id); true/false/neutral | `backend/prisma/schema.prisma`: Vote `@@id([rumor_id, voter_id])`; `votes.js` rejects duplicate | ✅ |
| §4.1 Data model | User, Rumor (deleted_at, final_trust_score, finalized_at), Vote | Schema: User, Rumor (topic_cluster_id, deleted_at, final_trust_score, finalized_at), Vote | ✅ |
| §5.1 Trust | Rep-weighted; vote_weight true=1, false=-1, neutral=0; score [-1,1] | `trust.js`: VOTE_WEIGHT, repFloor, weightedSum/totalAbsWeight, σ_r, clamp [-1,1] | ✅ |
| §5.2 Reputation | Outcome from finalization; agree ↑, disagree ↓; new users 0.1 | `trust.js`: outcomeFromScore, finalizeRumor rep deltas; DEFAULT_REPUTATION 0.1 in identity | ✅ |
| §5.3 Stability | Finalization window (e.g. 7 days); outcome fixed | FINALIZATION_DAYS = 7; final_trust_score/finalized_at; enrichRumor uses final score when set | ✅ |
| §5.4 Deleted rumors | Soft-delete; exclude from all trust/reputation | queries.js: rumorById, rumorsToFinalize, rumorsAll use deleted_at: null; trust uses these only | ✅ |
| §5.5 Bot/Sybil | CAPTCHA, rate limits, reputation weighting | identity: CAPTCHA; rateLimit.js: rumors/day, votes/hour; trust: rep weight, 48h 0.25× | ✅ |
| §6 Gameability | Minority liars cannot reliably game | ALIGNMENT.md proof sketch; About.jsx and JUDGES_PRESENTATION describe it | ✅ |

---

## 2. JUDGES_PRESENTATION.md

| Claim | Location | Status |
|-------|----------|--------|
| Theme primary #778873, background #F1F3E0 | `frontend/src/index.css` :root | ✅ |
| Rep ∈ [0.05, 1.0]; 48h new-account 0.25×; vote age 24h 0.5×; σ_r | `backend/src/services/trust.js` | ✅ |
| 7-day finalization; outcome immutable | trust.js FINALIZATION_DAYS; finalizeRumor | ✅ |
| identity.js computeAnonymousId snippet | Matches backend/src/services/identity.js | ✅ |
| Trust snippet (weightedSum, totalRep) | trust.js has full formula with accFactor, ageFactor, σ_r | ✅ |
| queries.js rumorById / rumorsToFinalize exclude deleted_at | queries.js | ✅ |
| Prisma Vote @@id([rumor_id, voter_id]) | schema.prisma | ✅ |
| How to run (backend + frontend, scripts) | run-project.ps1, install-dependencies.ps1 | ✅ |
| Design doc alignment table | Matches implementation | ✅ |

---

## 3. ALIGNMENT.md

| Area | Status | Notes |
|------|--------|--------|
| Identity | ✅ | Fingerprint + salt, CAPTCHA, hash-only |
| Rumor & voting | ✅ | One vote per (rumor_id, voter_id), true/false/neutral |
| Data model | ✅ | User, Rumor (topic_cluster_id), Vote; rep ∈ [0.05, 1.0] |
| Trust formula | ✅ | Rep-weighted + time decay + variance; 48h 0.25× |
| Reputation | ✅ | Agree ↑, disagree ↓; floor 0.05, cap 1.0 |
| Deleted rumors | ✅ | All trust/reputation queries exclude deleted_at |
| Bot resistance | ✅ | CAPTCHA, rate limits, rep weighting, 48h delay |
| Stability | ✅ | 7-day finalization; outcome immutable |

---

## 4. IMPLEMENTATION_PLAN (Phases 0–6)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | backend/, frontend/, README, .gitignore | ✅ |
| 1 | Prisma schema (User, Rumor, Vote); queries exclude soft-deleted | ✅ |
| 2 | POST /api/identity/register-or-lookup; fingerprint + CAPTCHA; frontend IdentityGate | ✅ |
| 3 | Rumors CRUD, GET include_deleted; POST /api/votes one per (rumor_id, voter_id) | ✅ |
| 4 | Trust score, 7-day finalization, reputation update, exclude deleted | ✅ |
| 5 | Rate limiting per anonymous_id (rumors/day, votes/hour) | ✅ |
| 6 | List excludes deleted by default; "Show archived"; Finalized badge; trust display | ✅ |

---

## 5. Supporting docs

| Doc | Check | Status |
|-----|--------|--------|
| README.md | Quick start, SUBMISSION alignment table, USE_DEMO_STORE note, §5.1 formula detail | ✅ Updated |
| docs/RECAPTCHA_SETUP.md | Test keys, frontend/backend env, troubleshooting | ✅ |
| docs/PRISMA_SUPABASE.md | DATABASE_URL, DIRECT_URL, db push, seed; health check `/api/health/db` | ✅ (health at /api/health/db) |
| SHARE-LINK.md | Firewall, backend+frontend, share link format; no CAPTCHA on shared link | ✅ (IdentityGate: non-localhost shows Continue only) |
| DEMO_SCRIPT.md | Placeholder text, Finalized badge, CAPTCHA/bot, 48h | ✅ Matches RumorForm, RumorList, About |
| frontend/.env.example | VITE_RECAPTCHA_SITE_KEY, test key comment | ✅ |
| backend/.env.example | USE_DEMO_STORE, RECAPTCHA, test key note | ✅ Updated |

---

## 6. Code details verified

- **Finalization job:** Runs when `!USE_DEMO_STORE` (index.js); demo store does not run it (expected).
- **Health:** `GET /health` → `{ ok, demo }`; `GET /api/health/db` → `{ ok, db }` (health.js).
- **Vote composite key:** Prisma `findUnique({ where: { rumor_id_voter_id: { rumor_id, voter_id } } })` in votes.js.
- **Demo store:** Excludes deleted in demoGetRumor, demoListRumors; one vote per (rumor_id, voter_id); no reputation weighting in demo (simplified).

---

## Summary

All documented requirements from SUBMISSION_DAY1, JUDGES_PRESENTATION, ALIGNMENT, and IMPLEMENTATION_PLAN are present in the codebase. Minor doc updates made:

- README: added USE_DEMO_STORE note for running without DB; §5.1 trust formula now mentions 48h and variance.
- backend/.env.example: added comment about reCAPTCHA test keys (see RECAPTCHA_SETUP.md).

No code changes were required for alignment; implementation matches the documentation.
