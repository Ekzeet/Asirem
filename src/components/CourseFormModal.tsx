import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { Icon } from './Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss, textareaCss } from './Modal'

export type EditableCourse = {
  id?: string; title: string; subtitle: string | null; description?: string | null; category: string | null
  level: string | null; price_cents: number; instructor_id: string | null; accent: string | null; icon: string | null; status: string
}

const ACCENTS = [
  'linear-gradient(135deg,#0F2C4C,#1B4B7F)',
  'linear-gradient(135deg,#1B5FB0,#2E7DD1)',
  'linear-gradient(135deg,#7C5CD6,#9B7BE8)',
  'linear-gradient(135deg,#1F8A5B,#35A874)',
  'linear-gradient(135deg,#C99A2E,#E7B450)',
  'linear-gradient(135deg,#556575,#6E8093)',
]
const ICONS = ['file-text', 'landmark', 'shield', 'heart-pulse', 'monitor', 'stethoscope', 'book-open', 'briefcase', 'calculator', 'trending-up']
const CATEGORIES = ['Fiscalité', 'Assurance', 'Health', 'Logiciel', 'Medicare', 'Finance']

export function CourseFormModal({ existing, onClose, onSaved }: {
  existing?: EditableCourse | null
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const isStaff = me!.role === 'institution_admin' || me!.role === 'super_admin'

  const [form, setForm] = useState<EditableCourse>(existing ?? {
    title: '', subtitle: '', description: '', category: 'Fiscalité', level: 'Débutant',
    price_cents: 9900, instructor_id: me!.role === 'teacher' ? me!.userId : null, accent: ACCENTS[0], icon: ICONS[0], status: 'draft',
  })
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof EditableCourse, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    if (!isStaff) return
    supabase.from('memberships').select('user_id, profiles:profiles!memberships_user_profile_fkey(full_name)').eq('institution_id', me!.institutionId).eq('role', 'teacher')
      .then(({ data }) => setTeachers((data ?? []).map((m: any) => ({ id: m.user_id, name: m.profiles?.full_name ?? '—' }))))
  }, [isStaff, me])

  async function save() {
    if (!form.title.trim()) { setError('Title required'); return }
    setBusy(true); setError(null)
    const payload = {
      institution_id: me!.institutionId,
      title: form.title.trim(), subtitle: form.subtitle, description: form.description,
      category: form.category, level: form.level, price_cents: form.price_cents,
      instructor_id: form.instructor_id ?? (me!.role === 'teacher' ? me!.userId : null),
      accent: form.accent, icon: form.icon, status: form.status,
      published_at: form.status === 'published' ? new Date().toISOString() : null,
    }
    let id = existing?.id
    if (id) {
      const { error } = await supabase.from('courses').update(payload).eq('id', id)
      if (error) { setError(error.message); setBusy(false); return }
    } else {
      const { data, error } = await supabase.from('courses').insert({ ...payload, created_by: me!.userId }).select('id').single()
      if (error || !data) { setError(error?.message ?? 'Insert failed'); setBusy(false); return }
      id = data.id
    }
    setBusy(false)
    onSaved(id!)
  }

  const dollars = (form.price_cents / 100).toString()

  return (
    <Modal title={existing ? t('editCourse') : t('newCourse')} subtitle={t('courseFormSub')} onClose={onClose} width={560}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{existing ? t('save') : t('create')}</BtnPrimary></>}>
      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      <Field label={t('courseTitle')}><input value={form.title} onChange={(e) => set('title', e.target.value)} style={inputCss} /></Field>
      <Field label={t('subtitle')}><input value={form.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} style={inputCss} /></Field>
      <Field label={t('description')}><textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} style={textareaCss} /></Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('category')}>
          <select value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} style={inputCss}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label={t('level')}>
          <select value={form.level ?? ''} onChange={(e) => set('level', e.target.value)} style={inputCss}>
            {(lang === 'en' ? ['Beginner', 'Intermediate', 'Advanced'] : lang === 'es' ? ['Principiante', 'Intermedio', 'Avanzado'] : ['Débutant', 'Intermédiaire', 'Avancé']).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('priceUsd')}><input type="number" min={0} value={dollars} onChange={(e) => set('price_cents', Math.round(Number(e.target.value) * 100))} style={inputCss} /></Field>
        <Field label={t('status')}>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} style={inputCss}>
            <option value="draft">{t('drafts').replace(/s$/, '')}</option>
            <option value="published">{t('published')}</option>
          </select>
        </Field>
      </div>

      {isStaff && (
        <Field label={t('instructor')}>
          <select value={form.instructor_id ?? ''} onChange={(e) => set('instructor_id', e.target.value || null)} style={inputCss}>
            <option value="">—</option>
            {teachers.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </select>
        </Field>
      )}

      <Field label={t('cover')}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ACCENTS.map((a) => (
            <button key={a} onClick={() => set('accent', a)} style={{ width: 54, height: 34, borderRadius: 9, background: a, border: form.accent === a ? '2.5px solid #0F2C4C' : '2.5px solid transparent', cursor: 'pointer' }} />
          ))}
        </div>
      </Field>
      <Field label={t('icon')}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ICONS.map((ic) => (
            <button key={ic} onClick={() => set('icon', ic)} style={{ width: 40, height: 40, borderRadius: 10, background: form.icon === ic ? 'var(--navy-800)' : '#F1F4F8', color: form.icon === ic ? '#fff' : '#5B6B82', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={18} /></button>
          ))}
        </div>
      </Field>
    </Modal>
  )
}
