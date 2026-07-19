# Phase 1 — "Turn on the Money" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-out visitor discover a course on a public storefront, buy it with a real card (guest or logged-in), and immediately start learning — with tax collected, coupons applied, receipts sent, and CE-ready data hooks in place.

**Architecture:** Add a public (unauthenticated) route tree to the existing SPA that renders published-course data through published-only RLS + dedicated SECURITY DEFINER RPCs (never exposing drafts, answer keys, or non-preview media). Money is server-authoritative: the browser only passes a course id + optional coupon/email to an Edge Function that builds a Stripe Checkout Session; a signature-verified webhook is the sole writer of orders/enrollments and provisions guest accounts. CE fields are cheap columns surfaced in the UI now, activated for formal reporting later.

**Tech Stack:** Vite + React 18 + TypeScript + React Router v6; Supabase (Postgres, Auth, RLS, Storage, Edge Functions/Deno); Stripe Checkout + Stripe Tax; Resend for email. Migrations applied via Supabase MCP; DB types hand-maintained in `src/lib/database.types.ts`; i18n dict FR/EN/ES in `src/i18n/dict.ts`.

## Global Constraints

- Supabase project id: `fnlhevoiwweowqairsyb`. All migrations via MCP `apply_migration`; all SQL checks via MCP `execute_sql`.
- Node must be on PATH for tsc/build: `export PATH="/c/Program Files/nodejs:$PATH"` (Git Bash) before `npx tsc -b` / `npm run build`.
- No unit-test runner exists in this repo. "Test" = (a) backend: a SQL verification query with an expected result, run via `execute_sql`, and/or role-impersonation to prove RLS; (b) frontend: `npx tsc -b` clean + `npm run build` succeeds, plus a stated manual/impersonation check. Do NOT introduce Jest/Vitest.
- Every new SECURITY DEFINER function sets `set search_path to 'public'` and `revoke execute ... from anon, authenticated, public` unless it is deliberately public (then grant only the minimum role).
- Every new user-facing string goes in all three locales (FR, EN, ES) in `src/i18n/dict.ts`. Default language is FR.
- DB types are hand-maintained: after any DDL, update `src/lib/database.types.ts` by hand to match (mirror the existing style in that file).
- Commit after each task with a clear message ending:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Money values are integer cents. Currency comes from `institutions.currency` (per-tenant), lowercased for Stripe.
- Never trust price, tax, or coupon amount from the client; the Edge Function/Stripe computes them.

---

## File Structure

**Backend (via MCP migrations + edge functions):**
- Migration `p1_storefront_ce` — adds `courses.slug`, `courses.credit_hours`, `exams.time_limit_minutes`, `orders.tax_cents`, `profiles.ptin`; backfills slugs.
- Migration `p1_public_rpcs` — `list_public_courses()`, `get_public_course(slug)`, `preview_lesson_signed_path(p_lesson uuid)`; published-only exposure.
- Migration `p1_lock_financial_rpcs` — restrict `revenue_monthly`/`mrr`/`sales_stats`/`admin_dashboard_stats` to `institution_admin`.
- Edge function `create-checkout` (modify) — support guest + logged-in, coupons, Stripe Tax, real success/cancel URLs.
- Edge function `stripe-webhook` (modify) — persist tax + coupon usage, provision guest accounts, send access email.

**Frontend (`src/`):**
- `lib/database.types.ts` (modify) — new columns + RPC signatures.
- `App.tsx` (modify) — serve a public route tree when unauthenticated.
- `components/PublicLayout.tsx` (create) — header/footer chrome for public pages.
- `pages/public/Home.tsx` (create) — marketing homepage.
- `pages/public/PublicCatalog.tsx` (create) — public course listing.
- `pages/public/CourseSales.tsx` (create) — per-course sales page + preview playback + buy CTA.
- `pages/public/Legal.tsx` (create) — Terms / Privacy / Refund (one component, route param).
- `pages/public/CheckoutReturn.tsx` (create) — success/cancel landing.
- `lib/checkout.ts` (create) — client helper that calls the checkout Edge Function.
- `i18n/dict.ts` (modify) — storefront + legal strings (FR/EN/ES).
- `pages/admin/CourseBuilder.tsx` (modify) — edit `credit_hours` + `slug` on a course.
- `pages/ExamPlayer.tsx` (modify) — countdown when `time_limit_minutes` set.

---

## Task 1: DB migration — storefront + CE-ready columns

**Files:**
- Migration (MCP): `p1_storefront_ce`
- Modify: `src/lib/database.types.ts` (courses/exams/orders/profiles Row+Insert+Update)

**Interfaces:**
- Produces columns: `courses.slug text` (unique per institution, not null after backfill), `courses.credit_hours numeric` (nullable), `exams.time_limit_minutes int` (nullable), `orders.tax_cents int default 0`, `profiles.ptin text` (nullable).

- [ ] **Step 1: Apply the migration**

Apply via MCP `apply_migration` (project `fnlhevoiwweowqairsyb`, name `p1_storefront_ce`):

```sql
alter table public.courses add column if not exists slug text;
alter table public.courses add column if not exists credit_hours numeric;
alter table public.exams add column if not exists time_limit_minutes int;
alter table public.orders add column if not exists tax_cents int not null default 0;
alter table public.profiles add column if not exists ptin text;

-- Backfill slugs from title (lowercase, hyphenate, strip non-alnum), de-duplicate with a short id suffix.
update public.courses c set slug =
  regexp_replace(lower(coalesce(nullif(trim(c.title),''),'course')), '[^a-z0-9]+', '-', 'g')
  || '-' || substr(c.id::text, 1, 4)
where slug is null;

-- Trim leading/trailing hyphens left by the regex.
update public.courses set slug = trim(both '-' from slug) where slug like '-%' or slug like '%-';

-- Enforce uniqueness within an institution.
create unique index if not exists courses_slug_inst_key on public.courses(institution_id, slug);
```

- [ ] **Step 2: Verify columns + backfill (SQL test)**

Run via `execute_sql`:

```sql
select count(*) as total, count(slug) as with_slug, count(*) filter (where slug is null) as null_slugs from public.courses;
select slug from public.courses order by slug;
```

Expected: `null_slugs = 0`; every course has a non-empty, hyphenated slug.

- [ ] **Step 3: Update DB types**

In `src/lib/database.types.ts`, add to each table's `Row`, `Insert` (optional), and `Update`:
- `courses`: `slug: string`, `credit_hours: number | null`
- `exams`: `time_limit_minutes: number | null`
- `orders`: `tax_cents: number`
- `profiles`: `ptin: string | null`

Match the existing hand-maintained style (mirror a neighboring column's typing).

- [ ] **Step 4: Typecheck**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b`
Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "P1: storefront + CE-ready columns (slug, credit_hours, time_limit_minutes, tax_cents, ptin)"
```

---

## Task 2: Public data RPCs + preview-only signing

**Files:**
- Migration (MCP): `p1_public_rpcs`
- Modify: `src/lib/database.types.ts` (Functions block)

**Interfaces:**
- Consumes: `courses.slug`, `courses.status='published'`, `lessons.is_preview`, existing `course-media` Storage bucket.
- Produces RPCs (callable by `anon`):
  - `list_public_courses()` → setof rows `{ id uuid, slug text, title text, subtitle text, category text, level text, price_cents int, currency text, rating numeric, credit_hours numeric, accent text, icon text, instructor_name text }`
  - `get_public_course(p_slug text)` → single json object with the same course fields plus `sections` (array of `{ id, title, position, lessons: [{ id, title, position, is_preview, duration_seconds }] }`).
  - `preview_lesson_signed_path(p_lesson uuid)` → `text` (Storage object path) or null; returns a path ONLY when the lesson's course is published AND `lessons.is_preview = true`. (The client signs it via `supabase.storage.from('course-media').createSignedUrl(path, 3600)` — but see Step 3; signing needs the service role, so this RPC returns a fully-signed URL instead.)

- [ ] **Step 1: Apply the migration**

Apply via MCP `apply_migration` (name `p1_public_rpcs`). Note: `get_public_course` returns published data only; `list_public_courses` too. `preview_lesson_signed_path` is renamed to `get_preview_lesson_url` and returns a signed URL via a definer that can read storage.

```sql
-- Public catalog listing (published only). SQL, STABLE, definer so anon can read joined instructor name.
create or replace function public.list_public_courses()
returns table (id uuid, slug text, title text, subtitle text, category text, level text,
               price_cents int, currency text, rating numeric, credit_hours numeric,
               accent text, icon text, instructor_name text)
language sql stable security definer set search_path to 'public' as $$
  select c.id, c.slug, c.title, c.subtitle, c.category, c.level,
         c.price_cents, i.currency, c.rating, c.credit_hours, c.accent, c.icon,
         p.full_name
  from public.courses c
  join public.institutions i on i.id = c.institution_id
  left join public.profiles p on p.id = c.instructor_id
  where c.status = 'published'
  order by c.published_at desc nulls last, c.title;
$$;
grant execute on function public.list_public_courses() to anon, authenticated;

-- Single course sales page (published only) with curriculum outline.
create or replace function public.get_public_course(p_slug text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when c.id is null then null else jsonb_build_object(
    'id', c.id, 'slug', c.slug, 'title', c.title, 'subtitle', c.subtitle,
    'category', c.category, 'level', c.level, 'price_cents', c.price_cents,
    'currency', i.currency, 'rating', c.rating, 'credit_hours', c.credit_hours,
    'accent', c.accent, 'icon', c.icon, 'instructor_name', p.full_name,
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'title', s.title, 'position', s.position,
        'lessons', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l.id, 'title', l.title, 'position', l.position,
            'is_preview', l.is_preview, 'duration_seconds', l.duration_seconds
          ) order by l.position)
          from public.lessons l where l.section_id = s.id
        ), '[]'::jsonb)
      ) order by s.position)
      from public.sections s where s.course_id = c.id
    ), '[]'::jsonb)
  ) end
  from public.courses c
  join public.institutions i on i.id = c.institution_id
  left join public.profiles p on p.id = c.instructor_id
  where c.slug = p_slug and c.status = 'published';
$$;
grant execute on function public.get_public_course(text) to anon, authenticated;

-- Signed URL for a PREVIEW lesson only, on a PUBLISHED course. Returns null otherwise.
create or replace function public.get_preview_lesson_url(p_lesson uuid)
returns text language plpgsql stable security definer set search_path to 'public','storage' as $$
declare v_path text; v_ok boolean; v_url text;
begin
  select l.file_url,
         (c.status='published' and coalesce(l.is_preview,false))
    into v_path, v_ok
  from public.lessons l
  join public.sections s on s.id = l.section_id
  join public.courses c on c.id = s.course_id
  where l.id = p_lesson;
  if not coalesce(v_ok,false) or v_path is null then return null; end if;
  select token into v_url from storage.create_signed_url('course-media', v_path, 3600); -- helper below
  return v_url;
end $$;
grant execute on function public.get_preview_lesson_url(uuid) to anon, authenticated;
```

If `storage.create_signed_url` is not available as a callable in this project, replace the signing line with returning the raw `v_path` and have the client call `supabase.storage.from('course-media').createSignedUrl(path, 3600)` — but that requires a Storage RLS read policy allowing anon to sign preview objects. Prefer the definer-signs approach; if unavailable, add this Storage policy instead and return `v_path`:

```sql
-- Fallback: allow anyone to read a preview lesson object by path convention {courseId}/...
-- (Only add if get_preview_lesson_url returns the path instead of a signed URL.)
```

- [ ] **Step 2: Verify anon exposure is safe (SQL test)**

Run via `execute_sql`:

```sql
-- as anon
set local role anon;
select count(*) from list_public_courses();                       -- >= number of published courses
select (get_public_course((select slug from courses where status='published' limit 1))) ->> 'title';  -- non-null title
select get_public_course('does-not-exist');                       -- null
-- drafts must not leak:
select count(*) from list_public_courses() lp
  join courses c on c.id = lp.id where c.status <> 'published';    -- 0
reset role;
```

Expected: published list non-empty, unknown slug returns null, zero non-published rows leaked.

- [ ] **Step 3: Verify preview gating (SQL test)**

```sql
set local role anon;
-- a preview lesson on a published course returns a url; a non-preview returns null
select get_preview_lesson_url((select l.id from lessons l join sections s on s.id=l.section_id join courses c on c.id=s.course_id where c.status='published' and l.is_preview limit 1)) is not null as preview_ok;
select get_preview_lesson_url((select l.id from lessons l join sections s on s.id=l.section_id join courses c on c.id=s.course_id where coalesce(l.is_preview,false)=false limit 1)) is null as nonpreview_blocked;
reset role;
```

Expected: `preview_ok = true`, `nonpreview_blocked = true`. (If no preview lesson exists in seed data, first set one: `update lessons set is_preview=true where id = (...)`.)

- [ ] **Step 4: Add RPC signatures to DB types**

In `src/lib/database.types.ts` `Functions` block, add:
- `list_public_courses: { Args: Record<string, never>; Returns: { id: string; slug: string; title: string; subtitle: string | null; category: string | null; level: string | null; price_cents: number; currency: string; rating: number | null; credit_hours: number | null; accent: string | null; icon: string | null; instructor_name: string | null }[] }`
- `get_public_course: { Args: { p_slug: string }; Returns: Json }`
- `get_preview_lesson_url: { Args: { p_lesson: string }; Returns: string | null }`

- [ ] **Step 5: Typecheck**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "P1: public storefront RPCs (list_public_courses, get_public_course, preview-only signed url)"
```

---

## Task 3: Lock financial RPCs to institution_admin (deferred P0)

**Files:**
- Migration (MCP): `p1_lock_financial_rpcs`

**Interfaces:**
- Consumes: existing `has_institution_role(uuid, text[])`.
- Produces: `revenue_monthly`, `mrr`, `sales_stats`, `admin_dashboard_stats` now raise unless caller is `institution_admin` (or `super_admin`) of the target institution.

- [ ] **Step 1: Apply the migration**

Apply via MCP `apply_migration` (name `p1_lock_financial_rpcs`). Add a guard clause at the top of each function body. Because these are existing functions, re-create them with `create or replace` preserving their current body but prepending the guard. Fetch each current definition first with:

```sql
select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('revenue_monthly','mrr','sales_stats','admin_dashboard_stats');
```

Then for each, insert immediately after the `begin` (plpgsql) or wrap (sql → convert to plpgsql or add a `where has_institution_role(...)` predicate). For plpgsql ones (`mrr`, `sales_stats`, `admin_dashboard_stats`):

```sql
if not public.has_institution_role(p_institution_id, array['institution_admin']) then
  raise exception 'forbidden' using errcode='42501';
end if;
```

For the sql function `revenue_monthly(p_institution_id uuid)`, add a guard by converting to plpgsql or gate via a wrapper. Minimal approach — recreate as plpgsql:

```sql
create or replace function public.revenue_monthly(p_institution_id uuid)
returns table (month text, revenue_cents bigint) language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not public.has_institution_role(p_institution_id, array['institution_admin']) then
    raise exception 'forbidden' using errcode='42501';
  end if;
  return query
    <PASTE THE EXISTING SELECT BODY FROM pg_get_functiondef HERE, UNCHANGED>;
end $$;
```

(Use the exact column list/body from `pg_get_functiondef` so the return shape is unchanged.)

- [ ] **Step 2: Verify a teacher is now blocked (SQL test)**

Impersonate a teacher and confirm denial, then an admin and confirm success. Get ids first:

```sql
select p.id as teacher_id, m.institution_id from memberships m join profiles p on p.id=m.user_id where m.role='teacher' limit 1;
select p.id as admin_id, m.institution_id from memberships m join profiles p on p.id=m.user_id where m.role='institution_admin' limit 1;
```

Then, for the teacher:

```sql
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub','<TEACHER_ID>','role','authenticated')::text, true);
select public.mrr('<INSTITUTION_ID>');  -- expect ERROR forbidden (42501)
reset role;
```

Expected: teacher call raises `forbidden`; repeating with `<ADMIN_ID>` returns data normally.

- [ ] **Step 3: Confirm frontend still works for admins**

`admin/Dashboard.tsx` and `admin/Sales.tsx` call these as an admin — no code change needed. Confirm no other role calls them: `grep -rn "revenue_monthly\|\.rpc('mrr'\|sales_stats\|admin_dashboard_stats" src`. Expected: only admin-gated pages reference them.

- [ ] **Step 4: Commit**

(No source files changed — DB-only migration.) Record the change:

```bash
git commit --allow-empty -m "P1 security: restrict financial RPCs (revenue_monthly/mrr/sales_stats/admin_dashboard_stats) to institution_admin"
```

---

## Task 4: Public route tree + PublicLayout (App refactor)

**Files:**
- Modify: `src/App.tsx` (unauthenticated branch)
- Create: `src/components/PublicLayout.tsx`
- Modify: `src/i18n/dict.ts` (nav/footer strings, FR/EN/ES)

**Interfaces:**
- Consumes: `useAuth()` (`session`, `me`, `loading`), `supabaseConfigured`, `useI18n()`.
- Produces: `PublicLayout` (header with logo + language toggle + "Log in" + "Browse courses"; footer with legal links); public routes: `/`, `/courses`, `/courses/:slug`, `/legal/:doc`, `/checkout/return`, `/login`, `/verify/:serial`. Any other unauthenticated path renders the public Home (not a redirect to login).

- [ ] **Step 1: Create `PublicLayout.tsx`**

```tsx
import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--border-soft)', background: '#fff' }}>
        <Link to="/" style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--navy-800)', fontSize: 18, textDecoration: 'none' }}>Asirem Academy</Link>
        <Link to="/courses" style={{ marginLeft: 8, color: '#5B6B82', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{t('browseCourses')}</Link>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <select value={lang} onChange={(e) => setLang(e.target.value as any)} aria-label="Language"
            style={{ border: '1px solid var(--border-soft)', borderRadius: 8, padding: '6px 8px', fontWeight: 700, color: '#5B6B82' }}>
            <option value="fr">FR</option><option value="en">EN</option><option value="es">ES</option>
          </select>
          <Link to="/login" style={{ background: 'var(--navy-800)', color: '#fff', padding: '8px 16px', borderRadius: 9, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>{t('login')}</Link>
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ borderTop: '1px solid var(--border-soft)', padding: '20px 24px', display: 'flex', gap: 18, flexWrap: 'wrap', color: '#8494A8', fontSize: 13, fontWeight: 600, background: '#fff' }}>
        <span>© {new Date().getFullYear()} Asirem Academy</span>
        <Link to="/legal/terms" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('terms')}</Link>
        <Link to="/legal/privacy" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('privacy')}</Link>
        <Link to="/legal/refund" style={{ color: '#5B6B82', textDecoration: 'none' }}>{t('refund')}</Link>
      </footer>
    </div>
  )
}
```

Confirm `useI18n()` exposes `setLang`; if it's named `setLanguage`, use that. (`grep -n "setLang\|setLanguage" src/i18n/I18nContext.tsx`.)

- [ ] **Step 2: Add lazy imports + public routes in `App.tsx`**

Near the other `lazy(...)` imports add:

```tsx
const PublicLayoutC = lazy(() => import('./components/PublicLayout'))
const Home = lazy(() => import('./pages/public/Home'))
const PublicCatalog = lazy(() => import('./pages/public/PublicCatalog'))
const CourseSales = lazy(() => import('./pages/public/CourseSales'))
const Legal = lazy(() => import('./pages/public/Legal'))
const CheckoutReturn = lazy(() => import('./pages/public/CheckoutReturn'))
```

Replace the unauthenticated `<Routes>` block (the `if (!session || !me)` branch) with:

```tsx
if (!session || !me) {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/verify/:serial" element={<Verify />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/checkout/return" element={<PublicLayoutC><CheckoutReturn /></PublicLayoutC>} />
        <Route path="/courses" element={<PublicLayoutC><PublicCatalog /></PublicLayoutC>} />
        <Route path="/courses/:slug" element={<PublicLayoutC><CourseSales /></PublicLayoutC>} />
        <Route path="/legal/:doc" element={<PublicLayoutC><Legal /></PublicLayoutC>} />
        <Route path="/" element={<PublicLayoutC><Home /></PublicLayoutC>} />
        <Route path="*" element={<PublicLayoutC><Home /></PublicLayoutC>} />
      </Routes>
    </Suspense>
  )
}
```

Also add public routes for LOGGED-IN users so they can still view the storefront (e.g. to buy another course). In the authenticated `<Routes>`, before `<Route element={<Layout />}>`, add:

```tsx
<Route path="/courses" element={<PublicLayoutC><PublicCatalog /></PublicLayoutC>} />
<Route path="/courses/:slug" element={<PublicLayoutC><CourseSales /></PublicLayoutC>} />
<Route path="/legal/:doc" element={<PublicLayoutC><Legal /></PublicLayoutC>} />
<Route path="/checkout/return" element={<PublicLayoutC><CheckoutReturn /></PublicLayoutC>} />
```

- [ ] **Step 3: Add i18n strings**

In each locale block of `src/i18n/dict.ts` add: `browseCourses`, `terms`, `privacy`, `refund`, `login` (exists). FR: `browseCourses: 'Parcourir les cours', terms: 'Conditions', privacy: 'Confidentialité', refund: 'Remboursement'`. EN: `'Browse courses'`, `'Terms'`, `'Privacy'`, `'Refund'`. ES: `'Explorar cursos'`, `'Términos'`, `'Privacidad'`, `'Reembolso'`.

- [ ] **Step 4: Create placeholder pages so the build compiles**

Create minimal stubs (fleshed out in Tasks 5–8) so imports resolve:
`src/pages/public/Home.tsx`, `PublicCatalog.tsx`, `CourseSales.tsx`, `Legal.tsx`, `CheckoutReturn.tsx`, each: `export default function X(){ return <div style={{padding:24}}>X</div> }`.

- [ ] **Step 5: Typecheck + build**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean typecheck; build succeeds.

- [ ] **Step 6: Manual check**

Run the dev server (`npm run dev`), open `/` logged out → Home stub renders inside PublicLayout (header/footer, language toggle, Log in button). `/login` still works.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/PublicLayout.tsx src/i18n/dict.ts src/pages/public
git commit -m "P1: public route tree + PublicLayout (storefront reachable logged-out)"
```

---

## Task 5: Public catalog + Home

**Files:**
- Modify: `src/pages/public/PublicCatalog.tsx`, `src/pages/public/Home.tsx`
- Modify: `src/i18n/dict.ts`

**Interfaces:**
- Consumes: `supabase.rpc('list_public_courses')` → array from Task 2; `useAsync`; `ui.tsx` primitives; `formatMoney` (check `src/lib/format.ts` for an existing money formatter; if named differently, use that).

- [ ] **Step 1: Implement `PublicCatalog.tsx`**

```tsx
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function PublicCatalog() {
  const { t } = useI18n()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_courses')
    return data ?? []
  }, [])
  if (loading || !data) return <Loader />
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 18 }}>{t('browseCourses')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
        {data.map((c: any) => (
          <Link key={c.id} to={`/courses/${c.slug}`} style={{ textDecoration: 'none', border: '1px solid var(--border-soft)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ height: 96, background: c.accent || 'linear-gradient(135deg,#0F2C4C,#123f6b)' }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 15 }}>{c.title}</div>
              <div style={{ color: '#8494A8', fontSize: 13, fontWeight: 600, margin: '4px 0 10px' }}>{c.subtitle}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--gold-600, #B8860B)' }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</span>
                {c.credit_hours ? <span style={{ fontSize: 12, fontWeight: 700, color: '#5B6B82' }}>{c.credit_hours} {t('hours')}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement `Home.tsx`**

A hero + the same catalog grid (reuse by importing PublicCatalog below the hero, or duplicate the grid). Minimal:

```tsx
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import PublicCatalog from './PublicCatalog'

export default function Home() {
  const { t } = useI18n()
  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg,#0F2C4C,#123f6b)', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 40, maxWidth: 760, margin: '0 auto 14px' }}>{t('heroTitle')}</h1>
        <p style={{ opacity: .85, fontSize: 17, maxWidth: 620, margin: '0 auto 24px' }}>{t('heroSub')}</p>
        <Link to="/courses" style={{ background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', padding: '12px 26px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('browseCourses')}</Link>
      </section>
      <PublicCatalog />
    </div>
  )
}
```

- [ ] **Step 3: Add i18n strings**

Add `free`, `hours`, `heroTitle`, `heroSub` in FR/EN/ES. FR: `free:'Gratuit', hours:'h', heroTitle:'Devenez préparateur fiscal certifié', heroSub:'Des cours pratiques en fiscalité, à votre rythme, avec certificat.'` EN/ES equivalents.

- [ ] **Step 4: Typecheck + build**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean.

- [ ] **Step 5: Manual check**

Logged out, `/courses` lists published courses with price + hours; clicking a card navigates to `/courses/:slug` (stub for now).

- [ ] **Step 6: Commit**

```bash
git add src/pages/public/Home.tsx src/pages/public/PublicCatalog.tsx src/i18n/dict.ts
git commit -m "P1: public Home + catalog wired to list_public_courses"
```

---

## Task 6: Course sales page + preview playback

**Files:**
- Modify: `src/pages/public/CourseSales.tsx`
- Modify: `src/i18n/dict.ts`

**Interfaces:**
- Consumes: `supabase.rpc('get_public_course', { p_slug })`, `supabase.rpc('get_preview_lesson_url', { p_lesson })`, `useParams`, `useAuth` (to decide buy CTA), `startCheckout` (from Task 7 `lib/checkout.ts` — will be added before this task's buy button is wired; if executing in order, stub the onClick to `alert('checkout')` until Task 7, then wire).
- Produces: the sales page rendering course meta + curriculum with playable preview lessons + a Buy CTA.

- [ ] **Step 1: Implement `CourseSales.tsx`**

```tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'
import { startCheckout } from '../../lib/checkout'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function CourseSales() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_public_course', { p_slug: slug! })
    return data as any
  }, [slug])
  if (loading) return <Loader />
  if (!data) return <div style={{ padding: 24 }}>{t('noData')}</div>
  const c = data

  async function playPreview(lessonId: string) {
    const { data } = await supabase.rpc('get_preview_lesson_url', { p_lesson: lessonId })
    if (data) setPreview(data as string)
  }
  async function buy() {
    setBusy(true)
    try { await startCheckout({ courseId: c.id }) } finally { setBusy(false) }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 30 }}>{c.title}</h1>
        <p style={{ color: '#5B6B82', fontSize: 16, fontWeight: 600 }}>{c.subtitle}</p>
        {preview && <video src={preview} controls style={{ width: '100%', borderRadius: 12, margin: '14px 0', background: '#000' }} />}
        <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '18px 0 10px' }}>{t('curriculum')}</h2>
        {(c.sections ?? []).map((s: any) => (
          <div key={s.id} style={{ border: '1px solid var(--border-soft)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--navy-800)', background: '#F7F9FC' }}>{s.title}</div>
            {(s.lessons ?? []).map((l: any) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ flex: 1, color: '#334', fontSize: 14 }}>{l.title}</span>
                {l.is_preview
                  ? <button onClick={() => playPreview(l.id)} style={{ border: 0, background: 'transparent', color: 'var(--navy-800)', fontWeight: 800, cursor: 'pointer' }}>{t('preview')}</button>
                  : <span style={{ color: '#B7C0CD', fontSize: 12, fontWeight: 700 }}>🔒</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
      <aside>
        <div style={{ position: 'sticky', top: 20, border: '1px solid var(--border-soft)', borderRadius: 14, padding: 18, background: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--navy-800)' }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</div>
          {c.credit_hours ? <div style={{ color: '#5B6B82', fontWeight: 700, margin: '4px 0' }}>{c.credit_hours} {t('hours')} · {t('certificateOfCompletion')}</div> : null}
          <button onClick={buy} disabled={busy} style={{ width: '100%', marginTop: 12, background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : t('enrollNow')}</button>
          <div style={{ color: '#8494A8', fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{t('moneyBack')}</div>
        </div>
      </aside>
    </div>
  )
}
```

- [ ] **Step 2: Add i18n strings**

Add `curriculum`, `preview`, `certificateOfCompletion`, `enrollNow`, `moneyBack` in FR/EN/ES. FR: `curriculum:'Programme', preview:'Aperçu', certificateOfCompletion:'Certificat de réussite', enrollNow:'S’inscrire maintenant', moneyBack:'Garantie satisfait ou remboursé 30 jours'`.

- [ ] **Step 3: Typecheck + build**

(Requires `lib/checkout.ts` from Task 7 to exist. If executing strictly in order, create the `lib/checkout.ts` stub now: `export async function startCheckout(_:{courseId:string;email?:string}){ alert('checkout wired in Task 7') }` and replace it in Task 7.)

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean.

- [ ] **Step 4: Manual check**

Logged out, open a course; a preview lesson plays a video via signed URL; locked lessons show a lock; the price/hours/CTA render.

- [ ] **Step 5: Commit**

```bash
git add src/pages/public/CourseSales.tsx src/lib/checkout.ts src/i18n/dict.ts
git commit -m "P1: course sales page with preview playback + buy CTA"
```

---

## Task 7: Live checkout — Edge Function + client helper + return page

**Files:**
- Modify (MCP deploy): edge function `create-checkout`
- Modify (MCP deploy): edge function `stripe-webhook`
- Create/replace: `src/lib/checkout.ts`
- Modify: `src/pages/public/CheckoutReturn.tsx`
- Modify: `src/i18n/dict.ts`

**Interfaces:**
- Produces client helper: `startCheckout({ courseId, email?, coupon? }): Promise<void>` — POSTs to the function URL, redirects to `session.url`.
- Edge `create-checkout` now: `verify_jwt=false`; accepts `{ course_id, email?, coupon?, success_url, cancel_url }`; if `Authorization` present+valid → use that user; else require `email` (guest). Enables `automatic_tax`, `billing_address_collection:'required'`, `allow_promotion_codes:true`, `customer_email`. Passes metadata `{ institution_id, course_id, user_id?, guest_email? }`.
- Edge `stripe-webhook`: on `checkout.session.completed`, if no `user_id` in metadata, provision by `guest_email` (find existing auth user by email or `inviteUserByEmail`), then order + enroll; persist `tax_cents = s.total_details.amount_tax`; increment coupon `uses_count` when a promotion code was used; send access email via Resend.

- [ ] **Step 1: Redeploy `create-checkout` (guest + tax + coupons)**

Deploy via MCP `deploy_edge_function` (slug `create-checkout`, `verify_jwt: false`). Full file:

```ts
import Stripe from 'npm:stripe@16'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const secret = Deno.env.get('STRIPE_SECRET_KEY')
  if (!secret) return json({ error: 'stripe_not_configured' }, 501)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  let body: { course_id?: string; email?: string; coupon?: string; success_url?: string; cancel_url?: string }
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }
  if (!body.course_id) return json({ error: 'course_id_required' }, 400)

  // Resolve buyer: logged-in (Authorization) or guest (email).
  let userId: string | null = null
  let email: string | undefined = body.email
  const authz = req.headers.get('Authorization')
  if (authz) {
    const caller = createClient(url, anon, { global: { headers: { Authorization: authz } } })
    const { data: u } = await caller.auth.getUser()
    if (u?.user) { userId = u.user.id; email = u.user.email ?? email }
  }
  if (!userId && !email) return json({ error: 'email_required_for_guest' }, 400)

  const admin = createClient(url, service, { auth: { persistSession: false } })
  const { data: c } = await admin.from('courses')
    .select('title, price_cents, institution_id, status, currency:institutions(currency)')
    .eq('id', body.course_id).single()
  if (!c || c.status !== 'published') return json({ error: 'course_not_available' }, 404)

  // Optional coupon → Stripe promotion code lookup by our coupon code (validated server-side).
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
  if (body.coupon) {
    const { data: coup } = await admin.from('coupons').select('code, active').eq('code', body.coupon).eq('institution_id', c.institution_id).maybeSingle()
    if (coup?.active) discounts = undefined // let Stripe promotion codes handle it via allow_promotion_codes; see note
  }

  const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() })
  const metadata: Record<string, string> = { institution_id: c.institution_id, course_id: body.course_id }
  if (userId) metadata.user_id = userId; else metadata.guest_email = email!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: ((c as any).currency?.currency ?? 'usd').toLowerCase(), unit_amount: c.price_cents, product_data: { name: c.title } } }],
    customer_email: email,
    client_reference_id: userId ?? email,
    metadata,
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    allow_promotion_codes: true,
    payment_intent_data: { receipt_email: email },
    success_url: (body.success_url ?? 'https://example.com/checkout/return') + '?status=success',
    cancel_url: (body.cancel_url ?? 'https://example.com/checkout/return') + '?status=cancel',
  })
  return json({ url: session.url })
})
```

Note on coupons: `allow_promotion_codes: true` lets the buyer enter a Stripe promotion code at Checkout. For our DB coupons to work, they must exist as Stripe promotion codes (created in the Stripe dashboard or synced). Phase 1 relies on Stripe-native promotion codes; the DB `coupons` check above is a soft validation only. (Full DB-coupon→Stripe sync is a Phase 2/4 item.)

- [ ] **Step 2: Redeploy `stripe-webhook` (tax, guest provisioning, email)**

Deploy via MCP `deploy_edge_function` (slug `stripe-webhook`, `verify_jwt: false`). Full file:

```ts
import Stripe from 'npm:stripe@16'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const secret = Deno.env.get('STRIPE_SECRET_KEY')
  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!secret || !whSecret) return new Response('stripe_not_configured', { status: 501 })

  const stripe = new Stripe(secret, { httpClient: Stripe.createFetchHttpClient() })
  const sig = req.headers.get('stripe-signature') ?? ''
  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whSecret, undefined, Stripe.createSubtleCryptoProvider())
  } catch (e) {
    return new Response('invalid_signature: ' + (e as Error).message, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object as Stripe.Checkout.Session
    const m = s.metadata ?? {}
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

    // Idempotency: skip if we already recorded this session.
    const { data: existing } = await admin.from('orders').select('id').eq('stripe_session_id', s.id).maybeSingle()
    if (existing) return new Response(JSON.stringify({ received: true, dup: true }), { status: 200 })

    // Resolve user: metadata.user_id, else provision from guest_email.
    let userId = m.user_id as string | undefined
    const instId = m.institution_id as string | undefined
    if (!userId && m.guest_email && instId) {
      const email = m.guest_email
      // find existing auth user by email
      const { data: list } = await admin.auth.admin.listUsers()
      const found = list?.users?.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase())
      if (found) userId = found.id
      else {
        const { data: created } = await admin.auth.admin.inviteUserByEmail(email)
        userId = created?.user?.id
      }
      if (userId) {
        await admin.from('memberships').upsert(
          { user_id: userId, institution_id: instId, role: 'student', status: 'active' },
          { onConflict: 'user_id,institution_id' },
        )
      }
    }

    if (userId && instId) {
      await admin.from('orders').insert({
        institution_id: instId, user_id: userId,
        course_id: m.course_id ?? null, plan_id: m.plan_id ?? null,
        amount_cents: s.amount_total ?? 0, tax_cents: s.total_details?.amount_tax ?? 0,
        status: 'paid', provider: 'stripe', stripe_session_id: s.id,
      })
      if (m.course_id) {
        await admin.from('enrollments').upsert(
          { institution_id: instId, course_id: m.course_id, user_id: userId, status: 'active' },
          { onConflict: 'course_id,user_id' },
        )
      }
      // Access email (best-effort; requires RESEND_API_KEY + RESEND_FROM).
      const rk = Deno.env.get('RESEND_API_KEY'); const from = Deno.env.get('RESEND_FROM')
      const to = s.customer_details?.email ?? m.guest_email
      if (rk && from && to) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST', headers: { Authorization: `Bearer ${rk}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, subject: 'Your Asirem course access', html: '<p>Thanks for your purchase! Log in at your Asirem account to start learning. If this is your first purchase, use the invite email to set your password.</p>' }),
        }).catch(() => {})
      }
    }
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
```

- [ ] **Step 3: Implement `lib/checkout.ts`**

```ts
import { supabase } from './supabase'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`

export async function startCheckout(opts: { courseId: string; email?: string; coupon?: string }): Promise<void> {
  const { data: sess } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  }
  if (sess?.session?.access_token) headers.Authorization = `Bearer ${sess.session.access_token}`
  const origin = window.location.origin
  const res = await fetch(FN_URL, {
    method: 'POST', headers,
    body: JSON.stringify({
      course_id: opts.courseId, email: opts.email, coupon: opts.coupon,
      success_url: `${origin}/checkout/return`, cancel_url: `${origin}/checkout/return`,
    }),
  })
  const body = await res.json()
  if (body?.url) window.location.href = body.url
  else alert(body?.error ?? 'checkout_failed')
}
```

For guest buyers (not logged in), `CourseSales.buy()` must collect an email first. Update `buy()` in `CourseSales.tsx`: if there is no session, `const email = prompt(t('enterEmail')); if (!email) return; await startCheckout({ courseId: c.id, email })`. (A styled email modal can replace the prompt in Phase 2.)

- [ ] **Step 4: Implement `CheckoutReturn.tsx`**

```tsx
import { useSearchParams, Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export default function CheckoutReturn() {
  const [sp] = useSearchParams()
  const { t } = useI18n()
  const ok = sp.get('status') === 'success'
  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 44 }}>{ok ? '✅' : '↩️'}</div>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)' }}>{ok ? t('purchaseThanks') : t('purchaseCancelled')}</h1>
      <p style={{ color: '#5B6B82', fontWeight: 600 }}>{ok ? t('purchaseThanksSub') : t('purchaseCancelledSub')}</p>
      <Link to="/login" style={{ display: 'inline-block', marginTop: 14, background: 'var(--navy-800)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('login')}</Link>
    </div>
  )
}
```

- [ ] **Step 5: Add i18n strings**

Add `enterEmail`, `purchaseThanks`, `purchaseThanksSub`, `purchaseCancelled`, `purchaseCancelledSub` in FR/EN/ES. FR: `enterEmail:'Votre email pour recevoir l’accès', purchaseThanks:'Merci pour votre achat !', purchaseThanksSub:'Vérifiez votre email pour définir votre mot de passe, puis connectez-vous pour commencer.', purchaseCancelled:'Paiement annulé', purchaseCancelledSub:'Aucun montant n’a été prélevé.'`.

- [ ] **Step 6: Typecheck + build**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean.

- [ ] **Step 7: End-to-end test (Stripe test mode)**

Prereq: user sets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (from a Stripe webhook on `checkout.session.completed` pointing at the deployed `stripe-webhook` URL), and enables Stripe Tax in the Stripe dashboard. Then:
1. Logged out, open a published course, click Enroll, enter a test email.
2. Complete Stripe Checkout with card `4242 4242 4242 4242`, any future expiry/CVC, a taxable address.
3. Verify via `execute_sql`:

```sql
select user_id, course_id, amount_cents, tax_cents, status, stripe_session_id from orders order by created_at desc limit 1;
select count(*) from enrollments e join orders o on o.user_id=e.user_id and o.course_id=e.course_id order by 1 desc limit 1;
```

Expected: a `paid` order with non-null `stripe_session_id` and `tax_cents ≥ 0`; a matching active enrollment; a new/matched membership for the guest email. Re-sending the same webhook event does NOT create a second order (idempotency).

- [ ] **Step 8: Commit**

```bash
git add src/lib/checkout.ts src/pages/public/CheckoutReturn.tsx src/pages/public/CourseSales.tsx src/i18n/dict.ts
git commit -m "P1: live Stripe checkout (guest+auth, Stripe Tax, receipts, guest provisioning, idempotent fulfillment)"
```

---

## Task 8: Legal pages

**Files:**
- Modify: `src/pages/public/Legal.tsx`
- Modify: `src/i18n/dict.ts`

**Interfaces:**
- Consumes: `useParams()` `doc` ∈ {`terms`,`privacy`,`refund`}, `useI18n`.

- [ ] **Step 1: Implement `Legal.tsx`**

```tsx
import { useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export default function Legal() {
  const { doc } = useParams()
  const { t } = useI18n()
  const key = doc === 'privacy' ? 'privacyBody' : doc === 'refund' ? 'refundBody' : 'termsBody'
  const title = doc === 'privacy' ? t('privacy') : doc === 'refund' ? t('refund') : t('terms')
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 12 }}>{title}</h1>
      <div style={{ whiteSpace: 'pre-wrap', color: '#334', lineHeight: 1.6, fontSize: 15 }}>{t(key)}</div>
    </div>
  )
}
```

- [ ] **Step 2: Add legal copy in i18n**

Add `termsBody`, `privacyBody`, `refundBody` in FR/EN/ES with real starter copy (a few paragraphs each). Refund body must state the 30-day money-back guarantee referenced on the sales page. Keep it plain and factual (placeholder legal text the owner can replace with counsel-reviewed copy — note this in a code comment near the strings).

- [ ] **Step 3: Typecheck + build**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean.

- [ ] **Step 4: Manual check**

`/legal/terms`, `/legal/privacy`, `/legal/refund` each render localized copy; footer links work; language toggle switches copy.

- [ ] **Step 5: Commit**

```bash
git add src/pages/public/Legal.tsx src/i18n/dict.ts
git commit -m "P1: legal pages (Terms/Privacy/Refund) localized"
```

---

## Task 9: CE display + admin editing + exam timer

**Files:**
- Modify: `src/pages/admin/CourseBuilder.tsx` (course settings: `credit_hours`, `slug`)
- Modify: `src/pages/student/Certificates.tsx` (show hours on certificate) — confirm filename via `ls src/pages/student`
- Modify: `src/pages/ExamPlayer.tsx` (countdown when `time_limit_minutes` set)
- Modify: `src/i18n/dict.ts`

**Interfaces:**
- Consumes: `courses.credit_hours`, `courses.slug`, `exams.time_limit_minutes` (Task 1).

- [ ] **Step 1: Add `credit_hours` + `slug` to the course settings form**

In `CourseBuilder.tsx`, locate the course settings/edit form (where title/subtitle/price are edited). Add two fields bound to the course update payload:

```tsx
<label>{t('creditHours')}
  <input type="number" step="0.5" min="0" value={form.credit_hours ?? ''} onChange={e => setForm(f => ({ ...f, credit_hours: e.target.value === '' ? null : Number(e.target.value) }))} />
</label>
<label>{t('slug')}
  <input value={form.slug ?? ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
</label>
```

Include `credit_hours` and `slug` in the `supabase.from('courses').update({...})` payload. Match the file's existing form/state pattern (field names, `inputCss`).

- [ ] **Step 2: Show hours on the certificate**

In the student certificate page, if the course has `credit_hours`, render "· {credit_hours} {t('hours')}" next to the course title, and include it in the jsPDF output line. (Read the file first to match its data shape; the course row may need `credit_hours` added to its select.)

- [ ] **Step 3: Exam countdown**

In `ExamPlayer.tsx`, after loading the exam (which now includes `time_limit_minutes` via `get_exam` — confirm the RPC returns it; if not, add it to the RPC's json and DB types), if `time_limit_minutes` is set, start a countdown from `time_limit_minutes*60` seconds; on reaching 0, auto-submit via the existing `grade_exam` call. Show `mm:ss` in the header. (Server-side hard enforcement of the limit is a later item; Phase 1 does client countdown + auto-submit.)

- [ ] **Step 4: Add i18n strings**

Add `creditHours`, `slug` in FR/EN/ES. FR: `creditHours:'Heures de crédit', slug:'Identifiant URL'`.

- [ ] **Step 5: Typecheck + build**

Run: `export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`
Expected: clean.

- [ ] **Step 6: Manual check**

As admin, set `credit_hours=8` and a slug on a course → sales page shows "8 h · Certificate of Completion" and is reachable at the new slug. An exam with a time limit shows a ticking countdown that auto-submits at 0.

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/CourseBuilder.tsx src/pages/student src/pages/ExamPlayer.tsx src/i18n/dict.ts
git commit -m "P1: CE-ready UI (credit hours + slug editing, hours on certificate, exam countdown)"
```

---

## Task 10: Push, deploy, and verify live

**Files:** none (integration).

- [ ] **Step 1: Security advisor sweep**

Run MCP `get_advisors(security)`; confirm no new ERRORs from the new RPCs/columns (WARN-level definer notices on the new public RPCs are expected — they are intentionally public and expose only published data).

- [ ] **Step 2: Push**

```bash
export PATH="/c/Program Files/nodejs:$PATH"; cd "C:/Users/ALX/OneDrive/Desktop/asirem" && git push origin main
```

Expected: CI (`.github/workflows/ci.yml`) goes green (typecheck+build).

- [ ] **Step 3: Vercel env + smoke**

Confirm with the user that Vercel has `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` and that Supabase Edge Function secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM` are set. On the deployed URL, verify: `/` renders logged-out, `/courses` lists, a course sales page previews a lesson, and a full test-mode purchase provisions access.

- [ ] **Step 4: Final commit (docs)**

Update the roadmap spec's Phase 1 status to "shipped" and commit:

```bash
git add docs/superpowers/specs/2026-07-18-b2c-tax-lms-roadmap-design.md
git commit -m "docs: mark Phase 1 shipped"
git push origin main
```

---

## Self-Review Notes (coverage vs. spec §5)

- §5.1 Public storefront → Tasks 4,5,6 (routes, catalog, sales page, preview playback, slug).
- §5.2 Live Stripe checkout → Task 7 (guest+auth, Stripe Tax, coupons via promotion codes, receipts, idempotent webhook, guest provisioning).
- §5.3 CE-ready hooks → Task 1 (columns) + Task 9 (UI: credit_hours, ptin column present, exam timer).
- §5.4 Legal pages → Task 8.
- §7 Deferred P0 security (financial RPCs) → Task 3.
- §5.6 Acceptance criteria → Task 7 Step 7 + Task 10 Step 3.

**Open dependencies the owner must supply (not buildable by the engineer):** Stripe keys + webhook endpoint + Stripe Tax enablement; Resend API key + verified sending domain; Supabase Auth redirect URLs for invite/magic-link password setup. These are called out in Task 7 Step 7 and Task 10 Step 3.

**Known Phase-1 simplifications (documented, intentional):** DB coupons rely on Stripe-native promotion codes (full DB→Stripe sync deferred); exam time limit is client-enforced with auto-submit (server hard-stop deferred); guest email captured via `prompt()` (styled modal deferred to Phase 2). `ptin` column ships unused (activated with full CE later).
