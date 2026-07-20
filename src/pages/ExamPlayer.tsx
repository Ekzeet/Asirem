import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../components/Icon'
import { Card, Loader } from '../components/ui'
import { BtnPrimary } from '../components/Modal'

type Q = { id: string; prompt: string; question_type: string; points: number; options: { id: string; label: string }[] }
type Exam = { id: string; title: string; description: string | null; pass_score: number; time_limit_minutes?: number | null; questions: Q[] }

function fmtCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ExamPlayer() {
  const { examId } = useParams()
  const { t } = useI18n()
  const nav = useNavigate()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean; pass_score: number } | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_exam', { p_exam: examId! })
    return data as unknown as Exam | null
  }, [examId])

  async function submit() {
    setBusy(true)
    const { data: r } = await supabase.rpc('grade_exam', { p_exam: examId!, p_answers: answers as any })
    setBusy(false)
    setResult(r as any)
  }

  // Start the countdown once the exam (with its time limit) has loaded.
  useEffect(() => {
    if (data?.time_limit_minutes) setRemaining(data.time_limit_minutes * 60)
  }, [data])

  // Tick the countdown down every second; auto-submit when it reaches 0.
  useEffect(() => {
    if (remaining === null || result) return
    if (remaining <= 0) { submit(); return }
    const id = setInterval(() => setRemaining((r) => (r === null ? null : r - 1)), 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, result])

  if (loading) return <Loader />
  if (!data) return <div style={{ padding: 40, color: 'var(--muted)' }}>{t('noData')}</div>
  const exam = data

  if (result) {
    return (
      <div className="lmsfade" style={{ padding: '40px 30px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', background: result.passed ? '#EAF6EF' : '#FBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={result.passed ? 'award' : 'x-circle'} size={34} color={result.passed ? '#1F8A5B' : '#D14343'} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 30, color: result.passed ? '#1F8A5B' : '#D14343' }}>{result.score}%</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink-soft)', margin: '4px 0 2px' }}>{result.passed ? t('passed') : t('failed')}</div>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginBottom: 20 }}>{t('passScore')} {result.pass_score}%{result.passed ? ` · ${t('examCertNote')}` : ''}</div>
        <button onClick={() => nav('/exams')} style={{ height: 42, padding: '0 20px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>{t('exams')}</button>
      </div>
    )
  }

  return (
    <div className="lmsfade" style={{ padding: '22px 30px 46px', maxWidth: 720 }}>
      <button onClick={() => nav('/exams')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, padding: 0 }}><Icon name="arrow-left" size={15} /> {t('exams')}</button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{exam.title}</div>
        {remaining !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: remaining <= 60 ? '#D14343' : 'var(--navy-800)', background: remaining <= 60 ? '#FBEBEB' : '#EEF2F7', padding: '7px 14px', borderRadius: 20, flex: 'none' }}>
            <Icon name="clock" size={15} />{fmtCountdown(remaining)}
          </div>
        )}
      </div>
      {exam.description && <div style={{ fontSize: 13.5, color: '#5B6B82', lineHeight: 1.6, margin: '6px 0 4px' }}>{exam.description}</div>}
      <div style={{ fontSize: 12.5, color: '#9AA7B8', fontWeight: 600, marginBottom: 20 }}>{exam.questions.length} {t('questions').toLowerCase()} · {t('passScore')} {exam.pass_score}%</div>

      {exam.questions.map((q, i) => (
        <Card key={q.id} style={{ padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--navy-800)', marginBottom: 14 }}>{i + 1}. {q.prompt} <span style={{ fontSize: 11.5, color: '#9AA7B8' }}>({q.points} pts)</span></div>
          {q.question_type === 'short_answer' ? (
            <input value={answers[q.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder={t('yourAnswer')} style={{ width: '100%', height: 44, border: '1px solid var(--border)', borderRadius: 11, padding: '0 14px', fontSize: 14, outline: 'none' }} />
          ) : q.options.map((o) => {
            const picked = answers[q.id] === o.id
            return (
              <button key={o.id} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', borderRadius: 11, border: `1.5px solid ${picked ? '#D9A441' : '#E6EBF1'}`, background: picked ? '#FBF7EE' : '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13.5, color: '#33415A', textAlign: 'left', marginBottom: 8 }}>
                <Icon name={picked ? 'check-circle' : 'circle'} size={17} color={picked ? '#D9A441' : '#C9D2DF'} />{o.label}
              </button>
            )
          })}
        </Card>
      ))}
      <BtnPrimary onClick={submit} disabled={busy || Object.keys(answers).length === 0}><Icon name="send" size={15} />{t('submitExam')}</BtnPrimary>
    </div>
  )
}
