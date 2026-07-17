import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../components/Icon'
import { Card, Loader, PageWrap } from '../components/ui'
import { BtnPrimary } from '../components/Modal'

export default function Exams() {
  const { me } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const isStudent = me!.role === 'student'
  const [creating, setCreating] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    // courses in scope
    let courses: any[]
    if (isStudent) {
      const { data } = await supabase.from('enrollments').select('course:courses(id,title,accent,icon)').eq('user_id', me!.userId)
      courses = (data ?? []).map((e: any) => e.course).filter(Boolean)
    } else {
      const { data } = await supabase.from('courses').select('id,title,accent,icon,instructor_id').eq('institution_id', me!.institutionId)
      courses = ((data ?? []) as any[]).filter((c) => me!.role !== 'teacher' || c.instructor_id === me!.userId)
    }
    const ids = courses.map((c) => c.id)
    const { data: exams } = ids.length ? await supabase.from('exams').select('id,course_id,title,pass_score,status').in('course_id', ids) : { data: [] }
    const { data: attempts } = await supabase.from('exam_attempts').select('exam_id,passed,score').eq('user_id', me!.userId)
    const best: Record<string, { passed: boolean; score: number }> = {}
    for (const a of attempts ?? []) if (!best[a.exam_id] || a.score > best[a.exam_id].score) best[a.exam_id] = { passed: a.passed, score: a.score }
    return { courses, exams: (exams ?? []) as any[], best }
  }, [me!.userId])

  if (loading || !data) return <Loader />

  async function createExam(courseId: string) {
    setCreating(courseId)
    const { data: ex } = await supabase.from('exams').insert({ institution_id: me!.institutionId, course_id: courseId, title: t('newExam'), created_by: me!.userId, status: 'draft' }).select('id').single()
    setCreating(null)
    if (ex) nav(`/exams/${ex.id}/build`)
  }

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('exams')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{isStudent ? t('examsStudentSub') : t('examsStaffSub')}</div>
      {data.courses.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noCourses')}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.courses.map((c: any) => {
          const exams = data.exams.filter((e) => e.course_id === c.id && (!isStudent || e.status === 'published'))
          return (
            <Card key={c.id} style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: exams.length ? 12 : 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', background: c.accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="file-check" size={18} /></div>
                <div style={{ flex: 1, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{c.title}</div>
                {!isStudent && <BtnPrimary onClick={() => createExam(c.id)} disabled={creating === c.id}><Icon name="plus" size={15} />{t('newExam')}</BtnPrimary>}
              </div>
              {exams.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t('noExams')}</div>}
              {exams.map((e) => {
                const b = data.best[e.id]
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-soft)' }}>
                    <Icon name="clipboard-check" size={16} color="#7C5CD6" />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--navy-800)' }}>{e.title} {e.status === 'draft' && <span style={{ fontSize: 10, fontWeight: 800, color: '#7C8AA0', background: '#EEF2F7', padding: '2px 7px', borderRadius: 6 }}>{t('drafts').replace(/s$/, '')}</span>}</span>
                    {b && <span style={{ fontSize: 11.5, fontWeight: 800, color: b.passed ? '#1F8A5B' : '#D14343', background: b.passed ? '#EAF6EF' : '#FBEBEB', padding: '3px 9px', borderRadius: 20 }}>{b.passed ? `${t('passed')} ${b.score}%` : `${t('failed')} ${b.score}%`}</span>}
                    <span style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{t('passScore')} {e.pass_score}%</span>
                    <button onClick={() => nav(isStudent ? `/exams/${e.id}/take` : `/exams/${e.id}/build`)} style={{ height: 34, padding: '0 14px', borderRadius: 9, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{isStudent ? (b?.passed ? t('retryExam') : t('takeExam')) : t('editAssignment')}</button>
                  </div>
                )
              })}
            </Card>
          )
        })}
      </div>
    </PageWrap>
  )
}
