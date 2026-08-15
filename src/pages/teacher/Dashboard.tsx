import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { money, moneyFull, relTime } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { Avatar, Card, CourseCover, Loader, PageWrap, SectionTitle, StatusChip } from '../../components/ui'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss } from '../../components/Modal'

type Stats = { students: number; earnings_cents: number; courses: number; rating: number | null }
type Course = { id: string; title: string; category: string | null; accent: string | null; icon: string | null; status: string; rating: number | null }
type Question = { id: string; text: string; author: string; at: string }
type Coupon = { id: string; code: string; discount_type: string; amount: number; uses_count: number; starts_at: string | null; ends_at: string | null }

export default function TeacherDashboard() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId

  const [couponForm, setCouponForm] = useState<Coupon | 'new' | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const [stats, courses, posts, coupons] = await Promise.all([
      supabase.rpc('teacher_dashboard_stats', { p_institution_id: inst }),
      supabase.from('courses').select('id,title,category,accent,icon,status,rating').eq('institution_id', inst).eq('instructor_id', me!.userId).order('created_at', { ascending: false }),
      supabase.from('posts').select('id, body, created_at, author:profiles!posts_author_profile_fkey(full_name)').eq('institution_id', inst).order('created_at', { ascending: false }).limit(4),
      supabase.from('coupons').select('id, code, discount_type, amount, uses_count, starts_at, ends_at').eq('institution_id', inst).eq('active', true).order('created_at', { ascending: false }),
    ])
    const questions: Question[] = (posts.data ?? []).map((p: any) => ({ id: p.id, text: p.body, author: p.author?.full_name ?? '—', at: p.created_at }))
    return { stats: stats.data as unknown as Stats, courses: (courses.data ?? []) as Course[], questions, coupons: (coupons.data ?? []) as Coupon[] }
  }, [inst, me!.userId])

  async function deleteCoupon(c: Coupon) {
    if (!window.confirm(t('deleteCouponConfirm').replace('{code}', c.code))) return
    const { data, error } = await supabase.functions.invoke('manage-coupon', { body: { action: 'delete', id: c.id } })
    if (error || (data as any)?.error) { alert((data as any)?.error ?? error?.message ?? 'delete_failed'); return }
    reload()
  }

  if (loading || !data) return <Loader />
  const { stats, courses, questions, coupons } = data

  const kpis = [
    { icon: 'graduation-cap', tint: '#EAF1FB', color: '#1B5FB0', value: String(stats.students), label: t('yourStudents') },
    { icon: 'dollar-sign', tint: '#EAF6EF', color: '#1F8A5B', value: money(stats.earnings_cents), label: t('yourEarnings') },
    { icon: 'book-open', tint: '#FBF1E1', color: '#C99A2E', value: String(stats.courses), label: t('courses') },
    { icon: 'star', tint: '#F3EDFB', color: '#7C5CD6', value: stats.rating != null ? String(stats.rating) : '—', label: t('avgRating') },
  ]

  return (
    <PageWrap>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <Card key={i} style={{ padding: '18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: k.tint, color: k.color, marginBottom: 14 }}><Icon name={k.icon} size={18} /></div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: 'var(--navy-800)' }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: '#7C8AA0', fontWeight: 600, marginTop: 2 }}>{k.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
        <div>
          <SectionTitle title={t('courses')} right={<button onClick={() => nav('/admin/courses')} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('viewAll')} →</button>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {courses.map((c) => (
              <div key={c.id} onClick={() => nav(`/student/course/${c.id}`)} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
                <CourseCover accent={c.accent} icon={c.icon} height={84}>
                  <StatusChip status={c.status} />
                </CourseCover>
                <div style={{ padding: '13px 14px 14px' }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13.5, color: 'var(--navy-800)', lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#8494A8', fontWeight: 600 }}>
                    <span>{c.category}</span>{c.rating != null && <span style={{ color: '#C99A2E' }}>★ {c.rating}</span>}
                  </div>
                </div>
              </div>
            ))}
            {courses.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noCourses')}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>
          <Card style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{t('coupons')}</div>
              <button onClick={() => setCouponForm('new')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>+ {t('add')}</button>
            </div>
            {coupons.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', border: '1px dashed #D6DEE9', borderRadius: 10, marginBottom: 9, background: '#FAFBFD' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13, color: 'var(--navy-800)', letterSpacing: .5 }}>{c.code}</div>
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

          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)', marginBottom: 3 }}>{t('studentQuestions')}</div>
            <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 14 }}>{t('needsReply')}</div>
            {questions.map((q) => <QuestionRow key={q.id} q={q} />)}
          </Card>
        </div>
      </div>
      {couponForm && <CouponModal institutionId={inst} existing={couponForm === 'new' ? null : couponForm} onClose={() => setCouponForm(null)} onSaved={() => { setCouponForm(null); reload() }} />}
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

function CouponModal({ institutionId, existing, onClose, onSaved }: { institutionId: string; existing: Coupon | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [code, setCode] = useState(existing?.code ?? '')
  const [type, setType] = useState<'percent' | 'amount'>((existing?.discount_type as 'percent' | 'amount') ?? 'percent')
  const [amount, setAmount] = useState(existing ? (existing.discount_type === 'amount' ? existing.amount / 100 : existing.amount) : 20)
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('couponStart')}><input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputCss} /></Field>
        <Field label={t('couponEnd')}><input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputCss} /></Field>
      </div>
      <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginTop: -4 }}>{t('couponDateHint')}</div>
    </Modal>
  )
}

function QuestionRow({ q }: { q: Question }) {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function send() {
    if (!reply.trim()) return
    setBusy(true)
    await supabase.from('post_comments').insert({ post_id: q.id, author_id: me!.userId, body: reply.trim() })
    setBusy(false); setSent(true); setReply(''); setOpen(false)
  }

  return (
    <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: '1px solid var(--border-soft)' }}>
      <Avatar name={q.author} size={34} radius={9} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: '#33415A', fontWeight: 600, lineHeight: 1.4 }}>{q.text}</div>
        <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600, marginTop: 3, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>{q.author} · {relTime(q.at, lang)}</span>
          {sent
            ? <span style={{ color: '#1F8A5B', fontWeight: 700 }}><Icon name="check" size={12} /> {t('replied')}</span>
            : <button onClick={() => setOpen((o) => !o)} style={{ color: 'var(--blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11 }}>{t('reply')}</button>}
        </div>
        {open && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }} placeholder={t('yourReply')} style={{ flex: 1, height: 36, border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', fontSize: 12.5, outline: 'none' }} />
            <button onClick={send} disabled={busy || !reply.trim()} style={{ height: 36, padding: '0 14px', borderRadius: 9, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{t('send')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
