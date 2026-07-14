import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { money, moneyFull } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { CourseCover, Loader, PageWrap } from '../../components/ui'
import { CourseFormModal } from '../../components/CourseFormModal'

type Course = {
  id: string; title: string; subtitle: string | null; category: string | null
  price_cents: number; rating: number | null; accent: string | null; icon: string | null
  status: string; instructor: { full_name: string | null } | null
}

export default function AdminCourses() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [showNew, setShowNew] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: courses }, { data: enr }] = await Promise.all([
      supabase
        .from('courses')
        .select('id,title,subtitle,category,price_cents,rating,accent,icon,status,instructor:profiles!courses_instructor_id_fkey(full_name)')
        .eq('institution_id', inst)
        .order('created_at', { ascending: false }),
      supabase.from('enrollments').select('course_id').eq('institution_id', inst),
    ])
    const counts: Record<string, number> = {}
    for (const e of enr ?? []) counts[e.course_id] = (counts[e.course_id] ?? 0) + 1
    return { courses: (courses ?? []) as unknown as Course[], counts }
  }, [inst])

  const filtered = useMemo(() => {
    const list = data?.courses ?? []
    if (filter === 'all') return list
    return list.filter((c) => c.status === filter)
  }, [data, filter])

  if (loading || !data) return <Loader />
  const { courses, counts } = data
  const chips: { id: 'all' | 'published' | 'draft'; label: string; count: number }[] = [
    { id: 'all', label: t('all'), count: courses.length },
    { id: 'published', label: t('published'), count: courses.filter((c) => c.status === 'published').length },
    { id: 'draft', label: t('drafts'), count: courses.filter((c) => c.status === 'draft').length },
  ]

  return (
    <PageWrap>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {chips.map((f) => {
          const active = filter === f.id
          return (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: `1px solid ${active ? '#0F2C4C' : '#E2E8F0'}`, background: active ? '#0F2C4C' : '#fff', color: active ? '#fff' : '#5B6B82', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {f.label} <span style={{ opacity: .6 }}>{f.count}</span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowNew(true)} style={{ height: 40, padding: '0 16px', borderRadius: 11, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(217,164,65,.3)' }}>
          <Icon name="plus" size={16} />{t('newCourse')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {filtered.map((c) => {
          const st = c.status === 'published'
          return (
            <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
              <div onClick={() => nav(`/admin/courses/${c.id}/edit`)} style={{ cursor: 'pointer' }}>
              <CourseCover accent={c.accent} icon={c.icon}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: st ? 'rgba(31,138,91,.9)' : 'rgba(0,0,0,.32)', padding: '3px 10px', borderRadius: 20 }}>
                  {st ? t('published') : t('drafts').replace(/s$/, '')}
                </span>
                {c.category && <span style={{ position: 'absolute', top: 14, left: 14, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.18)', padding: '3px 9px', borderRadius: 20 }}>{c.category}</span>}
                <button onClick={(e) => { e.stopPropagation(); nav(`/admin/courses/${c.id}/edit`) }} title={t('editCourse')} style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.9)', color: '#0F2C4C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="pencil" size={15} /></button>
              </CourseCover>
              </div>
              <div style={{ padding: '15px 16px 16px' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3, marginBottom: 5 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginBottom: 13 }}>{c.instructor?.full_name ?? '—'}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: '#5B6B82', fontWeight: 600, marginBottom: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="users" size={14} color="#9AA7B8" />{counts[c.id] ?? 0}</span>
                  {c.rating != null && <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C99A2E' }}>★ {c.rating}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--navy-800)' }}>{c.price_cents === 0 ? (lang === 'fr' ? 'Gratuit' : lang === 'es' ? 'Gratis' : 'Free') : moneyFull(c.price_cents)}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1F8A5B' }}>{money((counts[c.id] ?? 0) * c.price_cents)} {t('earned')}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {showNew && <CourseFormModal onClose={() => setShowNew(false)} onSaved={(id) => { setShowNew(false); reload(); nav(`/admin/courses/${id}/edit`) }} />}
    </PageWrap>
  )
}
