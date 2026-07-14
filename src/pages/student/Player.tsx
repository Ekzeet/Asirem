import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Loader } from '../../components/ui'

type Lesson = { id: string; title: string; duration: string | null; body: string | null; done: boolean }
type Section = { id: string; title: string; lessons: Lesson[] }
type Resource = { id: string; name: string; size_label: string | null; icon: string | null; kind: string | null }
type QuizOption = { id: string; label: string; is_correct: boolean }
type QuizQuestion = { id: string; prompt: string; points: number; options: QuizOption[] }
type Quiz = { id: string; title: string; questions: QuizQuestion[] }

type TabId = 'overview' | 'resources' | 'quiz' | 'notes' | 'assignments'

export default function Player() {
  const { courseId } = useParams()
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [playing, setPlaying] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: course }, { data: sections }, { data: prog }] = await Promise.all([
      supabase.from('courses').select('id,title').eq('id', courseId!).single(),
      supabase.from('sections').select('id,title,position,lessons(id,title,duration,body,position)').eq('course_id', courseId!).order('position'),
      supabase.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', me!.userId),
    ])
    const doneSet = new Set((prog ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id))
    const secs: Section[] = (sections ?? []).map((s: any) => ({
      id: s.id, title: s.title,
      lessons: (s.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((l: any) => ({ id: l.id, title: l.title, duration: l.duration, body: l.body, done: doneSet.has(l.id) })),
    }))
    return { course: course as { id: string; title: string }, sections: secs }
  }, [courseId, me!.userId])

  const flat = useMemo(() => data?.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, sectionTitle: s.title }))) ?? [], [data])

  // Pick a default current lesson: first not-done, else first
  useEffect(() => {
    if (!currentId && flat.length) setCurrentId((flat.find((l) => !l.done) ?? flat[0]).id)
  }, [flat, currentId])

  const current = flat.find((l) => l.id === currentId) ?? null

  // Load quiz + note for the current lesson
  const detail = useAsync(async () => {
    if (!currentId) return { quiz: null as Quiz | null, note: '' }
    const [{ data: resources }, { data: quizRow }, { data: note }] = await Promise.all([
      supabase.from('lesson_resources').select('id,name,size_label,icon,kind,position').eq('lesson_id', currentId).order('position'),
      supabase.from('quizzes').select('id,title,questions:quiz_questions(id,prompt,points,position,options:quiz_options(id,label,is_correct,position))').eq('lesson_id', currentId).maybeSingle(),
      supabase.from('notes').select('body').eq('lesson_id', currentId).eq('user_id', me!.userId).maybeSingle(),
    ])
    let quiz: Quiz | null = null
    if (quizRow) {
      quiz = {
        id: (quizRow as any).id, title: (quizRow as any).title,
        questions: ((quizRow as any).questions ?? [])
          .sort((a: any, b: any) => a.position - b.position)
          .map((q: any) => ({ id: q.id, prompt: q.prompt, points: q.points, options: (q.options ?? []).sort((a: any, b: any) => a.position - b.position) })),
      }
    }
    return { resources: (resources ?? []) as Resource[], quiz, note: note?.body ?? '' }
  }, [currentId])

  if (loading || !data || !current) return <Loader />

  const doneCount = flat.filter((l) => l.done).length
  const pct = flat.length ? Math.round((doneCount / flat.length) * 100) : 0

  async function markDone() {
    if (!current) return
    await supabase.from('lesson_progress').upsert({ user_id: me!.userId, lesson_id: current.id, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
    reload()
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: t('overview') },
    { id: 'resources', label: t('resources') },
    { id: 'quiz', label: 'Quiz' },
    { id: 'assignments', label: t('assignments') },
    { id: 'notes', label: t('notes') },
  ]

  return (
    <div className="lmsfade" style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingBottom: 40 }}>
        {/* Video */}
        <div style={{ background: '#0B2038' }}>
          <div style={{ aspectRatio: '16/9', maxHeight: 460, background: 'linear-gradient(135deg,#0F2C4C,#0B2038)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 22px,transparent 22px 44px)' }} />
            <button onClick={() => setPlaying((p) => !p)} style={{ width: 76, height: 76, borderRadius: '50%', background: 'rgba(217,164,65,.95)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 34px rgba(217,164,65,.4)', zIndex: 2 }}>
              <Icon name={playing ? 'pause' : 'play'} size={30} color="#0F2C4C" fill="#0F2C4C" />
            </button>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 18px', background: 'linear-gradient(0deg,rgba(0,0,0,.55),transparent)' }}>
              <div style={{ height: 5, background: 'rgba(255,255,255,.22)', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}><div style={{ height: '100%', width: `${pct}%`, background: '#D9A441' }} /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 12.5, fontWeight: 600 }}>
                <Icon name={playing ? 'pause' : 'play'} size={16} /><span>{current.duration ?? '—'}</span><div style={{ flex: 1 }} />
                <Icon name="volume-2" size={16} /><Icon name="settings" size={16} /><Icon name="maximize" size={16} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '22px 30px', maxWidth: 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8494A8', fontWeight: 700, marginBottom: 8 }}>
            <span style={{ color: '#C99A2E' }}>● {t('live')}</span> · {(current as any).sectionTitle}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 23, color: 'var(--navy-800)', letterSpacing: '-.3px', marginBottom: 14 }}>{current.title}</div>

          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 18 }}>
            {tabs.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)} style={{ height: 40, padding: '0 4px', marginRight: 18, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, color: tab === tb.id ? 'var(--navy-800)' : '#93A1B4', borderBottom: `2.5px solid ${tab === tb.id ? '#D9A441' : 'transparent'}` }}>{tb.label}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <>
              <div style={{ fontSize: 14, color: '#3C4A5E', lineHeight: 1.7, marginBottom: 20 }}>{current.body}</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
                {[
                  { icon: 'clock', label: t('duration'), value: current.duration ?? '—' },
                  { icon: 'bar-chart-2', label: t('level'), value: lang === 'en' ? 'Intermediate' : lang === 'es' ? 'Intermedio' : 'Intermédiaire' },
                  { icon: 'globe', label: 'Audio', value: 'FR · EN · ES' },
                ].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 15px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12 }}>
                    <Icon name={m.icon} size={17} color="#D9A441" />
                    <div><div style={{ fontSize: 11, color: '#93A1B4', fontWeight: 700 }}>{m.label}</div><div style={{ fontSize: 13, color: 'var(--navy-800)', fontWeight: 700 }}>{m.value}</div></div>
                  </div>
                ))}
              </div>
              <button onClick={markDone} disabled={current.done} style={{ height: 44, padding: '0 22px', borderRadius: 11, background: current.done ? '#EAF6EF' : '#0F2C4C', color: current.done ? '#1F8A5B' : '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: current.done ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name={current.done ? 'check-circle' : 'circle'} size={17} />{current.done ? t('completed') : t('markDone')}
              </button>
            </>
          )}

          {tab === 'resources' && (
            <>
              {(detail.data?.resources ?? []).length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noData')}</div>}
              {(detail.data?.resources ?? []).map((r) => {
                const tints: Record<string, [string, string]> = { pdf: ['#FBEBEB', '#D14343'], xlsx: ['#EAF6EF', '#1F8A5B'], docx: ['#EAF1FB', '#1B5FB0'] }
                const [tint, color] = tints[r.kind ?? ''] ?? ['#EAF1FB', '#1B5FB0']
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={r.icon ?? 'file-text'} size={18} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy-800)' }}>{r.name}</div><div style={{ fontSize: 11.5, color: '#93A1B4', fontWeight: 600 }}>{r.size_label}</div></div>
                    <Icon name="download" size={18} color="#8494A8" />
                  </div>
                )
              })}
            </>
          )}

          {tab === 'quiz' && <QuizPanel quiz={detail.data?.quiz ?? null} />}

          {tab === 'assignments' && <AssignmentsPanel courseId={courseId!} />}

          {tab === 'notes' && <NotesPanel key={currentId} lessonId={currentId!} initial={detail.data?.note ?? ''} />}
        </div>
      </div>

      {/* Lesson list */}
      <aside style={{ width: 340, flex: 'none', background: '#fff', borderLeft: '1px solid var(--border)', overflowY: 'auto' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #EEF2F7' }}>
          <button onClick={() => nav('/student')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10, padding: 0 }}>
            <Icon name="arrow-left" size={15} /> {t('backToCourses')}
          </button>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{data.course.title}</div>
          <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, margin: '8px 0 6px' }}>{doneCount}/{flat.length} {t('lessons')} · {pct}% {t('complete')}</div>
          <div style={{ height: 6, background: '#EEF2F7', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#D9A441,#E7B450)' }} /></div>
        </div>
        {data.sections.map((s) => (
          <div key={s.id}>
            <div style={{ padding: '13px 20px 7px', fontSize: 12, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .4 }}>{s.title}</div>
            {s.lessons.map((l) => {
              const active = l.id === currentId
              const wrap = active ? { bg: '#D9A441', fg: '#0F2C4C', icon: 'play' } : l.done ? { bg: '#EAF6EF', fg: '#1F8A5B', icon: 'check' } : { bg: '#F1F4F8', fg: '#B0BCCB', icon: 'circle' }
              return (
                <button key={l.id} onClick={() => { setCurrentId(l.id); setTab('overview') }} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 20px', border: 'none', cursor: 'pointer', background: active ? '#FBF7EE' : 'transparent', borderLeft: `3px solid ${active ? '#D9A441' : 'transparent'}`, textAlign: 'left' }}>
                  <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: wrap.bg, color: wrap.fg }}><Icon name={wrap.icon} size={14} /></span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: active ? 700 : 600, color: active ? '#0F2C4C' : l.done ? '#5B6B82' : '#5B6B82', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</span>
                  <span style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{l.duration}</span>
                </button>
              )
            })}
          </div>
        ))}
      </aside>
    </div>
  )
}

function QuizPanel({ quiz }: { quiz: Quiz | null }) {
  const { me } = useAuth()
  const { t } = useI18n()
  const [idx, setIdx] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  if (!quiz || quiz.questions.length === 0) return <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noData')}</div>
  const q = quiz.questions[idx]
  const correctId = q.options.find((o) => o.is_correct)?.id
  const isCorrect = answered && pick === correctId

  async function submit() {
    if (pick == null) return
    if (!answered) {
      setAnswered(true)
      if (pick === correctId) {
        await supabase.from('quiz_attempts').insert({ user_id: me!.userId, quiz_id: quiz!.id, score: q.points, answers: { [q.id]: pick } })
        await supabase.from('points_ledger').insert({ institution_id: me!.institutionId, user_id: me!.userId, points: q.points, reason: 'Quiz' })
      }
    } else {
      // next question
      const next = idx + 1
      if (next < quiz!.questions.length) { setIdx(next); setPick(null); setAnswered(false) }
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}><Icon name="clipboard-check" size={18} color="#D9A441" /><span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)' }}>{quiz.title}</span></div>
      <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('question')} {idx + 1} / {quiz.questions.length}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy-800)', lineHeight: 1.5, marginBottom: 16 }}>{q.prompt}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {q.options.map((o, i) => {
          const picked = pick === o.id
          let bg = '#fff', bd = '#E6EBF1', icon = 'circle', ic = '#C9D2DF'
          if (answered && o.id === correctId) { bg = '#EAF6EF'; bd = '#1F8A5B'; icon = 'check-circle'; ic = '#1F8A5B' }
          else if (answered && picked && o.id !== correctId) { bg = '#FBEBEB'; bd = '#D14343'; icon = 'x-circle'; ic = '#D14343' }
          else if (picked) { bd = '#D9A441'; bg = '#FBF7EE' }
          return (
            <button key={o.id} onClick={() => { if (!answered) setPick(o.id) }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', borderRadius: 12, border: `1.5px solid ${bd}`, background: bg, cursor: answered ? 'default' : 'pointer', fontWeight: 600, fontSize: 13.5, color: '#33415A', textAlign: 'left' }}>
              <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 7, background: picked ? '#D9A441' : '#F1F4F8', color: picked ? '#0F2C4C' : '#8494A8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12 }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>{o.label}</span>
              <Icon name={icon} size={18} color={ic} />
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={submit} disabled={pick == null} style={{ height: 44, padding: '0 22px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 14, cursor: pick == null ? 'default' : 'pointer', opacity: pick == null ? .6 : 1 }}>
          {answered && idx + 1 < quiz.questions.length ? '→' : t('submit')}
        </button>
        {answered && <span style={{ fontSize: 13, color: isCorrect ? '#1F8A5B' : '#D14343', fontWeight: 700 }}>{isCorrect ? `${t('correct')} +${q.points}` : t('incorrect')}</span>}
      </div>
    </div>
  )
}

function AssignmentsPanel({ courseId }: { courseId: string }) {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const [draft, setDraft] = useState<Record<string, { body: string; link: string }>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: assignments }, { data: subs }] = await Promise.all([
      supabase.from('assignments').select('id, title, instructions, due_at, points').eq('course_id', courseId).order('created_at'),
      supabase.from('assignment_submissions').select('id, assignment_id, body, link_url, status, grade, feedback').eq('student_id', me!.userId),
    ])
    const byAssignment: Record<string, any> = {}
    for (const s of subs ?? []) byAssignment[s.assignment_id] = s
    return { assignments: assignments ?? [], byAssignment }
  }, [courseId])

  if (loading || !data) return <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('loading')}</div>
  if (data.assignments.length === 0) return <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noAssignments')}</div>

  async function submit(assignmentId: string) {
    const d = draft[assignmentId] ?? { body: '', link: '' }
    if (!d.body.trim() && !d.link.trim()) return
    setBusy(assignmentId)
    await supabase.from('assignment_submissions').upsert(
      { assignment_id: assignmentId, student_id: me!.userId, body: d.body, link_url: d.link || null, status: 'submitted' },
      { onConflict: 'assignment_id,student_id' }
    )
    setBusy(null); reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.assignments.map((a: any) => {
        const sub = data.byAssignment[a.id]
        const d = draft[a.id] ?? { body: sub?.body ?? '', link: sub?.link_url ?? '' }
        const graded = sub?.status === 'graded'
        return (
          <div key={a.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Icon name="clipboard-list" size={18} color="#7C5CD6" />
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)', flex: 1 }}>{a.title}</span>
              <span style={{ fontSize: 12, color: '#8494A8', fontWeight: 700 }}>{a.points} {t('points')}</span>
            </div>
            {a.instructions && <div style={{ fontSize: 13, color: '#5B6B82', lineHeight: 1.55, marginBottom: 12 }}>{a.instructions}</div>}
            {a.due_at && <div style={{ fontSize: 12, color: '#9AA7B8', fontWeight: 600, marginBottom: 12 }}>{t('due')} {new Date(a.due_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR')}</div>}

            {graded ? (
              <div style={{ background: '#EAF6EF', border: '1px solid #CDE9DA', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Icon name="award" size={16} color="#1F8A5B" />
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#1F8A5B' }}>{sub.grade} / {a.points}</span>
                  <span style={{ fontSize: 12, color: '#1F8A5B', fontWeight: 700 }}>· {t('graded')}</span>
                </div>
                {sub.feedback && <div style={{ fontSize: 13, color: '#33415A', lineHeight: 1.5 }}>{sub.feedback}</div>}
              </div>
            ) : (
              <>
                {sub && <div style={{ fontSize: 12, color: '#1B5FB0', fontWeight: 700, marginBottom: 10 }}><Icon name="check" size={13} /> {t('submitted')} — {t('canResubmit')}</div>}
                <textarea value={d.body} onChange={(e) => setDraft((s) => ({ ...s, [a.id]: { ...d, body: e.target.value } }))} placeholder={t('yourAnswer')} style={{ width: '100%', minHeight: 90, border: '1px solid var(--border)', borderRadius: 11, padding: 12, fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'var(--sans)', marginBottom: 10 }} />
                <input value={d.link} onChange={(e) => setDraft((s) => ({ ...s, [a.id]: { ...d, link: e.target.value } }))} placeholder={t('linkOptional')} style={{ width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 11, padding: '0 12px', fontSize: 13, outline: 'none', marginBottom: 12 }} />
                <button onClick={() => submit(a.id)} disabled={busy === a.id} style={{ height: 42, padding: '0 20px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Icon name="send" size={15} />{sub ? t('resubmit') : t('submitWork')}
                </button>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function NotesPanel({ lessonId, initial }: { lessonId: string; initial: string }) {
  const { me } = useAuth()
  const { t } = useI18n()
  const [val, setVal] = useState(initial)
  const [saved, setSaved] = useState(true)

  useEffect(() => { setVal(initial); setSaved(true) }, [initial])
  useEffect(() => {
    if (saved) return
    const id = setTimeout(async () => {
      await supabase.from('notes').upsert({ user_id: me!.userId, lesson_id: lessonId, body: val, updated_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' })
      setSaved(true)
    }, 700)
    return () => clearTimeout(id)
  }, [val, saved, lessonId, me])

  return (
    <div>
      <textarea value={val} onChange={(e) => { setVal(e.target.value); setSaved(false) }} placeholder={t('takeNotes')} style={{ width: '100%', minHeight: 200, border: '1px solid var(--border)', borderRadius: 14, padding: 16, fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none', background: '#fff', color: '#33415A' }} />
      <div style={{ fontSize: 11.5, color: saved ? '#1F8A5B' : '#9AA7B8', fontWeight: 600, marginTop: 8 }}>{saved ? '✓ ' + (t('completed')) : '…'}</div>
    </div>
  )
}
