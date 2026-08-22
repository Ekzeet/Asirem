import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { Icon } from './Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss } from './Modal'
import { FileUpload } from './FileUpload'
import { RichTextEditor } from './RichText'

export type EditableCourse = {
  id?: string; title: string; subtitle: string | null; description?: string | null; category: string | null
  level: string | null; price_cents: number; instructor_id: string | null; accent: string | null; icon: string | null; status: string
  is_live?: boolean; zoom_url?: string | null; module_lock?: boolean
  credit_hours?: number | null; slug?: string; cover_url?: string | null
  sale_price_cents?: number | null; sale_starts_at?: string | null; sale_ends_at?: string | null
  instructor_request_price_cents?: number | null
}

/** yyyy-mm-dd for a date input; '' when null. */
const toDateInput = (iso: string | null | undefined) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

const ACCENTS = [
  'linear-gradient(135deg,#0F2C4C,#1B4B7F)',
  'linear-gradient(135deg,#1B5FB0,#2E7DD1)',
  'linear-gradient(135deg,#7C5CD6,#9B7BE8)',
  'linear-gradient(135deg,#1F8A5B,#35A874)',
  'linear-gradient(135deg,#C99A2E,#E7B450)',
  'linear-gradient(135deg,#556575,#6E8093)',
]
const ICONS = ['file-text', 'landmark', 'shield', 'heart-pulse', 'monitor', 'stethoscope', 'book-open', 'briefcase', 'calculator', 'trending-up']
const CATEGORIES = ['Tax', 'Insurance', 'Health', 'Software', 'Medicare', 'Finance']

export function CourseFormModal({ existing, onClose, onSaved }: {
  existing?: EditableCourse | null
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const isStaff = me!.role === 'institution_admin' || me!.role === 'super_admin'

  const [form, setForm] = useState<EditableCourse>(existing ?? {
    title: '', subtitle: '', description: '', category: 'Tax', level: 'Beginner',
    price_cents: 9900, instructor_id: me!.role === 'teacher' ? me!.userId : null, accent: ACCENTS[0], icon: ICONS[0], status: 'draft',
    is_live: false, zoom_url: '', module_lock: false, credit_hours: null, slug: '', cover_url: null,
    sale_price_cents: null, sale_starts_at: null, sale_ends_at: null, instructor_request_price_cents: null,
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
    // slug is NOT NULL + unique per institution; auto-derive from the title when the
    // admin leaves it blank so course creation never collides on an empty slug.
    const slug = ((form.slug ?? '').trim() ||
      (form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).slice(2, 6)))
    const payload = {
      institution_id: me!.institutionId,
      title: form.title.trim(), subtitle: form.subtitle, description: form.description,
      category: form.category, level: form.level, price_cents: form.price_cents,
      instructor_id: form.instructor_id ?? (me!.role === 'teacher' ? me!.userId : null),
      accent: form.accent, icon: form.icon, status: form.status,
      is_live: form.is_live ?? false, zoom_url: form.zoom_url || null, module_lock: form.module_lock ?? false,
      credit_hours: form.credit_hours ?? null, slug,
      sale_price_cents: form.sale_price_cents ?? null,
      sale_starts_at: form.sale_starts_at ?? null,
      sale_ends_at: form.sale_ends_at ?? null,
      instructor_request_price_cents: form.instructor_request_price_cents ?? null,
      published_at: form.status === 'published' ? new Date().toISOString() : null,
      ...(form.cover_url !== undefined ? { cover_url: form.cover_url } : {}),
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
      <Field label={t('description')}><RichTextEditor value={form.description ?? ''} onChange={(v) => set('description', v)} minHeight={110} placeholder="Describe the course…" /></Field>

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

      <div style={{ padding: '12px 14px', background: '#FBF7EC', border: '1px solid #EBD9A8', borderRadius: 11, marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#8A6D1F', marginBottom: 10 }}>{t('salePromo')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Field label={t('salePriceUsd')}><input type="number" min={0} value={form.sale_price_cents != null ? form.sale_price_cents / 100 : ''} onChange={(e) => set('sale_price_cents', e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))} style={inputCss} /></Field>
          <Field label={t('couponStart')}><input type="date" value={toDateInput(form.sale_starts_at)} onChange={(e) => set('sale_starts_at', e.target.value ? new Date(e.target.value + 'T00:00:00').toISOString() : null)} style={inputCss} /></Field>
          <Field label={t('couponEnd')}><input type="date" value={toDateInput(form.sale_ends_at)} onChange={(e) => set('sale_ends_at', e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : null)} style={inputCss} /></Field>
        </div>
        <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginTop: 8 }}>{t('saleHint')}</div>
      </div>

      <Field label={t('requestPriceUsd')}>
        <input type="number" min={0} value={form.instructor_request_price_cents != null ? form.instructor_request_price_cents / 100 : ''} onChange={(e) => set('instructor_request_price_cents', e.target.value === '' ? null : Math.round(Number(e.target.value) * 100))} style={inputCss} placeholder="0" />
        <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginTop: 6 }}>{t('requestPriceHint')}</div>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('creditHours')}><input type="number" step="0.5" min="0" value={form.credit_hours ?? ''} onChange={(e) => set('credit_hours', e.target.value === '' ? null : Number(e.target.value))} style={inputCss} /></Field>
        <Field label={t('slug')}><input value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} style={inputCss} /></Field>
      </div>

      {isStaff && (
        <Field label={t('instructor')}>
          <select value={form.instructor_id ?? ''} onChange={(e) => set('instructor_id', e.target.value || null)} style={inputCss}>
            <option value="">—</option>
            {teachers.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </select>
        </Field>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', background: '#F7F9FC', border: '1px solid var(--border)', borderRadius: 11, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.is_live} onChange={(e) => set('is_live', e.target.checked)} /> {t('liveCourse')}
        </label>
        {form.is_live && (
          <input value={form.zoom_url ?? ''} onChange={(e) => set('zoom_url', e.target.value)} placeholder={t('zoomUrlHint')} style={inputCss} />
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!form.module_lock} onChange={(e) => set('module_lock', e.target.checked)} /> {t('moduleLock')}
        </label>
      </div>

      <Field label={t('cover') + ' — thumbnail'}>
        {form.cover_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <img src={form.cover_url} alt="cover" style={{ width: 120, height: 76, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} />
            <button onClick={() => set('cover_url', null)} style={{ border: '1px solid var(--border)', background: '#fff', color: '#D14343', fontWeight: 700, fontSize: 12.5, padding: '7px 12px', borderRadius: 9, cursor: 'pointer' }}>Remove image</button>
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            <FileUpload bucket="blog-media" pathPrefix={me!.institutionId} accept="image/*" label="Upload thumbnail image"
              onUploaded={(path) => set('cover_url', supabase.storage.from('blog-media').getPublicUrl(path).data.publicUrl)} />
          </div>
        )}
        <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600, marginBottom: 6 }}>Or pick a color (used when no image):</div>
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
