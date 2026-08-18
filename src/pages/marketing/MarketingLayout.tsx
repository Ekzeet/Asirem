import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IMG } from './images'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/books', label: 'Books' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}

/** Marketing chrome: the design's sticky blueprint nav + footer, in English. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const loc = useLocation()
  const nav = useNavigate()
  const cur = (to: string) => (to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to))
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <div className="mkt" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="mkt-nav">
        <img className="brand" src={IMG.logoColor} alt="Asirem Tax Academy" onClick={() => { nav('/'); close() }} style={{ height: 38, width: 'auto', display: 'block' }} />
        <button type="button" className="mkt-burger" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
        </button>
        <div className={`mkt-nav-links${menuOpen ? ' open' : ''}`}>
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} aria-current={cur(n.to) ? 'page' : undefined} onClick={close}>{n.label}</Link>
          ))}
          <Link to="/login" style={{ color: 'var(--color-neutral-700)' }} onClick={close}>Log in</Link>
          <button type="button" className="btn btn-primary" onClick={() => { nav('/contact'); close() }}>Pre-register</button>
        </div>
      </nav>

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{ borderTop: '1px solid var(--color-divider)', background: 'var(--color-surface)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,5vw,64px) clamp(20px,5vw,64px) clamp(28px,3vw,40px)', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 'clamp(24px,4vw,56px)' }} className="grid-2">
          <div>
            <img src={IMG.logoBlack} alt="Asirem Tax Academy" style={{ height: 44, width: 'auto', display: 'block', marginBottom: 14 }} />
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-neutral-700)', maxWidth: '34ch' }}>Train in tax preparation and insurance, and launch a career that protects families' financial futures.</p>
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 14 }}>Programs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
              <Link to="/courses">Tax preparation course</Link>
              <Link to="/courses">Professional tax software solutions</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 14 }}>Useful links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
              <Link to="/">Home</Link>
              <Link to="/about">About</Link>
              <Link to="/blog">Blog</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)', marginBottom: 14 }}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14, color: 'var(--color-neutral-700)' }}>
              <span>1821 S. Dixie Highway,<br />Pompano Beach, FL 33060</span>
              <span>1-833-747-0398</span>
              <span>info@asirem.us</span>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px clamp(20px,5vw,64px)', borderTop: '1px solid var(--color-divider)', display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', fontSize: 13, color: 'var(--color-neutral-600)' }}>
          <span>© {new Date().getFullYear()} Asirem Academy — An Expert Media Group &amp; Expert Financial Group brand.</span>
          <Link to="/legal/privacy">Privacy policy</Link>
        </div>
      </footer>
    </div>
  )
}

export { Arrow }
