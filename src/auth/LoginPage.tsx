import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAuth } from './AuthContext'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './demoAccounts'
import { Icon } from '../components/Icon'
import { avatarGradient, initials } from '../lib/format'

export default function LoginPage() {
  const { t, roleName, lang, setLang } = useI18n()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('amina@meridian.test')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function doSignIn(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    if (error) setError(error)
    setBusy(false)
  }

  async function demo(acEmail: string) {
    setBusy(true)
    setError(null)
    const { error } = await signIn(acEmail, DEMO_PASSWORD)
    if (error) setError(error)
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--bg)' }}>
      {/* Brand panel */}
      <div style={{
        background: 'linear-gradient(160deg,#0F2C4C 0%,#0B2038 100%)', color: '#fff',
        padding: '54px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
      }}>
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
        <div style={{ position: 'relative', fontSize: 12.5, color: '#6E84A0', fontWeight: 600 }}>Fiscalité · Assurance · Medicare · Finance</div>
      </div>

      {/* Form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 26 }}>
            {(['FR', 'EN', 'ES'] as const).map((c) => {
              const active = lang === c.toLowerCase()
              return (
                <button key={c} onClick={() => setLang(c.toLowerCase() as any)} style={{
                  width: 36, height: 30, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12,
                  background: active ? 'var(--navy-800)' : '#EEF2F7', color: active ? '#fff' : 'var(--muted)',
                }}>{c}</button>
              )
            })}
          </div>

          <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 24, color: 'var(--ink)', marginBottom: 6 }}>{t('login')}</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 24 }}>{t('welcomeBack')} 👋</div>

          <form onSubmit={doSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('email')}</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                style={inputStyle} />
            </label>
            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>{t('password')}</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
                style={inputStyle} />
            </label>
            {error && (
              <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10 }}>{error}</div>
            )}
            <button type="submit" disabled={busy} style={{
              height: 46, borderRadius: 12, border: 'none', cursor: busy ? 'default' : 'pointer',
              background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', fontWeight: 800, fontSize: 14,
              boxShadow: '0 4px 14px rgba(217,164,65,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {busy ? <span className="spin" style={{ width: 18, height: 18, borderTopColor: '#0F2C4C' }} /> : <><Icon name="log-in" size={17} /> {t('login')}</>}
            </button>
          </form>

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .6, color: 'var(--muted-2)', textTransform: 'uppercase', marginBottom: 12 }}>{t('demoAccounts')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map((a) => (
                <button key={a.email} onClick={() => demo(a.email)} disabled={busy} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 12,
                  border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, flex: 'none', background: avatarGradient(a.name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12 }}>{initials(a.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{roleName(a.role)}</div>
                  </div>
                  <Icon name="arrow-right" size={16} color="var(--muted-2)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, marginTop: 6, border: '1px solid var(--border)', borderRadius: 11,
  background: '#F7F9FC', padding: '0 14px', fontSize: 14, color: 'var(--ink)', outline: 'none',
}
