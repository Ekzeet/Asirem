import { useNavigate } from 'react-router-dom'
import { Users, GraduationCap, Link2 } from 'lucide-react'
import { IMG } from './images'

const NAVY = '#0b2143'
const GOLD = '#c6a052'

/** Dark, brand-navy hero (EduFlex-style): headline + CTAs + stats on the left,
 *  a photo collage with decorative shapes on the right. Full-bleed navy background. */
export default function HeroBrand() {
  const nav = useNavigate()

  const photo = (src: string, style: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', borderRadius: 18, backgroundImage: `url(${src})`, backgroundSize: 'cover',
    backgroundPosition: 'center', border: '6px solid rgba(255,255,255,.05)',
    boxShadow: '0 24px 50px rgba(0,0,0,.45)', ...style,
  })

  const stats: { icon: React.ReactNode; value: string; label: string; onClick?: () => void }[] = [
    { icon: <Users size={18} />, value: '1,200+', label: 'Active students' },
    { icon: <GraduationCap size={18} />, value: '12', label: 'Expert instructors' },
    { icon: <Link2 size={18} />, value: '', label: 'Resources', onClick: () => nav('/books') },
  ]

  return (
    <section style={{ background: NAVY, color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div className="grid-2" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(48px,6vw,96px) clamp(20px,5vw,64px)', display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'center' }}>
        {/* Left */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 'clamp(38px,5.4vw,68px)', lineHeight: 1.04, letterSpacing: '-.01em', margin: 0 }}>
            A new way to learn <br />&amp; <span style={{ color: GOLD }}>launch your career</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,1.6vw,19px)', lineHeight: 1.6, color: 'rgba(255,255,255,.72)', maxWidth: '46ch', margin: '22px 0 0' }}>
            Asirem Academy gives you practical courses and expert instructors to build a career in tax preparation and insurance — at your own pace.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 32 }}>
            <button onClick={() => nav('/courses')} style={{ background: GOLD, color: NAVY, border: 0, borderRadius: 12, padding: '14px 26px', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15.5, cursor: 'pointer', letterSpacing: '.01em' }}>Join the Class</button>
            <button onClick={() => nav('/about')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.28)', borderRadius: 12, padding: '14px 26px', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 15.5, cursor: 'pointer' }}>Learn more</button>
          </div>

          <div style={{ display: 'flex', gap: 'clamp(20px,3vw,40px)', flexWrap: 'wrap', marginTop: 44 }}>
            {stats.map((s) => (
              <div key={s.label} onClick={s.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: s.onClick ? 'pointer' : 'default' }}>
                <span style={{ width: 44, height: 44, flex: 'none', borderRadius: '50%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD }}>{s.icon}</span>
                <div>
                  {s.value
                    ? <><div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, lineHeight: 1 }}>{s.value}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 3 }}>{s.label}</div></>
                    : <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 18 }}>{s.label}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — photo collage */}
        <div style={{ position: 'relative', minHeight: 'clamp(360px,42vw,520px)' }} aria-hidden="true">
          {/* decorative shapes */}
          <div style={{ position: 'absolute', top: '2%', left: '14%', width: 96, height: 96, borderRadius: '50%', background: '#12335a' }} />
          <div style={{ position: 'absolute', bottom: '3%', right: '1%', width: 74, height: 74, borderRadius: 14, background: GOLD }} />
          {/* photos — Tax Preparer promo takes the prominent (square) slot; woman-at-desk photo below */}
          <div style={photo(IMG.promo, { top: '0%', right: '0%', width: '56%', aspectRatio: '1 / 1' })} />
          <div style={photo(IMG.classroom, { bottom: '6%', right: '10%', width: '52%', aspectRatio: '3 / 2' })} />
          <div style={photo(IMG.hero, { bottom: '0%', left: '0%', width: '42%', aspectRatio: '3 / 4' })} />
        </div>
      </div>
    </section>
  )
}
