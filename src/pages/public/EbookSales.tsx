import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'
import { RichText } from '../../components/RichText'

type EbookDetail = { id: string; slug: string; title: string; subtitle: string | null; description: string | null; author: string | null; cover_url: string | null; price_cents: number; currency: string }
const money = (c: number, cur: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency: (cur || 'usd').toUpperCase() }).format((c || 0) / 100)

export default function EbookSales() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { data: e, loading } = useAsync(async () => {
    const { data } = await (supabase.rpc as any)('get_public_ebook', { p_slug: slug })
    const d = Array.isArray(data) ? data[0] : data
    return (d ?? null) as EbookDetail | null
  }, [slug])
  useDocumentHead({ title: e ? `${e.title} · Asirem Academy` : 'Ebook', description: e?.subtitle ?? undefined })

  if (loading) return <Loader />
  if (!e) return <div style={{ padding: 40, textAlign: 'center' }}>Not found.</div>

  function buy() {
    if (!e) return
    nav(`/checkout?ebook=${e.slug}`, { state: { item: { kind: 'ebook', id: e.id, title: e.title, priceCents: e.price_cents, currency: e.currency } } })
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32 }} className="two-col">
      <div style={{ aspectRatio: '3 / 4', borderRadius: 14, background: e.cover_url ? `center/cover no-repeat url(${e.cover_url})` : 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', boxShadow: '0 10px 30px rgba(15,44,76,.18)' }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8494A8' }}>Ebook</div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 30, margin: '8px 0 6px' }}>{e.title}</h1>
        {e.subtitle && <div style={{ fontSize: 16, color: '#5B6B82', fontWeight: 600 }}>{e.subtitle}</div>}
        {e.author && <div style={{ fontSize: 14, color: '#8494A8', fontWeight: 600, marginTop: 6 }}>by {e.author}</div>}
        <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 28, color: 'var(--navy-800)', margin: '18px 0' }}>{e.price_cents === 0 ? 'Free' : money(e.price_cents, e.currency)}</div>
        <button onClick={buy} style={{ background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, padding: '13px 28px', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Buy &amp; download</button>
        {e.description && <div style={{ marginTop: 26, color: '#33415A', lineHeight: 1.7 }}><RichText html={e.description} /></div>}
      </div>
    </div>
  )
}
