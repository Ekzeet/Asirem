import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../components/Icon'
import { Card, Loader, PageWrap } from '../components/ui'

export default function Exams() {
  const { me } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const isStudent = me!.role === 'student'

  const { data, loading } = useAsync(async () => {
    if (isStudent) {
      const { data } = await supabase.from('enrollments').select('course:courses(id,title,category,accent,icon)').eq('user_id', me!.userId)
      return (data ?? []).map((e: any) => e.course).filter(Boolean)
    }
    const { data } = await supabase.from('courses').select('id,title,category,accent,icon,instructor_id').eq('institution_id', me!.institutionId).order('created_at', { ascending: false })
    let list = (data ?? []) as any[]
    if (me!.role === 'teacher') list = list.filter((c) => c.instructor_id === me!.userId)
    return list
  }, [me!.userId])

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('exams')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{isStudent ? t('examsStudentSub') : t('examsStaffSub')}</div>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noCourses')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {data.map((c: any) => (
          <Card key={c.id} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} >
            <div onClick={() => nav(isStudent ? `/student/course/${c.id}` : `/admin/courses/${c.id}/edit`)}>
              <div style={{ height: 76, background: c.accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name="file-check" size={26} /></div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)' }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginTop: 3 }}>{isStudent ? t('takeExam') : t('manageExams')} →</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageWrap>
  )
}
