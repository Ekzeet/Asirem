import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { StarRating } from '../../components/StarRating'
import PublicCatalog from './PublicCatalog'

type Testimonial = { id: string; rating: number; title: string | null; body: string | null; author_name: string | null; course_title: string | null; course_slug: string | null }

export default function Home() {
  const { t } = useI18n()
  const { data: testimonials } = useAsync(async () => {
    const { data } = await supabase.rpc('list_recent_reviews', { p_limit: 6 })
    return (data ?? []) as Testimonial[]
  }, [])

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg,#0F2C4C,#123f6b)', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--display)', fontSize: 40, maxWidth: 760, margin: '0 auto 14px' }}>{t('heroTitle')}</h1>
        <p style={{ opacity: .85, fontSize: 17, maxWidth: 620, margin: '0 auto 24px' }}>{t('heroSub')}</p>
        <Link to="/courses" style={{ background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', padding: '12px 26px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('browseCourses')}</Link>
      </section>

      <PublicCatalog />

      {testimonials && testimonials.length > 0 && (
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 24px 48px' }}>
          <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 22, marginBottom: 18 }}>{t('whatStudentsSay')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {testimonials.map((r) => (
              <div key={r.id} style={{ border: '1px solid var(--border-soft)', borderRadius: 14, padding: '16px 18px', background: '#fff' }}>
                <StarRating value={r.rating} size={14} />
                {r.title && <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 14, margin: '8px 0 4px' }}>{r.title}</div>}
                {r.body && <p style={{ color: '#5B6B82', fontSize: 13.5, lineHeight: 1.5, margin: '4px 0 10px' }}>{r.body}</p>}
                <div style={{ fontSize: 12, color: '#9AA7B8', fontWeight: 600 }}>
                  {t('by')} {r.author_name ?? '—'}
                  {r.course_slug && <> · <Link to={`/courses/${r.course_slug}`} style={{ color: '#5B6B82', fontWeight: 700, textDecoration: 'none' }}>{r.course_title}</Link></>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
