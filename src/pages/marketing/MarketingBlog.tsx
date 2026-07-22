import { useDocumentHead } from '../../lib/seo'
import { Corners } from './CourseCard'
import { IMG } from './images'
import Photo from './Photo'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const

const featured = { cat: 'News', date: 'Jun 20, 2026', read: '10 min', title: 'The 2026 tax season: start preparing now', excerpt: 'Regulatory changes, deadlines and strategy to approach the coming season a step ahead. Our team breaks down what changes this year.' }
const posts = [
  { cat: 'Tips', date: 'Jun 12, 2026', read: '6 min', title: '5 common mistakes on the 1040 return', excerpt: 'The errors that cost your clients dearly — and how to avoid them every time.' },
  { cat: 'Career', date: 'May 28, 2026', read: '9 min', title: 'Becoming a tax preparer in 2026', excerpt: 'The complete guide: training, certification, business status and first income.' },
  { cat: 'Insurance', date: 'May 14, 2026', read: '7 min', title: 'Understanding Obamacare premium tax credits', excerpt: 'Who qualifies, how to calculate them and how to weave them into client advice.' },
  { cat: 'Software', date: 'May 2, 2026', read: '5 min', title: 'Which tax software should you start with?', excerpt: 'A comparison of professional solutions suited to new preparers.' },
  { cat: 'Insurance', date: 'Apr 20, 2026', read: '8 min', title: 'Medicare at 65: what you need to know', excerpt: 'The key enrollment steps and the pitfalls to avoid at retirement.' },
  { cat: 'Tips', date: 'Apr 6, 2026', read: '4 min', title: 'Organize your tax season stress-free', excerpt: 'Method, tools and a checklist to handle more files, calmly.' },
]

export default function MarketingBlog() {
  useDocumentHead({ title: 'Asirem Academy · Blog', description: 'Tips, tax news and career guides for the tax preparation and insurance industry.' })
  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,76px) clamp(20px,5vw,64px) clamp(24px,3vw,36px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 14 }}>Resources</span>
        <h1 style={{ fontSize: 'clamp(36px,4.6vw,60px)', textTransform: 'uppercase', lineHeight: 1.02 }}>The Asirem blog</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '58ch', color: 'var(--color-neutral-700)', margin: '22px 0 0' }}>Tips, tax news and career guides to grow in the tax preparation and insurance industry.</p>
      </section>

      <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(32px,4vw,48px)' }}>
        <article className="blueprint grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', background: 'transparent' }}>
          <Corners />
          <figure className="duotone" style={{ minHeight: 280, position: 'relative', borderRight: '1px solid var(--color-divider)', background: 'var(--color-accent-100)' }}>
            <Photo src={IMG.blog} alt={featured.title} label="Featured image" />
          </figure>
          <div style={{ padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}><span className="tag tag-outline">{featured.cat}</span><span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{featured.date}</span></div>
            <h2 style={{ fontSize: 'clamp(24px,2.8vw,34px)', textTransform: 'uppercase', lineHeight: 1.08, margin: '0 0 14px' }}>{featured.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-700)', margin: '0 0 22px' }}>{featured.excerpt}</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-neutral-600)' }}>{featured.read} read</span>
          </div>
        </article>
      </section>

      <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,32px)' }} className="grid-3">
          {posts.map((p) => (
            <article key={p.title} className="blueprint" style={{ display: 'flex', flexDirection: 'column', background: 'transparent' }}>
              <Corners />
              <div style={{ aspectRatio: '16/9', background: 'var(--color-accent-100)', borderBottom: '1px solid var(--color-divider)', display: 'grid', placeItems: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z" /><path d="M13 3v6h6" /><path d="M9 13h6M9 17h6" /></svg>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><span className="tag tag-accent">{p.cat}</span><span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{p.date}</span></div>
                <h3 style={{ fontSize: 19, textTransform: 'uppercase', lineHeight: 1.14 }}>{p.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-neutral-700)', flex: 1 }}>{p.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--color-divider)' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{p.read} read</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
