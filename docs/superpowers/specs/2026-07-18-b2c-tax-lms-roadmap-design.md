# Asirem Academy — B2C Tax-Course LMS Improvement Roadmap

**Date:** 2026-07-18
**Status:** Design / spec (approved shape, pending user spec-review)
**Owner:** Asirem (single institution, multi-tenant-capable)

---

## 1. Context

Asirem Academy is a trilingual (FR/EN/ES) multi-role LMS built on Vite + React 18 + TypeScript + React Router v6, with Supabase (Postgres, Auth, RLS, Storage, Edge Functions) as the backend. It has a complete learning engine: courses → sections → lessons (Storage video + external), resources, drip, module-lock-by-test, server-graded quizzes and per-course exams, assignments with rubric review, Q&A, auto-certificates + public verification, auto-awarded badges, community (groups/posts/likes/comments/events/points), dashboards, gradebook, drop-off analytics, search, notifications, invite-by-email, audit log, and CI.

**Business model (confirmed):** Commercial **B2C** course sales — Asirem sells tax-preparation courses to external individuals (agents, preparers, public).

**Stage (confirmed):** **Pre-revenue.** Stripe is scaffolded but not live; catalog and checkout currently sit *behind* authentication.

**Strategic decision (confirmed):** **Approach A — revenue-first hardening.** Lock the money path end-to-end first, then trust, then retention, then growth. Tax-specific CE-credit machinery is **deferred** (it requires IRS/NASBA provider accreditation, not just software), but the data model is made **CE-ready** cheaply now.

## 2. Goals & non-goals

**Goals**
- G1. A stranger can discover a course, buy it with a card, and immediately start learning — no manual steps.
- G2. Marketing pages are indexable by search engines.
- G3. Buyers trust the store before paying (reviews, credentials, refund policy, social proof).
- G4. Students stay engaged and return (lifecycle email, nudges, mobile).
- G5. Levers exist to grow revenue per customer (bundles, membership, referrals, upsells).
- G6. The schema is ready to activate formal CE-credit reporting later without a rebuild.

**Non-goals (now)**
- Becoming an IRS-approved CE provider or NASBA CPE sponsor (business/legal process, out of software scope).
- Formal credit-hour reporting to the IRS, AFSP/AFTR program administration, live proctoring.
- Native mobile apps (responsive web only).
- Replacing the SPA with full SSR (prerendering marketing routes is sufficient — see §7).

## 3. Current-state gap analysis (B2C funnel lens)

| Funnel stage | Have | Missing (this roadmap) |
|---|---|---|
| Acquisition / storefront | Auth-gated catalog; preview-lesson flag | Public homepage, catalog, per-course **sales page**; SEO (meta/OG/JSON-LD/sitemap/prerender) |
| Checkout | Stripe scaffolding, `create-checkout`, `enroll-fulfillment`, coupons table | **Live** checkout, guest-buy→auto account, coupons applied, **Stripe Tax**, receipts/invoices |
| Trust / conversion | `courses.rating` column | **Reviews** system, public instructor profiles + credentials, refund/guarantee, social proof |
| Retention | Drip, notifications, Resend scaffolding | **Live lifecycle email**, drip→notification wiring, streaks/reminders |
| Growth | `plans` table (unused), drop-off analytics | **Bundles/paths**, **membership subscription**, **affiliate/referral**, upsells, funnel/cohort analytics |
| Tax-specific | Exams, certificates | `credit_hours`, PTIN capture, timed exams (CE-ready); full CE deferred |
| Cross-cutting | 3 media queries, CI, audit log | Mobile-responsive pass, legal pages, a11y, email deliverability, monitoring |

## 4. Architecture principles

- **Reuse first.** Extend existing tables/RLS helpers (`can_view_course`, `has_institution_role`, `is_enrolled`), `useAsync`, `ui.tsx` primitives, `Modal`, i18n (FR/EN/ES), Edge Functions.
- **Server-authoritative money & grades.** All pricing, tax, coupon validation, and fulfillment happen server-side (Stripe + Edge Functions + webhook), never trusted from the client.
- **Public vs. private split.** Marketing/storefront routes render without a session; learning routes stay behind `RequireAuth`. Public data is exposed only via published-status RLS or dedicated SECURITY DEFINER RPCs that leak nothing extra (same pattern as `verify_certificate`).
- **Each phase independently shippable** and reversible; migrations via Supabase MCP; types hand-maintained in `src/lib/database.types.ts`.
- **i18n + a11y** for every new user-facing surface.

---

## 5. Phase 1 — Turn on the money (revenue foundation)

**Outcome:** G1, G2 (basics), G6 (hooks). This is the revenue-critical phase.

### 5.1 Public storefront
- New **public** routes (outside auth gate), mirroring the existing `/verify/:serial` public pattern in `App.tsx`:
  - `/` (or `/home`) — marketing homepage: value prop, featured courses, categories, trust strip.
  - `/courses` — public catalog: published courses, filters (category/level/price), search.
  - `/courses/:slug` — **course sales page**: hero (title/subtitle/outcomes), price + CTA, curriculum outline with **free-preview** lessons playable (uses existing `is_preview` + signed URLs limited to preview lessons), instructor block, `credit_hours`, reviews summary (wired in Phase 2), refund/guarantee note.
  - `/pricing` — plans/bundles overview (fleshed out in Phase 4).
- **Data exposure:** a `public_courses` RLS policy (or SECURITY DEFINER RPC `list_public_courses()` / `get_public_course(slug)`) returning only published-course fields safe for anonymous users. Preview lesson playback via a scoped RPC that signs URLs **only** for `is_preview = true` lessons.
- **Slug:** add `courses.slug` (unique per institution) for clean URLs + SEO; backfill from title.

### 5.2 Live Stripe checkout
- Activate Stripe (keys supplied by user): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key.
- **Checkout flow:** sales-page CTA → `create-checkout` Edge Function creates a Stripe Checkout Session (price from server, `client_reference_id` = course, coupon promo code applied server-side, **Stripe Tax** enabled) → redirect to Stripe → success/cancel return routes.
- **Guest buy → account:** allow purchase by email without prior login; on webhook fulfillment, provision (or match) the auth user via `inviteUserByEmail`/magic link, create `membership` (student) + `enrollment`, then the buyer sets a password on first visit.
- **Fulfillment:** extend `enroll-fulfillment` (already handles Zoom/live) to also handle standard course purchase → enrollment + order row + receipt email.
- **Receipts/invoices:** Stripe-hosted receipt + a branded confirmation email (Resend). Store `orders.stripe_session_id`, amount, tax, coupon.
- **Coupons:** validate + apply the existing `coupons` table via Stripe promotion codes; increment `uses_count` on fulfillment.

### 5.3 CE-ready hooks (cheap, ship now)
- `courses.credit_hours numeric` (nullable). Display "X hrs • Certificate of Completion" on sales page, course card, and certificate PDF.
- Optional `profiles.ptin text` capture in student profile (unused until CE activates).
- `exams.time_limit_minutes int` (nullable) — surfaced in the exam player as a countdown (enforced server-side at grade time). Lays groundwork for timed finals.

### 5.4 Legal & compliance pages
- Static, localized pages: **Terms of Service**, **Privacy Policy**, **Refund Policy**, plus a cookie/consent notice (privacy-preserving default). Linked in footer + referenced at checkout (Stripe requires a refund/ToS URL).

### 5.5 Phase 1 data model summary
- `courses`: `+ slug text`, `+ credit_hours numeric`.
- `orders`: `+ stripe_session_id text`, `+ tax_cents int`, `+ coupon_id` (if not present), `+ status` states (`pending|paid|refunded`).
- `profiles`: `+ ptin text` (nullable).
- `exams`: `+ time_limit_minutes int`.
- RPCs: `list_public_courses()`, `get_public_course(slug)`, `preview_lesson_url(lesson_id)` (preview-only signing).

### 5.6 Phase 1 acceptance criteria
1. Logged-out visitor loads `/courses/:slug`, plays a preview lesson, and sees price + credit hours.
2. Visitor completes Stripe Checkout with a **test card**; webhook creates account + membership + enrollment + paid order; buyer lands in the course.
3. A coupon reduces the charged amount; `uses_count` increments exactly once.
4. Stripe Tax adds the correct line; receipt email arrives.
5. Legal pages reachable; refund/ToS URLs set in Stripe.
6. No answer keys, unpublished courses, or non-preview signed URLs are exposed to anon (RLS/RPC verified by impersonation).

---

## 6. Phases 2–4 (roadmap depth)

### Phase 2 — Earn the click (trust & conversion)
- **Reviews & ratings:** `course_reviews (id, course_id, user_id, rating 1-5, title, body, status, created_at)`; **verified-purchase only** (insert allowed if `is_enrolled` / has paid order); one review per user per course; aggregate into `courses.rating` + count via trigger. Moderation state for staff. Display on sales page and catalog cards.
- **Public instructor profiles:** `/instructors/:id` — bio, credentials (EA/CPA badges via `profiles.credentials text[]`), their courses, aggregate rating. Adds trust and SEO surface.
- **Refund/guarantee flow:** a "30-day money-back" policy surfaced pre-purchase; staff-initiated refund from `orders` calls Stripe refund + revokes enrollment + logs to `audit_log`.
- **Social proof:** enrolled counts (from `enrollments`), testimonials block, "recently enrolled" ticker.
- **SEO:** per-page `<title>/meta/OG`, JSON-LD `Course`/`Review`/`AggregateRating`, `sitemap.xml`, robots; **prerender** marketing routes (see §7).

### Phase 3 — Keep them (retention & lifecycle)
- **Lifecycle email (Resend live, verified sending domain):** welcome, purchase receipt, progress nudge ("pick up where you left off"), "almost done" (≥80% complete), certificate-earned, win-back (N days inactive). Driven by a scheduled Edge Function reading progress + a per-user email-preferences table (`email_prefs`) with unsubscribe.
- **Drip → notifications:** when drip unlocks a module, emit a `notifications` row + optional email.
- **Streaks/reminders:** `points_ledger`-backed streak count; opt-in reminder email/notification.
- **Richer student dashboard:** continue-learning card, streak, next-due, recommended next course.
- **Mobile-responsive pass:** systematic breakpoints across student learning surfaces (player, catalog, dashboard, modals), building on the 3 existing media queries; sidebar drawer already exists.

### Phase 4 — Grow (growth levers)
- **Learning paths / bundles:** `learning_paths (id, slug, title, description, price_cents)` + `learning_path_courses (path_id, course_id, position)`; a path is purchasable as a bundle (single Checkout enrolls all member courses); path progress = union of course progress; path certificate on full completion. Flagship: "Become a Tax Preparer".
- **All-access membership:** activate `plans` as a **recurring Stripe subscription**; `entitlements` derived from active subscription grant access to all (or tier-scoped) courses; RLS `can_view_course` extended to honor active membership.
- **Affiliate / referral:** `referral_codes (user_id, code)` + attribution on `orders`; payout/credit ledger; simple affiliate dashboard.
- **Upsells / order bumps:** related-course bump on the checkout/confirmation page; post-purchase "next in path" upsell.
- **Funnel & cohort analytics:** storefront view → checkout → purchase conversion; cohort retention; extend existing `revenue_monthly`/`mrr`/`course_dropoff` RPCs; admin analytics page.

### Later / conditional — Full CE credentialing (gated on accreditation)
Activate only once Asirem holds IRS CE-provider and/or NASBA sponsor status: credit-hour reporting per completion, AFSP/AFTR program numbers, PTIN validation, timed **and** proctored final exams, IRS/NASBA export files, per-student CE transcript. The `credit_hours`, `ptin`, and `time_limit_minutes` hooks from Phase 1 make this an activation, not a rebuild.

## 7. Cross-cutting concerns

- **SEO/rendering:** the app is a client-only Vite SPA (bad for discovery). Decision: **prerender** the public marketing routes (`/`, `/courses`, `/courses/:slug`, `/instructors/:id`) at build/deploy time (e.g. `vite-plugin-ssr`/prerender or Vercel prerendering) rather than a full SSR migration. Learning routes stay SPA behind auth.
- **Email deliverability:** verified sending domain + SPF/DKIM/DMARC for Resend; Supabase Auth SMTP for password/invite reliability.
- **Accessibility:** semantic landmarks, focus management in modals (portal already), color-contrast, keyboard nav on new public pages.
- **Payments security:** all amounts server-derived; verify Stripe webhook signatures; idempotent fulfillment (guard on `stripe_session_id`).
- **Deferred P0 security (fold into Phase 1 hardening):** restrict financial RPCs (`revenue_monthly`, `mrr`, `sales_stats`, `admin_dashboard_stats`) to `institution_admin`; enable Supabase leaked-password protection.
- **Monitoring:** basic error logging + uptime; Stripe/webhook failure alerts.

## 8. Risks & mitigations

- **R1 — Stripe/tax/legal correctness.** Mitigate: use Stripe Checkout + Stripe Tax (offloads PCI + tax calc); test-mode end-to-end before go-live; explicit refund/ToS pages.
- **R2 — SEO on an SPA.** Mitigate: prerender marketing routes; JSON-LD; sitemap.
- **R3 — Guest-buy account collisions.** Mitigate: match existing auth user by email; idempotent webhook; magic-link password setup.
- **R4 — Scope creep across 4 phases.** Mitigate: ship Phase 1 to revenue first; each later phase gets its own implementation plan.
- **R5 — CE promises without accreditation.** Mitigate: market only "certificate of completion / X hours", never "IRS CE credit", until provider status is held.

## 9. Sequencing summary

1. **Phase 1** (revenue foundation) — build first, ship to real payments.
2. **Phase 2** (trust/conversion) — lift conversion on the now-live funnel.
3. **Phase 3** (retention) — reduce churn, raise completion.
4. **Phase 4** (growth) — increase revenue per customer.
5. **CE** — only after accreditation.

The implementation plan (next step) will start with **Phase 1**, since it is the shippable, revenue-critical unit; Phases 2–4 are captured here as approved roadmap and will each get their own plan when reached.
