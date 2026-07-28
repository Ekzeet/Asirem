import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import { Icon } from '../components/Icon'

export default function LoginPage() {
  const { t, lang, setLang } = useI18n()
  const { signIn } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const signupCopy = lang === 'fr' ? 'Espace formateur' : lang === 'es' ? 'Espacio instructor' : 'Instructor sign-up'
  const toLogin = lang === 'fr' ? 'Déjà un compte ? Se connecter' : lang === 'es' ? '¿Ya tienes cuenta? Inicia sesión' : 'Already have an account? Log in'
  const toSignup = lang === 'fr' ? 'Formateur ? Créer un compte' : lang === 'es' ? '¿Instructor? Crea una cuenta' : 'Instructor? Create an account'
  const studentNote = lang === 'fr' ? 'Étudiant ? Ton compte est créé automatiquement à l’achat d’un cours.' : lang === 'es' ? '¿Estudiante? Tu cuenta se crea al comprar un curso.' : 'Student? Your account is created when you buy a course.'

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password)
      if (error) setError(error)
      setBusy(false)
      return
    }
    // Teacher self-signup: metadata signup_role=teacher → trigger grants a teacher membership.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name.trim(), signup_role: 'teacher' } },
    })
    setBusy(false)
    if (error) { setError(error.message); return }
    if (!data.session) { setInfo(lang === 'fr' ? 'Compte créé — vérifie ton email pour confirmer, puis connecte-toi.' : 'Account created — check your email to confirm, then log in.'); setMode('login') }
    // else: session active → AuthContext picks up the teacher role on next tick.
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg)' }}>
      <div style={{ background: 'linear-gradient(160deg,#0F2C4C 0%,#0B2038 100%)', color: '#fff', padding: '54px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -80, top: -60, width: 320, height: 320, borderRadius: '50%', background: 'rgba(217,164,65,.14)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#E7B450,#D9A441)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2C4C', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 23, boxShadow: '0 4px 14px rgba(217,164,65,.35)' }}>A</div>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 20 }}>Asirem</div>
            <div style={{ fontSize: 11, color: '#8FA3BC', fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>Academy · LMS</div>
          </div>
        </div>
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 34, lineHeight: 1.2, marginBottom: 14 }}>{t('welcome')}</div>
          <div style={{ fontSize: 15, color: '#9DB4D0', lineHeight: 1.6 }}>{t('tagline')}</div>
        </div>
        <div style={{ position: 'relative', fontSize: 12.5, color: '#6E84A0', fontWeight: 600 }}>Tax · Insurance · Medicare · Finance</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 26 }}>
            {(['FR', 'EN', 'ES'] as const).map((c) => {
              const active = lang === c.toLowerCase()
              return <button key={c} onClick={() => setLang(c.toLowerCase() as any)} style={{ width: 36, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12, background: active ? 'var(--navy-800)' : '#EEF2F7', color: active ? '#fff' : 'var(--muted)' }}>{c}</button>
            })}
          </div>

          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 6 }}>{mode === 'login' ? t('login') : signupCopy}</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 24 }}>{mode === 'login' ? `${t('welcomeBack')} 👋` : studentNote}</div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('fullName')}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} type="text" required style={inputStyle} />
              </label>
            )}
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('email')}</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('password')}</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} style={inputStyle} />
            </label>
            {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10 }}>{error}</div>}
            {info && <div style={{ fontSize: 12.5, color: '#1F8A5B', fontWeight: 600, background: '#EAF6EF', padding: '9px 12px', borderRadius: 10 }}>{info}</div>}
            <button type="submit" disabled={busy} style={{ height: 46, borderRadius: 12, border: 'none', cursor: busy ? 'default' : 'pointer', background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 14px rgba(217,164,65,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {busy ? <span className="spin" style={{ width: 18, height: 18, borderTopColor: '#0F2C4C' }} /> : <><Icon name={mode === 'login' ? 'log-in' : 'user-plus'} size={17} /> {mode === 'login' ? t('login') : signupCopy}</>}
            </button>
          </form>

          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setInfo(null) }}
            style={{ marginTop: 20, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--navy-800)' }}>
            {mode === 'login' ? toSignup : toLogin}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, marginTop: 6, border: '1px solid var(--border)', borderRadius: 11,
  background: '#F7F9FC', padding: '0 14px', fontSize: 14, color: 'var(--ink)', outline: 'none',
}
