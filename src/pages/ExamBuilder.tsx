import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../components/Icon'
import { Card, Loader } from '../components/ui'
import { BtnGhost, BtnPrimary, Field, inputCss, textareaCss } from '../components/Modal'

export default function ExamBuilder() {
  const { examId } = useParams()
  const { t } = useI18n()
  const nav = useNavigate()

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: exam }, { data: qs }] = await Promise.all([
      supabase.from('exams').select('id,title,description,pass_score,status,course_id').eq('id', examId!).single(),
      supabase.from('exam_questions').select('id,prompt,question_type,points,answer_text,position,options:exam_options(id,label,is_correct,position)').eq('exam_id', examId!).order('position'),
    ])
    return { exam, qs: (qs ?? []) as any[] }
  }, [examId])

  const [prompt, setPrompt] = useState('')
  const [qtype, setQtype] = useState<'single' | 'true_false' | 'short_answer'>('single')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [answer, setAnswer] = useState('')
  const [pts, setPts] = useState(10)

  if (loading || !data?.exam) return <Loader />
  const exam = data.exam

  async function saveMeta(patch: any) { await supabase.from('exams').update(patch).eq('id', examId!); reload() }

  async function addQuestion() {
    if (!prompt.trim()) return
    if (qtype === 'short_answer' && !answer.trim()) return
    if (qtype === 'single' && opts.filter((o) => o.trim()).length < 2) return
    const { data: q } = await supabase.from('exam_questions').insert({ exam_id: examId!, prompt: prompt.trim(), question_type: qtype, points: pts, answer_text: qtype === 'short_answer' ? answer.trim() : null, position: data!.qs.length }).select('id').single()
    if (qtype === 'true_false') await supabase.from('exam_options').insert([{ question_id: q!.id, label: 'Vrai', is_correct: correct === 0, position: 0 }, { question_id: q!.id, label: 'Faux', is_correct: correct === 1, position: 1 }])
    else if (qtype === 'single') await supabase.from('exam_options').insert(opts.filter((o) => o.trim()).map((label, i) => ({ question_id: q!.id, label: label.trim(), is_correct: i === correct, position: i })))
    setPrompt(''); setOpts(['', '', '', '']); setCorrect(0); setAnswer(''); setPts(10); reload()
  }
  async function delQ(id: string) { await supabase.from('exam_questions').delete().eq('id', id); reload() }

  return (
    <div className="lmsfade" style={{ padding: '22px 30px 46px', maxWidth: 820 }}>
      <button onClick={() => nav('/exams')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, padding: 0 }}><Icon name="arrow-left" size={15} /> {t('exams')}</button>

      <Card style={{ padding: '18px 20px', marginBottom: 18 }}>
        <Field label={t('assignmentTitle')}><input defaultValue={exam.title} onBlur={(e) => saveMeta({ title: e.target.value })} style={inputCss} /></Field>
        <Field label={t('description')}><textarea defaultValue={exam.description ?? ''} onBlur={(e) => saveMeta({ description: e.target.value })} style={textareaCss} /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label={`${t('passScore')} (%)`}><input type="number" min={0} max={100} defaultValue={exam.pass_score} onBlur={(e) => saveMeta({ pass_score: Number(e.target.value) })} style={inputCss} /></Field>
          <Field label={t('status')}>
            <select value={exam.status} onChange={(e) => saveMeta({ status: e.target.value })} style={inputCss}><option value="draft">{t('drafts').replace(/s$/, '')}</option><option value="published">{t('published')}</option></select>
          </Field>
        </div>
        <div style={{ fontSize: 12, color: '#C99A2E', fontWeight: 600 }}><Icon name="alert-triangle" size={13} /> {t('examRequiredNote')}</div>
      </Card>

      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)', marginBottom: 10 }}>{t('questions')} ({data.qs.length})</div>
      {data.qs.map((q, i) => (
        <Card key={q.id} style={{ padding: '12px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--navy-800)' }}>{i + 1}. {q.prompt} <span style={{ fontSize: 11, color: '#9AA7B8' }}>· {q.points} pts</span></span>
            <button onClick={() => delQ(q.id)} style={{ border: 'none', background: 'none', color: '#D14343', cursor: 'pointer' }}><Icon name="trash-2" size={15} /></button>
          </div>
          {(q.options ?? []).map((o: any) => <div key={o.id} style={{ fontSize: 12.5, color: o.is_correct ? '#1F8A5B' : '#5B6B82', fontWeight: o.is_correct ? 700 : 500 }}>{o.is_correct ? '✓' : '○'} {o.label}</div>)}
          {q.question_type === 'short_answer' && <div style={{ fontSize: 12.5, color: '#1F8A5B', fontWeight: 700 }}>✎ {q.answer_text}</div>}
        </Card>
      ))}

      <Card style={{ padding: '16px 18px', marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Field label={t('questionType')}><select value={qtype} onChange={(e) => setQtype(e.target.value as any)} style={inputCss}><option value="single">{t('typeSingle')}</option><option value="true_false">{t('typeTrueFalse')}</option><option value="short_answer">{t('typeShort')}</option></select></Field>
          <Field label={t('points')}><input type="number" min={1} value={pts} onChange={(e) => setPts(Number(e.target.value))} style={inputCss} /></Field>
        </div>
        <Field label={t('question')}><input value={prompt} onChange={(e) => setPrompt(e.target.value)} style={inputCss} /></Field>
        {qtype === 'single' && opts.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <button onClick={() => setCorrect(i)} style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, border: 'none', cursor: 'pointer', background: correct === i ? '#EAF6EF' : '#F1F4F8', color: correct === i ? '#1F8A5B' : '#B0BCCB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={correct === i ? 'check-circle' : 'circle'} size={16} /></button>
            <input value={o} onChange={(e) => setOpts((os) => os.map((x, j) => j === i ? e.target.value : x))} placeholder={`${t('option')} ${String.fromCharCode(65 + i)}`} style={{ ...inputCss, height: 38 }} />
          </div>
        ))}
        {qtype === 'true_false' && ['Vrai', 'Faux'].map((label, i) => (
          <button key={i} onClick={() => setCorrect(i)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', marginBottom: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${correct === i ? '#1F8A5B' : 'var(--border)'}`, background: correct === i ? '#EAF6EF' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)' }}><Icon name={correct === i ? 'check-circle' : 'circle'} size={16} color={correct === i ? '#1F8A5B' : '#B0BCCB'} />{label}</button>
        ))}
        {qtype === 'short_answer' && <Field label={t('acceptedAnswer')}><input value={answer} onChange={(e) => setAnswer(e.target.value)} style={inputCss} /></Field>}
        <BtnPrimary onClick={addQuestion}><Icon name="plus" size={15} />{t('addQuestion')}</BtnPrimary>
      </Card>
    </div>
  )
}
