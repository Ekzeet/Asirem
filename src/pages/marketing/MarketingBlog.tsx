import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'
import { Corners } from './CourseCard'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const

type Post = { id: string; slug: string; title: string; excerpt: string | null; category: string | null; cover_url: string | null; read_minutes: number | null; featured: boolean; published_at: string | null; author_name: string | null }

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '')

function CoverPlaceholder({ small }: { small?: boolean }) {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: small ? undefined : 280, background: 'var(--color-accent-100)', display: 'grid', placeItems: 'center' }}>
      <svg width={small ? 40 : 52} height={small ? 40 : 52} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9Z" /><path d="M13 3v6h6" /><path d="M9 13h6M9 17h6" /></svg>
    </div>
  )
}

export default function MarketingBlog() {
  useDocumentHead({ title: 'Asirem Academy · Blog', description: 'Tips, tax news and career guides for the tax preparation and insurance industry.' })
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_posts')
    return (data ?? []) as Post[]
  }, [])
  if (loading || !data) return <Loader />

  const featured = data.find((p) => p.featured) ?? data[0] ?? null
  const rest = data.filter((p) => p.id !== featured?.id)

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,76px) clamp(20px,5vw,64px) clamp(24px,3vw,36px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 14 }}>Resources</span>
        <h1 style={{ fontSize: 'clamp(36px,4.6vw,60px)', textTransform: 'uppercase', lineHeight: 1.02 }}>The Asirem blog</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '58ch', color: 'var(--color-neutral-700)', margin: '22px 0 0' }}>Tips, tax news and career guides to grow in the tax preparation and insurance industry.</p>
      </section>

      {!featured && (
        <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)', color: 'var(--color-neutral-600)' }}>No articles published yet — check back soon.</section>
      )}

      {featured && (
        <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(32px,4vw,48px)' }}>
          <Link to={`/blog/${featured.slug}`} style={{ textDecoration: 'none' }}>
            <article className="blueprint grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', background: 'transparent' }}>
              <Corners />
              <figure className="duotone" style={{ position: 'relative', borderRight: '1px solid var(--color-divider)' }}>
                {featured.cover_url ? <img src={featured.cover_url} alt={featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <CoverPlaceholder />}
              </figure>
              <div style={{ padding: 'clamp(24px,3vw,40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>{featured.category && <span className="tag tag-outline">{featured.category}</span>}<span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{fmtDate(featured.published_at)}</span></div>
                <h2 style={{ fontSize: 'clamp(24px,2.8vw,34px)', textTransform: 'uppercase', lineHeight: 1.08, margin: '0 0 14px' }}>{featured.title}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-700)', margin: '0 0 22px' }}>{featured.excerpt}</p>
                {featured.read_minutes ? <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{featured.read_minutes} min read</span> : null}
              </div>
            </article>
          </Link>
        </section>
      )}

      {rest.length > 0 && (
        <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,32px)' }} className="grid-3">
            {rest.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                <article className="blueprint" style={{ display: 'flex', flexDirection: 'column', background: 'transparent', height: '100%' }}>
                  <Corners />
                  <div style={{ aspectRatio: '16/9', borderBottom: '1px solid var(--color-divider)', overflow: 'hidden' }}>
                    {p.cover_url ? <img src={p.cover_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <CoverPlaceholder small />}
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{p.category && <span className="tag tag-accent">{p.category}</span>}<span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{fmtDate(p.published_at)}</span></div>
                    <h3 style={{ fontSize: 19, textTransform: 'uppercase', lineHeight: 1.14 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-neutral-700)', flex: 1 }}>{p.excerpt}</p>
                    {p.read_minutes ? <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-divider)', fontSize: 12, color: 'var(--color-neutral-600)' }}>{p.read_minutes} min read</div> : null}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
