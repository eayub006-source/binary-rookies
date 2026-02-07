# Binary Rookies — Judge Presentation

**Team:** BINARY ROOKIES  
**Members:** Eshal Ayub, Momna Khalid, Ayan Asif Hashmi, Fahad Mehmood  
**Repo:** [github.com/eayub006-source/binary-rookies](https://github.com/eayub006-source/binary-rookies)

---

## 1. What We Built

An **anonymous campus rumor system** where truth is decided by **consensus and reputation**, not by any central authority. Students submit and vote on rumors (true / false / neutral); the system computes a **reputation-weighted trust score** per rumor, finalizes outcomes after 7 days, and updates voter reputations from their agreement with the final result. No admin ever marks a rumor true or false.

---

## 2. Problem & Solution (Summary)

| Requirement | Our approach |
|-------------|--------------|
| No central authority for truth | Trust score = reputation-weighted sum of votes; outcome derived from formula + finalization window. |
| Anonymous but unique participants | `anonymous_id = SHA256(fingerprint + salt)`; one-time CAPTCHA; only hash stored. |
| One vote per (rumor, identity) | DB composite primary key `(rumor_id, voter_id)`; API rejects duplicates. |
| Popularity ≠ truth | Vote weight × voter reputation; high-rep voters affect score more. |
| Stable scores | 7-day finalization; after that, score and outcome are fixed. |
| Deleted rumors don’t affect system | Soft-delete; all trust/reputation queries exclude `deleted_at` rumors. |
| Bot / Sybil resistance | CAPTCHA at signup, rate limits (rumors/day, votes/hour), reputation weighting. |

Full design: **SUBMISSION_DAY1.md**.

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Vite + React)                                         │
│  • Fingerprint (FingerprintJS) → CAPTCHA (reCAPTCHA v2)          │
│  • Submit rumor, vote (true/false/neutral), list rumors          │
│  • Theme: primary #778873, background #F1F3E0                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (localhost:3001)
┌───────────────────────────▼─────────────────────────────────────┐
│  Backend (Node + Express)                                         │
│  • /api/identity  → register/lookup (fingerprint + CAPTCHA)     │
│  • /api/rumors    → create, list, soft-delete                   │
│  • /api/votes     → cast vote (one per rumor_id + voter_id)     │
│  • Rate limits, finalization job (hourly)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma
┌───────────────────────────▼─────────────────────────────────────┐
│  Database (Supabase / PostgreSQL)                                │
│  User(anonymous_id, reputation_score), Rumor(..., deleted_at,  │
│  final_trust_score, finalized_at), Vote(rumor_id, voter_id, vote)│
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Trust Formula & Reputation (Implementation)

**Trust score** (in `[−1, 1]`):

\[
T(r) = \frac{\sum_i w_i \cdot v_i}{\sum_i |w_i|} \cdot \sigma_r
\]

- \( w_i = \text{reputation}_i \cdot \text{accountAgeFactor} \cdot \text{voteAgeFactor} \); \( v_i \in \{-1, 0, +1\} \) (false, neutral, true).
- **Account age:** votes from accounts &lt; 48h old count at **0.25×** weight (bot resistance).
- **Vote age:** votes from the last 24h count at **0.5×** (late swarms discounted).
- **Variance:** \( \sigma_r = \max(0, 1 - \text{vote variance}/2) \) — high disagreement lowers confidence.
- **Reputation:** \( \in [0.05, 1.0] \); new users 0.1; agree with final outcome → +0.05, disagree → −0.05.
- After **7 days**, rumor is **finalized** (outcome immutable).

**Code:** `backend/src/services/trust.js` — `computeTrustScore()`, `finalizeRumor()`, `runFinalizationJob()`.

**No epistemic authority / gameability proof:** see **ALIGNMENT.md**.

---

## 5. Key Implementation Highlights (Code to Show Judges)

### 5.1 Anonymous identity (no PII)

**File:** `backend/src/services/identity.js`

```javascript
export function computeAnonymousId(fingerprint) {
  return crypto.createHash('sha256').update(String(fingerprint) + SALT).digest('hex');
}
```

Only the hash is stored. One-time CAPTCHA verified before first user create.

---

### 5.2 Reputation-weighted trust score

**File:** `backend/src/services/trust.js`

```javascript
let weightedSum = 0;
let totalRep = 0;
for (const v of votes) {
  const rep = repByVoter.get(v.voter_id) ?? 0.1;
  const w = VOTE_WEIGHT[v.vote] ?? 0;  // true:1, false:-1, neutral:0
  weightedSum += w * rep;
  totalRep += rep;
}
return Math.max(-1, Math.min(1, weightedSum / totalRep));
```

Deleted rumors never enter this path: `rumorById()` and vote fetches use only non-deleted rumors (see queries).

---

### 5.3 Deleted rumors excluded everywhere

**File:** `backend/src/db/queries.js`

```javascript
export async function rumorById(id) {
  return prisma.rumor.findFirst({ where: { id, deleted_at: null } });
}
export async function rumorsToFinalize(finalizationDays = 7) {
  // ...
  return prisma.rumor.findMany({
    where: { deleted_at: null, finalized_at: null, created_at: { lt: cutoff } },
  });
}
```

All trust and finalization logic uses these queries; soft-deleted rumors and their votes are never included.

---

### 5.4 One vote per (rumor, voter)

**File:** `backend/prisma/schema.prisma`

```prisma
model Vote {
  rumor_id  String   @db.Uuid
  voter_id  String
  vote      String   // 'true' | 'false' | 'neutral'
  @@id([rumor_id, voter_id])   // composite primary key
}
```

Enforced at DB and API: duplicate (rumor_id, voter_id) is rejected.

---

## 6. How to Run & Demo

**Prerequisites:** Node.js, npm. Backend needs `.env` (DATABASE_URL, DIRECT_URL, IDENTITY_SALT, RECAPTCHA_SECRET_KEY); frontend needs `VITE_RECAPTCHA_SITE_KEY` in `.env`.

```bash
# Terminal 1 — Backend
cd backend
npm install && npx prisma generate && npx prisma db push && npm run db:seed
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install && npm run dev
```

- **Frontend (demo):** http://localhost:5173  
- **Backend API:** http://localhost:3001  
- **Health check:** http://localhost:3001/health  

**Or use the scripts (Windows PowerShell):**  
`.\install-dependencies.ps1` then `.\run-project.ps1` from repo root.

---

## 7. Design Doc Alignment

| SUBMISSION_DAY1 section | Implementation |
|-------------------------|----------------|
| §3–4 Identity | Fingerprint + salt → `anonymous_id`; one-time CAPTCHA; hash only stored. |
| §3–4 Rumor | Submit rumor; one vote per (rumor_id, voter_id); true/false/neutral. |
| §4.1 Data model | User, Rumor (topic_cluster_id, deleted_at, final_trust_score, finalized_at), Vote. Rep ∈ [0.05, 1.0]. |
| §5.1 Trust formula | Rep-weighted + time/variance weighting; 48h new-account 0.25×; score in [−1, 1]. |
| §5.2 Reputation | Updated from finalized outcomes; agree ↑, disagree ↓; new users 0.1. |
| §5.3 Stability | 7-day finalization; outcome fixed; displayed in UI. |
| §5.4 Deleted rumors | Soft-delete; excluded from all trust and reputation (queries). |
| §5.5 Bot/Sybil | CAPTCHA, rate limits, rep weighting, 48h vote-weight delay. |
| §6 Gameability | Minority liars cannot reliably game without building rep (see About in app). |

---

## 8. Stack

| Layer    | Technology        |
|----------|--------------------|
| Database | Supabase (PostgreSQL) |
| Backend  | Node.js, Express, Prisma |
| Frontend | Vite, React; backend API |

Thank you for evaluating our project.
