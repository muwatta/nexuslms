# Admin API Endpoints

This small helper documents the admin-specific API endpoints added for the
admin UI.

POST /api/admin/sync-groups/

- Body: { "user_ids": [1,2,3] }
- Auth: staff users (IsAdminUser)
- Response: { "processed": [...], "errors": [...] }

Use this endpoint from the frontend Manage Users page to re-sync Django Group
membership for selected users based on their `Profile.role`.

## Management command: normalize_departments

Use this command after importing users from Excel when invalid department
values are accepted and stored as Unassigned. It maps corrupted department
labels back to valid internal department codes and clears invalid values so
those users can be re-assigned cleanly.

Example:

```bash
python manage.py normalize_departments --dry-run
```

Drop `--dry-run` to apply the fixes.
