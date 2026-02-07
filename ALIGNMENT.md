# Alignment with Design & “No Central Authority”

## 1. No epistemic authority (reframe)

**Claim:** “No central server or admin who controls truth.”

**Clarification:** The system has **infrastructure** (Supabase, Node backend) but **no epistemic authority**. The backend enforces **rules** (one vote per user, rate limits, finalization window); it does **not** decide what is true or false. Truth emerges solely from:

- Participant consensus (reputation-weighted votes)
- Historical accuracy (reputation updates from finalized outcomes)
- Immutable finalization after 7 days

So: *The backend enforces rules, not truth. Truth is derived only from consensus and past accuracy.*

This is a valid academic stance: logical centralization of rules ≠ central authority over truth.

---

## 2. Mathematical proof sketch: “Can’t be gamed”

**Claim to prove:** A coordinated group of liars cannot reliably force false rumors to finalize as true without long-term honest participation.

**Notation:**

- \( H \) = number of honest voters, \( L \) = number of liars
- \( R_h \) = average reputation of honest voters, \( R_l \) = average reputation of liars
- Honest majority: \( H > L \); honest average accuracy > 0.5

**Expected trust score (reputation-weighted):**

\[
E[T] = \frac{H \cdot R_h - L \cdot R_l}{H \cdot R_h + L \cdot R_l}
\]

**Dynamics:**

- **Reputation of liars (\( R_l \))** decreases over time (they disagree with finalized outcomes → rep ↓).
- **Reputation of honest (\( R_h \))** increases asymptotically (they agree with outcomes → rep ↑).
- New users start at low rep (0.1); votes from accounts &lt; 48h count at 0.25× weight.

**Conclusion:** To have meaningful influence, liars must accumulate reputation by voting “correctly” (i.e. honestly) over time. Doing so defeats the goal of pushing false rumors. So a minority of coordinated liars cannot reliably game finalization without long-term honest behavior.

This satisfies the requirement without controlling who participates.

---

## 3. Implementation alignment summary

| Area | Status | Notes |
|------|--------|--------|
| Identity | ✅ | Fingerprint + salt, CAPTCHA, hash-only |
| Rumor & voting | ✅ | One vote per (rumor_id, voter_id), true/false/neutral |
| Data model | ✅ | User, Rumor (with topic_cluster_id), Vote; rep ∈ [0.05, 1.0] |
| Trust formula | ✅ | Rep-weighted + time decay + variance (σ_r); 48h new-account 0.25× |
| Reputation | ✅ | Agree ↑, disagree ↓; floor 0.05, cap 1.0 |
| Deleted rumors | ✅ | All trust/reputation queries exclude deleted_at |
| Bot resistance | ✅ | CAPTCHA, rate limits, rep weighting, 48h delay |
| Stability | ✅ | 7-day finalization; outcome immutable |

See **JUDGES_PRESENTATION.md** and **SUBMISSION_DAY1.md** for full design.
