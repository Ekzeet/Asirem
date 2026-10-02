import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { moneyFull } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { CourseCover, Loader, PageWrap } from '../../components/ui'

type Course = {
  id: string; slug: string; title: string; subtitle: string | null; category: string | null; price_cents: number
  rating: number | null; accent: string | null; icon: string | null
  instructor: { full_name: string | null } | null
}

export default function Catalog() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId

  const { data, loading } = useAsync(async () => {
    const [{ data: courses }, { data: enr }, { data: plans }] = await Promise.all([
      supabase.from('courses').select('id,slug,title,subtitle,category,price_cents,rating,accent,icon,cover_url,instructor:profiles!courses_instructor_id_fkey(full_name)').eq('institution_id', inst).eq('status', 'published').order('created_at', { ascending: false }),
      supabase.from('enrollments').select('course_id').eq('user_id', me!.userId),
      supabase.from('plans').select('id, code').eq('institution_id', inst),
    ])
    const enrolled = new Set((enr ?? []).map((e) => e.course_id))
    const oneTime = (plans ?? []).find((p) => p.code === 'one_time')?.id ?? null
    return { courses: ((courses ?? []) as unknown as Course[]).filter((c) => !enrolled.has(c.id)), oneTimePlan: oneTime }
  }, [inst])

  if (loading || !data) return <Loader />
  const { courses } = data

  // Send the student to the course detail page so they can review it before buying.
  function view(c: Course) { nav(`/courses/${c.slug}`) }

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('catalog')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('browseEnroll')}</div>
      {courses.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('allEnrolled')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {courses.map((c) => (
          <div key={c.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CourseCover accent={c.accent} icon={c.icon} cover={(c as any).cover_url} height={110}>
              {c.category && <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.18)', padding: '3px 9px', borderRadius: 20 }}>{c.category}</span>}
            </CourseCover>
            <div style={{ padding: '15px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginBottom: 6 }}>{c.instructor?.full_name ?? '—'}</div>
              {c.subtitle && <div style={{ fontSize: 12.5, color: '#5B6B82', lineHeight: 1.5, marginBottom: 12, flex: 1 }}>{c.subtitle}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--navy-800)' }}>{c.price_cents === 0 ? (lang === 'es' ? 'Gratis' : 'Free') : moneyFull(c.price_cents)}</span>
                <button onClick={() => view(c)} style={{ height: 38, padding: '0 16px', borderRadius: 10, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t('viewCourse')} <Icon name="arrow-right" size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
