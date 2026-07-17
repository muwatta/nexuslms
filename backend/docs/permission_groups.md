# Permission Groups in the LMS

This document explains the Django `Group` objects used by the NexusLMS backend
and describes which human roles belong in each group along with the kinds of
backend actions they permit.

The groups act as **permission buckets**. School administrators drag users
into the appropriate buckets; our signal code also auto‑assigns groups based on
`Profile.role` when profiles are saved.

| Group name             | Who goes in it (roles/jobs)     | What they can do in the backend                                |
| ---------------------- | ------------------------------- | -------------------------------------------------------------- |
| **Course Creators**    | Instructors, Teachers, Admin    | create/change/delete courses; manage course metadata           |
| **Grade Managers**     | Teachers, Instructors           | update quiz & assignment scores; override grades               |
| **Content Moderators** | Instructors, Teachers           | edit/delete quizzes, assignments, achievements, projects       |
| **Financial Viewers**  | School‑level Admin, Super‑Admin | view payment records, invoices, enrollments                    |
| **User Managers**      | School‑level Admin, Super‑Admin | add/change/delete users; assign roles                          |
| **Parents**            | Parent accounts                 | view their child's enrollments & progress (own‑child only)     |
| **Billing Managers**   | Super‑Admin, Admin              | view subscriptions, initialize payments, manage billing plans  |
| **School Managers**    | Super‑Admin                     | create/edit/delete schools, manage plans, set feature flags    |
| **Backend Staff**      | IT/support staff                | access tooling/health pages; manage deployments (custom group) |

> **Note:** “Backend Staff” isn’t a built‑in Django concept; it’s a label you
> can create if you need an operational team to see internal APIs or health
> screens. There is no special handling for it in the code – just give it the
> appropriate permissions and place the right users inside.

## LMS app vs. backend groups

The LMS app is the entire Django project: models, views, serializers, etc. The
backend groups are the Django `Group` objects we create to control who may
interact with the LMS app. There isn’t a single “backend” group unless you
explicitly make one and put IT/ops users in it.

When a school admin asks “who should be in the backend group?”, the answer
is: **whichever staff members need backend privileges** (see the table above).

## Practical workflow

1. Run `python manage.py init_groups` during deployment to create the groups.
2. Saving a `Profile` automatically assigns the appropriate groups for the
   role (`teacher` → Course Creators, Grade Managers, Content Moderators,
   etc.; `parent` → Parents only).
3. Use the Django admin (Groups page) to view or manually adjust membership.
4. Teachers and admins can also use the **Sync groups from profile role** user
   action on the Users list to retro‑fit existing accounts.

```bash
# bootstrap groups and sync existing profiles in one step
python backend/manage.py init_groups --sync-users
```

Role checks in the codebase should continue to use `profile.role` for UI-level
routing, while permission enforcement uses `.groups` membership checks or
`django.contrib.auth.decorators.permission_required` with the relevant codename.

---

Keeping both a `role` field and Django groups gives you the best of both worlds:
fast, readable role switches for front‑end logic plus fine‑grained, admin‑managed
permission control on the backend.
