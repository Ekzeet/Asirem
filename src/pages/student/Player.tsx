import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Avatar, Loader } from '../../components/ui'
import { relTime } from '../../lib/format'

type Lesson = { id: string; title: string; duration: string | null; body: string | null; done: boolean; content_type: string; file_url: string | null; external_url: string | null; duration_seconds: number | null }
type Section = { id: string; title: string; lessons: Lesson[] }
type Resource = { id: string; name: string; size_label: string | null; icon: string | null; kind: string | null }
type QuizOption = { id: string; label: string; is_correct: boolean }
type QuizQuestion = { id: string; prompt: string; points: number; options: QuizOption[] }
type Quiz = { id: string; title: string; pass_score: number; questions: QuizQuestion[] }

type TabId = 'overview' | 'resources' | 'quiz' | 'notes' | 'assignments' | 'qa'

export default function Player() {
  const { courseId } = useParams()
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [playing, setPlaying] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: course }, { data: sections }, { data: prog }, { data: quizzes }, { data: attempts }] = await Promise.all([
      supabase.from('courses').select('id,title,drip_enabled,module_lock').eq('id', courseId!).single(),
      supabase.from('sections').select('id,title,position,lessons(id,title,duration,body,position,content_type,file_url,external_url,duration_seconds)').eq('course_id', courseId!).order('position'),
      supabase.from('lesson_progress').select('lesson_id, completed_at').eq('user_id', me!.userId),
      supabase.from('quizzes').select('id, pass_score, lesson_id'),
      supabase.from('quiz_attempts').select('quiz_id, score').eq('user_id', me!.userId),
    ])
    const doneSet = new Set((prog ?? []).filter((p) => p.completed_at).map((p) => p.lesson_id))
    const secs: Section[] = (sections ?? []).map((s: any) => ({
      id: s.id, title: s.title,
      lessons: (s.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((l: any) => ({ id: l.id, title: l.title, duration: l.duration, body: l.body, done: doneSet.has(l.id), content_type: l.content_type, file_url: l.file_url, external_url: l.external_url, duration_seconds: l.duration_seconds })),
    }))
    // Per-section: does it have a quiz (module test) and did the user pass it?
    const lessonIds = new Set(secs.flatMap((s) => s.lessons.map((l) => l.id)))
    const bestScore: Record<string, number> = {}
    for (const a of attempts ?? []) bestScore[a.quiz_id] = Math.max(bestScore[a.quiz_id] ?? 0, a.score ?? 0)
    const quizByLesson: Record<string, { id: string; pass_score: number }> = {}
    for (const q of quizzes ?? []) if (lessonIds.has(q.lesson_id)) quizByLesson[q.lesson_id] = { id: q.id, pass_score: q.pass_score }
    const sectionPassed: Record<string, boolean> = {}
    for (const s of secs) {
      const secQuizzes = s.lessons.map((l) => quizByLesson[l.id]).filter(Boolean) as { id: string; pass_score: number }[]
      if (secQuizzes.length > 0) sectionPassed[s.id] = secQuizzes.some((q) => (bestScore[q.id] ?? 0) >= q.pass_score)
      else sectionPassed[s.id] = s.lessons.length > 0 && s.lessons.every((l) => l.done) // no test → all lessons done
    }
    return { course: course as { id: string; title: string; drip_enabled: boolean; module_lock: boolean }, sections: secs, sectionPassed }
  }, [courseId, me!.userId])

  // Sections unlocked when the previous module is "passed" (test passed, or all lessons done if no test)
  const unlockedSections = useMemo(() => {
    const set = new Set<string>()
    const secs = data?.sections ?? []
    const lock = data?.course.module_lock ?? false
    secs.forEach((s, i) => { if (!lock || i === 0 || (data?.sectionPassed[secs[i - 1].id])) set.add(s.id) })
    return set
  }, [data])

  const flat = useMemo(() => data?.sections.flatMap((s) => s.lessons.map((l) => ({ ...l, sectionTitle: s.title, sectionId: s.id }))) ?? [], [data])
  const drip = data?.course.drip_enabled ?? false
  const unlocked = useMemo(() => {
    const set = new Set<string>()
    flat.forEach((l, i) => {
      const secOk = unlockedSections.has(l.sectionId)
      if (secOk && (!drip || i === 0 || l.done || flat[i - 1]?.done)) set.add(l.id)
    })
    return set
  }, [flat, drip, unlockedSections])

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
      supabase.from('quizzes').select('id,title,pass_score,questions:quiz_questions(id,prompt,points,position,options:quiz_options(id,label,is_correct,position))').eq('lesson_id', currentId).maybeSingle(),
      supabase.from('notes').select('body').eq('lesson_id', currentId).eq('user_id', me!.userId).maybeSingle(),
    ])
    let quiz: Quiz | null = null
    if (quizRow) {
      quiz = {
        id: (quizRow as any).id, title: (quizRow as any).title, pass_score: (quizRow as any).pass_score ?? 60,
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
    { id: 'qa', label: 'Q&R' },
    { id: 'notes', label: t('notes') },
  ]

  return (
    <div className="lmsfade" style={{ display: 'flex', height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', paddingBottom: 40 }}>
        <MediaPlayer key={current.id} lesson={current} userId={me!.userId} progressPct={pct} onCompleted={reload} />

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

          {tab === 'qa' && <QAPanel courseId={courseId!} />}

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
              const locked = !unlocked.has(l.id)
              const wrap = active ? { bg: '#D9A441', fg: '#0F2C4C', icon: 'play' } : l.done ? { bg: '#EAF6EF', fg: '#1F8A5B', icon: 'check' } : locked ? { bg: '#F1F4F8', fg: '#B0BCCB', icon: 'lock' } : { bg: '#F1F4F8', fg: '#B0BCCB', icon: 'circle' }
              return (
                <button key={l.id} disabled={locked} onClick={() => { if (!locked) { setCurrentId(l.id); setTab('overview') } }} title={locked ? t('lockedLesson') : ''} style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '11px 20px', border: 'none', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? .55 : 1, background: active ? '#FBF7EE' : 'transparent', borderLeft: `3px solid ${active ? '#D9A441' : 'transparent'}`, textAlign: 'left' }}>
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

function QAPanel({ courseId }: { courseId: string }) {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const isStaff = me!.role !== 'student'
  const [ask, setAsk] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: qs }, { data: ans }] = await Promise.all([
      supabase.from('course_questions').select('id, body, resolved, created_at, author:profiles!course_questions_author_id_fkey(full_name)').eq('course_id', courseId).order('created_at', { ascending: false }),
      supabase.from('question_answers').select('id, question_id, body, is_official, created_at, author:profiles!question_answers_author_id_fkey(full_name)').order('created_at'),
    ])
    return { qs: (qs ?? []) as any[], ans: (ans ?? []) as any[] }
  }, [courseId])

  async function submitQuestion() {
    if (!ask.trim()) return
    await supabase.from('course_questions').insert({ institution_id: me!.institutionId, course_id: courseId, author_id: me!.userId, body: ask.trim() })
    setAsk(''); reload()
  }
  async function submitAnswer(qid: string) {
    if (!reply.trim()) return
    await supabase.from('question_answers').insert({ question_id: qid, author_id: me!.userId, body: reply.trim(), is_official: isStaff })
    setReply(''); setReplyTo(null); reload()
  }
  async function toggleResolved(qid: string, val: boolean) { await supabase.from('course_questions').update({ resolved: val }).eq('id', qid); reload() }

  if (loading || !data) return <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('loading')}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 10 }}>
        <input value={ask} onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitQuestion() }} placeholder={t('askQuestion')} style={{ flex: 1, height: 42, border: '1px solid var(--border)', borderRadius: 11, background: '#F7F9FC', padding: '0 14px', fontSize: 13.5, outline: 'none' }} />
        <button onClick={submitQuestion} disabled={!ask.trim()} style={{ height: 42, padding: '0 18px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', opacity: ask.trim() ? 1 : .6 }}>{t('post')}</button>
      </div>
      {data.qs.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noQuestions')}</div>}
      {data.qs.map((q) => {
        const answers = data.ans.filter((a) => a.question_id === q.id)
        return (
          <div key={q.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: '15px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Avatar name={q.author?.full_name ?? '—'} size={34} radius={9} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-800)' }}>{q.author?.full_name ?? '—'} <span style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600 }}>· {relTime(q.created_at, lang)}</span></div>
              </div>
              {q.resolved
                ? <span style={{ fontSize: 11, fontWeight: 800, color: '#1F8A5B', background: '#EAF6EF', padding: '3px 9px', borderRadius: 20 }}>✓ {t('resolved')}</span>
                : (isStaff || true) && <button onClick={() => toggleResolved(q.id, true)} style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('markResolved')}</button>}
            </div>
            <div style={{ fontSize: 13.5, color: '#33415A', lineHeight: 1.55 }}>{q.body}</div>

            {answers.map((a) => (
              <div key={a.id} style={{ display: 'flex', gap: 10, marginTop: 12, paddingLeft: 12, borderLeft: `2px solid ${a.is_official ? '#D9A441' : '#EEF2F7'}` }}>
                <Avatar name={a.author?.full_name ?? '—'} size={28} radius={8} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy-800)' }}>{a.author?.full_name ?? '—'}{a.is_official && <span style={{ fontSize: 10, fontWeight: 800, color: '#C99A2E', background: '#FBF1E1', padding: '2px 7px', borderRadius: 6, marginLeft: 6 }}>{t('officialAnswer')}</span>}</div>
                  <div style={{ fontSize: 13, color: '#33415A', lineHeight: 1.5, marginTop: 2 }}>{a.body}</div>
                </div>
              </div>
            ))}

            {replyTo === q.id ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(q.id) }} autoFocus placeholder={t('yourAnswer')} style={{ flex: 1, height: 36, border: '1px solid var(--border)', borderRadius: 9, padding: '0 11px', fontSize: 12.5, outline: 'none' }} />
                <button onClick={() => submitAnswer(q.id)} disabled={!reply.trim()} style={{ height: 36, padding: '0 14px', borderRadius: 9, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{t('send')}</button>
              </div>
            ) : (
              <button onClick={() => { setReplyTo(q.id); setReply('') }} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{t('answer')} →</button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function embedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) { const id = u.searchParams.get('v'); return id ? `https://www.youtube.com/embed/${id}` : null }
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (u.hostname.includes('vimeo.com')) { const id = u.pathname.split('/').filter(Boolean)[0]; return id ? `https://player.vimeo.com/video/${id}` : null }
    return url
  } catch { return null }
}

function MediaPlayer({ lesson, userId, progressPct, onCompleted }: {
  lesson: Lesson & { sectionTitle?: string }
  userId: string
  progressPct: number
  onCompleted: () => void
}) {
  const { t } = useI18n()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [marked, setMarked] = useState(lesson.done)
  const lastSaveRef = useState({ t: 0 })[0]

  useEffect(() => {
    setMarked(lesson.done)
    let active = true
    if (lesson.file_url) {
      supabase.storage.from('course-media').createSignedUrl(lesson.file_url, 3600).then(({ data }) => { if (active) setSignedUrl(data?.signedUrl ?? null) })
    } else setSignedUrl(null)
    return () => { active = false }
  }, [lesson.id, lesson.file_url, lesson.done])

  async function complete() {
    if (marked) return
    setMarked(true)
    await supabase.from('lesson_progress').upsert(
      { user_id: userId, lesson_id: lesson.id, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' },
    )
    onCompleted()
  }

  async function onTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const v = e.currentTarget
    const dur = lesson.duration_seconds || v.duration
    const now = Date.now()
    if (now - lastSaveRef.t > 5000) {
      lastSaveRef.t = now
      supabase.from('lesson_progress').upsert(
        { user_id: userId, lesson_id: lesson.id, seconds: Math.round(v.currentTime) },
        { onConflict: 'user_id,lesson_id' },
      )
    }
    if (dur && v.currentTime / dur >= 0.9) complete()
  }

  const isVideo = lesson.content_type === 'video'
  const isPdf = lesson.content_type === 'pdf'
  const embed = lesson.external_url ? embedUrl(lesson.external_url) : null

  return (
    <div>
      <div style={{ background: '#0B2038' }}>
        <div style={{ aspectRatio: '16/9', maxHeight: 460, background: 'linear-gradient(135deg,#0F2C4C,#0B2038)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {isVideo && signedUrl ? (
            <video src={signedUrl} controls onTimeUpdate={onTimeUpdate} onEnded={complete} style={{ width: '100%', height: '100%', background: '#000' }} />
          ) : embed ? (
            <iframe src={embed} title={lesson.title} allow="accelerated-destination; autoplay; encrypted-media; picture-in-picture" allowFullScreen style={{ width: '100%', height: '100%', border: 'none' }} />
          ) : isPdf && signedUrl ? (
            <iframe src={signedUrl} title={lesson.title} style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
          ) : (
            <>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.02) 0 22px,transparent 22px 44px)' }} />
              <div style={{ textAlign: 'center', color: '#9DB4D0', zIndex: 2 }}>
                <Icon name={isVideo ? 'video-off' : 'file'} size={40} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>{t('noMediaYet')}</div>
              </div>
            </>
          )}
          {!isVideo || !signedUrl ? (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 18px', background: 'linear-gradient(0deg,rgba(0,0,0,.55),transparent)', pointerEvents: 'none' }}>
              <div style={{ height: 5, background: 'rgba(255,255,255,.22)', borderRadius: 4, overflow: 'hidden' }}><div style={{ height: '100%', width: `${progressPct}%`, background: '#D9A441' }} /></div>
            </div>
          ) : null}
        </div>
      </div>
      {/* Manual completion for non-tracked media (embed / pdf / none) */}
      {!(isVideo && signedUrl) && (
        <div style={{ padding: '12px 30px 0', maxWidth: 820 }}>
          <button onClick={complete} disabled={marked} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: marked ? '#EAF6EF' : '#0F2C4C', color: marked ? '#1F8A5B' : '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: marked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name={marked ? 'check-circle' : 'circle'} size={16} />{marked ? t('completed') : t('markDone')}
          </button>
        </div>
      )}
    </div>
  )
}

function QuizPanel({ quiz }: { quiz: Quiz | null }) {
  const { me } = useAuth()
  const { t } = useI18n()
  const [idx, setIdx] = useState(0)
  const [pick, setPick] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [earned, setEarned] = useState(0)
  const [finished, setFinished] = useState(false)

  if (!quiz || quiz.questions.length === 0) return <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('noData')}</div>
  const q = quiz.questions[idx]
  const correctId = q.options.find((o) => o.is_correct)?.id
  const isCorrect = answered && pick === correctId
  const totalPoints = quiz.questions.reduce((s, qq) => s + qq.points, 0)
  const lastQuestion = idx === quiz.questions.length - 1

  async function submit() {
    if (pick == null) return
    if (!answered) {
      setAnswered(true)
      if (pick === correctId) {
        setEarned((e) => e + q.points)
        await supabase.from('points_ledger').insert({ institution_id: me!.institutionId, user_id: me!.userId, points: q.points, reason: 'Quiz' })
      }
    } else if (!lastQuestion) {
      setIdx(idx + 1); setPick(null); setAnswered(false)
    } else {
      // record the whole attempt on finish
      await supabase.from('quiz_attempts').insert({ user_id: me!.userId, quiz_id: quiz!.id, score: Math.round((earned / (totalPoints || 1)) * 100), answers: {} })
      setFinished(true)
    }
  }

  if (finished) {
    const pct = Math.round((earned / (totalPoints || 1)) * 100)
    const pass = pct >= quiz.pass_score
    return (
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px', background: pass ? '#EAF6EF' : '#FBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={pass ? 'award' : 'x-circle'} size={30} color={pass ? '#1F8A5B' : '#D14343'} />
        </div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: pass ? '#1F8A5B' : '#D14343' }}>{pct}%</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-soft)', margin: '4px 0 2px' }}>{pass ? t('passed') : t('failed')}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 16 }}>{t('quizResult')} · {quiz.pass_score}% {t('complete')}</div>
        {!pass && <button onClick={() => { setIdx(0); setPick(null); setAnswered(false); setEarned(0); setFinished(false) }} style={{ height: 40, padding: '0 18px', borderRadius: 10, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{t('retryQuiz')}</button>}
      </div>
    )
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
