import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'
import { Corners } from './CourseCard'

const wrap = { maxWidth: 760, margin: '0 auto' } as const
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

export default function MarketingPost() {
  const { slug } = useParams()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_public_post', { p_slug: slug! })
    return data as any
  }, [slug])
  useDocumentHead({
    title: data ? `${data.title} · Asirem Academy` : 'Asirem Academy · Blog',
    description: data?.excerpt ?? undefined,
    jsonLd: data ? { '@context': 'https://schema.org', '@type': 'Article', headline: data.title, description: data.excerpt, datePublished: data.published_at, author: data.author_name ? { '@type': 'Person', name: data.author_name } : undefined } : undefined,
  })
  if (loading) return <Loader />
  if (!data) return <div style={{ maxWidth: 760, margin: '60px auto', padding: 24, textAlign: 'center' }}><h1 style={{ textTransform: 'uppercase' }}>Article not found</h1><Link to="/blog" style={{ color: 'var(--color-accent)', fontWeight: 700 }}>← Back to the blog</Link></div>
  const p = data

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <article style={{ ...wrap, padding: 'clamp(40px,6vw,72px) clamp(20px,5vw,40px) clamp(48px,7vw,88px)' }}>
        <Link to="/blog" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)', textDecoration: 'none' }}>← Blog</Link>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '20px 0 12px' }}>
          {p.category && <span className="tag tag-outline">{p.category}</span>}
          <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{fmtDate(p.published_at)}{p.read_minutes ? ` · ${p.read_minutes} min read` : ''}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(30px,4vw,48px)', textTransform: 'uppercase', lineHeight: 1.05, margin: '0 0 10px' }}>{p.title}</h1>
        {p.author_name && <div style={{ fontSize: 14, color: 'var(--color-neutral-700)', marginBottom: 24 }}>By <strong style={{ fontFamily: 'var(--font-heading)' }}>{p.author_name}</strong></div>}
        {p.cover_url && (
          <figure className="blueprint duotone" style={{ margin: '0 0 28px', aspectRatio: '16/9' }}>
            <img src={p.cover_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <Corners />
          </figure>
        )}
        {p.excerpt && <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--color-neutral-800)', fontWeight: 500, margin: '0 0 20px' }}>{p.excerpt}</p>}
        <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--color-neutral-800)', whiteSpace: 'pre-wrap' }}>{p.body}</div>
      </article>
    </div>
  )
}
