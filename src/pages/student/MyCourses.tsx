import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Loader, ProgressBar } from '../../components/ui'

type MyCourse = {
  id: string; title: string; category: string | null; accent: string | null
  instructor: string; done: number; total: number; pct: number
}

export default function MyCourses() {
  const { me } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()

  const { data, loading } = useAsync(async () => {
    const [{ data: enr }, { data: prog }, { data: certs }, { data: pts }, { data: ubadges }] = await Promise.all([
      supabase.from('enrollments').select('course_id, course:courses(id,title,category,accent,icon,instructor:profiles!courses_instructor_id_fkey(full_name))').eq('user_id', me!.userId),
      supabase.from('course_progress').select('course_id, done, total, pct').eq('user_id', me!.userId),
      supabase.from('certificates').select('id').eq('user_id', me!.userId),
      supabase.from('points_ledger').select('points').eq('user_id', me!.userId),
      supabase.from('user_badges').select('badge:badges(name,icon,color)').eq('user_id', me!.userId),
    ])
    const progByCourse: Record<string, { done: number; total: number; pct: number }> = {}
    for (const p of prog ?? []) progByCourse[p.course_id!] = { done: p.done ?? 0, total: p.total ?? 0, pct: p.pct ?? 0 }
    const courses: MyCourse[] = (enr ?? []).filter((e: any) => e.course).map((e: any) => {
      const pg = progByCourse[e.course_id] ?? { done: 0, total: 0, pct: 0 }
      return { id: e.course.id, title: e.course.title, category: e.course.category, accent: e.course.accent, instructor: e.course.instructor?.full_name ?? '—', done: pg.done, total: pg.total, pct: pg.pct }
    })
    const points = (pts ?? []).reduce((s, p) => s + (p.points ?? 0), 0)
    const inProgress = courses.filter((c) => c.pct > 0 && c.pct < 100).length
    const badges = (ubadges ?? []).map((b: any) => b.badge).filter(Boolean) as { name: string; icon: string | null; color: string | null }[]
    return { courses, certificates: (certs ?? []).length, points, inProgress, badges }
  }, [me!.userId])

  if (loading || !data) return <Loader />
  const { courses, certificates, points, inProgress, badges } = data
  const firstName = me!.fullName.split(' ')[0]

  const heroStats = [
    { v: String(inProgress), l: t('inProgress') },
    { v: String(courses.length), l: t('enrolledCourses').toLowerCase() },
    { v: String(certificates), l: t('certificates').toLowerCase() },
    { v: points.toLocaleString(), l: t('points'), gold: true },
  ]

  return (
    <div className="lmsfade" style={{ padding: '24px 30px 46px', maxWidth: 1280 }}>
      <div style={{ background: 'linear-gradient(120deg,#0F2C4C 0%,#12406E 60%,#1B5FB0 100%)', borderRadius: 20, padding: '28px 30px', color: '#fff', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(217,164,65,.18)' }} />
        <div style={{ position: 'relative', maxWidth: 560 }}>
          <div style={{ fontSize: 13, color: '#9DB4D0', fontWeight: 700, marginBottom: 6 }}>{t('welcomeBack')}, {firstName} 👋</div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, lineHeight: 1.25, marginBottom: 16 }}>{t('continueLearning')}</div>
          <div style={{ display: 'flex', gap: 26 }}>
            {heroStats.map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: s.gold ? '#F2C766' : '#fff' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#9DB4D0', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .5 }}>{t('badges')}</span>
          {badges.map((b, i) => (
            <span key={i} title={b.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--navy-800)', background: '#fff', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: (b.color ?? '#D9A441') + '22', color: b.color ?? '#D9A441', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={b.icon ?? 'award'} size={13} /></span>
              {b.name}
            </span>
          ))}
        </div>
      )}
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 14 }}>{t('myCourses')}</div>
      {courses.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noCourses')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {courses.map((c) => (
          <div key={c.id} onClick={() => nav(`/student/course/${c.id}`)} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ height: 120, background: c.accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2C4C', boxShadow: '0 6px 18px rgba(0,0,0,.2)' }}><Icon name="play" size={22} fill="#0F2C4C" /></div>
              {c.category && <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.22)', padding: '3px 9px', borderRadius: 20 }}>{c.category}</span>}
            </div>
            <div style={{ padding: '15px 16px 16px' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginBottom: 13 }}>{c.instructor}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#5B6B82', marginBottom: 6 }}>
                <span>{c.done}/{c.total} {t('lessons')}</span><span style={{ color: '#1F8A5B' }}>{c.pct}%</span>
              </div>
              <ProgressBar pct={c.pct} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
