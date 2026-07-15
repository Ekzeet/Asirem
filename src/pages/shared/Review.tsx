import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { relTime } from '../../lib/format'
import { Avatar, Card, Loader, PageWrap } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss, textareaCss } from '../../components/Modal'

type Criterion = { id: string; label: string; points: number }
type Submission = {
  id: string; body: string | null; link_url: string | null; status: string; grade: number | null; feedback: string | null
  submitted_at: string; student: string; assignmentTitle: string; courseTitle: string; points: number
  files: { name: string; path: string }[]; isLate: boolean; rubric: Criterion[]; rubricScores: Record<string, number>; latePenalty: number
}

export default function Review() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId
  const [filter, setFilter] = useState<'all' | 'submitted' | 'graded'>('submitted')
  const [grading, setGrading] = useState<Submission | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const { data: subs } = await supabase
      .from('assignment_submissions')
      .select('id, body, link_url, files, is_late, rubric_scores, status, grade, feedback, submitted_at, student:profiles!submissions_student_profile_fkey(full_name), assignment:assignments(title, points, rubric, late_penalty, course:courses(title))')
      .order('submitted_at', { ascending: false })
    const rows: Submission[] = (subs ?? []).map((s: any) => ({
      id: s.id, body: s.body, link_url: s.link_url, files: s.files ?? [], isLate: s.is_late, rubricScores: s.rubric_scores ?? {},
      status: s.status, grade: s.grade, feedback: s.feedback,
      submitted_at: s.submitted_at, student: s.student?.full_name ?? '—',
      assignmentTitle: s.assignment?.title ?? '—', courseTitle: s.assignment?.course?.title ?? '—', points: s.assignment?.points ?? 100,
      rubric: s.assignment?.rubric ?? [], latePenalty: s.assignment?.late_penalty ?? 0,
    }))
    return rows
  }, [inst])

  const shown = useMemo(() => (data ?? []).filter((s) => filter === 'all' ? true : s.status === filter), [data, filter])
  if (loading || !data) return <Loader />

  const chips: { id: 'all' | 'submitted' | 'graded'; label: string }[] = [
    { id: 'submitted', label: t('toGrade') },
    { id: 'graded', label: t('graded') },
    { id: 'all', label: t('all') },
  ]

  return (
    <PageWrap maxWidth={980}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {chips.map((c) => {
          const active = filter === c.id
          const n = (data ?? []).filter((s) => c.id === 'all' ? true : s.status === c.id).length
          return (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{ height: 36, padding: '0 14px', borderRadius: 10, border: `1px solid ${active ? '#0F2C4C' : '#E2E8F0'}`, background: active ? '#0F2C4C' : '#fff', color: active ? '#fff' : '#5B6B82', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>{c.label} <span style={{ opacity: .6 }}>{n}</span></button>
          )
        })}
      </div>

      {shown.length === 0 && <Card style={{ padding: 22, color: 'var(--muted)', fontSize: 13.5 }}>{t('nothingToReview')}</Card>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {shown.map((s) => (
          <Card key={s.id} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={s.student} size={42} radius={11} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy-800)' }}>{s.student} <span style={{ color: '#9AA7B8', fontWeight: 600 }}>· {s.assignmentTitle}</span></div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{s.courseTitle} · {relTime(s.submitted_at, lang)}</div>
            </div>
            {s.status === 'graded'
              ? <span style={{ fontSize: 13, fontWeight: 800, color: '#1F8A5B', background: '#EAF6EF', padding: '5px 12px', borderRadius: 20 }}>{s.grade}/{s.points}</span>
              : <BtnPrimary onClick={() => setGrading(s)}><Icon name="check-circle" size={15} />{t('grade')}</BtnPrimary>}
          </Card>
        ))}
      </div>

      {grading && <GradeModal sub={grading} onClose={() => setGrading(null)} onSaved={() => { setGrading(null); reload() }} />}
    </PageWrap>
  )
}

function GradeModal({ sub, onClose, onSaved }: { sub: Submission; onClose: () => void; onSaved: () => void }) {
  const { me } = useAuth()
  const { t } = useI18n()
  const hasRubric = sub.rubric.length > 0
  const [scores, setScores] = useState<Record<string, number>>(sub.rubricScores ?? {})
  const rubricTotal = sub.rubric.reduce((s, c) => s + (scores[c.id] ?? 0), 0)
  const [grade, setGrade] = useState<number>(sub.grade ?? Math.round(sub.points * 0.8))
  const [feedback, setFeedback] = useState(sub.feedback ?? '')
  const [busy, setBusy] = useState(false)
  const effective = hasRubric ? rubricTotal : grade

  async function save() {
    setBusy(true)
    await supabase.from('assignment_submissions').update({ grade: effective, feedback, rubric_scores: scores as any, status: 'graded', graded_by: me!.userId, graded_at: new Date().toISOString() }).eq('id', sub.id)
    setBusy(false); onSaved()
  }

  async function requestResubmit() {
    setBusy(true)
    await supabase.from('assignment_submissions').update({ status: 'returned', feedback }).eq('id', sub.id)
    setBusy(false); onSaved()
  }

  const openFile = async (path: string) => {
    const { data } = await supabase.storage.from('submissions').createSignedUrl(path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }

  return (
    <Modal title={t('gradeSubmission')} subtitle={`${sub.student} · ${sub.assignmentTitle}`} onClose={onClose} width={560}
      footer={<><BtnGhost onClick={requestResubmit}>{t('requestResubmit')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{t('saveGrade')} · {effective}/{sub.points}</BtnPrimary></>}>
      <div style={{ background: '#F7F9FC', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .4 }}>{t('submission')}</span>
          {sub.isLate && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#D14343', background: '#FBEBEB', padding: '2px 8px', borderRadius: 20 }}>{t('late')}{sub.latePenalty ? ` −${sub.latePenalty}%` : ''}</span>}
        </div>
        <div style={{ fontSize: 13.5, color: '#33415A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{sub.body || '—'}</div>
        {sub.link_url && <a href={sub.link_url} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8 }}><Icon name="link" size={13} />{sub.link_url}</a>}
        {sub.files.map((f, i) => (
          <button key={i} onClick={() => openFile(f.path)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8, padding: 0 }}><Icon name="paperclip" size={13} />{f.name}</button>
        ))}
      </div>

      {hasRubric ? (
        <Field label={`${t('rubric')} (${rubricTotal}/${sub.points})`}>
          {sub.rubric.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>{c.label}</span>
              <input type="number" min={0} max={c.points} value={scores[c.id] ?? 0} onChange={(e) => setScores((s) => ({ ...s, [c.id]: Math.min(c.points, Number(e.target.value)) }))} style={{ ...inputCss, width: 70, height: 36 }} />
              <span style={{ fontSize: 12, color: '#9AA7B8', fontWeight: 700, width: 34 }}>/{c.points}</span>
            </div>
          ))}
        </Field>
      ) : (
        <Field label={`${t('grade')} (/ ${sub.points})`}><input type="number" min={0} max={sub.points} value={grade} onChange={(e) => setGrade(Number(e.target.value))} style={inputCss} /></Field>
      )}
      <Field label={t('feedback')}><textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} style={textareaCss} /></Field>
    </Modal>
  )
}
