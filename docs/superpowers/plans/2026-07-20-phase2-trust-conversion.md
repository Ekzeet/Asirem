# Phase 2 — "Earn the Click" (Trust & Conversion) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lift conversion on the now-live storefront by adding the trust signals a B2C buyer needs before paying: verified-purchase reviews & ratings, public instructor profiles with credentials, a real refund/guarantee flow, social proof, and search-engine discoverability.

**Architecture:** Reviews are gated to verified purchasers via RLS and aggregated into `courses.rating` by a trigger; public read paths stay on SECURITY DEFINER RPCs that expose only published/approved data. Refunds are staff-initiated and executed server-side via a Stripe Edge Function that also revokes access and writes the audit log. SEO is added to the existing SPA via per-route document-head updates + JSON-LD + a generated sitemap (no SSR migration).

**Tech Stack:** Vite + React 18 + TS + React Router v6; Supabase (Postgres/RLS/Edge Functions); Stripe refunds. Migrations via Supabase MCP (project `fnlhevoiwweowqairsyb`); DB types hand-maintained in `src/lib/database.types.ts`; i18n FR/EN/ES in `src/i18n/dict.ts`.

## Global Constraints

- Supabase project id: `fnlhevoiwweowqairsyb`. Migrations via MCP `apply_migration`; checks via `execute_sql`; Edge Functions via `deploy_edge_function`.
- Node on PATH for the build gate: `export PATH="/c/Program Files/nodejs:$PATH"` then `cd "C:/Users/ALX/OneDrive/Desktop/asirem" && npx tsc -b && npm run build`. No unit-test runner exists — "test" = SQL verification (with role impersonation for RLS) and/or `tsc`+`build` clean, per task.
- Every SECURITY DEFINER function sets `search_path to 'public'`; public-read RPCs grant execute to `anon, authenticated`; everything else revokes from `anon, authenticated, public`.
- Every new user-facing string goes in FR, EN, ES (FR default). Do not duplicate existing keys — grep `src/i18n/dict.ts` first.
- DB types are hand-maintained: after DDL, update `src/lib/database.types.ts` to match, mirroring existing style.
- Reviews and refunds are money/trust-sensitive: a review may be written ONLY by a user with a paid order or active enrollment for that course; a refund may be triggered ONLY by `institution_admin`. Enforce server-side (RLS / function guard), never trust the client.
- Commit on branch `phase2-trust`; end commit bodies with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Branch `phase2-trust` is stacked on `phase1-storefront` (Phase 1 not yet merged); base for the eventual PR is `phase1-storefront`.

---

## File Structure

**Backend (MCP):**
- Migration `p2_reviews_profiles` — `course_reviews` table + RLS + rating-aggregation trigger; `profiles.bio text`, `profiles.credentials text[]`.
- Migration `p2_public_read_rpcs` — extend `list_public_courses`/`get_public_course` with `rating`/`review_count`; add `list_course_reviews(slug)`, `get_public_instructor(id)`.
- Edge function `refund-order` (create) — institution_admin-only Stripe refund + revoke enrollment + audit.

**Frontend (`src/`):**
- `lib/database.types.ts` — new table + columns + RPC signatures.
- `components/StarRating.tsx` (create) — read-only + interactive star display.
- `pages/public/CourseSales.tsx` (modify) — rating summary + reviews list + JSON-LD.
- `pages/public/PublicCatalog.tsx` (modify) — rating + enrolled-count on cards.
- `pages/public/InstructorProfile.tsx` (create) + route `/instructors/:id`.
- `components/ReviewForm.tsx` (create) — verified purchaser writes/edits their review; mounted in the student course player.
- `pages/student/Player.tsx` (modify) — mount `ReviewForm`.
- `pages/admin/Sales.tsx` (modify) — per-order Refund action calling `refund-order`.
- `lib/seo.ts` (create) — `useDocumentHead({title, description, jsonLd})` hook.
- `public/sitemap.xml` build step or static route.
- `i18n/dict.ts` — Phase 2 strings.

---

## Task 1: Reviews + profile columns (schema)

**Files:** Migration `p2_reviews_profiles`; modify `src/lib/database.types.ts`.

**Interfaces produced:**
- `course_reviews(id uuid pk, institution_id uuid, course_id uuid, user_id uuid, rating int check 1..5, title text, body text, status text default 'published', created_at timestamptz, unique(course_id,user_id))`.
- `profiles.bio text`, `profiles.credentials text[]`.
- Trigger keeps `courses.rating` = avg of published reviews.

- [ ] **Step 1: Apply migration**

```sql
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists credentials text[];

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  status text not null default 'published',   -- published | hidden
  created_at timestamptz not null default now(),
  unique (course_id, user_id)
);
create index if not exists course_reviews_course_idx on public.course_reviews(course_id, status);

-- Helper: has the user paid for or is enrolled in this course? (verified-purchase gate)
create or replace function public.has_course_access(p_course uuid, p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from public.enrollments e where e.course_id=p_course and e.user_id=p_user)
      or exists(select 1 from public.orders o where o.course_id=p_course and o.user_id=p_user and o.status='paid');
$$;
revoke execute on function public.has_course_access(uuid, uuid) from anon, authenticated, public;

-- RLS
alter table public.course_reviews enable row level security;
-- anyone may read published reviews (public storefront); author reads own always
create policy course_reviews_read on public.course_reviews for select
  using (status='published' or user_id = auth.uid());
-- only a verified purchaser may insert their own review
create policy course_reviews_insert on public.course_reviews for insert
  with check (user_id = auth.uid() and public.has_course_access(course_id, auth.uid()));
-- author may update/delete own review; staff may moderate (update status)
create policy course_reviews_update_own on public.course_reviews for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy course_reviews_admin on public.course_reviews for all
  using (public.has_institution_role(institution_id, array['institution_admin']));

-- Aggregate into courses.rating on any change
create or replace function public.recompute_course_rating()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_course uuid; v_avg numeric;
begin
  v_course := coalesce(new.course_id, old.course_id);
  select round(avg(rating)::numeric, 1) into v_avg from public.course_reviews where course_id=v_course and status='published';
  update public.courses set rating = v_avg where id=v_course;
  return null;
end $$;
revoke execute on function public.recompute_course_rating() from anon, authenticated, public;
drop trigger if exists trg_course_rating on public.course_reviews;
create trigger trg_course_rating after insert or update or delete on public.course_reviews
  for each row execute function public.recompute_course_rating();
```

- [ ] **Step 2: Verify RLS gate (SQL)**

```sql
-- pick a paid/enrolled user + course, and a non-purchaser
select o.user_id, o.course_id from orders o where o.status='paid' limit 1;   -- purchaser
-- as the purchaser: insert should succeed; as a random other user: insert should fail with_check
```
Impersonate the purchaser (`set local role authenticated; select set_config('request.jwt.claims', json_build_object('sub','<UID>','role','authenticated')::text, true);`) and insert a review → success; impersonate a user with no order/enrollment and attempt insert → `new row violates row-level security`. Then confirm `courses.rating` updated to the review's value. Clean up the test review.

- [ ] **Step 3: DB types** — add `course_reviews` table (Row/Insert/Update) and `profiles.bio: string | null`, `profiles.credentials: string[] | null` to `src/lib/database.types.ts`.

- [ ] **Step 4: Typecheck** — `npx tsc -b` clean.

- [ ] **Step 5: Commit** — `git commit -m "P2: course_reviews (verified-purchase RLS) + rating trigger + profile bio/credentials"`.

---

## Task 2: Public read RPCs (ratings, reviews list, instructor)

**Files:** Migration `p2_public_read_rpcs`; modify `src/lib/database.types.ts`.

**Interfaces produced (all callable by `anon, authenticated`):**
- `list_public_courses()` extended: add `review_count int` (rating already present).
- `get_public_course(slug)` extended: add `review_count` and `enrolled_count` to the JSON.
- `list_course_reviews(p_slug text)` → setof `{ id, rating, title, body, created_at, author_name }` (published only, newest first, max 50).
- `get_public_instructor(p_id uuid)` → jsonb `{ id, full_name, avatar_url, bio, credentials, avg_rating, courses:[{slug,title,subtitle,price_cents,currency,rating}] }` (published courses only).

- [ ] **Step 1: Apply migration** — `create or replace` the two existing RPCs (fetch current defs first via `pg_get_functiondef` and transplant, adding the new fields) and add the two new functions. Full SQL for the new functions:

```sql
create or replace function public.list_course_reviews(p_slug text)
returns table (id uuid, rating int, title text, body text, created_at timestamptz, author_name text)
language sql stable security definer set search_path to 'public' as $$
  select r.id, r.rating, r.title, r.body, r.created_at, p.full_name
  from public.course_reviews r
  join public.courses c on c.id=r.course_id
  left join public.profiles p on p.id=r.user_id
  where c.slug=p_slug and c.status='published' and r.status='published'
  order by r.created_at desc limit 50;
$$;
grant execute on function public.list_course_reviews(text) to anon, authenticated;

create or replace function public.get_public_instructor(p_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when p.id is null then null else jsonb_build_object(
    'id', p.id, 'full_name', p.full_name, 'avatar_url', p.avatar_url,
    'bio', p.bio, 'credentials', to_jsonb(coalesce(p.credentials, array[]::text[])),
    'avg_rating', (select round(avg(c.rating),1) from public.courses c where c.instructor_id=p.id and c.status='published' and c.rating is not null),
    'courses', coalesce((select jsonb_agg(jsonb_build_object('slug',c.slug,'title',c.title,'subtitle',c.subtitle,'price_cents',c.price_cents,'currency',i.currency,'rating',c.rating) order by c.published_at desc nulls last)
      from public.courses c join public.institutions i on i.id=c.institution_id where c.instructor_id=p.id and c.status='published'), '[]'::jsonb)
  ) end
  from public.profiles p where p.id=p_id
    and exists (select 1 from public.courses c where c.instructor_id=p.id and c.status='published');
$$;
grant execute on function public.get_public_instructor(uuid) to anon, authenticated;
```
For the two existing RPCs: in `list_public_courses` add `(select count(*) from course_reviews r where r.course_id=c.id and r.status='published') as review_count`; in `get_public_course` add `'review_count', (select count(*)...)` and `'enrolled_count', (select count(*) from enrollments e where e.course_id=c.id)` to the JSON object. Keep everything else (published-only filter, existing fields) identical.

- [ ] **Step 2: Verify (SQL, anon)** — as `anon`: `list_course_reviews('<published slug>')` returns only published reviews; `get_public_instructor('<instructor id>')` returns their published courses and null for a non-instructor id; `get_public_course` now includes `review_count` + `enrolled_count`.

- [ ] **Step 3: DB types** — add `list_course_reviews`, `get_public_instructor` to the Functions block; update `list_public_courses` Return with `review_count: number`.

- [ ] **Step 4: Typecheck** — clean.

- [ ] **Step 5: Commit** — `git commit -m "P2: public read RPCs (reviews list, instructor profile, review/enroll counts)"`.

---

## Task 3: StarRating + reviews on the sales page + JSON-LD

**Files:** create `src/components/StarRating.tsx`; modify `src/pages/public/CourseSales.tsx`, `src/lib/seo.ts` (create), `src/i18n/dict.ts`.

**Interfaces:**
- `StarRating` props: `{ value: number; size?: number; onChange?: (v:number)=>void }` — read-only stars when no `onChange`, clickable when provided.
- `useDocumentHead({ title, description, jsonLd })` — sets `document.title`, a `<meta name="description">`, `<meta property="og:*">`, and injects a `<script type="application/ld+json">`; cleans up on unmount.

- [ ] **Step 1: Create `StarRating.tsx`** — renders 5 star glyphs filled up to `value` (supports halves visually via a filled-width overlay); when `onChange` is set, hovering/click selects 1–5.

- [ ] **Step 2: Create `lib/seo.ts`** — `useDocumentHead` hook using `useEffect` that creates/updates/removes the meta + JSON-LD nodes (idempotent by a `data-seo` attribute); restores previous title on unmount.

- [ ] **Step 3: Sales page** — under the title show `<StarRating value={c.rating||0} />` + `({c.review_count})`; add a Reviews section below the curriculum that calls `supabase.rpc('list_course_reviews', { p_slug: slug })` and lists each (stars, title, body, author, date). Call `useDocumentHead` with the course title/subtitle + a JSON-LD `Course` object (with `aggregateRating` when `review_count>0`).

- [ ] **Step 4: i18n** — add `reviews`, `noReviews`, `writeReview`, `verifiedPurchase` (used later), `by` in fr/en/es.

- [ ] **Step 5: tsc + build** — clean.

- [ ] **Step 6: Commit** — `git commit -m "P2: sales-page ratings + reviews list + Course JSON-LD"`.

---

## Task 4: Verified-purchaser review form (in the player)

**Files:** create `src/components/ReviewForm.tsx`; modify `src/pages/student/Player.tsx`, `src/i18n/dict.ts`.

**Interfaces:**
- `ReviewForm` props `{ courseId: string; institutionId: string }` — loads the user's existing review (if any) via `supabase.from('course_reviews').select().eq('course_id',...).eq('user_id', me.userId).maybeSingle()`; renders `StarRating` (interactive) + title + body; upserts on submit (`onConflict: 'course_id,user_id'`). RLS enforces the verified-purchase gate, so a non-purchaser simply gets an error (form only shown to enrolled students, who are in the player).

- [ ] **Step 1: Create `ReviewForm.tsx`** per the interface; show a saved-state confirmation and allow editing.

- [ ] **Step 2: Mount in `Player.tsx`** — READ the file; add the form in a sensible spot (e.g. a "Rate this course" card in the sidebar or below the lesson). Pass `courseId` + `me.institutionId`. Match existing patterns.

- [ ] **Step 3: i18n** — add `rateThisCourse`, `yourReview`, `reviewTitle`, `reviewSaved`, `updateReview` in fr/en/es.

- [ ] **Step 4: tsc + build** — clean.

- [ ] **Step 5: Verify** — as an enrolled student user (SQL-impersonation insert already proven in Task 1) the row upserts; controller can spot-check via the app. Report the mount location.

- [ ] **Step 6: Commit** — `git commit -m "P2: verified-purchaser review form in the course player"`.

---

## Task 5: Public instructor profile page

**Files:** create `src/pages/public/InstructorProfile.tsx`; modify `src/App.tsx` (route `/instructors/:id`, public + logged-in), `src/pages/public/CourseSales.tsx` (link instructor name), `src/i18n/dict.ts`.

- [ ] **Step 1: Create `InstructorProfile.tsx`** — `useParams().id` → `supabase.rpc('get_public_instructor', { p_id })`; render avatar, name, credentials as chips, bio, avg rating, and a grid of their published courses (linking to `/courses/:slug`). Wrap with `useDocumentHead` (title = instructor name). Handle null → "not found".

- [ ] **Step 2: Route** — add `/instructors/:id` to BOTH the logged-out and logged-in public route groups in `App.tsx` (mirroring how `/courses/:slug` is wired through `PublicLayoutC`).

- [ ] **Step 3: Link from sales page** — make the instructor name on `CourseSales.tsx` a `Link` to `/instructors/{instructor_id}` (note: `get_public_course` must expose `instructor_id` — it already returns `instructor_name`; add `instructor_id` to that RPC's JSON in Task 2's migration if not present, and to the sales page).

- [ ] **Step 4: i18n** — add `instructorProfile`, `coursesBy`, `credentials` in fr/en/es (`credentials` may already exist from admin — grep first).

- [ ] **Step 5: tsc + build** — clean.

- [ ] **Step 6: Commit** — `git commit -m "P2: public instructor profile page + linkage"`.

> Note for Task 2 implementer coordination: ensure `get_public_course` JSON includes `instructor_id`. If Task 2 already shipped without it, add it in this task via a follow-up `create or replace`.

---

## Task 6: Refund / guarantee flow

**Files:** create Edge Function `refund-order`; modify `src/pages/admin/Sales.tsx`, `src/i18n/dict.ts`.

**Interfaces:**
- Edge function `refund-order` (`verify_jwt: true`): body `{ order_id }`. Verifies the caller is `institution_admin` of the order's institution (caller JWT → `has_institution_role`), loads the order, calls `stripe.refunds.create({ payment_intent })` (retrieve PI from the stored `stripe_session_id`), sets `orders.status='refunded'`, deletes/So sets the matching `enrollments.status='refunded'` (revoke access), and inserts an `audit_log` row (`action='refund'`). Returns `{ ok: true }` or an error. 501 if Stripe not configured.

- [ ] **Step 1: Deploy `refund-order`** — full Deno function: authenticate caller via anon client + `getUser`; use service client for DB + `has_institution_role` check; retrieve the Checkout Session (`stripe.checkout.sessions.retrieve(stripe_session_id)`) to get `payment_intent`; `stripe.refunds.create`; update order + enrollment; insert audit_log. Guard: only `status='paid'` orders are refundable.

- [ ] **Step 2: Admin UI** — in `Sales.tsx`, add a "Refund" button on each paid order row → confirm modal → `supabase.functions.invoke('refund-order', { body: { order_id } })` → on success refresh the list. Show refunded status.

- [ ] **Step 3: i18n** — add `refundOrder`, `confirmRefund`, `refunded`, `refundDone` in fr/en/es.

- [ ] **Step 4: tsc + build** — clean; function deploys ACTIVE. (Live refund test PENDING owner Stripe secrets — note in report.)

- [ ] **Step 5: Commit** — `git commit -m "P2: staff refund flow (Stripe refund + revoke access + audit)"`.

---

## Task 7: Social proof (enrolled counts + testimonials)

**Files:** modify `src/pages/public/PublicCatalog.tsx`, `src/pages/public/Home.tsx`, `src/i18n/dict.ts`.

- [ ] **Step 1: Catalog cards** — show `★ {rating} ({review_count})` and, when `enrolled_count` is available, "{enrolled_count} {t('learners')}". (`list_public_courses` now returns `review_count`; enrolled counts are on `get_public_course` per-course — for the catalog card, add `enrolled_count` to `list_public_courses` too in a tiny `create or replace`, or omit on cards and keep on the sales page. Choose: add it to `list_public_courses`.)

- [ ] **Step 2: Home testimonials** — add a testimonials strip on `Home.tsx` sourced from the highest-rated recent reviews (`list_course_reviews` across featured courses, or a simple `course_reviews` published sample). Keep it real data, not hardcoded.

- [ ] **Step 3: i18n** — add `learners`, `whatStudentsSay` in fr/en/es.

- [ ] **Step 4: tsc + build** — clean.

- [ ] **Step 5: Commit** — `git commit -m "P2: social proof (enrolled counts + testimonials)"`.

---

## Task 8: SEO — sitemap + robots + head coverage

**Files:** create `public/robots.txt`; add a sitemap route/generator; ensure `useDocumentHead` is applied on Home/Catalog; modify `index.html` base tags.

- [ ] **Step 1: `useDocumentHead` on Home + Catalog** — set descriptive titles/descriptions + an `Organization`/`ItemList` JSON-LD on the catalog.

- [ ] **Step 2: `public/robots.txt`** — allow all, reference the sitemap URL.

- [ ] **Step 3: Sitemap** — add a build script `scripts/gen-sitemap.mjs` that queries `list_public_courses` (via the anon REST endpoint using `VITE_` env at build) and writes `public/sitemap.xml` with `/`, `/courses`, each `/courses/:slug`, and `/instructors/:id`; wire it into `package.json` `prebuild`. If build-time DB access is undesirable, instead add a runtime `/sitemap.xml` note in the report and ship a static sitemap with the stable routes. Choose the build-script approach; make it non-fatal if env is missing (skip with a warning).

- [ ] **Step 4: `index.html`** — ensure a sensible default `<title>` + meta description + `og:` defaults + `lang` attribute.

- [ ] **Step 5: build** — clean; confirm `dist/sitemap.xml` exists (or the graceful skip message).

- [ ] **Step 6: Commit** — `git commit -m "P2: SEO — head coverage, robots, sitemap generation"`.

---

## Task 9: Push, advisor sweep, PR

- [ ] **Step 1:** `get_advisors(security)` — no new ERRORs from `course_reviews`/RPCs (public-read WARN on the new RPCs is expected/intended).
- [ ] **Step 2:** `npx tsc -b && npm run build` clean on the final tip.
- [ ] **Step 3:** `git push -u origin phase2-trust`; open a PR with base `phase1-storefront` summarizing Phase 2.

---

## Self-Review Notes (coverage vs. spec §6 Phase 2)
- Reviews & ratings (verified-purchase, aggregate, moderation) → Tasks 1–4.
- Public instructor profiles + credentials → Tasks 1,2,5.
- Refund/guarantee flow → Task 6.
- Social proof (enrolled counts, testimonials) → Tasks 2,7.
- SEO (meta/OG, JSON-LD Course/AggregateRating, sitemap, robots) → Tasks 3,8. (Full prerender/SSR remains a documented Phase-2+ option; per-route head + JSON-LD + sitemap is the shipped scope.)

**Owner-supplied dependency:** live refund needs the same Stripe secrets as Phase 1; build-time sitemap needs `VITE_SUPABASE_URL`/`ANON_KEY` in the build env (already set on Vercel).
