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
type Coupon = { code: string; discount_type: string; amount: number; uses_count: number }

export default function TeacherDashboard() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId

  const [showCoupon, setShowCoupon] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [stats, courses, posts, coupons] = await Promise.all([
      supabase.rpc('teacher_dashboard_stats', { p_institution_id: inst }),
      supabase.from('courses').select('id,title,category,accent,icon,status,rating').eq('institution_id', inst).eq('instructor_id', me!.userId).order('created_at', { ascending: false }),
      supabase.from('posts').select('id, body, created_at, author:profiles!posts_author_profile_fkey(full_name)').eq('institution_id', inst).order('created_at', { ascending: false }).limit(4),
      supabase.from('coupons').select('code, discount_type, amount, uses_count').eq('institution_id', inst).eq('active', true).order('created_at', { ascending: false }),
    ])
    const questions: Question[] = (posts.data ?? []).map((p: any) => ({ id: p.id, text: p.body, author: p.author?.full_name ?? '—', at: p.created_at }))
    return { stats: stats.data as unknown as Stats, courses: (courses.data ?? []) as Course[], questions, coupons: (coupons.data ?? []) as Coupon[] }
  }, [inst, me!.userId])

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
            {coupons.length === 0 && <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600 }}>{t('noCoupons')}</div>}
          </Card>

          <Card style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)', marginBottom: 3 }}>{t('studentQuestions')}</div>
            <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 14 }}>{t('needsReply')}</div>
            {questions.map((q) => <QuestionRow key={q.id} q={q} />)}
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
