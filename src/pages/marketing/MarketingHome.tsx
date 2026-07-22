import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import CourseCard, { Corners, PublicCourse } from './CourseCard'
import { Arrow } from './MarketingLayout'
import { IMG } from './images'
import Photo from './Photo'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className="mkt-kicker" style={{ marginBottom: 12 }}>{children}</span>
}

export default function MarketingHome() {
  const nav = useNavigate()
  useDocumentHead({
    title: 'Asirem Academy · Tax preparation training',
    description: 'Practical, certification-ready tax preparation and insurance training — launch a career in the tax industry with Asirem.',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Asirem Academy', description: 'Tax preparation and insurance training academy.' },
  })
  const { data: featured } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_courses')
    return ((data ?? []) as PublicCourse[]).slice(0, 3)
  }, [])

  const why = [
    { t: 'Concrete skills', d: 'Real return scenarios, not abstract theory. You practice on genuine files from week one.', icon: <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z M9 12l2 2 4-4" /> },
    { t: 'Professional software', d: 'Master the tax tools used by firms. You graduate job-ready, able to handle real clients.', icon: <><rect x="5" y="3" width="14" height="18" rx="1.5" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></> },
    { t: 'Recognized certification', d: 'Guided AFSP / IRS exam prep, with support all the way to your certification.', icon: <><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7 4.5-2.7 4.5 2.7-1.5-7" /></> },
  ]
  const steps = [
    { no: '01', name: 'Pre-registration', dur: '10 min', detail: 'Reserve your spot online in minutes, no commitment.' },
    { no: '02', name: 'Online training', dur: '3–8 weeks', detail: 'Videos, hands-on exercises and professional software, at your own pace.' },
    { no: '03', name: 'Certification', dur: '1–3 weeks', detail: 'Sit the AFSP / IRS exam, supported by our certified instructors.' },
    { no: '04', name: 'Launch your practice', dur: 'Tax season', detail: 'Start earning a living in the tax industry from your very first season.' },
  ]
  const stats = [['1,200+', 'Students trained'], ['95%', 'Success rate'], ['12 yrs', 'Of expertise']]

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      {/* Hero */}
      <section style={{ ...wrap, padding: 'clamp(48px,7vw,92px) clamp(20px,5vw,64px) clamp(40px,5vw,60px)', display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,.85fr)', gap: 'clamp(28px,5vw,72px)', alignItems: 'center' }} className="grid-2">
        <div>
          <Kicker>Professional training · Tax & Insurance</Kicker>
          <h1 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: 'clamp(40px,5.4vw,76px)', lineHeight: 1.02, letterSpacing: '.01em' }}>
            <span style={{ display: 'block' }}>Launch your career</span>
            <span style={{ display: 'block' }}>in tax</span>
            <span style={{ display: 'block', color: 'var(--color-accent)' }}>preparation.</span>
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '52ch', color: 'var(--color-neutral-700)', margin: '26px 0 0' }}>Gain practical skills, master professional software, and get ready to earn a living in the tax industry — guided by Asirem's experts.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
            <button type="button" className="btn btn-primary" onClick={() => nav('/contact')} style={{ padding: '12px 22px', fontSize: 15 }}>Pre-register</button>
            <button type="button" className="btn btn-secondary" onClick={() => nav('/courses')} style={{ padding: '12px 22px', fontSize: 15 }}>View courses</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, marginTop: 40, paddingTop: 26, borderTop: '1px solid var(--color-divider)' }}>
            {stats.map(([v, l]) => (
              <div key={l}><div style={{ fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1 }}>{v}</div><div style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginTop: 6 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <figure className="blueprint duotone" style={{ aspectRatio: '4/5', background: 'var(--color-accent-100)' }}>
          <Photo src={IMG.hero} alt="Tax professional at work" label="Photo — training / students" eager />
          <Corners />
        </figure>
      </section>

      {/* Why */}
      <section style={{ ...wrap, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,64px)' }}>
        <Kicker>01 · Why Asirem Academy</Kicker>
        <hr style={{ height: 1, border: 0, background: 'var(--color-divider)', margin: '0 0 32px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,40px)' }} className="grid-3">
          {why.map((w) => (
            <div key={w.t} className="blueprint" style={{ padding: 26 }}>
              <Corners />
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{w.icon}</svg>
              <h3 style={{ fontSize: 22, textTransform: 'uppercase', margin: '18px 0 8px' }}>{w.t}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-700)' }}>{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured courses (real data) */}
      {featured && featured.length > 0 && (
        <section style={{ ...wrap, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,64px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div>
              <Kicker>02 · Featured programs</Kicker>
              <hr style={{ height: 1, border: 0, background: 'var(--color-divider)', width: 200, margin: 0 }} />
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => nav('/courses')} style={{ fontSize: 15 }}>All courses <Arrow /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,32px)' }} className="grid-3">
            {featured.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
        </section>
      )}

      {/* Journey */}
      <section style={{ ...wrap, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,64px)' }}>
        <Kicker>03 · Your path</Kicker>
        <div className="blueprint" style={{ position: 'relative', marginTop: 20 }}>
          <Corners />
          <header style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid var(--color-divider)' }}>
            <span style={{ flex: 1, minWidth: '16ch', padding: '12px 22px', fontSize: 13, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' }}>From sign-up to your first tax season</span>
            <span style={{ borderLeft: '1px solid var(--color-divider)', padding: '12px 22px', fontSize: 13, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>Program · 4 steps</span>
          </header>
          {steps.map((s) => (
            <div key={s.no} style={{ display: 'grid', gridTemplateColumns: '64px 1.1fr 22% 2fr', gap: '12px 16px', alignItems: 'baseline', padding: '16px 22px', borderBottom: '1px solid color-mix(in srgb,var(--color-text) 8%,transparent)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--color-accent-700)' }}>{s.no}</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 19, textTransform: 'uppercase' }}>{s.name}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{s.dur}</span>
              <span style={{ fontSize: 14, color: 'var(--color-neutral-700)' }}>{s.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: 'clamp(48px,7vw,88px) clamp(20px,5vw,64px)', textAlign: 'center' }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" style={{ margin: '0 auto 20px' }}><path d="M10 11c0-2.2-1.8-4-4-4H4v4c0 1.1.9 2 2 2h1l-1 4h4l1-4v-2Zm10 0c0-2.2-1.8-4-4-4h-2v4c0 1.1.9 2 2 2h1l-1 4h4l1-4v-2Z" /></svg>
        <blockquote style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.28, margin: 0, maxWidth: '24ch', marginInline: 'auto' }}>I am committed to making sure you receive the highest quality of professional service.</blockquote>
        <figcaption style={{ marginTop: 24, fontSize: 15, color: 'var(--color-neutral-700)' }}><strong style={{ fontFamily: 'var(--font-heading)', letterSpacing: '.02em' }}>Jean Rollin Deshommes</strong> — Founder & CEO, Asirem</figcaption>
      </section>

      {/* CTA */}
      <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
        <div className="blueprint" style={{ background: 'var(--color-accent-900)', color: 'var(--color-bg)', padding: 'clamp(32px,5vw,56px)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '24px 40px', alignItems: 'center' }}>
          <Corners />
          <div>
            <h2 style={{ fontSize: 'clamp(28px,3.4vw,40px)', textTransform: 'uppercase', margin: '0 0 10px', lineHeight: 1.05 }}>Our very first course is online.</h2>
            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'color-mix(in srgb,var(--color-bg) 82%,transparent)' }}>Official launch — limited seats for the first cohort. Reserve yours today.</p>
          </div>
          <button type="button" className="btn" onClick={() => nav('/contact')} style={{ background: 'var(--color-bg)', color: 'var(--color-accent-900)', borderColor: 'var(--color-bg)', padding: '14px 26px', fontSize: 16, whiteSpace: 'nowrap' }}>Sign me up <Arrow /></button>
        </div>
      </section>
    </div>
  )
}
