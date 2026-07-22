import { useDocumentHead } from '../../lib/seo'
import { Corners } from './CourseCard'
import { IMG, coverStyle } from './images'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const

const stats = [['1,200+', 'Students trained'], ['95%', 'Success rate'], ['12', 'Years of experience'], ['8', 'Programs']]
const teamImg = [IMG.team1, IMG.team2, IMG.team3]
const values = [
  { title: 'Rigor', body: 'Taxation leaves no room for approximation. We train for precision and compliance.' },
  { title: 'Accessibility', body: 'Clear programs, built for people starting from scratch — no jargon, no gatekeeping.' },
  { title: 'Community', body: 'Serving our community is an honor: we support every student all the way through.' },
]
const team = [
  { name: 'Jean Rollin Deshommes', role: 'Founder & CEO' },
  { name: 'Nadège Étienne', role: 'Instructor — Tax' },
  { name: 'Marc-Antoine Louis', role: 'Instructor — Software & Certification' },
]

export default function MarketingAbout() {
  useDocumentHead({ title: 'Asirem Academy · About', description: 'Asirem Academy trains the next generation of tax professionals with concrete skills and recognized certification.' })
  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,80px) clamp(20px,5vw,64px)', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'clamp(28px,5vw,64px)', alignItems: 'center' }} className="grid-2">
        <div>
          <span className="mkt-kicker" style={{ marginBottom: 14 }}>Who we are</span>
          <h1 style={{ fontSize: 'clamp(34px,4.4vw,58px)', textTransform: 'uppercase', lineHeight: 1.03 }}>Serving our community is an honor and a joy.</h1>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--color-neutral-700)', margin: '24px 0 0' }}>Asirem Academy is a brand of Expert Media Group and Expert Financial Group. From life and health insurance to tax preparation services, we make it simple to protect what matters most — and we train the next generation of tax professionals.</p>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--color-neutral-700)', margin: '16px 0 0' }}>Our mission: to pass on concrete skills and recognized certification so anyone can build a stable, rewarding career.</p>
        </div>
        <figure className="blueprint duotone" style={{ aspectRatio: '5/6', background: 'var(--color-accent-100)' }}>
          <img src={IMG.about} alt="The Asirem team" style={coverStyle} />
          <Corners />
        </figure>
      </section>

      <section style={{ ...wrap, padding: 'clamp(24px,3vw,40px) clamp(20px,5vw,64px)' }}>
        <div className="blueprint" style={{ background: 'var(--color-accent-900)', color: 'var(--color-bg)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, overflow: 'hidden' }}>
          <Corners />
          {stats.map(([v, l]) => (
            <div key={l} style={{ padding: 'clamp(24px,3vw,40px) 20px', textAlign: 'center', boxShadow: '0 0 0 1px color-mix(in srgb,var(--color-bg) 14%,transparent)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(34px,4vw,52px)', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 10, color: 'color-mix(in srgb,var(--color-bg) 78%,transparent)' }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...wrap, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,64px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 32 }}>Our values</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,40px)' }} className="grid-3">
          {values.map((v) => (
            <div key={v.title} style={{ borderTop: '2px solid var(--color-accent)', paddingTop: 20 }}>
              <h3 style={{ fontSize: 22, textTransform: 'uppercase', margin: '0 0 10px' }}>{v.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-700)' }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...wrap, padding: 'clamp(24px,3vw,40px) clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 32 }}>The team</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(24px,4vw,48px)' }} className="grid-3">
          {team.map((m, i) => (
            <div key={m.name} style={{ textAlign: 'center' }}>
              <figure className="blueprint duotone" style={{ margin: '0 auto 18px', width: 150, height: 150, background: 'var(--color-accent-100)' }}>
                <img src={teamImg[i]} alt={m.name} style={coverStyle} />
                <Corners />
              </figure>
              <h3 style={{ fontSize: 20, textTransform: 'uppercase', margin: '0 0 4px' }}>{m.name}</h3>
              <p style={{ fontSize: 14, color: 'var(--color-accent-700)' }}>{m.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
