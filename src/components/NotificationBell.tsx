import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { relTime } from '../lib/format'
import { Icon } from './Icon'

type Notif = { id: string; kind: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }

const KIND_ICON: Record<string, [string, string, string]> = {
  grade: ['clipboard-check', '#F3EDFB', '#7C5CD6'],
  certificate: ['award', '#FBF1E1', '#C99A2E'],
  info: ['bell', '#EAF1FB', '#1B5FB0'],
}

export default function NotificationBell() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notif[]>([])
  const ref = useRef<HTMLDivElement>(null)

  async function load() {
    const { data } = await supabase.from('notifications').select('id,kind,title,body,link,read_at,created_at').eq('user_id', me!.userId).order('created_at', { ascending: false }).limit(15)
    setItems((data ?? []) as Notif[])
  }
  useEffect(() => { load(); const id = setInterval(load, 60000); return () => clearInterval(id) }, [me!.userId])
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const unread = items.filter((n) => !n.read_at).length

  async function toggle() {
    const next = !open; setOpen(next)
    if (next && unread > 0) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', me!.userId).is('read_at', null)
      setItems((xs) => xs.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={toggle} style={{ width: 40, height: 40, borderRadius: 11, border: '1px solid #E2E8F0', background: '#fff', color: '#5B6B82', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        <Icon name="bell" size={18} />
        {unread > 0 && <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 8, background: '#D14343', color: '#fff', fontSize: 9.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #fff' }}>{unread}</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 48, width: 320, maxHeight: 420, overflowY: 'auto', background: '#fff', border: '1px solid var(--border)', borderRadius: 14, boxShadow: '0 16px 40px rgba(11,32,56,.18)', zIndex: 60 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 14, color: 'var(--navy-800)' }}>{t('notifications')}</div>
          {items.length === 0 && <div style={{ padding: 20, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>{t('noNotifications')}</div>}
          {items.map((n) => {
            const [icon, tint, color] = KIND_ICON[n.kind] ?? KIND_ICON.info
            return (
              <button key={n.id} onClick={() => { setOpen(false); if (n.link) { if (/^https?:\/\//.test(n.link)) { window.open(n.link, '_blank', 'noopener') } else { nav(n.link) } } }} style={{ display: 'flex', gap: 11, width: '100%', padding: '11px 14px', border: 'none', borderTop: '1px solid var(--border-soft)', background: n.read_at ? '#fff' : '#F7FAFF', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 9, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--navy-800)' }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: '#5B6B82', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600, marginTop: 1 }}>{relTime(n.created_at, lang)}</div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
