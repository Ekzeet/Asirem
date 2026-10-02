import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { Icon } from '../components/Icon'

/** Shown after password login when the account has 2FA enrolled but the session is still aal1. */
export default function MfaChallenge() {
  const { refreshMfa, signOut } = useAuth()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function verify(e?: React.FormEvent) {
    e?.preventDefault()
    setBusy(true); setError(null)
    const { data: f } = await supabase.auth.mfa.listFactors()
    const factor = (f?.totp ?? []).find((x) => x.status === 'verified')
    if (!factor) { setError('No authenticator is enrolled.'); setBusy(false); return }
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: factor.id })
    if (cErr || !ch) { setError(cErr?.message ?? 'Challenge failed'); setBusy(false); return }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: ch.id, code: code.trim() })
    setBusy(false)
    if (vErr) { setError(vErr.message); return }
    await refreshMfa()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg,#F4F6F9)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, background: '#fff', border: '1px solid var(--border-soft,#E6EBF1)', borderRadius: 16, padding: 32, boxShadow: '0 10px 30px rgba(15,44,76,.08)' }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Icon name="shield-check" size={26} /></div>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>Two-factor authentication</div>
        <div style={{ fontSize: 13.5, color: '#5B6B82', fontWeight: 500, margin: '6px 0 20px' }}>Enter the 6-digit code from your authenticator app.</div>
        <form onSubmit={verify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoFocus placeholder="000000"
            style={{ height: 52, border: '1px solid var(--border,#E2E8F0)', borderRadius: 12, padding: '0 16px', fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: 800, color: 'var(--navy-800)', outline: 'none' }} />
          {error && <div style={{ fontSize: 12.5, color: '#c0392b', fontWeight: 700, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10 }}>{error}</div>}
          <button type="submit" disabled={busy || code.length < 6} style={{ height: 46, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', fontWeight: 800, fontSize: 14 }}>{busy ? '…' : 'Verify'}</button>
        </form>
        <button onClick={() => signOut()} style={{ marginTop: 16, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#8494A8' }}>Sign out</button>
      </div>
    </div>
  )
}
