import { useState } from 'react';

export function About() {
  const [open, setOpen] = useState(false);
  return (
    <section className="about">
      <button type="button" className="about-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Hide' : 'How it works'}
      </button>
      {open && (
        <div className="about-content">
          <p><strong>Anonymous Campus Rumor System</strong> — truth from consensus, not from admins. Design: SUBMISSION_DAY1.md (this repo).</p>

          <h4>Three layers</h4>
          <ul>
            <li><strong>Identity:</strong> One anonymous identity per device. <code>anonymous_id = hash(fingerprint + salt)</code>. One-time CAPTCHA at first use. Only the hash is stored; no PII.</li>
            <li><strong>Rumor:</strong> Submit rumors; vote once per rumor (true / false / neutral). No central authority decides what is true.</li>
            <li><strong>Trust:</strong> Trust score of a rumor = <em>reputation-weighted</em> sum of votes. High-rep voters affect the score more; low-rep or new voters have less impact. Popularity ≠ truth.</li>
          </ul>

          <h4>Trust formula</h4>
          <p>Trust(Rumor) = Σ (vote_weight × Reputation(voter)) / Σ Reputation(voter). Vote weights: true = 1, false = −1, neutral = 0. Score is bounded in [−1, 1].</p>

          <h4>Stability & finalization</h4>
          <p>After a <strong>7-day finalization window</strong>, a rumor’s outcome is fixed (e.g. above 0.6 ⇒ “true”, below −0.6 ⇒ “false”, else “neutral”). That outcome is used to update voter reputations (agree ⇒ rep up, disagree ⇒ rep down). Past “verified” facts do not keep changing.</p>

          <h4>Deleted rumors</h4>
          <p>Soft-deleted rumors and their votes are <strong>excluded from all</strong> trust and reputation calculations. Deleted data does not affect newer rumors.</p>

          <h4>Rate limiting & bot mitigation</h4>
          <p>Per identity: limited rumors per day and votes per hour. CAPTCHA at identity creation. Reputation: voters who consistently disagree with consensus get lower reputation, so their votes have negligible weight. A minority of coordinated liars cannot reliably game the system without building reputation (which requires voting “correctly” and thus not distorting).</p>

          <p className="about-ref">BINARY ROOKIES — Eshal Ayub, Momna Khalid, Ayan Asif Hashmi, Fahad Mehmood.</p>
        </div>
      )}
    </section>
  );
}
