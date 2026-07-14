import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { CourseCover, Loader, PageWrap } from '../components/ui'

type Course = {
  id: string; title: string; subtitle: string | null; category: string | null; status: string
  accent: string | null; icon: string | null; instructor: { full_name: string | null } | null
}

export default function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim()
  const { me } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const isStaff = me!.role !== 'student'

  const { data, loading } = useAsync(async () => {
    if (!q) return [] as Course[]
    const like = `%${q.replace(/[%,]/g, '')}%`
    const { data } = await supabase
      .from('courses')
      .select('id,title,subtitle,category,status,accent,icon,instructor:profiles!courses_instructor_id_fkey(full_name)')
      .eq('institution_id', me!.institutionId)
      .or(`title.ilike.${like},subtitle.ilike.${like},category.ilike.${like},description.ilike.${like}`)
      .limit(24)
    return (data ?? []) as unknown as Course[]
  }, [q])

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('searchResults')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>« {q} » · {data.length}</div>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noResults')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {data.map((c) => (
          <div key={c.id} onClick={() => nav(isStaff ? `/admin/courses/${c.id}/edit` : `/student/course/${c.id}`)} className="card" style={{ overflow: 'hidden', cursor: 'pointer' }}>
            <CourseCover accent={c.accent} icon={c.icon} height={92}>
              {c.category && <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.9)', background: 'rgba(0,0,0,.18)', padding: '3px 9px', borderRadius: 20 }}>{c.category}</span>}
            </CourseCover>
            <div style={{ padding: '13px 15px 15px' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)', lineHeight: 1.3 }}>{c.title}</div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginTop: 4 }}>{c.instructor?.full_name ?? '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
