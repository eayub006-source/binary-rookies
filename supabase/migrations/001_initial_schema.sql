-- Phase 1: Anonymous Campus Rumor System — data layer (SUBMISSION_DAY1 §4.1)
-- Users: anonymous_id (PK), reputation_score, created_at. New users start with reputation 0.1 (§5.2).
-- Rumors: soft-delete via deleted_at; final_trust_score, finalized_at for stability (§5.3).
-- Votes: one per (rumor_id, voter_id); vote in true | false | neutral.

CREATE TABLE IF NOT EXISTS public.users (
  anonymous_id text PRIMARY KEY,
  reputation_score numeric NOT NULL DEFAULT 0.1 CHECK (reputation_score >= -1 AND reputation_score <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rumors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  creator_id text NOT NULL REFERENCES public.users(anonymous_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  final_trust_score numeric CHECK (final_trust_score IS NULL OR (final_trust_score >= -1 AND final_trust_score <= 1)),
  finalized_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.votes (
  rumor_id uuid NOT NULL REFERENCES public.rumors(id) ON DELETE CASCADE,
  voter_id text NOT NULL REFERENCES public.users(anonymous_id),
  vote text NOT NULL CHECK (vote IN ('true', 'false', 'neutral')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rumor_id, voter_id)
);

-- Indexes for trust/reputation queries: exclude soft-deleted rumors.
CREATE INDEX IF NOT EXISTS idx_rumors_not_deleted
  ON public.rumors (created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_votes_rumor
  ON public.votes (rumor_id);

CREATE INDEX IF NOT EXISTS idx_votes_voter
  ON public.votes (voter_id);

COMMENT ON TABLE public.users IS 'Anonymous users; anonymous_id = hash(fingerprint+salt). Reputation drives vote weight.';
COMMENT ON TABLE public.rumors IS 'Immutable content; soft-delete via deleted_at. Excluded from trust/reputation when deleted_at IS NOT NULL.';
COMMENT ON TABLE public.votes IS 'One vote per (rumor_id, voter_id). Votes on deleted rumors must be excluded from all trust/reputation.';
