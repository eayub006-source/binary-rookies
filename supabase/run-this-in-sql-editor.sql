-- =============================================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR (once per project)
-- Dashboard → SQL Editor → New query → Paste all → Run
-- =============================================================================

-- 1. CREATE TABLES
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

CREATE INDEX IF NOT EXISTS idx_rumors_not_deleted ON public.rumors (created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_votes_rumor ON public.votes (rumor_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes (voter_id);

-- 2. SEED DATA (optional)
INSERT INTO public.users (anonymous_id, reputation_score) VALUES
  ('seed_anon_1', 0.1), ('seed_anon_2', 0.5), ('seed_anon_3', 0.8), ('seed_anon_4', 0.3), ('seed_anon_5', 0.1)
ON CONFLICT (anonymous_id) DO NOTHING;

INSERT INTO public.rumors (id, content, creator_id, created_at, deleted_at, final_trust_score, finalized_at) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'The new library opens next Monday.', 'seed_anon_1', now() - interval '8 days', NULL, 0.72, now() - interval '1 day'),
  ('a0000001-0001-4000-8000-000000000002', 'Campus cafe is raising prices next week.', 'seed_anon_2', now() - interval '3 days', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000003', 'There will be a guest lecture on AI this Friday.', 'seed_anon_1', now() - interval '1 day', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000004', 'Dorms will get new WiFi in March.', 'seed_anon_3', now() - interval '5 days', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000005', 'This rumor was removed by creator (soft-delete demo).', 'seed_anon_4', now() - interval '2 days', now(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.votes (rumor_id, voter_id, vote) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'seed_anon_2', 'true'), ('a0000001-0001-4000-8000-000000000001', 'seed_anon_3', 'true'), ('a0000001-0001-4000-8000-000000000001', 'seed_anon_4', 'false'),
  ('a0000001-0001-4000-8000-000000000002', 'seed_anon_1', 'true'), ('a0000001-0001-4000-8000-000000000002', 'seed_anon_3', 'neutral'),
  ('a0000001-0001-4000-8000-000000000003', 'seed_anon_2', 'true'), ('a0000001-0001-4000-8000-000000000003', 'seed_anon_5', 'true'),
  ('a0000001-0001-4000-8000-000000000004', 'seed_anon_1', 'false'), ('a0000001-0001-4000-8000-000000000004', 'seed_anon_2', 'neutral')
ON CONFLICT (rumor_id, voter_id) DO NOTHING;
