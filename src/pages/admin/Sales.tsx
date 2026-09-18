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
type Coupon = { id: string; code: string; discount_type: string; amount: number; uses_count: number; starts_at: string | null; ends_at: string | null; course_id: string | null; ebook_id: string | null; course?: { title: string } | null; ebook?: { title: string } | null }
type CourseOpt = { id: string; title: string }

export default function AdminSales() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId

  const [couponForm, setCouponForm] = useState<Coupon | 'new' | null>(null)
  const [refunding, setRefunding] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const [stats, mrr, orders, coupons, courseList, ebookList] = await Promise.all([
      supabase.rpc('sales_stats', { p_institution_id: inst }),
      supabase.rpc('mrr', { p_institution_id: inst }),
      supabase
        .from('orders')
        .select('id, amount_cents, created_at, status, stripe_session_id, provider, plan:plans(name), course:courses(title), buyer:profiles!orders_user_profile_fkey(full_name)')
        .eq('institution_id', inst)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('coupons').select('id, code, discount_type, amount, uses_count, starts_at, ends_at, course_id, ebook_id, course:courses(title), ebook:ebooks(title)').eq('institution_id', inst).eq('active', true).order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title').eq('institution_id', inst).order('title'),
      supabase.from('ebooks').select('id, title').eq('institution_id', inst).order('title'),
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
    return { stats: stats.data as unknown as Stats, mrr: mrr.data as unknown as Mrr, tx, coupons: (coupons.data ?? []) as unknown as Coupon[], courseOpts: (courseList.data ?? []) as CourseOpt[], ebookOpts: (ebookList.data ?? []) as CourseOpt[] }
  }, [inst])

  if (loading || !data) return <Loader />
  const { stats, mrr, tx, coupons, courseOpts, ebookOpts } = data
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: '2-digit', month: 'short' })

  async function doRefund(id: string) {
    if (!window.confirm(t('confirmRefund'))) return
    setRefunding(id)
    const { data: res, error } = await supabase.functions.invoke('refund-order', { body: { order_id: id } })
    setRefunding(null)
    if (error || !(res as any)?.ok) { alert((res as any)?.error ?? error?.message ?? 'refund_failed'); return }
    reload()
  }

  async function deleteCoupon(c: Coupon) {
    if (!window.confirm(t('deleteCouponConfirm').replace('{code}', c.code))) return
    const { data, error } = await supabase.functions.invoke('manage-coupon', { body: { action: 'delete', id: c.id } })
    if (error || (data as any)?.error) { alert((data as any)?.error ?? error?.message ?? 'delete_failed'); return }
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
              <button onClick={() => setCouponForm('new')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>+ {t('add')}</button>
            </div>
            {coupons.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px dashed #D6DEE9', borderRadius: 10, marginBottom: 9, background: '#FAFBFD' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--navy-800)', letterSpacing: .5 }}>{c.code}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: (c.course_id || c.ebook_id) ? '#1B5FB0' : '#8494A8', background: (c.course_id || c.ebook_id) ? '#EAF1FB' : '#F1F4F8', padding: '2px 7px', borderRadius: 20, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.course?.title ?? c.ebook?.title ?? t('allCourses')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#93A1B4', fontWeight: 600 }}>{c.uses_count} {t('uses')}{couponWindow(c, lang) ? ` · ${couponWindow(c, lang)}` : ''}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: '#C99A2E' }}>{c.discount_type === 'percent' ? `-${c.amount}%` : `-${moneyFull(c.amount)}`}</span>
                  <button onClick={() => setCouponForm(c)} title={t('edit')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5B6B82', padding: 2, display: 'flex' }}><Icon name="pencil" size={14} /></button>
                  <button onClick={() => deleteCoupon(c)} title={t('delete')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D14343', padding: 2, display: 'flex' }}><Icon name="trash-2" size={14} /></button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600 }}>{t('noCoupons')}</div>}
          </Card>
        </div>
      </div>
      {couponForm && <CouponModal institutionId={inst} courseOpts={courseOpts} ebookOpts={ebookOpts} existing={couponForm === 'new' ? null : couponForm} onClose={() => setCouponForm(null)} onSaved={() => { setCouponForm(null); reload() }} />}
    </PageWrap>
  )
}

/** Short human label for a coupon's active window, or '' when it has no dates. */
function couponWindow(c: Coupon, lang: string): string {
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })
  if (c.starts_at && c.ends_at) return `${fmt(c.starts_at)} – ${fmt(c.ends_at)}`
  if (c.ends_at) return `→ ${fmt(c.ends_at)}`
  if (c.starts_at) return `${fmt(c.starts_at)} →`
  return ''
}

/** yyyy-mm-dd for a date input; '' when null. */
const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

function CouponModal({ institutionId, courseOpts, ebookOpts, existing, onClose, onSaved }: { institutionId: string; courseOpts: CourseOpt[]; ebookOpts: CourseOpt[]; existing: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState(existing?.code ?? '')
  const [type, setType] = useState<'percent' | 'amount'>((existing?.discount_type as 'percent' | 'amount') ?? 'percent')
  const [amount, setAmount] = useState(existing ? (existing.discount_type === 'amount' ? existing.amount / 100 : existing.amount) : 20)
  // Target encodes scope: '' = all, 'c:<id>' = a course, 'e:<id>' = an ebook.
  const [target, setTarget] = useState(existing?.course_id ? `c:${existing.course_id}` : existing?.ebook_id ? `e:${existing.ebook_id}` : '')
  const [startsAt, setStartsAt] = useState(toDateInput(existing?.starts_at ?? null))
  const [endsAt, setEndsAt] = useState(toDateInput(existing?.ends_at ?? null))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!code.trim()) return
    if (startsAt && endsAt && endsAt < startsAt) { setError(t('couponDateOrder')); return }
    setBusy(true); setError(null)
    const value = type === 'amount' ? Math.round(amount * 100) : amount
    // End date is inclusive: treat it as end-of-day so the coupon works through that whole day.
    const payload = {
      action: existing ? 'update' : 'create', id: existing?.id, institution_id: institutionId,
      code: code.trim().toUpperCase(), discount_type: type, amount: value,
      course_id: target.startsWith('c:') ? target.slice(2) : null,
      ebook_id: target.startsWith('e:') ? target.slice(2) : null,
      starts_at: startsAt ? new Date(startsAt + 'T00:00:00').toISOString() : null,
      ends_at: endsAt ? new Date(endsAt + 'T23:59:59').toISOString() : null,
    }
    const { data, error } = await supabase.functions.invoke('manage-coupon', { body: payload })
    if (error || (data as any)?.error) { setError((data as any)?.error ?? error!.message); setBusy(false); return }
    setBusy(false); onSaved()
  }

  return (
    <Modal title={existing ? t('editCoupon') : t('newCoupon')} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{existing ? t('save') : t('create')}</BtnPrimary></>}>
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
      <Field label={t('couponCategory')}>
        <select value={target} onChange={(e) => setTarget(e.target.value)} style={inputCss}>
          <option value="">{t('allCourses')}</option>
          {courseOpts.length > 0 && <optgroup label={t('courses')}>{courseOpts.map((c) => <option key={c.id} value={`c:${c.id}`}>{c.title}</option>)}</optgroup>}
          {ebookOpts.length > 0 && <optgroup label={t('ebooks')}>{ebookOpts.map((e) => <option key={e.id} value={`e:${e.id}`}>{e.title}</option>)}</optgroup>}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('couponStart')}><input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputCss} /></Field>
        <Field label={t('couponEnd')}><input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputCss} /></Field>
      </div>
      <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginTop: -4 }}>{t('couponDateHint')}</div>
    </Modal>
  )
}
