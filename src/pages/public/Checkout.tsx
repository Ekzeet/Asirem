import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'
import { startCheckout } from '../../lib/checkout'
import { useDocumentHead } from '../../lib/seo'

type Kind = 'course' | 'path' | 'plan'
type Item = { kind: Kind; id: string; title: string; priceCents: number; currency: string; interval?: string | null }

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

const inputCss: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid var(--border-soft)',
  fontSize: 15, fontWeight: 600, color: 'var(--navy-800)', background: '#fff', outline: 'none',
}

export default function Checkout() {
  const [sp] = useSearchParams()
  const loc = useLocation()
  const nav = useNavigate()
  const { t } = useI18n()
  useDocumentHead({ title: 'Checkout · Asirem Academy' })

  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const { data: item, loading } = useAsync(async (): Promise<Item | null> => {
    const st = (loc.state as { item?: Item } | null)?.item
    if (st) return st
    const courseSlug = sp.get('course'), pathSlug = sp.get('path'), planId = sp.get('plan')
    if (courseSlug) {
      const { data } = await supabase.rpc('get_public_course', { p_slug: courseSlug })
      return data ? { kind: 'course', id: (data as any).id, title: (data as any).title, priceCents: (data as any).price_cents, currency: (data as any).currency } : null
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

  async function pay(guestEmail?: string) {
    if (!item) return
    const opts: { courseId?: string; pathId?: string; planId?: string; email?: string } = {}
    if (item.kind === 'course') opts.courseId = item.id
    else if (item.kind === 'path') opts.pathId = item.id
    else opts.planId = item.id
    if (guestEmail) opts.email = guestEmail
    await startCheckout(opts) // redirects to Stripe
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null); setBusy(true)
    try {
      if (session) { await pay(); return }
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) { setError(error.message); setBusy(false); return }
        await pay(); return
      }
      // Register: the student picks the email + password they'll log in with from now on.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim(), signup_role: 'student' } },
      })
      if (error) {
        if (/registered|already|exists/i.test(error.message)) { setMode('login'); setError(t('emailExistsLogin')) }
        else setError(error.message)
        setBusy(false); return
      }
      // Confirm-email OFF → a session is returned and we check out as an authenticated user.
      if (data.session) await pay()
      else await pay(email.trim()) // fallback if email confirmation is on
    } catch (err) {
      setError((err as Error).message ?? 'checkout_failed'); setBusy(false)
    }
  }

  if (loading || session === undefined) return <Loader />
  if (!item) return <div style={{ padding: 24, textAlign: 'center' }}>{t('noData')}</div>
  if (!item.priceCents) { nav('/login', { replace: true }); return null }

  return (
    <div className="two-col" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      {/* Left — account gate / pay */}
      <div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, margin: '0 0 4px' }}>{t('completeEnrollment')}</h1>

        {session ? (
          <div style={{ marginTop: 16 }}>
            <div style={{ color: '#5B6B82', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>
              {t('login')}: <strong style={{ color: 'var(--navy-800)' }}>{session.user.email}</strong>
            </div>
            {error && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{error}</div>}
            <button onClick={() => submit()} disabled={busy} style={payBtn}>{busy ? '…' : t('paySecurely')}</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#5B6B82', fontWeight: 700, fontSize: 14 }}>{t('createAccountToContinue')}</div>
            {mode === 'register' && (
              <input style={inputCss} placeholder={t('fullName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            )}
            <input style={inputCss} type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <input style={inputCss} type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} />
            {mode === 'register' && <div style={{ color: '#8494A8', fontSize: 12.5, fontWeight: 600 }}>{t('passwordHint')}</div>}
            {error && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 13 }}>{error}</div>}
            <button type="submit" disabled={busy} style={payBtn}>{busy ? '…' : t('paySecurely')}</button>
            <button type="button" onClick={() => { setError(null); setMode(mode === 'register' ? 'login' : 'register') }} style={toggleBtn}>
              {mode === 'register' ? t('alreadyHaveAccount') : t('newHere')}
            </button>
          </form>
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
          <hr style={{ border: 0, borderTop: '1px solid var(--border-soft)', margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--navy-800)', fontWeight: 900 }}>
            <span>Total</span><span>{money(item.priceCents, item.currency)}</span>
          </div>
          <div style={{ color: '#8494A8', fontSize: 12, fontWeight: 600, marginTop: 12, textAlign: 'center' }}>{t('moneyBack')}</div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
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
