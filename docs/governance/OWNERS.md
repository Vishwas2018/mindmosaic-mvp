# MindMosaic — Service Ownership Matrix v1.1
> Authoritative source of table ownership, mutability classification, and endpoint responsibility. 
> **RULE**: Any PR that changes writer ownership, adds a tenant-scoped table, or introduces a new endpoint MUST update this file. CI blocks merge if missing.
> **Solo Note**: One developer owns all services. Logical boundaries are preserved for maintainability and future team scaling.

## Service: auth-svc / users-svc (UTA)
Path: `supabase/functions/auth-svc` | `supabase/functions/users-svc`
### Tables (WRITE)
- `tenant` — controlled mutable
- `user_profile` — mutable
- `parent_student_link` — mutable
- `class_group` — mutable
- `class_student` — mutable
- `feature_flag` — mutable
- `admin_action_log` — append-only
### Endpoints Owned
- `POST /auth/signup`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`
- `GET/PATCH /users/me`, `/users/me/children`, `/users/me/classes`

## Service: content-svc (CSG)
Path: `supabase/functions/content-svc`
### Tables (WRITE)
- `skill_graph_version`, `skill_node`, `skill_edge`, `skill_migration_map`
- `misconception`, `repair_sequence`, `stimulus`
- `item` — mutable | `item_version` — immutable
- `pathway`, `framework_config`, `assessment_profile`, `blueprint`, `diagnostic_rule`
### Endpoints Owned
- `GET /pathways`, `/assessment-profiles`, `/skill-graphs/active`
- `GET /content/items/{id}`, `/content/select`, `/content/search`
- `POST /skill-graphs/{id}/publish`

## Service: assessment-svc (ASN)
Path: `supabase/functions/assessment-svc`
### Tables (WRITE)
- `session_record` — controlled mutable
- `session_response`, `response_telemetry` — immutable
- `session_checkpoint` — mutable
- `learning_event` — immutable (deferred partitioning)
- `api_idempotency_key` — append-only
- `outbox_event` — append-only
### Tables (READ)
- `user_profile`, `pathway`, `assessment_profile`, `blueprint`, `item`/`v_item_current`, `framework_config`, `repair_sequence`, `feature_flag`
### Endpoints Owned
- `POST /sessions/create`, `/sessions/{id}/respond`, `/sessions/{id}/submit`, `/sessions/{id}/checkpoint`, `/sessions/{id}/state`, `/sessions/{id}/abandon`
- `GET /sessions/recent`

## Service: intelligence-svc (INT)
Path: `supabase/functions/intelligence-svc`
### Tables (WRITE)
- `skill_mastery`, `learning_velocity` — mutable
- `behaviour_profile` — mutable
- `student_misconception` — mutable
- `intelligence_audit_log` — append-only
- `pipeline_event` — append-only
### Tables (READ)
- `session_record`, `session_response`, `response_telemetry`, `skill_node`, `skill_edge`, `misconception`
### Endpoints Owned
- `POST /intelligence/process-session/{id}` (sync L1–L3a)
- `GET /intelligence/learner-profile/{student_id}`, `/intelligence/causal-map/{student_id}`, `/intelligence/behaviour-profile/{student_id}`

## Service: orchestration-svc (ORC)
Path: `supabase/functions/orchestration-svc`
### Tables (WRITE)
- `learning_plan` — controlled mutable
- `plan_revision` — append-only
- `recommendation` — mutable
### Tables (READ)
- `skill_mastery`, `behaviour_profile`, `student_misconception`, `feature_flag`
### Endpoints Owned
- `GET/POST /orchestration/plan/{student_id}/current`, `POST /orchestration/generate-plan/{student_id}`

## Service: analytics-svc (ANL)
Path: `supabase/functions/analytics-svc`
### Tables (WRITE)
- `cohort_metric_cache` — mutable
### Tables (READ)
- All tenant-scoped tables (read-only aggregation)
### Endpoints Owned
- `GET /analytics/pathway-readiness/{student_id}/{pathway_slug}`
- `POST /analytics/generate-assignment` (deferred to v2)

## Service: assignments-svc (ASG)
Path: `supabase/functions/assignments-svc` (v2)
### Tables (WRITE)
- `assignment`, `assignment_target`, `assignment_session` — controlled mutable
### Endpoints Owned
- `POST /assignments`, `GET/PATCH /assignments/{id}`, `POST /assignments/{id}/publish`, `POST /assignments/{id}/start`

## Service: billing-svc (BIL)
Path: `supabase/functions/billing-svc`
### Tables (WRITE)
- `subscription` — mutable
- `billing_customer`, `invoice`, `billing_event` — mutable / append-only
### Tables (READ)
- `tenant`, `feature_flag`, `user_profile`
### Endpoints Owned
- `GET /billing/plans`, `POST /billing/checkout`, `POST /billing/portal`, `GET /billing/subscription`, `POST /billing/webhook/stripe`

## Service: engagement-svc (ENG)
Path: `supabase/functions/engagement-svc` (v2)
### Tables (WRITE)
- `engagement_streak` — mutable
- `achievement_definition` — mutable | `student_achievement` — append-only
### Endpoints Owned
- `GET /engagement/summary/{student_id}`

## Service: notifications-svc (NTF)
Path: `supabase/functions/notifications-svc` (v2)
### Tables (WRITE)
- `notification` — mutable
### Tables (READ)
- `user_profile`, `outbox_event`
### Endpoints Owned
- `GET /notifications/me`, `PATCH /notifications/{id}/read`

## Service: jobs-worker (Platform)
Path: `supabase/functions/jobs-worker`
### Tables (WRITE)
- `job_queue` — mutable
- `rate_limit_bucket` — mutable
### Tables (READ)
- `outbox_event`, `pipeline_event`
### Endpoints Owned
- `GET/POST /admin/jobs`, `POST /admin/jobs/{id}/retry`

---
### 📋 Mutability Legend (§1.3)
| Class | Rule |
|-------|------|
| `Immutable` | Never `UPDATE` or `DELETE` after insert. |
| `Append-only` | Only `INSERT`. Cleanup via retention jobs. |
| `Controlled mutable` | Only specific columns may change. Transitions enforced by owning service. |
| `Mutable` | Standard `UPDATE` allowed by owner service. |