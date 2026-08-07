import { useState } from 'react'
import { useDocumentHead } from '../../lib/seo'
import { Corners } from './CourseCard'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const

function InfoRow({ icon, label, value, last }: { icon: JSX.Element; label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 0', borderTop: '1px solid var(--color-divider)', borderBottom: last ? '1px solid var(--color-divider)' : undefined }}>
      <span style={{ flex: 'none', marginTop: 2, color: 'var(--color-accent)' }}>{icon}</span>
      <div><div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div><div style={{ fontSize: 15, color: 'var(--color-neutral-700)', marginTop: 2 }}>{value}</div></div>
    </div>
  )
}

export default function MarketingContact() {
  useDocumentHead({ title: 'Asirem Academy · Contact', description: 'Book a free consultation with an Asirem expert and get advice tailored to your project.' })
  const [sent, setSent] = useState(false)

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,76px) clamp(20px,5vw,64px) clamp(48px,7vw,88px)', display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 'clamp(32px,5vw,72px)' }} className="grid-2">
        <div>
          <span className="mkt-kicker" style={{ marginBottom: 14 }}>Contact & pre-registration</span>
          <h1 style={{ fontSize: 'clamp(34px,4.4vw,56px)', textTransform: 'uppercase', lineHeight: 1.03, margin: '0 0 16px' }}>Book your free consultation</h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--color-neutral-700)', margin: '0 0 20px', maxWidth: '52ch' }}>Take the first step. Schedule a free conversation with an Asirem expert — by phone, video call, or in person — and get advice tailored to your project.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <InfoRow label="Address" value="1821 S. Dixie Highway, Pompano Beach, FL 33060" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>} />
            <InfoRow label="Phone" value="1-833-747-0398 · 561-771-2030" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" /></svg>} />
            <InfoRow label="Email" value="info@asirem.us" last icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>} />
          </div>
        </div>
        <div className="blueprint" style={{ padding: 'clamp(24px,3vw,36px)', alignSelf: 'start' }}>
          <Corners />
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px' }}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></svg>
              <h3 style={{ fontSize: 24, textTransform: 'uppercase', margin: '0 0 8px' }}>Message sent</h3>
              <p style={{ fontSize: 15, color: 'var(--color-neutral-700)' }}>Thank you! An Asirem expert will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 22, textTransform: 'uppercase' }}>Request a callback</h3>
              <div className="field"><label>Full name</label><input className="input" type="text" required placeholder="Your name" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field"><label>Email</label><input className="input" type="email" required placeholder="you@example.com" /></div>
                <div className="field"><label>Phone</label><input className="input" type="tel" placeholder="(000) 000-0000" /></div>
              </div>
              <div className="field"><label>Program you're interested in</label>
                <select className="input" style={{ appearance: 'auto' }}>
                  <option>Tax preparation — fundamentals</option>
                  <option>Professional tax software</option>
                  <option>Insurance & Medicare</option>
                  <option>AFSP / IRS certification</option>
                  <option>Not sure yet</option>
                </select>
              </div>
              <div className="field"><label>Message</label><textarea className="input" placeholder="Tell us about your project…" /></div>
              <button type="submit" className="btn btn-primary btn-block" style={{ minHeight: 44, fontSize: 15 }}>Send my request</button>
              <p style={{ fontSize: 12, color: 'var(--color-neutral-600)', textAlign: 'center' }}>Reply within 24 h · No-obligation consultation</p>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
