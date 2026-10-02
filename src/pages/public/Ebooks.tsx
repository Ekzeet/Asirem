import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'

type PublicEbook = { id: string; slug: string; title: string; subtitle: string | null; author: string | null; cover_url: string | null; price_cents: number; currency: string }
const wrap = { maxWidth: 1180, margin: '0 auto' } as const
const money = (c: number, cur: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'usd').toUpperCase() }).format((c || 0) / 100)

export default function Ebooks() {
  useDocumentHead({ title: 'Asirem Academy · Books', description: 'Downloadable ebooks and guides on tax preparation and professional software.' })
  const { data, loading } = useAsync(async () => {
    const { data } = await (supabase.rpc as any)('list_public_ebooks')
    return (data ?? []) as PublicEbook[]
  }, [])
  if (loading || !data) return <Loader />

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,76px) clamp(20px,5vw,64px) clamp(24px,3vw,36px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 14 }}>Library</span>
        <h1 style={{ fontSize: 'clamp(36px,4.6vw,60px)', textTransform: 'uppercase', lineHeight: 1.02, maxWidth: '16ch' }}>Books &amp; guides</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '58ch', color: 'var(--color-neutral-700)', margin: '22px 0 0' }}>Downloadable ebooks you can buy once and keep — read them any time from your library.</p>
      </section>
      <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
        {data.length === 0 ? (
          <div style={{ color: 'var(--color-neutral-600)', fontSize: 15 }}>No books published yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,32px)' }} className="grid-3">
            {data.map((e) => (
              <Link key={e.id} to={`/books/${e.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-divider)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '3 / 2', background: e.cover_url ? `center/cover no-repeat url(${e.cover_url})` : 'linear-gradient(135deg,#0b2143,#1B4B7F)' }} />
                <div style={{ padding: '16px 18px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, lineHeight: 1.25 }}>{e.title}</div>
                  {e.author && <div style={{ fontSize: 13, color: 'var(--color-neutral-600)', marginTop: 4 }}>{e.author}</div>}
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: 'var(--color-accent,#c6a052)', marginTop: 12 }}>{money(e.price_cents, e.currency)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
