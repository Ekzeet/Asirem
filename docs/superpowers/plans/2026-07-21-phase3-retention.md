# Phase 3 — "Keep Them" (Retention & Lifecycle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]` checkboxes.

**Goal:** Reduce churn and raise completion by adding lifecycle email (welcome, receipt, progress nudge, almost-done, win-back) with preferences + unsubscribe, a learning streak, a richer student dashboard, and a mobile-responsive pass on the learning surfaces.

**Architecture:** A single scheduled Edge Function (`send-lifecycle`, protected by a shared secret) computes who needs which email from progress/activity data, respects a per-user `email_prefs` row, dedups via an `email_log`, and sends through Resend (best-effort; live sending is PENDING the owner's Resend key). Preferences and one-click unsubscribe are exposed via SECURITY DEFINER RPCs keyed on an opaque token (no auth needed). Streaks are computed in SQL from `lesson_progress`. The dashboard and responsive work are pure frontend.

**Tech Stack:** Vite/React/TS; Supabase (Postgres/RLS/Edge Functions); Resend. Migrations via MCP (`fnlhevoiwweowqairsyb`); types hand-maintained; i18n FR/EN/ES.

## Global Constraints
- Build gate: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`. No unit runner — "test" = SQL verification (+ impersonation for RLS) and/or tsc+build clean.
- SECURITY DEFINER fns set `search_path to 'public'`; token RPCs are the only ones granted to `anon` (they take an unguessable token, expose only that user's prefs, never enumerate).
- Emails must be idempotent per (user, kind, entity) via `email_log`; never send if `email_prefs.unsubscribed_all` or the per-kind flag is false.
- New user-facing strings in FR/EN/ES (FR default); don't duplicate keys (grep first).
- DB types hand-maintained after DDL.
- Branch `phase3-retention` (stacked on `phase2-trust`); commit bodies end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Live email send is PENDING owner Resend secrets (`RESEND_API_KEY`, `RESEND_FROM`) + a cron to invoke `send-lifecycle` with the `x-cron-secret` header; the function must no-op gracefully (still logs intended sends? no — only log on actual send) and return counts when unconfigured.

## File Structure
- Migration `p3_email_infra` — `email_prefs`, `email_log`, prefs auto-provision trigger + backfill, token RPCs.
- Migration `p3_streaks` — `user_streak(p_user uuid)` + `lifecycle_candidates()` (staff/cron-only) helper.
- Edge function `send-lifecycle` (create).
- `src/pages/public/Unsubscribe.tsx` (create) + route `/unsubscribe/:token`.
- `src/pages/student/MyCourses.tsx` (modify) — continue-learning + streak + recommended.
- `src/styles/*` + key pages — responsive breakpoints.
- `src/lib/database.types.ts`, `src/i18n/dict.ts` (modify).

---

## Task 1: Email preferences + log + token RPCs

**Files:** Migration `p3_email_infra`; modify `database.types.ts`.

**Interfaces produced:**
- `email_prefs(user_id uuid pk → profiles, institution_id uuid, welcome bool default true, receipt bool default true, progress_nudge bool default true, winback bool default true, unsubscribed_all bool default false, token uuid default gen_random_uuid() unique, created_at)`.
- `email_log(id uuid pk, user_id uuid, kind text, entity_id uuid null, sent_at timestamptz default now(), unique(user_id, kind, entity_id))`.
- RPC `get_email_prefs(p_token uuid)` (anon) → jsonb of the row's flags (no ids) or null.
- RPC `set_email_unsubscribed(p_token uuid, p_all boolean)` (anon) → boolean; flips `unsubscribed_all`.

- [ ] **Step 1: Apply migration**

```sql
create table if not exists public.email_prefs (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  institution_id uuid,
  welcome boolean not null default true,
  receipt boolean not null default true,
  progress_nudge boolean not null default true,
  winback boolean not null default true,
  unsubscribed_all boolean not null default false,
  token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now()
);
alter table public.email_prefs enable row level security;
create policy email_prefs_self on public.email_prefs for select using (user_id = auth.uid());
create policy email_prefs_self_upd on public.email_prefs for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  entity_id uuid,
  sent_at timestamptz not null default now(),
  unique (user_id, kind, entity_id)
);
alter table public.email_log enable row level security; -- no policies: service-role only

-- Auto-provision a prefs row for each profile; backfill existing.
create or replace function public.provision_email_prefs()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.email_prefs(user_id, institution_id)
  values (new.id, (select institution_id from public.memberships where user_id=new.id order by created_at limit 1))
  on conflict (user_id) do nothing;
  return new;
end $$;
revoke execute on function public.provision_email_prefs() from anon, authenticated, public;
drop trigger if exists trg_provision_email_prefs on public.profiles;
create trigger trg_provision_email_prefs after insert on public.profiles for each row execute function public.provision_email_prefs();
insert into public.email_prefs(user_id, institution_id)
  select p.id, (select institution_id from public.memberships m where m.user_id=p.id order by created_at limit 1)
  from public.profiles p on conflict (user_id) do nothing;

-- Token-keyed public RPCs for the unsubscribe page.
create or replace function public.get_email_prefs(p_token uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when e.user_id is null then null else jsonb_build_object(
    'welcome', e.welcome, 'receipt', e.receipt, 'progress_nudge', e.progress_nudge,
    'winback', e.winback, 'unsubscribed_all', e.unsubscribed_all) end
  from public.email_prefs e where e.token = p_token;
$$;
grant execute on function public.get_email_prefs(uuid) to anon, authenticated;

create or replace function public.set_email_unsubscribed(p_token uuid, p_all boolean)
returns boolean language plpgsql volatile security definer set search_path to 'public' as $$
declare v int;
begin
  update public.email_prefs set unsubscribed_all = p_all where token = p_token;
  get diagnostics v = row_count;
  return v > 0;
end $$;
grant execute on function public.set_email_unsubscribed(uuid, boolean) to anon, authenticated;
```

- [ ] **Step 2: Verify (SQL)** — every profile has an `email_prefs` row (`select count(*) from profiles p left join email_prefs e on e.user_id=p.id where e.user_id is null` → 0). As `anon`: `get_email_prefs('<a real token>')` returns flags; `get_email_prefs(gen_random_uuid())` → null; `set_email_unsubscribed('<token>', true)` → true and flips the flag (then set back to false). Confirm `email_log` has RLS on with no policies (service-role only).

- [ ] **Step 3: DB types** — add `email_prefs`, `email_log` tables and the two RPCs to `database.types.ts`.

- [ ] **Step 4: tsc clean. Step 5: Commit** `P3: email prefs + log + token unsubscribe RPCs`.

---

## Task 2: Streak + lifecycle candidates (SQL)

**Files:** Migration `p3_streaks`; modify `database.types.ts`.

**Interfaces:**
- `user_streak(p_user uuid)` (authenticated; uses given user but only meaningful for self — or make it use auth.uid()) → int consecutive-day streak from `lesson_progress.completed_at`. Use `auth.uid()` internally (no arg) to avoid an activity oracle: `current_streak()` returns int.
- `lifecycle_candidates()` (service-role only) → setof `{ user_id, email, kind, entity_id, full_name, course_title }` computing progress_nudge / almost_done / winback rows, already excluding anyone unsubscribed or already-logged.

- [ ] **Step 1: Apply migration**

```sql
-- Consecutive-day learning streak for the current user.
create or replace function public.current_streak()
returns int language sql stable security definer set search_path to 'public' as $$
  with days as (
    select distinct (completed_at at time zone 'utc')::date d
    from public.lesson_progress where user_id = auth.uid() and completed_at is not null
  ), ranked as (
    select d, (d - (row_number() over (order by d))::int) grp from days
  )
  select coalesce((
    select count(*)::int from ranked
    where grp = (select grp from ranked order by d desc limit 1)
      and (select max(d) from days) >= current_date - 1
  ), 0);
$$;
grant execute on function public.current_streak() to authenticated;

-- Candidate rows for lifecycle emails (service-role/cron only).
create or replace function public.lifecycle_candidates()
returns table (user_id uuid, email text, kind text, entity_id uuid, full_name text, course_title text)
language sql stable security definer set search_path to 'public','auth' as $$
  -- almost_done: course 80-99% complete, not yet emailed
  select e.user_id, au.email, 'almost_done'::text, cp.course_id, p.full_name, c.title
  from public.course_progress cp
  join public.enrollments e on e.user_id=cp.user_id and e.course_id=cp.course_id
  join public.courses c on c.id=cp.course_id
  join public.profiles p on p.id=cp.user_id
  join auth.users au on au.id=cp.user_id
  join public.email_prefs pr on pr.user_id=cp.user_id
  where cp.pct >= 80 and cp.pct < 100
    and pr.unsubscribed_all=false and pr.progress_nudge=true
    and not exists(select 1 from public.email_log l where l.user_id=cp.user_id and l.kind='almost_done' and l.entity_id=cp.course_id)
  union all
  -- winback: enrolled, no completed lesson in 14 days, not winback-emailed in 30 days
  select e.user_id, au.email, 'winback'::text, e.course_id, p.full_name, c.title
  from public.enrollments e
  join public.courses c on c.id=e.course_id
  join public.profiles p on p.id=e.user_id
  join auth.users au on au.id=e.user_id
  join public.email_prefs pr on pr.user_id=e.user_id
  where e.status='active' and pr.unsubscribed_all=false and pr.winback=true
    and not exists(select 1 from public.lesson_progress lp where lp.user_id=e.user_id and lp.completed_at > now() - interval '14 days')
    and not exists(select 1 from public.email_log l where l.user_id=e.user_id and l.kind='winback' and l.entity_id=e.course_id and l.sent_at > now() - interval '30 days');
$$;
revoke execute on function public.lifecycle_candidates() from anon, authenticated, public;
```

- [ ] **Step 2: Verify (SQL)** — `select current_streak()` under an impersonated user with recent completions returns >=1; `lifecycle_candidates()` runs without error and returns rows only for subscribed users (spot-check the join). (May be empty in seed — fine; confirm no error and that flipping a user's `progress_nudge=false` removes them.)

- [ ] **Step 3: DB types** — add `current_streak` (Args none, Returns number) + `lifecycle_candidates` to Functions. **Step 4: tsc. Step 5: Commit** `P3: current_streak + lifecycle_candidates`.

---

## Task 3: send-lifecycle Edge Function

**Files:** deploy Edge Function `send-lifecycle`.

**Interface:** POST with header `x-cron-secret: <CRON_SECRET>`. Verifies the secret (`Deno.env.get('CRON_SECRET')`); 401 if mismatch. Service client → `rpc('lifecycle_candidates')`; for each row, if `RESEND_API_KEY`+`RESEND_FROM` set, send an email (subject/body per `kind`, include an unsubscribe link `${SITE_URL}/unsubscribe/${token}` — fetch the user's token from `email_prefs`), then insert `email_log(user_id, kind, entity_id)`. If Resend not configured, return `{ configured:false, candidates: n }` WITHOUT logging (so a real run later still sends). Returns `{ sent, skipped }`.

- [ ] **Step 1: Deploy** (`verify_jwt: false`; the `x-cron-secret` header is the auth). Reference `create-checkout` for the client/CORS pattern. Include per-kind subject/body (localized default EN is fine for v1). Insert `email_log` only after a successful Resend 200. Batch-limit to e.g. 200 rows/run.

- [ ] **Step 2: Verify** — deploy ACTIVE; `curl` without the secret → 401; with the secret but no Resend → `{ configured:false, candidates }`. (No live email — PENDING owner Resend key + a cron calling it, e.g. Supabase scheduled function or pg_cron once enabled.) Note the cron setup as owner action in the report.

- [ ] **Step 3: Commit** `P3: send-lifecycle edge function (progress/almost-done/winback, dedup, unsubscribe link)`.

---

## Task 4: Unsubscribe page

**Files:** create `src/pages/public/Unsubscribe.tsx`; modify `App.tsx` (route `/unsubscribe/:token`, both branches, public), `i18n/dict.ts`.

- [ ] **Step 1: Component** — `useParams().token` → `supabase.rpc('get_email_prefs', { p_token })`. Show current status; a button "Unsubscribe from all" → `set_email_unsubscribed(token, true)`; a "Resubscribe" when already unsubscribed → `set_email_unsubscribed(token, false)`. Null token → "invalid link". Wrap in `PublicLayout`. `useDocumentHead({ title: 'Email preferences' })`.
- [ ] **Step 2: Route** — add `/unsubscribe/:token` wrapped in `<PublicLayoutC>` to BOTH route groups in `App.tsx`.
- [ ] **Step 3: i18n** — `emailPrefs`, `unsubscribeAll`, `resubscribe`, `unsubscribed`, `subscribed`, `invalidLink` in fr/en/es.
- [ ] **Step 4: tsc+build. Step 5: Commit** `P3: public unsubscribe / email-preferences page`.

---

## Task 5: Richer student dashboard + streak

**Files:** modify `src/pages/student/MyCourses.tsx`; `i18n/dict.ts`.

- [ ] **Step 1** — READ `MyCourses.tsx`. Add a top strip: a **continue-learning** card (the in-progress course with highest recent activity → link to its player), a **streak** badge (`rpc('current_streak')` → "🔥 N days"), and (if the user has finished at least one course) a **recommended next** course from `list_public_courses` they aren't enrolled in. Keep existing content. Match existing card styles.
- [ ] **Step 2: i18n** — `dayStreak`, `keepItUp`, `recommendedNext`, `continueLearning` (may exist — grep) in fr/en/es.
- [ ] **Step 3: tsc+build. Step 4: Commit** `P3: student dashboard — continue-learning, streak, recommended next`.

---

## Task 6: Mobile-responsive pass (learning surfaces)

**Files:** `src/styles/global.css` (or theme.css); `src/pages/student/Player.tsx`; `src/pages/public/CourseSales.tsx`; `src/pages/admin/Sales.tsx` (table); targeted others.

- [ ] **Step 1** — Add breakpoints so the two-column grids collapse to one column on narrow screens: Player (`1fr 320px` → single col), CourseSales (`1fr 320px` → single col), Sales recent-tx grid horizontal-scroll wrapper, MyCourses grids `auto-fill minmax`. Prefer a small utility class (e.g. `.two-col` with a `@media (max-width: 820px){ grid-template-columns:1fr }`) applied in these pages rather than inline media queries (inline styles can't do media queries). Ensure the public catalog grid and dashboard already use `auto-fill minmax` (they do) — verify. Add `img,video{max-width:100%}` safety and ensure no page overflows horizontally on mobile width.
- [ ] **Step 2: Verify** — `npm run build` clean; resize check via the browser preview at 375px width: Player, sales page, catalog, dashboard, admin Sales table do not overflow horizontally (wide tables scroll within their own container).
- [ ] **Step 3: Commit** `P3: mobile-responsive pass on learning + sales surfaces`.

---

## Task 7: Advisor sweep, push, PR
- [ ] `get_advisors(security)` — no new ERRORs (email_prefs RLS on; email_log service-only; token RPCs are the only anon adds and take unguessable tokens). tsc+build clean. Push `phase3-retention`; PR base `phase2-trust`.

## Self-Review Notes (vs spec §6 Phase 3)
- Lifecycle email (welcome/receipt already partly in stripe-webhook; nudge/almost-done/winback) + prefs + unsubscribe → Tasks 1,3,4.
- Drip→notification: the `notifications` table + NotificationBell already exist; wiring drip unlocks to notifications is deferred as a documented follow-up (drip unlock is computed client-side; a clean server trigger needs a scheduler) — noted, not built here to avoid a fragile half-feature.
- Streaks/reminders → Tasks 2,5.
- Richer dashboard → Task 5. Mobile pass → Task 6.
**Owner action:** Resend key/domain + a scheduled invoker (cron) with `CRON_SECRET` for `send-lifecycle`; `SITE_URL` for unsubscribe links.
