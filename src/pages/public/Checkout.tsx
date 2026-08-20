import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'
import { startCheckout } from '../../lib/checkout'
import { effectivePrice } from '../../lib/sale'
import { useDocumentHead } from '../../lib/seo'

type Kind = 'course' | 'path' | 'plan' | 'ebook'
type Item = { kind: Kind; id: string; title: string; priceCents: number; currency: string; interval?: string | null }

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

const inputCss: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid var(--border-soft)',
  fontSize: 15, fontWeight: 600, color: 'var(--navy-800)', background: '#fff', outline: 'none',
}

/** Step pill in the "1 Account — 2 Payment" progress header. */
function StepPill({ n, label, state }: { n: number; label: string; state: 'done' | 'active' | 'todo' }) {
  const bg = state === 'active' ? 'var(--navy-800)' : state === 'done' ? 'var(--gold-500,#E7B450)' : '#E7ECF3'
  const fg = state === 'todo' ? '#8494A8' : state === 'done' ? '#0F2C4C' : '#fff'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: bg, color: fg, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{state === 'done' ? '✓' : n}</span>
      <span style={{ fontWeight: 800, fontSize: 13.5, color: state === 'todo' ? '#8494A8' : 'var(--navy-800)' }}>{label}</span>
    </div>
  )
}

export default function Checkout() {
  const [sp] = useSearchParams()
  const loc = useLocation()
  const nav = useNavigate()
  const { t } = useI18n()
  useDocumentHead({ title: 'Checkout · Asirem Academy' })

  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [step, setStep] = useState<1 | 2>(1)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) setStep(2) // already signed in → skip straight to payment
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const { data: item, loading } = useAsync(async (): Promise<Item | null> => {
    const st = (loc.state as { item?: Item } | null)?.item
    if (st) return st
    const courseSlug = sp.get('course'), pathSlug = sp.get('path'), planId = sp.get('plan'), ebookSlug = sp.get('ebook')
    if (ebookSlug) {
      const { data } = await (supabase.rpc as any)('get_public_ebook', { p_slug: ebookSlug })
      const d = Array.isArray(data) ? data[0] : data
      return d ? { kind: 'ebook', id: d.id, title: d.title, priceCents: d.price_cents, currency: d.currency } : null
    }
    if (courseSlug) {
      const { data } = await supabase.rpc('get_public_course', { p_slug: courseSlug })
      const d = data as any
      return d ? { kind: 'course', id: d.id, title: d.title, priceCents: effectivePrice(d.price_cents, d.sale_price_cents, d.sale_starts_at, d.sale_ends_at), currency: d.currency } : null
    }
    if (pathSlug) {
      const { data } = await supabase.rpc('get_public_path', { p_slug: pathSlug })
      return data ? { kind: 'path', id: (data as any).id, title: (data as any).title, priceCents: (data as any).price_cents, currency: (data as any).currency } : null
    }
    if (planId) {
      const { data } = await supabase.from('plans').select('name, price_cents, interval, institution:institutions(currency)').eq('id', planId).maybeSingle()
      const d = data as any
      return d ? { kind: 'plan', id: planId, title: d.name, priceCents: d.price_cents, currency: d.institution?.currency ?? 'usd', interval: d.interval } : null
    }
    return null
  }, [])

  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<{ discount_type: string; amount: number } | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)

  async function applyCoupon() {
    const code = coupon.trim().toUpperCase()
    if (!code || !item) return
    const args: Record<string, string> = { p_code: code }
    if (item.kind === 'course') args.p_course_id = item.id
    else if (item.kind === 'path') args.p_path_id = item.id
    else if (item.kind === 'ebook') args.p_ebook_id = item.id
    const { data } = await (supabase.rpc as any)('preview_coupon', args)
    const row = (Array.isArray(data) ? data[0] : data) as { discount_type: string; amount: number } | undefined
    if (row) { setApplied(row); setCouponMsg(null) }
    else { setApplied(null); setCouponMsg(t('couponInvalid')) }
  }

  // Step 1 → create account or log in, then advance to the payment step (no redirect yet).
  async function submitAccount(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) { setError(error.message); return }
        setStep(2); return
      }
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim(), signup_role: 'student' } },
      })
      if (error) {
        if (/registered|already|exists/i.test(error.message)) { setMode('login'); setError(t('emailExistsLogin')) }
        else setError(error.message)
        return
      }
      setStep(2)
    } finally { setBusy(false) }
  }

  // Step 2 → hand off to Stripe.
  async function pay() {
    if (!item) return
    setError(null); setBusy(true)
    try {
      const opts: { courseId?: string; pathId?: string; planId?: string; ebookId?: string; email?: string; coupon?: string } = {}
      if (item.kind === 'course') opts.courseId = item.id
      else if (item.kind === 'path') opts.pathId = item.id
      else if (item.kind === 'ebook') opts.ebookId = item.id
      else opts.planId = item.id
      if (!session && email) opts.email = email.trim() // guest fallback (if email confirmation is on)
      if (coupon.trim() && item.kind !== 'plan') opts.coupon = coupon.trim().toUpperCase()
      await startCheckout(opts) // redirects to Stripe
    } catch (err) {
      setError((err as Error).message ?? 'checkout_failed'); setBusy(false)
    }
  }

  if (loading || session === undefined) return <Loader />
  if (!item) return <div style={{ padding: 24, textAlign: 'center' }}>{t('noData')}</div>
  if (!item.priceCents) { nav('/login', { replace: true }); return null }

  const discountCents = applied ? (applied.discount_type === 'percent' ? Math.round(item.priceCents * applied.amount / 100) : applied.amount) : 0
  const finalCents = Math.max(0, item.priceCents - discountCents)

  return (
    <div className="two-col" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Left — the wizard */}
      <div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, margin: '0 0 14px' }}>{t('completeEnrollment')}</h1>

        {/* Progress header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <StepPill n={1} label={t('stepAccount')} state={step === 1 ? 'active' : 'done'} />
          <span style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
          <StepPill n={2} label={t('stepPayment')} state={step === 2 ? 'active' : 'todo'} />
        </div>

        {step === 1 ? (
          <form onSubmit={submitAccount} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#5B6B82', fontWeight: 700, fontSize: 14 }}>{t('createAccountToContinue')}</div>
            {mode === 'register' && (
              <input style={inputCss} placeholder={t('fullName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            )}
            <input style={inputCss} type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <input style={inputCss} type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} />
            {mode === 'register' && <div style={{ color: '#8494A8', fontSize: 12.5, fontWeight: 600 }}>{t('passwordHint')}</div>}
            {error && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 13 }}>{error}</div>}
            <button type="submit" disabled={busy} style={payBtn}>{busy ? '…' : t('continueLabel')}</button>
            <button type="button" onClick={() => { setError(null); setMode(mode === 'register' ? 'login' : 'register') }} style={toggleBtn}>
              {mode === 'register' ? t('alreadyHaveAccount') : t('newHere')}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, border: '1px solid var(--border-soft)', borderRadius: 10, padding: '11px 12px' }}>
              <span style={{ color: '#5B6B82', fontWeight: 600, fontSize: 14 }}>
                {session?.user.email ?? email}
              </span>
              {!session && (
                <button type="button" onClick={() => setStep(1)} style={{ ...toggleBtn, padding: 0 }}>{t('editAccount')}</button>
              )}
            </div>
            {item.kind !== 'plan' && (
              <div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={{ ...inputCss, flex: 1 }} placeholder={t('couponPlaceholder')} value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setApplied(null); setCouponMsg(null) }} autoComplete="off" />
                  <button type="button" onClick={applyCoupon} disabled={!coupon.trim()} style={{ border: '1px solid var(--border-soft)', background: '#fff', color: 'var(--navy-800)', fontWeight: 800, fontSize: 14, borderRadius: 10, padding: '0 18px', cursor: 'pointer' }}>{t('couponApply')}</button>
                </div>
                {applied && <div style={{ color: '#1F8A5B', fontWeight: 700, fontSize: 12.5, marginTop: 6 }}>✓ {t('couponApplied')}</div>}
                {couponMsg && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 12.5, marginTop: 6 }}>{couponMsg}</div>}
              </div>
            )}
            {error && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 13 }}>{error}</div>}
            <button onClick={pay} disabled={busy} style={payBtn}>{busy ? '…' : t('paySecurely')}</button>
          </div>
        )}

        <div style={{ color: '#8494A8', fontSize: 12.5, fontWeight: 600, marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span aria-hidden>🔒</span> {t('securePayment')}
        </div>
      </div>

      {/* Right — order summary */}
      <aside>
        <div style={{ position: 'sticky', top: 20, border: '1px solid var(--border-soft)', borderRadius: 14, padding: 18, background: '#fff' }}>
          <div style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8494A8', fontWeight: 700, marginBottom: 10 }}>{t('orderSummary')}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
            <span style={{ color: 'var(--navy-800)', fontWeight: 800, fontSize: 15 }}>{item.title}</span>
            <span style={{ color: 'var(--navy-800)', fontWeight: 900, fontSize: 18, whiteSpace: 'nowrap' }}>{money(item.priceCents, item.currency)}</span>
          </div>
          {item.kind === 'plan' && item.interval && (
            <div style={{ color: '#8494A8', fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>/ {item.interval}</div>
          )}
          {applied && discountCents > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1F8A5B', fontWeight: 700, fontSize: 13.5, marginTop: 8 }}>
              <span>{t('discountLabel')} ({coupon.trim()})</span><span>−{money(discountCents, item.currency)}</span>
            </div>
          )}
          <hr style={{ border: 0, borderTop: '1px solid var(--border-soft)', margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-800)', fontWeight: 900 }}>
            <span>Total</span><span>{money(finalCents, item.currency)}</span>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <Link to="/courses" style={{ color: '#8494A8', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}>← {t('courses')}</Link>
          </div>
        </div>
      </aside>
    </div>
  )
}

const payBtn: React.CSSProperties = {
  width: '100%', background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0,
  padding: '13px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer',
}
const toggleBtn: React.CSSProperties = {
  background: 'transparent', border: 0, color: 'var(--navy-800)', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', padding: 4,
}
