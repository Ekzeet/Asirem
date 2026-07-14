# Asirem Academy — LMS Platform

A trilingual (FR / EN / ES), multi-role Learning Management System for a tax & insurance training academy, built from the `LMS Platform.dc.html` design and backed by **Supabase**.

- **Frontend:** Vite + React 18 + TypeScript + React Router, plain CSS design tokens, `lucide-react` icons.
- **Backend:** Supabase (Postgres + Auth + Row Level Security). Project `Asirem Academy` (`fnlhevoiwweowqairsyb`).
- **Roles:** Administrator, Instructor (teacher), Student — role comes from the user's `membership`, and every table is multi-tenant (institution-scoped) with RLS.

## Prerequisites

- **Node.js 18+** (includes `npm`) — https://nodejs.org  
  _Node was not detected on this machine; install it before running the steps below._

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL (default http://localhost:5173).

`.env.local` is already configured with the Supabase URL and publishable key.

## Demo logins

All seeded accounts share the password **`asirem2026`**. The login screen also has one-click "Demo accounts" buttons.

| Role        | Email                    |
|-------------|--------------------------|
| Admin       | `amina@meridian.test`    |
| Instructor  | `sarah@asirem.test`      |
| Student     | `lina@asirem.test`       |

(Other seeded people: teachers marc/nadia/david/elena/tom@asirem.test, students karim/sofia/james/aminad/peter/rosa@asirem.test, plus the original marcus@ / diego@ / sara@meridian.test.)

The sidebar footer has a **"View as"** switcher that re-authenticates as the Admin / Instructor / Student demo account so you can tour all three role experiences.

## What's wired to real data

Everything reads from Supabase; analytics are computed in Postgres (SECURITY DEFINER RPCs / views), not hard-coded:

- **Admin Dashboard** — KPIs, 12-month revenue chart, enrollment mix, top courses, activity feed (`admin_dashboard_stats`, `revenue_monthly`, `enrollment_mix`, `top_courses`, `activity_feed`).
- **Admin Courses / Students / Teachers / Sales** — catalog, enrollments + progress, instructor stats, transactions, MRR, coupons (`sales_stats`, `mrr`, `course_progress`).
- **Community** — groups, post feed (create + like), events, leaderboard (`leaderboard` view, live `post_likes`).
- **Student** — My Courses (real progress), Course Player (lesson list, mark-complete → `lesson_progress`, quiz → `quiz_attempts` + `points_ledger`, autosaving notes), Certificates.
- **Teacher Dashboard** — your students / earnings / rating / courses (`teacher_dashboard_stats`).

## Project structure

```
src/
  lib/            supabase client, generated DB types, formatting helpers
  i18n/           FR/EN/ES dictionary + context
  auth/           AuthContext (role from membership), LoginPage, demo accounts
  components/     Layout, Sidebar, Topbar, Icon, shared UI
  pages/
    admin/        Dashboard, Courses, Students, Teachers, Sales
    community/    Community
    student/      MyCourses, Player, Certificates
    teacher/      Dashboard
```

## Backend notes

Schema and seed were applied as Supabase migrations (`catalog_extend`, `enrollment_progress`, `quizzes_notes`, `community`, `sales`, `certificates`, `analytics_rpcs`, `seed_*`). They build on the pre-existing tenancy/auth foundation (`institutions`, `profiles`, `memberships`, `courses/sections/lessons`) and reuse its RLS helper functions (`has_institution_role`, `can_view_course`, etc.). New helpers: `is_enrolled`, `can_view_lesson`, plus analytics RPCs restricted to `authenticated` and guarded by `has_institution_role`.
