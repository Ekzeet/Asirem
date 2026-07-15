import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Card, Loader, StatusChip } from '../../components/ui'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss, textareaCss } from '../../components/Modal'
import { CourseFormModal } from '../../components/CourseFormModal'
import { FileUpload } from '../../components/FileUpload'

type Lesson = { id: string; title: string; content_type: string; duration: string | null; duration_seconds: number | null; file_url: string | null; external_url: string | null; is_preview: boolean; position: number; hasQuiz: boolean }
type Section = { id: string; title: string; position: number; lessons: Lesson[] }
type Assignment = { id: string; title: string; instructions: string | null; due_at: string | null; points: number }
type Course = { id: string; title: string; status: string; category: string | null; accent: string | null; icon: string | null; subtitle: string | null; level: string | null; price_cents: number; instructor_id: string | null; drip_enabled: boolean }

export default function CourseBuilder() {
  const { courseId } = useParams()
  const { me } = useAuth()
  const { t } = useI18n()
  const nav = useNavigate()
  const [tab, setTab] = useState<'curriculum' | 'assignments' | 'grades'>('curriculum')
  const [editDetails, setEditDetails] = useState(false)
  const [quizLesson, setQuizLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState<{ sectionId: string; lesson?: Lesson } | null>(null)
  const [newSection, setNewSection] = useState('')
  const [newAssign, setNewAssign] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: course }, { data: sections }, { data: quizzes }, { data: assignments }] = await Promise.all([
      supabase.from('courses').select('id,title,status,category,accent,icon,subtitle,level,price_cents,instructor_id,drip_enabled').eq('id', courseId!).single(),
      supabase.from('sections').select('id,title,position,lessons(id,title,content_type,duration,duration_seconds,file_url,external_url,is_preview,position)').eq('course_id', courseId!).order('position'),
      supabase.from('quizzes').select('lesson_id'),
      supabase.from('assignments').select('id,title,instructions,due_at,points').eq('course_id', courseId!).order('created_at'),
    ])
    const quizLessons = new Set((quizzes ?? []).map((q) => q.lesson_id))
    const secs: Section[] = (sections ?? []).map((s: any) => ({
      id: s.id, title: s.title, position: s.position,
      lessons: (s.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((l: any) => ({ ...l, hasQuiz: quizLessons.has(l.id) })),
    }))
    return { course: course as Course, sections: secs, assignments: (assignments ?? []) as Assignment[] }
  }, [courseId])

  if (loading || !data) return <Loader />
  const { course, sections, assignments } = data

  async function togglePublish() {
    const next = course.status === 'published' ? 'draft' : 'published'
    await supabase.from('courses').update({ status: next, published_at: next === 'published' ? new Date().toISOString() : null }).eq('id', course.id)
    reload()
  }
  async function addSection() {
    if (!newSection.trim()) return
    await supabase.from('sections').insert({ course_id: course.id, title: newSection.trim(), position: sections.length })
    setNewSection(''); reload()
  }
  async function delSection(id: string) { await supabase.from('sections').delete().eq('id', id); reload() }
  async function delLesson(id: string) { await supabase.from('lessons').delete().eq('id', id); reload() }
  async function delAssignment(id: string) { await supabase.from('assignments').delete().eq('id', id); reload() }

  return (
    <div className="lmsfade" style={{ padding: '22px 30px 46px', maxWidth: 980 }}>
      <button onClick={() => nav('/admin/courses')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, padding: 0 }}>
        <Icon name="arrow-left" size={15} /> {t('courses')}
      </button>

      <Card style={{ padding: '18px 22px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: 12, flex: 'none', background: course.accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={course.icon ?? 'book-open'} size={22} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20, color: 'var(--navy-800)' }}>{course.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}><StatusChip status={course.status} /><span style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{course.category}</span></div>
        </div>
        <button onClick={async () => { await supabase.from('courses').update({ drip_enabled: !course.drip_enabled }).eq('id', course.id); reload() }} title={t('dripHint')} style={{ height: 42, padding: '0 14px', borderRadius: 11, border: '1px solid var(--border)', background: course.drip_enabled ? '#EAF1FB' : '#fff', color: course.drip_enabled ? '#1B5FB0' : '#5B6B82', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name={course.drip_enabled ? 'lock' : 'unlock'} size={15} />{t('drip')}
        </button>
        <button onClick={async () => { if (confirm(t('confirmDeleteCourse'))) { await supabase.from('courses').delete().eq('id', course.id); nav('/admin/courses') } }} title={t('delete')} style={{ height: 42, width: 42, borderRadius: 11, border: '1px solid #F1D5D5', background: '#fff', color: '#D14343', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="trash-2" size={16} />
        </button>
        <BtnGhost onClick={() => setEditDetails(true)}>{t('editDetails')}</BtnGhost>
        <BtnPrimary onClick={togglePublish}><Icon name={course.status === 'published' ? 'eye-off' : 'send'} size={15} />{course.status === 'published' ? t('unpublish') : t('publish')}</BtnPrimary>
      </Card>

      <CoInstructors courseId={course.id} institutionId={me!.institutionId} instructorId={course.instructor_id} />

      <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {([['curriculum', t('curriculum')], ['assignments', t('assignments')], ['grades', t('gradebook')]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ height: 40, padding: '0 4px', marginRight: 20, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: tab === id ? 'var(--navy-800)' : '#93A1B4', borderBottom: `2.5px solid ${tab === id ? '#D9A441' : 'transparent'}` }}>{label}</button>
        ))}
      </div>

      {tab === 'curriculum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sections.map((s) => (
            <Card key={s.id} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', background: '#FAFBFD', borderBottom: '1px solid #EEF2F7' }}>
                <Icon name="folder" size={16} color="#D9A441" />
                <span style={{ flex: 1, fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)' }}>{s.title}</span>
                <button onClick={() => setLessonForm({ sectionId: s.id })} style={linkBtn}><Icon name="plus" size={14} /> {t('addLesson')}</button>
                <button onClick={() => delSection(s.id)} style={{ ...linkBtn, color: '#D14343' }}><Icon name="trash-2" size={14} /></button>
              </div>
              {s.lessons.length === 0 && <div style={{ padding: '12px 18px', fontSize: 12.5, color: 'var(--muted)' }}>{t('noLessons')}</div>}
              {s.lessons.map((l) => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', borderTop: '1px solid var(--border-soft)' }}>
                  <Icon name={l.content_type === 'video' ? 'play-circle' : l.content_type === 'pdf' ? 'file-text' : 'file'} size={16} color="#9AA7B8" />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)' }}>{l.title}</span>
                  {l.is_preview && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1F8A5B', background: '#EAF6EF', padding: '2px 8px', borderRadius: 20 }}>{t('preview')}</span>}
                  {l.hasQuiz && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7C5CD6', background: '#F3EDFB', padding: '2px 8px', borderRadius: 20 }}>Quiz</span>}
                  <span style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{l.duration}</span>
                  <button onClick={() => setQuizLesson(l)} style={linkBtn}><Icon name="clipboard-check" size={14} /> Quiz</button>
                  <button onClick={() => setLessonForm({ sectionId: s.id, lesson: l })} style={linkBtn}><Icon name="pencil" size={14} /></button>
                  <button onClick={() => delLesson(l.id)} style={{ ...linkBtn, color: '#D14343' }}><Icon name="trash-2" size={14} /></button>
                </div>
              ))}
            </Card>
          ))}
          <Card style={{ padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="plus" size={16} color="#9AA7B8" />
            <input value={newSection} onChange={(e) => setNewSection(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSection() }} placeholder={t('newSection')} style={{ ...inputCss, height: 40 }} />
            <BtnPrimary onClick={addSection} disabled={!newSection.trim()}>{t('add')}</BtnPrimary>
          </Card>
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><BtnPrimary onClick={() => setNewAssign(true)}><Icon name="plus" size={15} />{t('newAssignment')}</BtnPrimary></div>
          {assignments.length === 0 && <Card style={{ padding: 20, color: 'var(--muted)', fontSize: 13.5 }}>{t('noAssignments')}</Card>}
          {assignments.map((a) => (
            <Card key={a.id} style={{ padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', background: '#F3EDFB', color: '#7C5CD6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="clipboard-list" size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy-800)' }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{a.points} {t('points')}{a.due_at ? ` · ${t('due')} ${new Date(a.due_at).toLocaleDateString()}` : ''}</div>
              </div>
              <button onClick={() => delAssignment(a.id)} style={{ ...linkBtn, color: '#D14343' }}><Icon name="trash-2" size={15} /></button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'grades' && <><Gradebook courseId={course.id} /><div style={{ height: 16 }} /><Dropoff courseId={course.id} /></>}

      {editDetails && <CourseFormModal existing={course} onClose={() => setEditDetails(false)} onSaved={() => { setEditDetails(false); reload() }} />}
      {lessonForm && <LessonModal courseId={course.id} sectionId={lessonForm.sectionId} lesson={lessonForm.lesson} count={sections.find((s) => s.id === lessonForm.sectionId)?.lessons.length ?? 0} onClose={() => setLessonForm(null)} onSaved={() => { setLessonForm(null); reload() }} />}
      {quizLesson && <QuizModal lesson={quizLesson} onClose={() => setQuizLesson(null)} onSaved={() => { setQuizLesson(null); reload() }} />}
      {newAssign && <AssignmentModal courseId={course.id} institutionId={me!.institutionId} onClose={() => setNewAssign(false)} onSaved={() => { setNewAssign(false); reload() }} />}
    </div>
  )
}

const linkBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }

function Dropoff({ courseId }: { courseId: string }) {
  const { t } = useI18n()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('course_dropoff', { p_course_id: courseId })
    return (data ?? []) as { lesson_id: string; title: string; ord: number; completed: number; enrolled: number }[]
  }, [courseId])
  if (loading || !data) return null
  const enrolled = data[0]?.enrolled ?? 0
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{t('dropoff')}</div>
      <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 16 }}>{t('dropoffSub')} · {enrolled} {t('students').toLowerCase()}</div>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{t('noLessons')}</div>}
      {data.map((r) => {
        const pct = enrolled > 0 ? Math.round((r.completed / enrolled) * 100) : 0
        return (
          <div key={r.lesson_id} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 46px', gap: 10, alignItems: 'center', marginBottom: 11 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#B0BCCB', textAlign: 'right' }}>{r.ord}</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>{r.title}</div>
              <div style={{ height: 8, background: '#EEF2F7', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: pct >= 66 ? '#1F8A5B' : pct >= 33 ? '#D9A441' : '#D14343' }} /></div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#5B6B82', textAlign: 'right' }}>{pct}%</span>
          </div>
        )
      })}
    </Card>
  )
}

function Gradebook({ courseId }: { courseId: string }) {
  const { t } = useI18n()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('course_gradebook', { p_course_id: courseId })
    return (data ?? []) as { user_id: string; full_name: string; progress_pct: number; quiz_avg: number | null; assignment_avg: number | null }[]
  }, [courseId])
  if (loading || !data) return <Loader />
  const cols = '2fr 1fr 1fr 1fr'
  return (
    <Card style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '13px 20px', background: '#FAFBFD', borderBottom: '1px solid #EEF2F7', fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .5 }}>
        <span>{t('student')}</span><span>{t('progress')}</span><span>Quiz</span><span>{t('assignments')}</span>
      </div>
      {data.length === 0 && <div style={{ padding: 18, color: 'var(--muted)', fontSize: 13 }}>{t('noData')}</div>}
      {data.map((r) => (
        <div key={r.user_id} style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '12px 20px', borderTop: '1px solid #F3F6FA' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy-800)' }}>{r.full_name}</span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: r.progress_pct >= 100 ? '#1F8A5B' : '#3C4A5E' }}>{Math.round(r.progress_pct)}%</span>
          <span style={{ fontSize: 12.5, color: r.quiz_avg == null ? '#B0BCCB' : '#3C4A5E', fontWeight: 700 }}>{r.quiz_avg == null ? '—' : r.quiz_avg}</span>
          <span style={{ fontSize: 12.5, color: r.assignment_avg == null ? '#B0BCCB' : '#3C4A5E', fontWeight: 700 }}>{r.assignment_avg == null ? '—' : `${r.assignment_avg}/100`}</span>
        </div>
      ))}
    </Card>
  )
}

function CoInstructors({ courseId, institutionId, instructorId }: { courseId: string; institutionId: string; instructorId: string | null }) {
  const { t } = useI18n()
  const { data, loading, reload } = useAsync(async () => {
    const [{ data: teachers }, { data: co }] = await Promise.all([
      supabase.from('memberships').select('user_id, profiles:profiles!memberships_user_profile_fkey(full_name)').eq('institution_id', institutionId).eq('role', 'teacher'),
      supabase.from('course_instructors').select('id, user_id, profiles:profiles!course_instructors_user_id_fkey(full_name)').eq('course_id', courseId),
    ])
    return {
      teachers: (teachers ?? []).map((m: any) => ({ id: m.user_id, name: m.profiles?.full_name ?? '—' })),
      co: (co ?? []).map((c: any) => ({ id: c.id, userId: c.user_id, name: c.profiles?.full_name ?? '—' })),
    }
  }, [courseId])

  if (loading || !data) return null
  const coIds = new Set(data.co.map((c) => c.userId))
  const available = data.teachers.filter((tt) => !coIds.has(tt.id) && tt.id !== instructorId)

  async function add(userId: string) { if (userId) { await supabase.from('course_instructors').insert({ course_id: courseId, user_id: userId }); reload() } }
  async function remove(id: string) { await supabase.from('course_instructors').delete().eq('id', id); reload() }

  return (
    <Card style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .4 }}>{t('coInstructors')}</span>
      {data.co.map((c) => (
        <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#1B5FB0', background: '#EAF1FB', padding: '5px 10px', borderRadius: 20 }}>
          {c.name}
          <button onClick={() => remove(c.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1B5FB0', display: 'flex', padding: 0 }}><Icon name="x" size={13} /></button>
        </span>
      ))}
      {data.co.length === 0 && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>—</span>}
      <div style={{ flex: 1 }} />
      {available.length > 0 && (
        <select onChange={(e) => { add(e.target.value); e.target.value = '' }} defaultValue="" style={{ ...inputCss, height: 36, width: 220 }}>
          <option value="" disabled>+ {t('addCoInstructor')}</option>
          {available.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
        </select>
      )}
    </Card>
  )
}

function LessonModal({ courseId, sectionId, lesson, count, onClose, onSaved }: { courseId: string; sectionId: string; lesson?: Lesson; count: number; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [title, setTitle] = useState(lesson?.title ?? '')
  const [ctype, setCtype] = useState(lesson?.content_type ?? 'video')
  const [duration, setDuration] = useState(lesson?.duration ?? '')
  const [preview, setPreview] = useState(lesson?.is_preview ?? false)
  const [source, setSource] = useState<'upload' | 'external' | 'none'>(lesson?.external_url ? 'external' : lesson?.file_url ? 'upload' : 'none')
  const [filePath, setFilePath] = useState<string | null>(lesson?.file_url ?? null)
  const [externalUrl, setExternalUrl] = useState(lesson?.external_url ?? '')
  const [durationSeconds, setDurationSeconds] = useState<number | null>(lesson?.duration_seconds ?? null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!title.trim()) return
    setBusy(true)
    const media = {
      file_url: source === 'upload' ? filePath : null,
      external_url: source === 'external' ? (externalUrl.trim() || null) : null,
      duration_seconds: durationSeconds,
    }
    const payload = { title: title.trim(), content_type: ctype, duration, is_preview: preview, ...media }
    if (lesson) await supabase.from('lessons').update(payload).eq('id', lesson.id)
    else await supabase.from('lessons').insert({ section_id: sectionId, position: count, ...payload })
    setBusy(false); onSaved()
  }

  const isMedia = ctype === 'video' || ctype === 'audio' || ctype === 'pdf' || ctype === 'image'

  return (
    <Modal title={lesson ? t('editLesson') : t('addLesson')} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}>{t('save')}</BtnPrimary></>}>
      <Field label={t('lessonTitle')}><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputCss} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('type')}>
          <select value={ctype} onChange={(e) => setCtype(e.target.value)} style={inputCss}>
            {['video', 'richtext', 'pdf', 'image', 'audio'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t('duration')}><input value={duration ?? ''} onChange={(e) => setDuration(e.target.value)} placeholder="12:40" style={inputCss} /></Field>
      </div>

      {isMedia && (
        <>
          <Field label={t('mediaSource')}>
            <select value={source} onChange={(e) => setSource(e.target.value as any)} style={inputCss}>
              <option value="none">{t('noMedia')}</option>
              <option value="upload">{t('uploadFile')}</option>
              <option value="external">{t('externalLink')}</option>
            </select>
          </Field>
          {source === 'upload' && (
            <div style={{ marginBottom: 14 }}>
              <FileUpload bucket="course-media" pathPrefix={courseId} currentPath={filePath}
                accept={ctype === 'video' ? 'video/*' : ctype === 'audio' ? 'audio/*' : ctype === 'pdf' ? 'application/pdf' : 'image/*'}
                onUploaded={(path) => setFilePath(path)} />
            </div>
          )}
          {source === 'external' && (
            <Field label={t('externalLink')}><input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={inputCss} /></Field>
          )}
          {ctype === 'video' && (
            <Field label={t('durationSeconds')}><input type="number" min={0} value={durationSeconds ?? ''} onChange={(e) => setDurationSeconds(e.target.value ? Number(e.target.value) : null)} placeholder="1907" style={inputCss} /></Field>
          )}
        </>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer' }}>
        <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> {t('freePreview')}
      </label>
    </Modal>
  )
}

function AssignmentModal({ courseId, institutionId, onClose, onSaved }: { courseId: string; institutionId: string; onClose: () => void; onSaved: () => void }) {
  const { me } = useAuth()
  const { t } = useI18n()
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [due, setDue] = useState('')
  const [points, setPoints] = useState(100)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!title.trim()) return
    setBusy(true)
    await supabase.from('assignments').insert({ institution_id: institutionId, course_id: courseId, title: title.trim(), instructions, due_at: due ? new Date(due).toISOString() : null, points, created_by: me!.userId })
    setBusy(false); onSaved()
  }

  return (
    <Modal title={t('newAssignment')} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}>{t('create')}</BtnPrimary></>}>
      <Field label={t('assignmentTitle')}><input value={title} onChange={(e) => setTitle(e.target.value)} style={inputCss} /></Field>
      <Field label={t('instructions')}><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} style={textareaCss} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('dueDate')}><input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={inputCss} /></Field>
        <Field label={t('points')}><input type="number" min={0} value={points} onChange={(e) => setPoints(Number(e.target.value))} style={inputCss} /></Field>
      </div>
    </Modal>
  )
}

function QuizModal({ lesson, onClose, onSaved }: { lesson: Lesson; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [prompt, setPrompt] = useState('')
  const [options, setOptions] = useState<string[]>(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [busy, setBusy] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const { data: quiz } = await supabase.from('quizzes').select('id,title,questions:quiz_questions(id,prompt,points,options:quiz_options(id,label,is_correct))').eq('lesson_id', lesson.id).maybeSingle()
    return quiz as any
  }, [lesson.id])

  async function addQuestion() {
    if (!prompt.trim() || options.filter((o) => o.trim()).length < 2) return
    setBusy(true)
    let quizId = data?.id
    if (!quizId) {
      const { data: q } = await supabase.from('quizzes').insert({ lesson_id: lesson.id, title: 'Quiz' }).select('id').single()
      quizId = q!.id
    }
    const pos = (data?.questions?.length ?? 0)
    const { data: qq } = await supabase.from('quiz_questions').insert({ quiz_id: quizId, prompt: prompt.trim(), position: pos, points: 20 }).select('id').single()
    await supabase.from('quiz_options').insert(options.filter((o) => o.trim()).map((label, i) => ({ question_id: qq!.id, label: label.trim(), is_correct: i === correct, position: i })))
    setPrompt(''); setOptions(['', '', '', '']); setCorrect(0); setBusy(false)
    reload()
  }

  return (
    <Modal title={t('quizEditor')} subtitle={lesson.title} onClose={onClose} width={560}
      footer={<BtnGhost onClick={() => { onSaved() }}>{t('done')}</BtnGhost>}>
      {!loading && (data?.questions ?? []).map((q: any, i: number) => (
        <div key={q.id} style={{ padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 11, marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 6 }}>{i + 1}. {q.prompt}</div>
          {(q.options ?? []).map((o: any) => (
            <div key={o.id} style={{ fontSize: 12.5, color: o.is_correct ? '#1F8A5B' : '#5B6B82', fontWeight: o.is_correct ? 700 : 500, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name={o.is_correct ? 'check-circle' : 'circle'} size={13} /> {o.label}
            </div>
          ))}
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 14 }}>
        <Field label={t('question')}><input value={prompt} onChange={(e) => setPrompt(e.target.value)} style={inputCss} /></Field>
        {options.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <button onClick={() => setCorrect(i)} title="Mark correct" style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, border: 'none', cursor: 'pointer', background: correct === i ? '#EAF6EF' : '#F1F4F8', color: correct === i ? '#1F8A5B' : '#B0BCCB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={correct === i ? 'check-circle' : 'circle'} size={16} /></button>
            <input value={o} onChange={(e) => setOptions((os) => os.map((x, j) => j === i ? e.target.value : x))} placeholder={`${t('option')} ${String.fromCharCode(65 + i)}`} style={{ ...inputCss, height: 38 }} />
          </div>
        ))}
        <BtnPrimary onClick={addQuestion} disabled={busy}><Icon name="plus" size={15} />{t('addQuestion')}</BtnPrimary>
      </div>
    </Modal>
  )
}
