-- PR 2: Tenancy, User Profiles, RLS
-- Apply: supabase db push
-- Tables: tenant, user_profile, parent_student_link, feature_flag, api_idempotency_key

-- ============================================================
-- Helper functions used by RLS policies
-- ============================================================

CREATE OR REPLACE FUNCTION auth_tenant_id()
  RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid $$;

CREATE OR REPLACE FUNCTION auth_user_id()
  RETURNS uuid LANGUAGE sql STABLE
  AS $$ SELECT auth.uid() $$;

CREATE OR REPLACE FUNCTION auth_role()
  RETURNS text LANGUAGE sql STABLE
  AS $$ SELECT auth.jwt() -> 'app_metadata' ->> 'role' $$;

-- ============================================================
-- tenant
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  plan        text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;

-- Tenants can only read their own row
CREATE POLICY "tenant: select own"
  ON tenant FOR SELECT
  USING (id = auth_tenant_id());

-- ============================================================
-- user_profile
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profile (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('parent','student','teacher','org_admin','platform_admin')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

-- Users can read profiles within their own tenant
CREATE POLICY "user_profile: select own tenant"
  ON user_profile FOR SELECT
  USING (tenant_id = auth_tenant_id());

-- Users can update only their own profile
CREATE POLICY "user_profile: update own"
  ON user_profile FOR UPDATE
  USING (id = auth_user_id());

-- Service role can insert (called during signup hook)
CREATE POLICY "user_profile: insert service"
  ON user_profile FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- parent_student_link
-- ============================================================

CREATE TABLE IF NOT EXISTS parent_student_link (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  parent_id   uuid NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  student_id  uuid NOT NULL REFERENCES user_profile(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

ALTER TABLE parent_student_link ENABLE ROW LEVEL SECURITY;

-- Parents can read their own links; students can read links to themselves
CREATE POLICY "parent_student_link: select own tenant"
  ON parent_student_link FOR SELECT
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "parent_student_link: insert own tenant"
  ON parent_student_link FOR INSERT
  WITH CHECK (tenant_id = auth_tenant_id() AND auth_role() IN ('parent','org_admin'));

CREATE POLICY "parent_student_link: delete own tenant"
  ON parent_student_link FOR DELETE
  USING (tenant_id = auth_tenant_id() AND auth_role() IN ('parent','org_admin'));

-- ============================================================
-- feature_flag
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flag (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenant(id) ON DELETE CASCADE, -- NULL = platform-wide
  flag        text NOT NULL,
  enabled     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, flag)
);

ALTER TABLE feature_flag ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read flags for their tenant or platform-wide flags
CREATE POLICY "feature_flag: select own tenant or global"
  ON feature_flag FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth_tenant_id());

-- ============================================================
-- api_idempotency_key
-- ============================================================

CREATE TABLE IF NOT EXISTS api_idempotency_key (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key           text NOT NULL,
  request_hash  text NOT NULL,
  response      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE (tenant_id, key)
);

ALTER TABLE api_idempotency_key ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_idempotency_key: own user"
  ON api_idempotency_key FOR ALL
  USING (user_id = auth_user_id() AND tenant_id = auth_tenant_id());

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profile_tenant ON user_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_psl_parent ON parent_student_link(parent_id);
CREATE INDEX IF NOT EXISTS idx_psl_student ON parent_student_link(student_id);
CREATE INDEX IF NOT EXISTS idx_psl_tenant ON parent_student_link(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_tenant ON feature_flag(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON api_idempotency_key(expires_at);

-- ============================================================
-- JWT custom access token hook
-- Injects tenant_id and role from user_profile into app_metadata.
-- Register in: Dashboard → Authentication → Hooks → Custom Access Token
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
  RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  claims   jsonb;
  profile  RECORD;
BEGIN
  SELECT tenant_id, role
    INTO profile
    FROM public.user_profile
   WHERE id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  IF profile IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(profile.tenant_id::text));
    claims := jsonb_set(claims, '{app_metadata,role}',      to_jsonb(profile.role));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to the supabase_auth_admin role so the hook can run
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
