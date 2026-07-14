import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../i18n/I18nContext'
import { Icon } from './Icon'

/** Uploads a file to a Storage bucket under `${pathPrefix}/<uuid>-<name>` and returns the object path. */
export function FileUpload({ bucket, pathPrefix, accept, label, currentPath, onUploaded }: {
  bucket: string
  pathPrefix: string
  accept?: string
  label?: string
  currentPath?: string | null
  onUploaded: (path: string, file: File) => void
}) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(currentPath ? currentPath.split('/').pop() ?? null : null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(null)
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${pathPrefix}/${crypto.randomUUID()}-${safe}`
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type })
    setBusy(false)
    if (error) { setError(error.message); return }
    setName(file.name)
    onUploaded(path, file)
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={onPick} style={{ display: 'none' }} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} style={{
        display: 'flex', alignItems: 'center', gap: 9, width: '100%', height: 44, padding: '0 14px', borderRadius: 11,
        border: '1.5px dashed var(--border)', background: '#F7F9FC', color: 'var(--ink-soft)', cursor: busy ? 'default' : 'pointer', fontWeight: 600, fontSize: 13,
      }}>
        {busy ? <span className="spin" style={{ width: 18, height: 18 }} /> : <Icon name={name ? 'check-circle' : 'upload-cloud'} size={18} color={name ? '#1F8A5B' : '#9AA7B8'} />}
        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {busy ? (t('uploading')) : name ? name : (label ?? t('chooseFile'))}
        </span>
      </button>
      {error && <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600, marginTop: 6 }}>{error}</div>}
    </div>
  )
}
