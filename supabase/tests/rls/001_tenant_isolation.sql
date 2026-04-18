-- PR 2: Tenant isolation tests
-- Run: supabase test db --db-url "$DATABASE_URL"
-- Requires: pgtap extension enabled on the database
--   Dashboard → Database → Extensions → pgtap → enable

BEGIN;

SELECT plan(6);

-- ============================================================
-- Seed two isolated tenants and one user per tenant
-- ============================================================

INSERT INTO public.tenant (id, name, slug) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Tenant Alpha', 'alpha'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Tenant Beta',  'beta');

-- Simulate auth users existing (bypass auth.users FK for test isolation)
-- In a real test environment these IDs are pre-seeded via supabase test helpers.
-- Here we cast to uuid directly and rely on SECURITY DEFINER functions being tested.

-- ============================================================
-- Test 1: tenant row is visible only to its own tenant
-- ============================================================

-- Simulate JWT for tenant alpha user
SET LOCAL request.jwt.claims = '{"app_metadata": {"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "parent"}}';
SET LOCAL role = 'authenticated';

SELECT is(
  (SELECT count(*)::int FROM public.tenant WHERE id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0,
  'tenant alpha cannot read tenant beta row'
);

SELECT is(
  (SELECT count(*)::int FROM public.tenant WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  'tenant alpha can read its own row'
);

-- ============================================================
-- Test 2: tenant beta user cannot read tenant alpha data
-- ============================================================

SET LOCAL request.jwt.claims = '{"app_metadata": {"tenant_id": "bbbbbbbb-0000-0000-0000-000000000002", "role": "parent"}}';

SELECT is(
  (SELECT count(*)::int FROM public.tenant WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0,
  'tenant beta cannot read tenant alpha row'
);

-- ============================================================
-- Test 3: feature_flag isolation (global flags visible to all)
-- ============================================================

RESET role;
INSERT INTO public.feature_flag (tenant_id, flag, enabled) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'exam_engine', true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'exam_engine', false),
  (NULL, 'platform_maintenance', false);  -- global flag

SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claims = '{"app_metadata": {"tenant_id": "aaaaaaaa-0000-0000-0000-000000000001", "role": "parent"}}';

-- Tenant alpha sees their own flag + global flag (2 rows)
SELECT is(
  (SELECT count(*)::int FROM public.feature_flag
   WHERE flag = 'exam_engine' AND tenant_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  0,
  'tenant alpha cannot read tenant beta feature flags'
);

-- Global flag is visible
SELECT is(
  (SELECT count(*)::int FROM public.feature_flag WHERE tenant_id IS NULL),
  1,
  'global feature flags visible to all tenants'
);

-- ============================================================
-- Test 4: authenticated user cannot read another tenant's data
-- as anon
-- ============================================================

RESET role;
SET LOCAL role = 'anon';

SELECT is(
  (SELECT count(*)::int FROM public.tenant),
  0,
  'anon cannot read any tenant rows'
);

SELECT * FROM finish();

ROLLBACK;
