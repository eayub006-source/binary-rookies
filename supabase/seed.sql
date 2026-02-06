-- Seed data for Anonymous Campus Rumor System (SUBMISSION_DAY1)
-- Run after 001_initial_schema.sql. Safe to run once; re-run only after clearing tables.

-- Users (anonymous_id, reputation_score). New users start at 0.1 (§5.2).
INSERT INTO public.users (anonymous_id, reputation_score) VALUES
  ('seed_anon_1', 0.1),
  ('seed_anon_2', 0.5),
  ('seed_anon_3', 0.8),
  ('seed_anon_4', 0.3),
  ('seed_anon_5', 0.1)
ON CONFLICT (anonymous_id) DO NOTHING;

-- Rumors (content, creator_id). One will be finalized, one soft-deleted for demo.
INSERT INTO public.rumors (id, content, creator_id, created_at, deleted_at, final_trust_score, finalized_at) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'The new library opens next Monday.', 'seed_anon_1', now() - interval '8 days', NULL, 0.72, now() - interval '1 day'),
  ('a0000001-0001-4000-8000-000000000002', 'Campus cafe is raising prices next week.', 'seed_anon_2', now() - interval '3 days', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000003', 'There will be a guest lecture on AI this Friday.', 'seed_anon_1', now() - interval '1 day', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000004', 'Dorms will get new WiFi in March.', 'seed_anon_3', now() - interval '5 days', NULL, NULL, NULL),
  ('a0000001-0001-4000-8000-000000000005', 'This rumor was removed by creator (soft-delete demo).', 'seed_anon_4', now() - interval '2 days', now(), NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Votes: one per (rumor_id, voter_id). Reputation-weighted trust (§5.1).
INSERT INTO public.votes (rumor_id, voter_id, vote) VALUES
  ('a0000001-0001-4000-8000-000000000001', 'seed_anon_2', 'true'),
  ('a0000001-0001-4000-8000-000000000001', 'seed_anon_3', 'true'),
  ('a0000001-0001-4000-8000-000000000001', 'seed_anon_4', 'false'),
  ('a0000001-0001-4000-8000-000000000002', 'seed_anon_1', 'true'),
  ('a0000001-0001-4000-8000-000000000002', 'seed_anon_3', 'neutral'),
  ('a0000001-0001-4000-8000-000000000003', 'seed_anon_2', 'true'),
  ('a0000001-0001-4000-8000-000000000003', 'seed_anon_5', 'true'),
  ('a0000001-0001-4000-8000-000000000004', 'seed_anon_1', 'false'),
  ('a0000001-0001-4000-8000-000000000004', 'seed_anon_2', 'neutral')
ON CONFLICT (rumor_id, voter_id) DO NOTHING;
