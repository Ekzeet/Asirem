import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Landing page for the emailed download link: forwards to the download broker, which 302s to the file. */
export default function EbookDownload() {
  const [sp] = useSearchParams()
  const token = sp.get('token')
  useEffect(() => {
    if (token) window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook?token=${encodeURIComponent(token)}`
  }, [token])
  return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--navy-800)', fontWeight: 700 }}>
      {token ? 'Starting your download…' : 'Missing download token.'}
    </div>
  )
}
