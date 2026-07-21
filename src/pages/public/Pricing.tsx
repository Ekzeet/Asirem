import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'
import { startCheckout } from '../../lib/checkout'
import { Loader } from '../../components/ui'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function Pricing() {
  const { t } = useI18n()
  useDocumentHead({ title: 'Asirem Academy · ' + t('membership') })
  const [busy, setBusy] = useState<string | null>(null)
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_plans')
    return data ?? []
  }, [])
  if (loading || !data) return <Loader />

  async function subscribe(planId: string) {
    const { data: sess } = await supabase.auth.getSession()
    let email: string | undefined
    if (!sess?.session) { email = window.prompt(t('enterEmail')) ?? undefined; if (!email) return }
    setBusy(planId)
    try { await startCheckout({ planId, email }) } finally { setBusy(null) }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 28, marginBottom: 6 }}>{t('membership')}</h1>
      <p style={{ color: '#8494A8', fontWeight: 600, marginBottom: 22 }}>{t('membershipSub')}</p>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noData')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18, justifyContent: 'center' }}>
        {data.map((p) => (
          <div key={p.id} style={{ border: '1px solid var(--border-soft)', borderRadius: 16, padding: '26px 22px', background: '#fff' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, color: 'var(--navy-800)' }}>{p.name}</div>
            <div style={{ margin: '12px 0' }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 30, color: 'var(--navy-800)' }}>{money(p.price_cents, p.currency)}</span>
              <span style={{ color: '#8494A8', fontWeight: 700 }}> / {p.bill_interval}</span>
            </div>
            <div style={{ color: '#5B6B82', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{t('allAccessPerk')}</div>
            <button onClick={() => subscribe(p.id)} disabled={busy === p.id} style={{ width: '100%', background: 'var(--navy-800)', color: '#fff', border: 0, padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy === p.id ? '…' : t('subscribe')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
