# Phase 4 — "Grow" (Growth Levers) Implementation Plan

> Execute with superpowers:subagent-driven-development or inline; `- [ ]` steps.

**Goal:** Increase revenue per customer via learning-path bundles, an all-access membership subscription, an affiliate/referral program, and checkout upsells + funnel analytics.

**Architecture:** Bundles and membership extend the existing Stripe checkout + webhook (one Checkout Session; fulfillment enrolls all bundle courses or records a subscription). Membership access is granted by a `has_active_subscription()` helper OR'd into the course-access path (no per-course enrollment rows). Referral attribution rides `orders.referrer_id`, captured from a code at checkout, with a credit ledger. Analytics are SECURITY DEFINER RPCs (institution_admin-only) over orders/enrollments/reviews.

**Tech Stack:** Vite/React/TS; Supabase (Postgres/RLS/Edge Functions); Stripe. Migrations via MCP (`fnlhevoiwweowqairsyb`); types hand-maintained; i18n FR/EN/ES.

## Global Constraints
- Build gate `npx tsc -b && npm run build`. No unit runner — "test" = SQL/impersonation + tsc/build.
- Money server-authoritative; access/entitlement server-enforced (RLS / definer helpers), never client-trusted.
- SECURITY DEFINER fns set search_path=public; public-read RPCs → anon+authenticated; admin/analytics RPCs guarded by `has_institution_role(..., institution_admin)`; revoke default PUBLIC where not intended.
- New strings in FR/EN/ES; DB types updated after DDL.
- Branch `phase4-growth` (stacked on `phase3-retention`); commit bodies end `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Live Stripe (bundle checkout, subscription) PENDING owner secrets, verified by build + SQL only.

---

## Feature A — Learning paths / bundles

**A1 migration `p4_learning_paths`:**
- `learning_paths(id, institution_id, slug unique-per-inst, title, subtitle, description, price_cents, accent, icon, status default 'draft', published_at, created_at)`.
- `learning_path_courses(path_id, course_id, position, primary key(path_id,course_id))`.
- RLS: manage via `has_institution_role(institution_id, array['teacher','institution_admin'])`; read published to institution members; **public** exposure via RPC only.
- RPCs (anon): `list_public_paths()`, `get_public_path(slug)` → path + member courses (published-only) + `course_count`. Bundle price = `learning_paths.price_cents` (explicit, not summed).
- `path_progress(p_path uuid)` (authenticated, auth.uid) → {done_courses, total_courses, pct} from `course_progress` over member courses.

**A2 checkout + fulfillment:** extend `create-checkout` to accept `path_id` (server price from `learning_paths`, metadata `path_id`); `stripe-webhook` on fulfillment: if `path_id`, enroll the buyer into every course in the path (upsert enrollments) + one order row.

**A3 frontend:** `/paths` list + `/paths/:slug` sales page (member courses, price, buy CTA via `startCheckout({ pathId })`); a "Paths" entry in the public catalog/nav; show path membership on the student dashboard.

## Feature B — All-access membership (subscription)

**B1 migration `p4_membership`:**
- `subscriptions(id, institution_id, user_id, plan_id, status, stripe_subscription_id, current_period_end, created_at, unique(user_id, plan_id))`.
- `has_active_subscription(p_institution uuid)` (SECURITY DEFINER, auth.uid) → boolean (an active, non-expired subscription row).
- Grant course access: extend the access path used by the player — redefine `is_enrolled(course_id)` OR the lesson-access helper to also return true when `has_active_subscription(course.institution_id)` for a published course. (Verify which function gates the player; keep `can_view_course` for browse unchanged.)
- RLS on `subscriptions`: user reads own; admin reads institution.

**B2 checkout + webhook:** `create-checkout` supports `plan_id` again (mode `subscription`, `plan.stripe_price_id`); `stripe-webhook` handles `checkout.session.completed` (mode subscription → upsert subscription active) and `customer.subscription.updated`/`deleted` (sync status/current_period_end). Refund/cancel path sets status.

**B3 frontend:** `/pricing` (or extend it) lists plans with a "Subscribe" CTA; student area shows membership status; catalog cards show "included with membership".

## Feature C — Affiliate / referral

**C1 migration `p4_referrals`:**
- `referral_codes(user_id pk, code unique, created_at)`; `orders.referrer_id uuid` (nullable); `referral_credits(id, institution_id, referrer_id, order_id, amount_cents, created_at)`.
- RPC `my_referral_code()` (authenticated) → creates/returns the caller's code. `referral_stats()` (authenticated) → {referrals, credit_cents}. Attribution: `create-checkout` accepts `ref` code → resolves to referrer_id in metadata; `stripe-webhook` sets `orders.referrer_id` + inserts a `referral_credits` row (e.g. 10% of net).
- RLS: user reads own code/credits; admin reads institution.

**C2 frontend:** an "Invite & earn" panel (student) showing the referral link (`/?ref=CODE`) + stats; capture `?ref=` into localStorage on load and pass to `startCheckout`.

## Feature D — Upsells + funnel analytics

**D1 upsell:** on `CheckoutReturn` (success) and the course sales page, show a "next in path" / related-course bump (from `get_public_path` or same-category `list_public_courses`).

**D2 analytics migration `p4_analytics`:** `funnel_stats(p_institution, p_days)` (institution_admin) → {views (from a lightweight `page_events` table or enrollments proxy), checkouts (orders pending+paid), purchases (orders paid), conversion}; `cohort_retention(p_institution)` → completion by enroll-month. Add a `page_events(institution_id, path, session_id, created_at)` table + a public `log_page_event(path)` RPC for view counts (best-effort).

**D3 frontend:** an admin **Analytics** page (`/admin/analytics`) with the funnel + cohort + top paths, nav entry (institution_admin).

---

## Verification & finish
- Per feature: apply migration → `get_advisors(security)` clean (no ERRORs; public RPCs are expected WARNs) → tsc+build → commit.
- Final: advisor sweep, push `phase4-growth`, PR base `phase3-retention`.
- **Owner action:** Stripe subscription price ids on `plans.stripe_price_id`; live bundle/subscription/refund tests need the Stripe secrets.

## Notes / deferred
- Path certificate on full-path completion: deferred (per-course certificates already exist).
- Affiliate payouts (actual money out) are prohibited to automate; the ledger tracks owed credit for manual/again-later payout.
- `page_events` view logging is best-effort and unauthenticated (rate-limit later).
