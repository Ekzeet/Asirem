import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'
import { StarRating } from '../../components/StarRating'
import { useDocumentHead } from '../../lib/seo'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function PublicCatalog({ seo = false }: { seo?: boolean }) {
  const { t } = useI18n()
  // Only the standalone /courses route manages the document head; when embedded in Home,
  // Home owns the head (empty opts = no-op) to avoid two effects fighting over title/JSON-LD.
  useDocumentHead(seo ? {
    title: 'Asirem Academy · ' + t('browseCourses'),
    description: t('heroSub'),
    jsonLd: { '@context': 'https://schema.org', '@type': 'ItemList', name: t('browseCourses') },
  } : {})
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_courses')
    return data ?? []
  }, [])
  if (loading || !data) return <Loader />
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 18 }}>{t('browseCourses')}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
        {data.map((c) => (
          <Link key={c.id} to={`/courses/${c.slug}`} style={{ textDecoration: 'none', border: '1px solid var(--border-soft)', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ height: 96, background: c.accent || 'linear-gradient(135deg,#0F2C4C,#123f6b)' }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 15 }}>{c.title}</div>
              <div style={{ color: '#8494A8', fontSize: 13, fontWeight: 600, margin: '4px 0 8px' }}>{c.subtitle}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, minHeight: 16 }}>
                {c.rating ? <><StarRating value={c.rating} size={13} /><span style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600 }}>({c.review_count ?? 0})</span></> : null}
                {c.enrolled_count ? <span style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>· {c.enrolled_count} {t('learners')}</span> : null}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--gold-600, #B8860B)' }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</span>
                {c.credit_hours ? <span style={{ fontSize: 12, fontWeight: 700, color: '#5B6B82' }}>{c.credit_hours} {t('hours')}</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
