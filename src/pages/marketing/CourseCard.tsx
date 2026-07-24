import { useNavigate } from 'react-router-dom'

export type PublicCourse = {
  id: string; slug: string; title: string; subtitle: string | null; category: string | null
  level: string | null; price_cents: number; currency: string; credit_hours: number | null
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase(), maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

const Corners = () => (<><i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" /></>)

/** Blueprint course card (design system) wired to a real published course. */
export default function CourseCard({ c }: { c: PublicCourse }) {
  const nav = useNavigate()
  const meta = (icon: JSX.Element, text: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{icon}{text}</span>
  )
  return (
    <article className="blueprint" style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}>
      <Corners />
      <div onClick={() => nav(`/courses/${c.slug}`)} style={{ aspectRatio: '16/10', background: 'var(--color-accent-100)', borderBottom: '1px solid var(--color-divider)', display: 'grid', placeItems: 'center', position: 'relative', cursor: 'pointer' }}>
        {c.category && <span className="tag tag-accent" style={{ position: 'absolute', top: 12, left: 12 }}>{c.category}</span>}
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4 2 9l10 5 10-5-10-5Z" /><path d="M6 11.5V16c0 1.1 2.7 2.5 6 2.5s6-1.4 6-2.5v-4.5" /></svg>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <h3 style={{ fontSize: 20, textTransform: 'uppercase', lineHeight: 1.1, cursor: 'pointer' }} onClick={() => nav(`/courses/${c.slug}`)}>{c.title}</h3>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-neutral-700)', flex: 1 }}>{c.subtitle}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--color-neutral-600)' }}>
          {c.credit_hours ? meta(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>, `${c.credit_hours} hrs`) : null}
          {c.level ? meta(<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-6" /></svg>, c.level) : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--color-divider)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 24 }}>{c.price_cents ? money(c.price_cents, c.currency) : 'Free'}</span>
          <button type="button" className="btn btn-primary" onClick={() => nav(`/courses/${c.slug}`)}>Enroll</button>
        </div>
      </div>
    </article>
  )
}

export { Corners, money }
