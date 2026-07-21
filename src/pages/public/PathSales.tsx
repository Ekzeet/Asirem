import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'
import { startCheckout } from '../../lib/checkout'
import { Loader } from '../../components/ui'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function PathSales() {
  const { slug } = useParams()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_public_path', { p_slug: slug! })
    return data as any
  }, [slug])
  useDocumentHead({ title: data?.title, description: data?.subtitle })
  if (loading) return <Loader />
  if (!data) return <div style={{ padding: 24 }}>{t('noData')}</div>
  const p = data

  async function buy() {
    if (!p.price_cents) { window.location.href = '/login'; return }
    const { data: sess } = await supabase.auth.getSession()
    let email: string | undefined
    if (!sess?.session) { email = window.prompt(t('enterEmail')) ?? undefined; if (!email) return }
    setBusy(true)
    try { await startCheckout({ pathId: p.id, email }) } finally { setBusy(false) }
  }

  return (
    <div className="two-col" style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 30 }}>{p.title}</h1>
        <p style={{ color: '#5B6B82', fontSize: 16, fontWeight: 600 }}>{p.subtitle}</p>
        {p.description && <p style={{ color: '#5B6B82', fontSize: 14.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.description}</p>}
        <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '18px 0 10px' }}>{t('includedCourses')}</h2>
        {(p.courses ?? []).map((c: any, i: number) => (
          <Link key={c.slug} to={`/courses/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: '1px solid var(--border-soft)', borderRadius: 12, marginBottom: 8, textDecoration: 'none' }}>
            <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: '#EAF1FB', color: '#1B5FB0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
            <span style={{ flex: 1, color: 'var(--navy-800)', fontWeight: 700, fontSize: 14 }}>{c.title}</span>
          </Link>
        ))}
      </div>
      <aside>
        <div style={{ position: 'sticky', top: 20, border: '1px solid var(--border-soft)', borderRadius: 14, padding: 18, background: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--navy-800)' }}>{p.price_cents ? money(p.price_cents, p.currency) : t('free')}</div>
          <div style={{ color: '#5B6B82', fontWeight: 700, margin: '4px 0' }}>{(p.courses ?? []).length} {t('courses').toLowerCase()} · {t('bundleSave')}</div>
          <button onClick={buy} disabled={busy} style={{ width: '100%', marginTop: 12, background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : t('getBundle')}</button>
          <div style={{ color: '#8494A8', fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{t('moneyBack')}</div>
        </div>
      </aside>
    </div>
  )
}
