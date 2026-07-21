import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Loader } from '../../components/ui'
import { startCheckout } from '../../lib/checkout'
import { StarRating } from '../../components/StarRating'
import { useDocumentHead } from '../../lib/seo'

type Review = { id: string; rating: number; title: string | null; body: string | null; created_at: string; author_name: string | null }

function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function CourseSales() {
  const { slug } = useParams()
  const { t, lang } = useI18n()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('get_public_course', { p_slug: slug! })
    return data as any
  }, [slug])
  const { data: reviews, loading: reviewsLoading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_course_reviews', { p_slug: slug! })
    return (data ?? []) as Review[]
  }, [slug])

  const jsonLd = data
    ? {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: data.title,
        description: data.subtitle,
        provider: { '@type': 'Organization', name: 'Asirem Academy' },
        ...(data.review_count > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: data.rating, reviewCount: data.review_count } }
          : {}),
      }
    : undefined
  useDocumentHead({ title: data?.title, description: data?.subtitle, jsonLd })

  if (loading) return <Loader />
  if (!data) return <div style={{ padding: 24 }}>{t('noData')}</div>
  const c = data
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  async function playPreview(lessonId: string) {
    const { data, error } = await supabase.functions.invoke('get-preview-url', { body: { lesson_id: lessonId } })
    if (!error && data?.url) setPreview(data.url as string)
  }
  async function buy() {
    // Free courses don't go through Stripe — send the visitor to sign in and self-enroll.
    if (!c.price_cents) { window.location.href = '/login'; return }
    // Guest buyers (no session) supply an email so the webhook can provision their account.
    const { data: sess } = await supabase.auth.getSession()
    let email: string | undefined
    if (!sess?.session) {
      email = window.prompt(t('enterEmail')) ?? undefined
      if (!email) return
    }
    setBusy(true)
    try { await startCheckout({ courseId: c.id, email }) } finally { setBusy(false) }
  }

  return (
    <div className="two-col" style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 30 }}>{c.title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 6px' }}>
          <StarRating value={c.rating || 0} />
          <span style={{ color: '#8494A8', fontSize: 13, fontWeight: 600 }}>({c.review_count ?? 0})</span>
        </div>
        <p style={{ color: '#5B6B82', fontSize: 16, fontWeight: 600 }}>{c.subtitle}</p>
        {preview && <video src={preview} controls style={{ width: '100%', borderRadius: 12, margin: '14px 0', background: '#000' }} />}
        <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '18px 0 10px' }}>{t('curriculum')}</h2>
        {(c.sections ?? []).map((s: any) => (
          <div key={s.id} style={{ border: '1px solid var(--border-soft)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', fontWeight: 800, color: 'var(--navy-800)', background: '#F7F9FC' }}>{s.title}</div>
            {(s.lessons ?? []).map((l: any) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderTop: '1px solid var(--border-soft)' }}>
                <span style={{ flex: 1, color: '#334', fontSize: 14 }}>{l.title}</span>
                {l.is_preview
                  ? <button onClick={() => playPreview(l.id)} style={{ border: 0, background: 'transparent', color: 'var(--navy-800)', fontWeight: 800, cursor: 'pointer' }}>{t('preview')}</button>
                  : <span style={{ color: '#B7C0CD', fontSize: 12, fontWeight: 700 }}>🔒</span>}
              </div>
            ))}
          </div>
        ))}
        <h2 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)', fontSize: 18, margin: '24px 0 10px' }}>{t('reviews')}</h2>
        {reviewsLoading ? (
          <Loader />
        ) : !reviews || reviews.length === 0 ? (
          <div style={{ color: '#8494A8', fontSize: 14 }}>{t('noReviews')}</div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <StarRating value={r.rating} size={14} />
                {r.title && <span style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 14 }}>{r.title}</span>}
              </div>
              {r.body && <p style={{ color: '#5B6B82', fontSize: 13.5, lineHeight: 1.5, margin: '4px 0' }}>{r.body}</p>}
              <div style={{ color: '#8494A8', fontSize: 12, fontWeight: 600 }}>
                {t('by')} {r.author_name ?? '—'} · {fmtDate(r.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
      <aside>
        <div style={{ position: 'sticky', top: 20, border: '1px solid var(--border-soft)', borderRadius: 14, padding: 18, background: '#fff' }}>
          <div style={{ fontWeight: 900, fontSize: 26, color: 'var(--navy-800)' }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</div>
          {c.credit_hours ? <div style={{ color: '#5B6B82', fontWeight: 700, margin: '4px 0' }}>{c.credit_hours} {t('hours')} · {t('certificateOfCompletion')}</div> : null}
          {c.instructor_name ? (
            <div style={{ color: '#8494A8', fontSize: 13, fontWeight: 600, margin: '4px 0 8px' }}>
              {t('by')}{' '}
              {c.instructor_id ? (
                <Link to={`/instructors/${c.instructor_id}`} style={{ color: 'var(--navy-800)', fontWeight: 800, textDecoration: 'none' }}>{c.instructor_name}</Link>
              ) : (
                <span style={{ color: 'var(--navy-800)', fontWeight: 800 }}>{c.instructor_name}</span>
              )}
            </div>
          ) : null}
          <button onClick={buy} disabled={busy} style={{ width: '100%', marginTop: 12, background: 'var(--gold-500,#E7B450)', color: '#0F2C4C', border: 0, padding: '12px', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{busy ? '…' : t('enrollNow')}</button>
          <div style={{ color: '#8494A8', fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{t('moneyBack')}</div>
        </div>
      </aside>
    </div>
  )
}
