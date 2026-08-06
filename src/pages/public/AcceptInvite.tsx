import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useI18n } from '../../i18n/I18nContext'

/** Landing page for the invite/recovery link: the invited user (teacher/student)
 *  sets their name + password here, then goes to their dashboard. */
export default function AcceptInvite() {
  const { t, lang } = useI18n()
  const [ready, setReady] = useState<'checking' | 'ok' | 'nosession'>('checking')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // The invite link establishes a session (detectSessionInUrl). Give it a moment.
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setReady('ok')
        setName((data.session.user.user_metadata?.full_name as string) ?? '')
      } else {
        setReady('nosession')
      }
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) { setReady('ok'); setName((s.user.user_metadata?.full_name as string) ?? '') } })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    if (password.length < 8) { setError(lang === 'es' ? 'Mínimo 8 caracteres' : 'Minimum 8 characters'); return }
    if (password !== confirm) { setError(lang === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'); return }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password, data: { full_name: name.trim() } })
    setBusy(false)
    if (error) { setError(error.message); return }
    window.location.href = '/' // reload → AuthContext routes to the right dashboard
  }

  const T = {
    title: lang === 'es' ? 'Configura tu cuenta' : 'Set up your account',
    sub: lang === 'es' ? 'Elige una contraseña para acceder a tu panel.' : 'Choose a password to access your dashboard.',
    newPass: lang === 'es' ? 'Nueva contraseña' : 'New password',
    confirm: lang === 'es' ? 'Confirmar contraseña' : 'Confirm password',
    save: lang === 'es' ? 'Guardar y continuar' : 'Save and continue',
    expired: lang === 'es' ? 'Este enlace de invitación no es válido o ha expirado.' : 'This invitation link is invalid or has expired.',
    goLogin: lang === 'es' ? 'Ir a iniciar sesión' : 'Go to login',
  }
  const inputCss: React.CSSProperties = { width: '100%', padding: '11px 12px', borderRadius: 10, border: '1px solid var(--border-soft)', fontSize: 15, fontWeight: 600, color: 'var(--navy-800)', background: '#fff', outline: 'none' }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <div style={{ border: '1px solid var(--border-soft)', borderRadius: 16, padding: '28px 26px', background: '#fff' }}>
        {ready === 'nosession' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
            <p style={{ color: '#5B6B82', fontWeight: 600 }}>{T.expired}</p>
            <a href="/login" style={{ display: 'inline-block', marginTop: 12, background: 'var(--navy-800)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{T.goLogin}</a>
          </div>
        ) : (
          <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{T.title}</div>
            <div style={{ color: '#5B6B82', fontWeight: 600, fontSize: 14, marginTop: -4, marginBottom: 4 }}>{T.sub}</div>
            <input style={inputCss} placeholder={t('fullName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <input style={inputCss} type="password" placeholder={T.newPass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
            <input style={inputCss} type="password" placeholder={T.confirm} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            {error && <div style={{ color: '#c0392b', fontWeight: 700, fontSize: 13 }}>{error}</div>}
            <button type="submit" disabled={busy || ready !== 'ok'} style={{ width: '100%', background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, padding: '13px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>{busy ? '…' : T.save}</button>
          </form>
        )}
      </div>
    </div>
  )
}
