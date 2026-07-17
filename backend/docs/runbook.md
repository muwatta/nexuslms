# Runbook (Essential Operational Commands)

This runbook contains command examples and procedures for common operational
tasks for NexusLMS in a managed deployment.

Environment prerequisite

- Ensure `python` and `docker` are available on the host (or use provided
  Docker images).
- Set environment variables from `.env` or secret manager.

Common tasks

1. Apply database migrations

```bash
# activate virtualenv or use container
python backend/manage.py migrate
```

2. Create groups and sync existing users

```bash
python backend/manage.py init_groups --sync-users
```

3. Collect static files

```bash
python backend/manage.py collectstatic --noinput
```

4. Verify Redis connectivity (production)

```bash
redis-cli -u "$REDIS_URL" ping
# Expected: PONG
```

5. Backup database (Postgres example)

```bash
pg_dump --dbname="$DATABASE_URL" -Fc -f /backups/nexuslms-$(date +%F).dump
```

6. Restore database (example)

```bash
pg_restore --clean --no-owner --dbname="$DATABASE_URL" /backups/nexuslms-2026-03-01.dump
```

7. Rolling deploy (Docker example)

- Build image locally and push to registry

```bash
docker build -t registry.example.com/nexuslms/backend:latest ./backend
docker push registry.example.com/nexuslms/backend:latest
```

- Update service (ECS/K8s/compose) to use new image and verify health checks.

8. Subscription management commands

```bash
# Check subscription status for all schools
python backend/manage.py shell -c "
from api.core.models import School, Subscription
for s in School.objects.all():
    sub = Subscription.objects.filter(school=s).order_by('-created_at').first()
    print(f'{s.name}: plan={s.plan}, sub={sub.status if sub else \"none\"}')"

# Manually expire overdue subscriptions (use with caution)
python backend/manage.py shell -c "
from api.core.models import Subscription
from django.utils import timezone
Subscription.objects.filter(status='active', expires_at__lt=timezone.now()).update(status='expired')"

# Set a school to enterprise plan (super admin override)
python backend/manage.py shell -c "
from api.core.models import School
s = School.objects.get(slug='my-school')
s.plan = 'enterprise'
s.save()
print(f'Updated {s.name} to enterprise plan')"
```

9. Troubleshooting

- Check web logs: `docker logs <container>` or cloud provider logs
- Check Redis: `redis-cli -u "$REDIS_URL" info server`
- Check tenant isolation: `python -c "import django; django.setup(); from api.core.models import User; print(User.objects.values('school__name').annotate(c=Count('id')))"` 
- Database connectivity: `python -c "import django; django.setup(); from django.db import connections; print(connections['default'].introspection.table_names())"`

10. Emergency rollback

- Re-deploy previous image tag and re-run migrations if needed.

11. Contact & escalation

- Support lead: ops@example.com
- On-call: +1-555-OPS (Gold SLA only)

Automation & CI

- Include DB migration and smoke test in CI before deployment
- Run integration tests in staging environment

Recovery drills

- Schedule monthly restore tests from backups to validate procedures

---

Add provider-specific commands (EKS, ECS, Azure) as part of final handover.
