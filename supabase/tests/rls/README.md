# RLS pg-tap Tests

Every tenant-scoped table must have a test here asserting zero cross-tenant reads.

Naming: NNN_<table_or_feature>.sql

Run locally: `supabase test db`
Runs in CI on every PR.
