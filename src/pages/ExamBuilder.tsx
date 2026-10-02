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

  const [editingId, setEditingId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [qtype, setQtype] = useState<'single' | 'multiple' | 'true_false' | 'short_answer'>('single')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [correct, setCorrect] = useState(0)
  const [multi, setMulti] = useState<number[]>([])
  const toggleMulti = (i: number) => setMulti((m) => m.includes(i) ? m.filter((x) => x !== i) : [...m, i])
  const [answer, setAnswer] = useState('')
  const [pts, setPts] = useState(10)

  if (loading || !data?.exam) return <Loader />
  const exam = data.exam

  async function saveMeta(patch: any) { await supabase.from('exams').update(patch).eq('id', examId!); reload() }

  function resetForm() { setEditingId(null); setPrompt(''); setQtype('single'); setOpts(['', '', '', '']); setCorrect(0); setMulti([]); setAnswer(''); setPts(10) }

  // Load an existing question back into the form for editing.
  function editQ(q: any) {
    setEditingId(q.id); setPrompt(q.prompt); setQtype(q.question_type); setPts(q.points)
    const options = [...(q.options ?? [])].sort((a: any, b: any) => a.position - b.position)
    if (q.question_type === 'short_answer') { setAnswer(q.answer_text ?? ''); setOpts(['', '', '', '']); setCorrect(0); setMulti([]) }
    else if (q.question_type === 'true_false') { const tf = options.find((o: any) => /^true$/i.test(o.label)); setCorrect(tf?.is_correct ? 0 : 1); setOpts(['', '', '', '']); setMulti([]); setAnswer('') }
    else {
      const labels = options.map((o: any) => o.label); while (labels.length < 4) labels.push('')
      setOpts(labels); setAnswer('')
      if (q.question_type === 'single') { setCorrect(Math.max(0, options.findIndex((o: any) => o.is_correct))); setMulti([]) }
      else { setMulti(options.map((o: any, i: number) => (o.is_correct ? i : -1)).filter((i: number) => i >= 0)); setCorrect(0) }
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  // Build the option rows for the current form state, keyed to a question id.
  function optionRows(qid: string) {
    if (qtype === 'true_false') return [{ question_id: qid, label: 'True', is_correct: correct === 0, position: 0 }, { question_id: qid, label: 'False', is_correct: correct === 1, position: 1 }]
    if (qtype === 'single') return opts.filter((o) => o.trim()).map((label, i) => ({ question_id: qid, label: label.trim(), is_correct: i === correct, position: i }))
    if (qtype === 'multiple') return opts.map((o, i) => ({ label: o.trim(), keep: !!o.trim(), correct: multi.includes(i) })).filter((o) => o.keep).map((o, i) => ({ question_id: qid, label: o.label, is_correct: o.correct, position: i }))
    return []
  }

  async function saveQuestion() {
    if (!prompt.trim()) return
    if (qtype === 'short_answer' && !answer.trim()) return
    if ((qtype === 'single' || qtype === 'multiple') && opts.filter((o) => o.trim()).length < 2) return
    if (qtype === 'multiple' && !opts.some((o, i) => o.trim() && multi.includes(i))) return
    const meta = { prompt: prompt.trim(), question_type: qtype, points: pts, answer_text: qtype === 'short_answer' ? answer.trim() : null }
    if (editingId) {
      // Edit: update the question, then replace its options wholesale.
      await supabase.from('exam_questions').update(meta).eq('id', editingId)
      await supabase.from('exam_options').delete().eq('question_id', editingId)
      const rows = optionRows(editingId)
      if (rows.length) await supabase.from('exam_options').insert(rows)
    } else {
      const { data: q } = await supabase.from('exam_questions').insert({ exam_id: examId!, ...meta, position: data!.qs.length }).select('id').single()
      const rows = optionRows(q!.id)
      if (rows.length) await supabase.from('exam_options').insert(rows)
    }
    resetForm(); reload()
  }
  async function delQ(id: string) { if (!window.confirm(t('confirmDelete'))) return; if (editingId === id) resetForm(); await supabase.from('exam_questions').delete().eq('id', id); reload() }

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
        <Card key={q.id} style={{ padding: '12px 16px', marginBottom: 8, border: editingId === q.id ? '1.5px solid #D9A441' : undefined, background: editingId === q.id ? '#FBF7EE' : undefined }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: 'var(--navy-800)' }}>{i + 1}. {q.prompt} <span style={{ fontSize: 11, color: '#9AA7B8' }}>· {q.points} pts</span></span>
            <button onClick={() => editQ(q)} title={t('edit')} style={{ border: 'none', background: 'none', color: 'var(--blue)', cursor: 'pointer' }}><Icon name="pencil" size={15} /></button>
            <button onClick={() => delQ(q.id)} style={{ border: 'none', background: 'none', color: '#D14343', cursor: 'pointer' }}><Icon name="trash-2" size={15} /></button>
          </div>
          {(q.options ?? []).map((o: any) => <div key={o.id} style={{ fontSize: 12.5, color: o.is_correct ? '#1F8A5B' : '#5B6B82', fontWeight: o.is_correct ? 700 : 500 }}>{o.is_correct ? '✓' : '○'} {o.label}</div>)}
          {q.question_type === 'short_answer' && <div style={{ fontSize: 12.5, color: '#1F8A5B', fontWeight: 700 }}>✎ {q.answer_text}</div>}
        </Card>
      ))}

      <Card style={{ padding: '16px 18px', marginTop: 8, border: editingId ? '1.5px solid #D9A441' : undefined }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13.5, color: editingId ? '#C99A2E' : 'var(--navy-800)', marginBottom: 10 }}>{editingId ? `✎ ${t('edit')}` : t('addQuestion')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <Field label={t('questionType')}><select value={qtype} onChange={(e) => setQtype(e.target.value as any)} style={inputCss}><option value="single">{t('typeSingle')}</option><option value="multiple">{t('typeMultiple')}</option><option value="true_false">{t('typeTrueFalse')}</option><option value="short_answer">{t('typeShort')}</option></select></Field>
          <Field label={t('points')}><input type="number" min={1} value={pts} onChange={(e) => setPts(Number(e.target.value))} style={inputCss} /></Field>
        </div>
        <Field label={t('question')}><input value={prompt} onChange={(e) => setPrompt(e.target.value)} style={inputCss} /></Field>
        {qtype === 'single' && opts.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
            <button onClick={() => setCorrect(i)} style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, border: 'none', cursor: 'pointer', background: correct === i ? '#EAF6EF' : '#F1F4F8', color: correct === i ? '#1F8A5B' : '#B0BCCB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={correct === i ? 'check-circle' : 'circle'} size={16} /></button>
            <input value={o} onChange={(e) => setOpts((os) => os.map((x, j) => j === i ? e.target.value : x))} placeholder={`${t('option')} ${String.fromCharCode(65 + i)}`} style={{ ...inputCss, height: 38 }} />
          </div>
        ))}
        {qtype === 'multiple' && (
          <>
            <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginBottom: 8 }}>{t('multipleHint')}</div>
            {opts.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <button onClick={() => toggleMulti(i)} style={{ width: 30, height: 30, flex: 'none', borderRadius: 8, border: 'none', cursor: 'pointer', background: multi.includes(i) ? '#EAF6EF' : '#F1F4F8', color: multi.includes(i) ? '#1F8A5B' : '#B0BCCB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={multi.includes(i) ? 'check-square' : 'square'} size={16} /></button>
                <input value={o} onChange={(e) => setOpts((os) => os.map((x, j) => j === i ? e.target.value : x))} placeholder={`${t('option')} ${String.fromCharCode(65 + i)}`} style={{ ...inputCss, height: 38 }} />
              </div>
            ))}
          </>
        )}
        {qtype === 'true_false' && ['True', 'False'].map((label, i) => (
          <button key={i} onClick={() => setCorrect(i)} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', marginBottom: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${correct === i ? '#1F8A5B' : 'var(--border)'}`, background: correct === i ? '#EAF6EF' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--ink-soft)' }}><Icon name={correct === i ? 'check-circle' : 'circle'} size={16} color={correct === i ? '#1F8A5B' : '#B0BCCB'} />{label}</button>
        ))}
        {qtype === 'short_answer' && <Field label={t('acceptedAnswer')}><input value={answer} onChange={(e) => setAnswer(e.target.value)} style={inputCss} /></Field>}
        <div style={{ display: 'flex', gap: 10 }}>
          <BtnPrimary onClick={saveQuestion}><Icon name={editingId ? 'save' : 'plus'} size={15} />{editingId ? t('save') : t('addQuestion')}</BtnPrimary>
          {editingId && <BtnGhost onClick={resetForm}>{t('cancel')}</BtnGhost>}
        </div>
      </Card>
    </div>
  )
}
