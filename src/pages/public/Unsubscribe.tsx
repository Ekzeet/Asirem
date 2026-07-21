import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'

type Prefs = { welcome: boolean; receipt: boolean; progress_nudge: boolean; winback: boolean; unsubscribed_all: boolean }

export default function Unsubscribe() {
  const { token } = useParams()
  const { t } = useI18n()
  useDocumentHead({ title: t('emailPrefs') })
  const [busy, setBusy] = useState(false)
  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.rpc('get_email_prefs', { p_token: token! })
    return (data ?? null) as Prefs | null
  }, [token])

  async function setAll(all: boolean) {
    setBusy(true)
    await supabase.rpc('set_email_unsubscribed', { p_token: token!, p_all: all })
    setBusy(false)
    reload()
  }

  if (loading) return <Loader />

  return (
    <div style={{ maxWidth: 520, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 24, marginBottom: 10 }}>{t('emailPrefs')}</h1>
      {!data ? (
        <p style={{ color: '#8494A8', fontWeight: 600 }}>{t('invalidLink')}</p>
      ) : data.unsubscribed_all ? (
        <>
          <p style={{ color: '#5B6B82', fontWeight: 600, marginBottom: 18 }}>{t('unsubscribed')}</p>
          <button onClick={() => setAll(false)} disabled={busy} style={{ background: 'var(--navy-800)', color: '#fff', border: 0, padding: '11px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : t('resubscribe')}</button>
        </>
      ) : (
        <>
          <p style={{ color: '#5B6B82', fontWeight: 600, marginBottom: 18 }}>{t('subscribed')}</p>
          <button onClick={() => setAll(true)} disabled={busy} style={{ background: '#FBEBEB', color: '#D14343', border: 0, padding: '11px 22px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : t('unsubscribeAll')}</button>
        </>
      )}
    </div>
  )
}
