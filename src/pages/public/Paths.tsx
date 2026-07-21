import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'
import { Icon } from '../../components/Icon'

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function Paths() {
  const { t } = useI18n()
  useDocumentHead({ title: 'Asirem Academy · ' + t('learningPaths') })
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_paths')
    return data ?? []
  }, [])
  if (loading || !data) return <Loader />
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, marginBottom: 6 }}>{t('learningPaths')}</h1>
      <p style={{ color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('pathsSub')}</p>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noData')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
        {data.map((p) => (
          <Link key={p.id} to={`/paths/${p.slug}`} style={{ textDecoration: 'none', border: '1px solid var(--border-soft)', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
            <div style={{ height: 90, background: p.accent || 'linear-gradient(135deg,#0F2C4C,#123f6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name={p.icon ?? 'route'} size={30} /></div>
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 16 }}>{p.title}</div>
              <div style={{ color: '#8494A8', fontSize: 13, fontWeight: 600, margin: '4px 0 10px' }}>{p.subtitle}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--gold-600,#B8860B)' }}>{p.price_cents ? money(p.price_cents, p.currency) : t('free')}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#5B6B82' }}>{p.course_count} {t('courses').toLowerCase()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
