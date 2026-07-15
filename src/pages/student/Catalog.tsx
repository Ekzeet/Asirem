import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { moneyFull } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { CourseCover, Loader, PageWrap } from '../../components/ui'

type Course = {
  id: string; title: string; subtitle: string | null; category: string | null; price_cents: number
  rating: number | null; accent: string | null; icon: string | null
  instructor: { full_name: string | null } | null
}

export default function Catalog() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId
  const [enrolling, setEnrolling] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: courses }, { data: enr }, { data: plans }] = await Promise.all([
      supabase.from('courses').select('id,title,subtitle,category,price_cents,rating,accent,icon,instructor:profiles!courses_instructor_id_fkey(full_name)').eq('institution_id', inst).eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('course_id').eq('user_id', me!.userId),
      supabase.from('plans').select('id, code').eq('institution_id', inst),
    ])
    const enrolled = new Set((enr ?? []).map((e) => e.course_id))
    const oneTime = (plans ?? []).find((p) => p.code === 'one_time')?.id ?? null
    return { courses: ((courses ?? []) as unknown as Course[]).filter((c) => !enrolled.has(c.id)), oneTimePlan: oneTime }
  }, [inst])

  if (loading || !data) return <Loader />
  const { courses, oneTimePlan } = data

  async function instantEnroll(c: Course) {
    await supabase.from('enrollments').insert({ institution_id: inst, course_id: c.id, user_id: me!.userId, plan_id: oneTimePlan, status: 'active' })
    if (c.price_cents > 0) await supabase.from('orders').insert({ institution_id: inst, user_id: me!.userId, course_id: c.id, plan_id: oneTimePlan, amount_cents: c.price_cents, status: 'paid', provider: 'demo' })
    // Best-effort: deliver the live-session Zoom link by email (in-app notification is auto-created by DB trigger).
    try {
      const { data: sess } = await supabase.auth.getSession()
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enroll-fulfillment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
        body: JSON.stringify({ course_id: c.id }),
      }).catch(() => {})
    } catch { /* ignore */ }
    reload(); nav(`/student/course/${c.id}`)
  }

  async function enroll(c: Course) {
    setEnrolling(c.id)
    if (c.price_cents > 0) {
      // Try a real Stripe checkout; fall back to instant enroll if Stripe isn't configured.
      try {
        const { data: sess } = await supabase.auth.getSession()
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sess.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
          body: JSON.stringify({ course_id: c.id, success_url: `${window.location.origin}/student`, cancel_url: `${window.location.origin}/student/catalog` }),
        })
        if (res.ok) {
          const j = await res.json()
          if (j.url) { window.location.href = j.url; return }
        }
        // 501 not_configured or any error → demo fallback
        await instantEnroll(c)
      } catch { await instantEnroll(c) }
    } else {
      await instantEnroll(c)
    }
    setEnrolling(null)
  }

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('catalog')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('browseEnroll')}</div>
      {courses.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('allEnrolled')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {courses.map((c) => (
          <div key={c.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CourseCover accent={c.accent} icon={c.icon} height={110}>
              {c.category && <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.18)', padding: '3px 9px', borderRadius: 20 }}>{c.category}</span>}
            </CourseCover>
            <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginBottom: 6 }}>{c.instructor?.full_name ?? '—'}</div>
              {c.subtitle && <div style={{ fontSize: 12.5, color: '#5B6B82', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{c.subtitle}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--navy-800)' }}>{c.price_cents === 0 ? (lang === 'fr' ? 'Gratuit' : lang === 'es' ? 'Gratis' : 'Free') : moneyFull(c.price_cents)}</span>
                <button onClick={() => enroll(c)} disabled={enrolling === c.id} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="plus" size={15} />{t('enroll')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
