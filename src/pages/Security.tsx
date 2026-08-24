import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../components/Icon'
import { Card, Loader, PageWrap } from '../components/ui'

/** Account security — enrol / remove TOTP two-factor authentication (authenticator app). */
export default function Security() {
  const { data, loading, reload } = useAsync(async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    const totp = (data?.totp ?? [])
    return { verified: totp.find((f) => f.status === 'verified') ?? null }
  }, [])

  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setError(null); setBusy(true)
    // Remove any leftover unverified factors so enrol doesn't fail.
    const { data: f } = await supabase.auth.mfa.listFactors()
    for (const x of (f?.totp ?? [])) if (x.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: x.id })
    const { data: en, error: e } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${Date.now()}` })
    setBusy(false)
    if (e || !en) { setError(e?.message ?? 'error'); return }
    setEnroll({ factorId: en.id, qr: en.totp.qr_code, secret: en.totp.secret })
  }

  async function confirm() {
    if (!enroll) return
    setBusy(true); setError(null)
    const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId })
    if (cErr || !ch) { setError(cErr?.message ?? 'error'); setBusy(false); return }
    const { error: vErr } = await supabase.auth.mfa.verify({ factorId: enroll.factorId, challengeId: ch.id, code: code.trim() })
    setBusy(false)
    if (vErr) { setError(vErr.message); return }
    setEnroll(null); setCode(''); reload()
  }

  async function disable(id: string) {
    if (!window.confirm('Disable two-factor authentication for your account?')) return
    await supabase.auth.mfa.unenroll({ factorId: id })
    reload()
  }

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)', marginBottom: 4 }}>Security</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>Protect your account with two-factor authentication (2FA).</div>

      <Card style={{ padding: '20px 22px', maxWidth: 540 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: data.verified ? '#EAF6EF' : '#F1F4F8', color: data.verified ? '#1F8A5B' : '#8494A8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={data.verified ? 'shield-check' : 'shield'} size={20} /></div>
          <div>
            <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 15 }}>Authenticator app (TOTP)</div>
            <div style={{ fontSize: 12.5, color: data.verified ? '#1F8A5B' : '#8494A8', fontWeight: 600 }}>{data.verified ? 'Enabled' : 'Not enabled'}</div>
          </div>
          <div style={{ flex: 1 }} />
          {data.verified
            ? <button onClick={() => disable(data.verified!.id)} style={{ border: '1px solid var(--border)', background: '#fff', color: '#D14343', fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 9, cursor: 'pointer' }}>Disable</button>
            : !enroll && <button onClick={start} disabled={busy} style={{ background: 'var(--navy-800)', color: '#fff', border: 0, fontWeight: 700, fontSize: 13, padding: '10px 16px', borderRadius: 9, cursor: 'pointer' }}>{busy ? '…' : 'Enable 2FA'}</button>}
        </div>

        {enroll && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border-soft)' }}>
            <div style={{ fontSize: 13, color: '#33415A', fontWeight: 600, marginBottom: 12 }}>1. Scan this QR code with Google Authenticator, Authy, or a similar app.</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ width: 168, height: 168, background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: 8 }} dangerouslySetInnerHTML={{ __html: enroll.qr }} />
              <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>Or enter the key manually:<br /><code style={{ fontSize: 12.5, color: 'var(--navy-800)', fontWeight: 700, wordBreak: 'break-all' }}>{enroll.secret}</code></div>
            </div>
            <div style={{ fontSize: 13, color: '#33415A', fontWeight: 600, margin: '18px 0 8px' }}>2. Enter the 6-digit code to confirm.</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000"
                style={{ height: 44, width: 150, border: '1px solid var(--border)', borderRadius: 10, padding: '0 14px', fontSize: 18, letterSpacing: 5, textAlign: 'center', fontWeight: 800, color: 'var(--navy-800)', outline: 'none' }} />
              <button onClick={confirm} disabled={busy || code.length < 6} style={{ height: 44, background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, fontWeight: 800, fontSize: 14, padding: '0 20px', borderRadius: 10, cursor: 'pointer' }}>{busy ? '…' : 'Confirm'}</button>
              <button onClick={() => { setEnroll(null); setCode(''); setError(null) }} style={{ height: 44, background: 'none', border: 0, color: '#8494A8', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 14, fontSize: 12.5, color: '#c0392b', fontWeight: 700, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10 }}>{error}</div>}
      </Card>
    </PageWrap>
  )
}
