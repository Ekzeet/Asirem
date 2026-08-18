import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Card, Loader, PageWrap } from '../../components/ui'

type Row = { ebook_id: string; ebook: { title: string; author: string | null; cover_url: string | null } | null }

export default function Library() {
  const { me } = useAuth()
  const { t } = useI18n()
  const [busy, setBusy] = useState<string | null>(null)

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.from('ebook_access')
      .select('ebook_id, ebook:ebooks(title, author, cover_url)')
      .eq('user_id', me!.userId).order('created_at', { ascending: false })
    return (data ?? []) as unknown as Row[]
  }, [me!.userId])

  async function download(ebookId: string) {
    setBusy(ebookId)
    const { data, error } = await supabase.functions.invoke('download-ebook', { body: { ebook_id: ebookId } })
    setBusy(null)
    if (error || !(data as any)?.url) { alert((data as any)?.error ?? error?.message ?? 'download_failed'); return }
    window.location.href = (data as any).url
  }

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)', marginBottom: 18 }}>{t('myLibrary')}</div>
      {data.length === 0 ? (
        <Card style={{ padding: 28, textAlign: 'center', color: '#8494A8', fontWeight: 600 }}>{t('noPurchasedEbooks')}</Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {data.map((r) => (
            <Card key={r.ebook_id} style={{ overflow: 'hidden' }}>
              <div style={{ aspectRatio: '3 / 2', background: r.ebook?.cover_url ? `center/cover no-repeat url(${r.ebook.cover_url})` : 'linear-gradient(135deg,#0F2C4C,#1B4B7F)' }} />
              <div style={{ padding: '13px 15px 15px' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14.5, color: 'var(--navy-800)', lineHeight: 1.3 }}>{r.ebook?.title ?? '—'}</div>
                <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, margin: '3px 0 12px' }}>{r.ebook?.author ?? ''}</div>
                <button onClick={() => download(r.ebook_id)} disabled={busy === r.ebook_id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--navy-800)', color: '#fff', border: 0, padding: '9px 14px', borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  <Icon name={busy === r.ebook_id ? 'loader' : 'download'} size={15} /> {t('download')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageWrap>
  )
}
