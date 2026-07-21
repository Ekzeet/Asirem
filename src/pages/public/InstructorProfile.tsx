import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader, Avatar } from '../../components/ui'
import { StarRating } from '../../components/StarRating'
import { useDocumentHead } from '../../lib/seo'

type InstructorCourse = { slug: string; title: string; subtitle: string | null; price_cents: number; currency: string; rating: number | null }
type Instructor = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  credentials: string[] | null
  avg_rating: number | null
  courses: InstructorCourse[]
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function InstructorProfile() {
  const { id } = useParams()
  const { t } = useI18n()
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_public_instructor', { p_id: id! })
    return data as Instructor | null
  }, [id])

  useDocumentHead({ title: data?.full_name ?? undefined, description: data?.bio ?? undefined })

  if (loading) return <Loader />
  if (!data) return <div style={{ padding: 24 }}>{t('instructorNotFound')}</div>

  const name = data.full_name ?? ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        {data.avatar_url
          ? <img src={data.avatar_url} alt={name} style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', flex: 'none' }} />
          : <Avatar name={name || '?'} size={72} radius={14} />}
        <div>
          <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 26, margin: 0 }}>{name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <StarRating value={data.avg_rating || 0} />
            {data.avg_rating ? <span style={{ color: '#8494A8', fontSize: 13, fontWeight: 600 }}>{data.avg_rating}</span> : null}
          </div>
        </div>
      </div>

      {data.credentials && data.credentials.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {data.credentials.map((c, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: '#EEF2F7', color: 'var(--navy-800)' }}>{c}</span>
          ))}
        </div>
      )}

      {data.bio && <p style={{ color: '#5B6B82', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>{data.bio}</p>}

      <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '10px 0 14px' }}>{t('coursesBy')} {name}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
        {(data.courses ?? []).map((c) => (
          <Link key={c.slug} to={`/courses/${c.slug}`} style={{ textDecoration: 'none', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 16, background: '#fff' }}>
            <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 15 }}>{c.title}</div>
            {c.subtitle && <div style={{ color: '#8494A8', fontSize: 13, fontWeight: 600, margin: '4px 0 10px' }}>{c.subtitle}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontWeight: 800, color: 'var(--gold-600, #B8860B)' }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</span>
              <StarRating value={c.rating || 0} size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
