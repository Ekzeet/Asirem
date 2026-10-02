import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { useI18n } from '../i18n/I18nContext'
import { money } from '../lib/format'
import { Icon } from './Icon'

/** "Invite & earn" panel: shows the student's referral link + credit earned. */
export default function ReferralCard() {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const { data } = useAsync(async () => {
    const [{ data: code }, { data: stats }, { data: coupons }] = await Promise.all([
      supabase.rpc('my_referral_code'),
      supabase.rpc('referral_stats'),
      (supabase.rpc as any)('my_referral_coupons'),
    ])
    return { code: code as string | null, stats: (stats ?? {}) as { referrals?: number; credit_cents?: number }, coupons: (coupons ?? []) as { code: string; amount: number; uses_count: number; max_uses: number | null }[] }
  }, [])
  if (!data?.code) return null
  const link = `${window.location.origin}/?ref=${data.code}`

  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon name="gift" size={16} color="#7C5CD6" />
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{t('inviteEarn')}</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 12 }}>{t('inviteEarnSub')}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input readOnly value={link} style={{ flex: 1, minWidth: 220, height: 38, border: '1px solid var(--border)', borderRadius: 10, padding: '0 12px', fontSize: 12.5, color: '#5B6B82', background: '#F7F9FC' }} />
        <button onClick={() => { navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          style={{ height: 38, padding: '0 16px', borderRadius: 10, background: '#0F2C4C', color: '#fff', border: 0, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{copied ? '✓' : t('copy')}</button>
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
        <div><div style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy-800)' }}>{data.stats.referrals ?? 0}</div><div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600 }}>{t('referrals')}</div></div>
        <div><div style={{ fontWeight: 800, fontSize: 18, color: '#1F8A5B' }}>{money(data.stats.credit_cents ?? 0)}</div><div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600 }}>{t('creditEarned')}</div></div>
      </div>
      {data.coupons.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 8 }}>{t('yourCoupons')}</div>
          {data.coupons.map((c) => {
            const used = c.max_uses != null && c.uses_count >= c.max_uses
            return (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 11px', border: '1px dashed #D6DEE9', borderRadius: 9, marginBottom: 7, background: used ? '#F7F9FC' : '#FBF7EE', opacity: used ? 0.6 : 1 }}>
                <div>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--navy-800)', letterSpacing: .5 }}>{c.code}</span>
                  <span style={{ fontSize: 11.5, color: '#93A1B4', fontWeight: 600, marginLeft: 8 }}>−{money(c.amount)} · {used ? t('couponUsed') : t('couponAvailable')}</span>
                </div>
                {!used && <button onClick={() => { navigator.clipboard?.writeText(c.code) }} style={{ height: 30, padding: '0 12px', borderRadius: 8, background: '#0F2C4C', color: '#fff', border: 0, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{t('copy')}</button>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
