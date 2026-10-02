import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { moneyFull } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { Card, Loader, PageWrap } from '../../components/ui'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss } from '../../components/Modal'
import { FileUpload } from '../../components/FileUpload'
import { RichTextEditor } from '../../components/RichText'

type Ebook = {
  id: string; title: string; subtitle: string | null; author: string | null; description: string | null
  cover_url: string | null; file_path: string | null; file_name: string | null; price_cents: number; status: string; slug: string
}

export default function AdminEbooks() {
  const { me } = useAuth()
  const { t } = useI18n()
  const inst = me!.institutionId
  const [editing, setEditing] = useState<Ebook | 'new' | null>(null)

  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.from('ebooks')
      .select('id,title,subtitle,author,description,cover_url,file_path,file_name,price_cents,status,slug')
      .eq('institution_id', inst).order('position', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    return (data ?? []) as Ebook[]
  }, [inst])

  async function del(e: Ebook) {
    if (!window.confirm(t('deleteEbookConfirm').replace('{title}', e.title))) return
    await supabase.from('ebooks').delete().eq('id', e.id)
    reload()
  }

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{t('ebooks')}</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setEditing('new')} style={{ height: 40, padding: '0 16px', borderRadius: 11, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="plus" size={16} />{t('newEbook')}
        </button>
      </div>

      {data.length === 0 && <Card style={{ padding: 28, textAlign: 'center', color: '#8494A8', fontWeight: 600 }}>{t('noEbooks')}</Card>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {data.map((e) => (
          <Card key={e.id} style={{ overflow: 'hidden' }}>
            <div style={{ height: 150, background: e.cover_url ? `center/cover no-repeat url(${e.cover_url})` : 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: e.status === 'published' ? 'rgba(31,138,91,.9)' : 'rgba(0,0,0,.42)', padding: '3px 10px', borderRadius: 20 }}>{e.status === 'published' ? t('published') : t('drafts').replace(/s$/, '')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setEditing(e)} title={t('edit')} style={ovBtn}><Icon name="pencil" size={15} /></button>
                <button onClick={() => del(e)} title={t('delete')} style={{ ...ovBtn, color: '#D14343' }}><Icon name="trash-2" size={15} /></button>
              </div>
            </div>
            <div style={{ padding: '13px 15px 15px' }}>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, margin: '3px 0 10px' }}>{e.author ?? '—'}{e.file_path ? '' : ` · ${t('noFile')}`}</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 17, color: 'var(--navy-800)' }}>{e.price_cents === 0 ? 'Free' : moneyFull(e.price_cents)}</div>
            </div>
          </Card>
        ))}
      </div>
      {editing && <EbookModal inst={inst} userId={me!.userId} existing={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />}
    </PageWrap>
  )
}

const ovBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 9, border: 'none', background: 'rgba(255,255,255,.92)', color: '#0F2C4C', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }

function EbookModal({ inst, userId, existing, onClose, onSaved }: { inst: string; userId: string; existing: Ebook | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [f, setF] = useState({
    title: existing?.title ?? '', subtitle: existing?.subtitle ?? '', author: existing?.author ?? '',
    description: existing?.description ?? '', cover_url: existing?.cover_url ?? null as string | null,
    file_path: existing?.file_path ?? null as string | null, file_name: existing?.file_name ?? null as string | null,
    price: existing ? existing.price_cents / 100 : 19, status: existing?.status ?? 'draft',
  })
  const set = (k: string, v: unknown) => setF((o) => ({ ...o, [k]: v }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!f.title.trim()) { setError(t('titleRequired')); return }
    if (!f.file_path) { setError(t('ebookFileRequired')); return }
    setBusy(true); setError(null)
    const slug = existing?.slug ?? (f.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Math.random().toString(36).slice(2, 6))
    const payload = {
      institution_id: inst, title: f.title.trim(), subtitle: f.subtitle || null, author: f.author || null,
      description: f.description || null, cover_url: f.cover_url, file_path: f.file_path, file_name: f.file_name,
      price_cents: Math.round(f.price * 100), status: f.status, slug,
    }
    const { error } = existing
      ? await supabase.from('ebooks').update(payload).eq('id', existing.id)
      : await supabase.from('ebooks').insert({ ...payload, created_by: userId })
    if (error) { setError(error.message); setBusy(false); return }
    setBusy(false); onSaved()
  }

  return (
    <Modal title={existing ? t('editEbook') : t('newEbook')} onClose={onClose} width={560}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={save} disabled={busy}><Icon name="check" size={16} />{existing ? t('save') : t('create')}</BtnPrimary></>}>
      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      <Field label={t('title')}><input value={f.title} onChange={(e) => set('title', e.target.value)} style={inputCss} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('subtitle')}><input value={f.subtitle} onChange={(e) => set('subtitle', e.target.value)} style={inputCss} /></Field>
        <Field label={t('author')}><input value={f.author} onChange={(e) => set('author', e.target.value)} style={inputCss} /></Field>
      </div>
      <Field label={t('description')}><RichTextEditor value={f.description} onChange={(v) => set('description', v)} minHeight={100} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('priceUsd')}><input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value))} style={inputCss} /></Field>
        <Field label={t('status')}>
          <select value={f.status} onChange={(e) => set('status', e.target.value)} style={inputCss}>
            <option value="draft">{t('drafts').replace(/s$/, '')}</option>
            <option value="published">{t('published')}</option>
          </select>
        </Field>
      </div>
      <Field label={t('cover') + ' — image'}>
        {f.cover_url
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}><img src={f.cover_url} alt="" style={{ width: 90, height: 58, objectFit: 'cover', borderRadius: 8 }} /><button onClick={() => set('cover_url', null)} style={{ border: '1px solid var(--border)', background: '#fff', color: '#D14343', fontWeight: 700, fontSize: 12, padding: '6px 11px', borderRadius: 8, cursor: 'pointer' }}>{t('remove')}</button></div>
          : <FileUpload bucket="blog-media" pathPrefix={inst} accept="image/*" label={t('uploadCover')} onUploaded={(p) => set('cover_url', supabase.storage.from('blog-media').getPublicUrl(p).data.publicUrl)} />}
      </Field>
      <Field label={t('ebookFile') + ' (PDF / EPUB)'}>
        <FileUpload bucket="ebooks" pathPrefix={inst} accept=".pdf,.epub,application/pdf,application/epub+zip" currentPath={f.file_path} label={t('uploadEbookFile')}
          onUploaded={(p, file) => setF((o) => ({ ...o, file_path: p, file_name: file.name }))} />
        {f.file_name && <div style={{ fontSize: 11.5, color: '#1F8A5B', fontWeight: 600, marginTop: 6 }}>✓ {f.file_name}</div>}
      </Field>
    </Modal>
  )
}
