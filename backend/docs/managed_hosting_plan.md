# Managed Hosting & Deployment Plan (Recommended)

This document describes a recommended managed hosting approach for delivering
NexusLMS to non-technical clients. It assumes you (the vendor) operate and
support the Django backend while providing a clear admin UI for school staff.

Goals

- Minimize client operational burden
- Secure production deployment and data backups
- Provide simple UI for non-technical school admins
- Offer an SLA and optional support contract

Hosting options (choose one)

- Small scale / rapid: DigitalOcean App Platform or Render
- Medium scale: AWS ECS / Elastic Beanstalk or Azure App Service
- Large / Kubernetes: AWS EKS / GKE / AKS (use only if multi-tenant or heavy scale)

Required infra components

- PostgreSQL (managed: RDS, Azure Database, DigitalOcean Managed DB)
- Redis (Channels layer + cache + rate limiting; managed Redis or Elasticache)
- Object storage for media (S3 or compatible)
- Monitoring (Prometheus/Grafana or SaaS: Datadog) and Sentry for errors
- Backups & retention of DB and media
- SSL via Let's Encrypt or provider managed certs

Deployment artifacts to deliver

- Dockerfile (backend/Dockerfile already present)
- `docker-compose.yml` for local/dev, and a cloud manifest (ECS task, deployment yaml)
- `env.example` with all required env vars and brief explanation
- `scripts/` folder with maintenance helpers (backup, restore, manage-users)
- `init_groups` management command (already included)

Essential environment variables

- `DJANGO_SETTINGS_MODULE`
- `DATABASE_URL` (Postgres)
- `REDIS_URL`
- `SECRET_KEY` (rotate and store in secrets manager)
- `SENTRY_DSN` (optional)
- `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (if S3)

Operational checklist (runbook tasks)

- Migrate DB: `python manage.py migrate`
- Create groups: `python manage.py init_groups --sync-users`
- Collect static: `python manage.py collectstatic --noinput`
- Start web + worker processes (Docker/Procfile/K8s)

Backups

- Daily DB dump to separate storage + 30-day retention
- Weekly full media snapshot
- Test restore monthly

Monitoring & Alerts

- Uptime monitoring (PagerDuty/email)
- Error tracking (Sentry) with threshold alerts
- DB connection and free disk alerts

Security & Compliance

- Access control: restrict admin panel by allowed IPs where required
- Audit logs: who changed grades/users (store in DB)
- Data deletion/export per GDPR/FERPA: provide admin export and delete endpoints

Support & SLA suggestions

- Bronze: 3 day SLA for bug fixes, weekly backups (low cost)
- Silver: 24 hour incident response, daily backups
- Gold: 4 hour response, on-call pager, uptime guarantee (requires ops)

Onboarding deliverables

- Admin UI walkthrough recordings (2x 20min)
- Quick start guide and runbook (this repo)
- 1–2 live training sessions (remote)

Costs to estimate for client

- Managed DB, Redis, storage, compute, monitoring, and support hours
- Optionally include a monthly maintenance retainer

Next steps

- Decide hosting provider and plan size
- Add deployment manifests (ECS, K8s, or docker-compose)
- Implement automated backups and health checks

## SaaS / Multi-Tenant Considerations

NexusLMS is now a multi-tenant SaaS application. Each school is an isolated tenant.

### Tenant isolation

- `School` model is the root entity (slug, plan, feature flags, limits)
- `User`, `Profile`, and `Course` have `school` foreign keys
- `TenantMiddleware` resolves `request.school` from the authenticated user
- Viewsets must apply `queryset = queryset.filter(school=request.school)` for tenant scoping

### Subscription plans

| Plan | Price (₦/month) | Students | Teachers | Courses |
|------|----------------|----------|----------|---------|
| Free Trial | 0 (14 days) | 50 | 10 | 20 |
| Starter | 15,000 | 200 | 30 | 50 |
| Professional | 35,000 | 1,000 | 100 | 200 |
| Enterprise | 80,000 | Unlimited | Unlimited | Unlimited |

### Billing integration

- Paystack handles payment collection
- `/api/billing/initialize/` creates a Paystack transaction
- `/api/billing/verify/` confirms payment and activates the subscription plan
- Webhook support (planned) for async payment confirmation

### Tenant provisioning flow

1. School admin visits `/school/register` or `/signup`
2. `POST /api/school/register/` creates School + admin User + Profile
3. School starts on `free_trial` plan (14 days, 50 students)
4. Admin upgrades via `/billing` page → Paystack → verification → plan activated

### Environment variables for SaaS

```bash
# Paystack
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...

# Tenant
DEFAULT_SCHOOL_PLAN=free_trial
TRIAL_DURATION_DAYS=14
```

---

Created for NexusLMS managed delivery.
