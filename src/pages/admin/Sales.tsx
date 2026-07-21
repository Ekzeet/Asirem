import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useState } from 'react'
import { money, moneyFull } from '../../lib/format'
import { Avatar, Card, Loader, PageWrap } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss } from '../../components/Modal'

type Stats = { revenue_cents: number; sales: number; subscriptions: number; avg_order_cents: number }
type Mrr = { mrr_cents: number; delta: number | null }
type Tx = { id: string; name: string; course: string; plan: string; amount: number; date: string; status: string; refundable: boolean }
type Coupon = { code: string; discount_type: string; amount: number; uses_count: number }

export default function AdminSales() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId

  const [showCoupon, setShowCoupon] = useState(false)
  const [refunding, setRefunding] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const [stats, mrr, orders, coupons] = await Promise.all([
      supabase.rpc('sales_stats', { p_institution_id: inst }),
      supabase.rpc('mrr', { p_institution_id: inst }),
      supabase
        .from('orders')
        .select('id, amount_cents, created_at, status, stripe_session_id, provider, plan:plans(name), course:courses(title), buyer:profiles!orders_user_profile_fkey(full_name)')
        .eq('institution_id', inst)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('coupons').select('code, discount_type, amount, uses_count').eq('institution_id', inst).eq('active', true),
    ])
    const tx: Tx[] = (orders.data ?? []).map((o: any) => ({
      id: o.id,
      name: o.buyer?.full_name ?? '—',
      course: o.course?.title ?? o.plan?.name ?? '—',
      plan: o.plan?.name ?? '—',
      amount: o.amount_cents,
      date: o.created_at,
      status: o.status,
      refundable: o.status === 'paid' && o.provider === 'stripe' && !!o.stripe_session_id,
    }))
    return { stats: stats.data as unknown as Stats, mrr: mrr.data as unknown as Mrr, tx, coupons: (coupons.data ?? []) as Coupon[] }
  }, [inst])

  if (loading || !data) return <Loader />
  const { stats, mrr, tx, coupons } = data
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: '2-digit', month: 'short' })

  async function doRefund(id: string) {
    if (!window.confirm(t('confirmRefund'))) return
    setRefunding(id)
    const { data: res, error } = await supabase.functions.invoke('refund-order', { body: { order_id: id } })
    setRefunding(null)
    if (error || !(res as any)?.ok) { alert((res as any)?.error ?? error?.message ?? 'refund_failed'); return }
    reload()
  }

  const cards = [
    { icon: 'dollar-sign', color: '#1F8A5B', label: t('revenue30'), value: money(stats.revenue_cents) },
    { icon: 'shopping-cart', color: '#1B5FB0', label: t('sales30'), value: String(stats.sales) },
    { icon: 'repeat', color: '#7C5CD6', label: t('subscriptions'), value: String(stats.subscriptions) },
    { icon: 'ticket', color: '#C99A2E', label: t('avgOrder'), value: moneyFull(stats.avg_order_cents) },
  ]
  const planChip = (p: string) => {
    const low = p.toLowerCase()
    return low.includes('premium') ? ['#EAF1FB', '#1B5FB0'] : low.includes('pack') ? ['#F3EDFB', '#7C5CD6'] : ['#FBF1E1', '#C99A2E']
  }
  const gridCols = '2fr 1.4fr 1fr 1fr 90px'

  return (
    <PageWrap>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {cards.map((s, i) => (
          <Card key={i} style={{ padding: '16px 18px', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Icon name={s.icon} size={16} color={s.color} /><span style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{s.label}</span></div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="two-col" style={{ gap: 16 }}>
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)', borderBottom: '1px solid #EEF2F7' }}>{t('recentTx')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, padding: '11px 22px', background: '#FAFBFD', fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .5, borderBottom: '1px solid #EEF2F7' }}>
            <span>{t('customer')}</span><span>{t('course')}</span><span>{t('plan')}</span><span style={{ textAlign: 'right' }}>{t('amount')}</span><span />
          </div>
          {tx.map((x) => {
            const [bg, fg] = planChip(x.plan)
            return (
              <div key={x.id} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, alignItems: 'center', padding: '12px 22px', borderTop: '1px solid #F3F6FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar name={x.name} size={34} radius={9} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--navy-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.name}</div>
                    <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600 }}>{fmtDate(x.date)}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#3C4A5E', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.course}</span>
                <span style={{ justifySelf: 'start', fontSize: 11, fontWeight: 700, color: fg, background: bg, padding: '3px 9px', borderRadius: 20 }}>{x.plan}</span>
                <span style={{ textAlign: 'right', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: x.status === 'refunded' ? '#9AA7B8' : '#1F8A5B', textDecoration: x.status === 'refunded' ? 'line-through' : 'none' }}>{moneyFull(x.amount)}</span>
                <span style={{ justifySelf: 'end' }}>
                  {x.status === 'refunded'
                    ? <span style={{ fontSize: 10.5, fontWeight: 800, color: '#9AA7B8', textTransform: 'uppercase' }}>{t('refunded')}</span>
                    : x.refundable
                      ? <button onClick={() => doRefund(x.id)} disabled={refunding === x.id} style={{ fontSize: 11, fontWeight: 700, color: '#D14343', background: '#FBEBEB', border: 'none', borderRadius: 8, padding: '4px 9px', cursor: 'pointer' }}>{refunding === x.id ? '…' : t('refundOrder')}</button>
                      : null}
                </span>
              </div>
            )
          })}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'linear-gradient(140deg,#0F2C4C,#123C69)', borderRadius: 16, padding: 20, color: '#fff' }}>
            <div style={{ fontSize: 12.5, color: '#9DB4D0', fontWeight: 600 }}>{t('mrr')}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, margin: '4px 0 2px' }}>{moneyFull(mrr.mrr_cents)}</div>
            {mrr.delta != null && <div style={{ fontSize: 12.5, color: '#7FE0B0', fontWeight: 700 }}>+{mrr.delta}% {t('thisMonth')}</div>}
          </div>
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{t('coupons')}</div>
              <button onClick={() => setShowCoupon(true)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>+ {t('add')}</button>
            </div>
            {coupons.map((c) => (
              <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px dashed #D6DEE9', borderRadius: 10, marginBottom: 9, background: '#FAFBFD' }}>
                <div>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--navy-800)', letterSpacing: .5 }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: '#93A1B4', fontWeight: 600 }}>{c.uses_count} {t('uses')}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#C99A2E' }}>{c.discount_type === 'percent' ? `-${c.amount}%` : `-${moneyFull(c.amount)}`}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
      {showCoupon && <CouponModal institutionId={inst} onClose={() => setShowCoupon(false)} onSaved={() => { setShowCoupon(false); reload() }} />}
    </PageWrap>
  )
}

function CouponModal({ institutionId, onClose, onSaved }: { institutionId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'amount'>('percent')
  const [amount, setAmount] = useState(20)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!code.trim()) return
    setBusy(true); setError(null)
    const value = type === 'amount' ? Math.round(amount * 100) : amount
    const { error } = await supabase.from('coupons').insert({ institution_id: institutionId, code: code.trim().toUpperCase(), discount_type: type, amount: value, active: true })
    if (error) { setError(error.message); setBusy(false); return }
    setBusy(false); onSaved()
  }

  return (
    <Modal title={t('newCoupon')} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{t('create')}</BtnPrimary></>}>
      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      <Field label={t('couponCode')}><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LAUNCH30" style={{ ...inputCss, letterSpacing: .5, fontWeight: 700 }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('discountType')}>
          <select value={type} onChange={(e) => setType(e.target.value as any)} style={inputCss}>
            <option value="percent">{t('percentOff')}</option>
            <option value="amount">{t('amountOff')}</option>
          </select>
        </Field>
        <Field label={type === 'percent' ? '%' : '$'}><input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={inputCss} /></Field>
      </div>
    </Modal>
  )
}
