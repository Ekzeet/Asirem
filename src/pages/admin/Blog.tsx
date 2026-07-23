import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Card, Loader, PageWrap } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss, textareaCss } from '../../components/Modal'
import { FileUpload } from '../../components/FileUpload'
import type { Database } from '../../lib/database.types'

type Post = Database['public']['Tables']['blog_posts']['Row']
type Draft = Partial<Post>

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function AdminBlog() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId
  const [editing, setEditing] = useState<Draft | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('blog_posts').select('*').eq('institution_id', inst).order('created_at', { ascending: false })
    return (data ?? []) as Post[]
  }, [inst])

  if (loading || !data) return <Loader />
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

  async function del(id: string) {
    if (!window.confirm(t('confirmDelete') || 'Delete this post?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    reload()
  }

  return (
    <PageWrap maxWidth={920}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--navy-800)' }}>{t('blog')}</div>
        <BtnPrimary onClick={() => setEditing({ status: 'draft', featured: false })}><Icon name="plus" size={16} />{t('newPost')}</BtnPrimary>
      </div>

      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noPosts')}</div>}
      <Card style={{ overflow: 'hidden' }}>
        {data.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ width: 46, height: 34, flex: 'none', borderRadius: 7, background: p.cover_url ? `center/cover url(${p.cover_url})` : '#EEF2F7', display: 'grid', placeItems: 'center', color: '#8494A8' }}>{!p.cover_url && <Icon name="file-text" size={15} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title} {p.featured && <span title="Featured" style={{ color: '#C99A2E' }}>★</span>}</div>
              <div style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{p.category ?? '—'} · {fmt(p.published_at)}</div>
            </div>
            <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: p.status === 'published' ? '#1F8A5B' : '#8494A8', background: p.status === 'published' ? '#EAF6EF' : '#EEF2F7', padding: '3px 9px', borderRadius: 20 }}>{p.status === 'published' ? t('published') : t('drafts')}</span>
            <button onClick={() => setEditing(p)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#5B6B82' }}><Icon name="pencil" size={16} /></button>
            <button onClick={() => del(p.id)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#D14343' }}><Icon name="trash-2" size={16} /></button>
          </div>
        ))}
      </Card>

      {editing && <PostModal draft={editing} inst={inst} authorId={me!.userId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </PageWrap>
  )
}

function PostModal({ draft, inst, authorId, onClose, onSaved }: { draft: Draft; inst: string; authorId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [form, setForm] = useState<Draft>(draft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof Post, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { setError('Title required'); return }
    setBusy(true); setError(null)
    const slug = (form.slug?.trim() || slugify(form.title) + '-' + Math.random().toString(36).slice(2, 6))
    const payload = {
      institution_id: inst, author_id: authorId, title: form.title.trim(), slug,
      excerpt: form.excerpt ?? null, body: form.body ?? null, category: form.category ?? null,
      cover_url: form.cover_url ?? null, read_minutes: form.read_minutes ?? null,
      featured: form.featured ?? false, status: form.status ?? 'draft',
      published_at: form.status === 'published' ? (form.published_at ?? new Date().toISOString()) : null,
    }
    const res = form.id
      ? await supabase.from('blog_posts').update(payload).eq('id', form.id)
      : await supabase.from('blog_posts').insert(payload)
    setBusy(false)
    if (res.error) { setError(res.error.message); return }
    onSaved()
  }

  return (
    <Modal title={form.id ? t('editPost') : t('newPost')} subtitle={t('blogSub')} onClose={onClose} width={600}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{form.id ? t('save') : t('create')}</BtnPrimary></>}>
      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      <Field label={t('postTitle')}><input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} style={inputCss} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('category')}><input value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} style={inputCss} placeholder="Tips / Career / …" /></Field>
        <Field label={t('slug')}><input value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} style={inputCss} placeholder="auto" /></Field>
      </div>
      <Field label={t('excerpt')}><textarea value={form.excerpt ?? ''} onChange={(e) => set('excerpt', e.target.value)} style={{ ...textareaCss, minHeight: 60 }} /></Field>
      <Field label={t('body')}><textarea value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} style={{ ...textareaCss, minHeight: 160 }} /></Field>
      <Field label={t('coverImage')}>
        <FileUpload bucket="blog-media" pathPrefix={inst} accept="image/*" label={t('uploadFile')} currentPath={undefined}
          onUploaded={(path) => set('cover_url', supabase.storage.from('blog-media').getPublicUrl(path).data.publicUrl)} />
        {form.cover_url && <img src={form.cover_url} alt="" style={{ marginTop: 8, width: 160, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />}
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
        <Field label={t('readMinutes')}><input type="number" min={1} value={form.read_minutes ?? ''} onChange={(e) => set('read_minutes', e.target.value === '' ? null : Number(e.target.value))} style={inputCss} /></Field>
        <Field label={t('status')}>
          <select value={form.status ?? 'draft'} onChange={(e) => set('status', e.target.value)} style={inputCss}>
            <option value="draft">{t('drafts').replace(/s$/, '')}</option>
            <option value="published">{t('published').replace(/s$/, '')}</option>
          </select>
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13.5, fontWeight: 600, color: 'var(--navy-800)', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} /> {t('featurePost')}
      </label>
    </Modal>
  )
}
