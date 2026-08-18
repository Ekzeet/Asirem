import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { Icon } from '../../components/Icon'
import { Loader } from '../../components/ui'
import { StarRating } from '../../components/StarRating'
import { RichText } from '../../components/RichText'
import { useDocumentHead } from '../../lib/seo'

type Review = { id: string; rating: number; title: string | null; body: string | null; created_at: string; author_name: string | null }
type Related = { id: string; slug: string; title: string; cover_url: string | null; accent?: string | null; price_cents: number; currency: string }

const navy = 'var(--navy-800)'
const gold = 'var(--gold-500,#E7B450)'
const muted = '#8494A8'
const border = '1px solid var(--border-soft)'
const fallbackCover = 'linear-gradient(135deg,#0F2C4C,#1B4B7F)'
function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function CourseSales() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { t, lang } = useI18n()
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [fav, setFav] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, loading } = useAsync(async () => {
    const [{ data: course }, { data: rel }] = await Promise.all([
      supabase.rpc('get_public_course', { p_slug: slug! }),
      supabase.rpc('list_public_courses'),
    ])
    const related = ((rel ?? []) as unknown as Related[]).filter((r) => r.slug !== slug).slice(0, 4)
    return { course: course as any, related }
  }, [slug])
  const { data: reviews, loading: reviewsLoading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_course_reviews', { p_slug: slug! })
    return (data ?? []) as Review[]
  }, [slug])

  const c = data?.course
  const jsonLd = c
    ? { '@context': 'https://schema.org', '@type': 'Course', name: c.title, description: c.subtitle, provider: { '@type': 'Organization', name: 'Asirem Academy' },
        ...(c.review_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: c.rating, reviewCount: c.review_count } } : {}) }
    : undefined
  useDocumentHead({ title: c?.title, description: c?.subtitle, jsonLd })

  if (loading) return <Loader />
  if (!c) return <div style={{ padding: 24 }}>{t('noData')}</div>
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const lessonCount = (c.sections ?? []).reduce((n: number, s: any) => n + (s.lessons ?? []).length, 0)

  async function playPreview(lessonId: string) {
    const { data, error } = await supabase.functions.invoke('get-preview-url', { body: { lesson_id: lessonId } })
    if (!error && data?.url) setPreview(data.url as string)
  }
  function buy() {
    if (!c.price_cents) { window.location.href = '/login'; return }
    setBusy(true)
    nav(`/checkout?course=${slug}`, { state: { item: { kind: 'course', id: c.id, title: c.title, priceCents: c.price_cents, currency: c.currency } } })
  }
  function share() {
    const url = window.location.href
    if (navigator.share) { navigator.share({ title: c.title, url }).catch(() => {}); return }
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {})
  }

  const iconBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border, background: '#fff', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
  const tags = [
    c.category ? { icon: 'tag', label: c.category } : null,
    c.level ? { icon: 'bar-chart-2', label: c.level } : null,
    lessonCount ? { icon: 'play-circle', label: `${lessonCount} ${t('lessons') ?? 'lessons'}` } : null,
    c.credit_hours ? { icon: 'award', label: `${c.credit_hours} ${t('hours')} · ${t('certificateOfCompletion')}` } : null,
  ].filter(Boolean) as { icon: string; label: string }[]

  return (
    <div style={{ background: '#F4F6F9' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(16px,3vw,32px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, border, boxShadow: '0 10px 34px rgba(15,44,76,.07)', overflow: 'hidden' }}>
          <div style={{ padding: 'clamp(18px,3vw,34px)' }}>
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: muted, marginBottom: 10, flexWrap: 'wrap' }}>
              {[{ label: 'Home', href: '/' }, { label: t('courses'), href: '/courses' }, { label: c.title, href: `/courses/${c.slug}` }].map((b, i, arr) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {i < arr.length - 1 ? <Link to={b.href} style={{ color: muted, textDecoration: 'none' }}>{b.label}</Link> : <span style={{ color: navy, fontWeight: 600 }}>{b.label}</span>}
                  {i < arr.length - 1 && <Icon name="chevron-right" size={14} />}
                </span>
              ))}
            </nav>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setFav((f) => !f)} title="Favorite" style={iconBtn}><Icon name="heart" size={18} color={fav ? '#E0245E' : navy} {...(fav ? { fill: '#E0245E' } as any : {})} /></button>
              <button onClick={share} title="Share" style={{ ...iconBtn, position: 'relative' }}>
                <Icon name="share-2" size={18} />
                {copied && <span style={{ position: 'absolute', top: -30, right: 0, background: navy, color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7, whiteSpace: 'nowrap' }}>Link copied</span>}
              </button>
            </div>

            <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 'clamp(22px,4vw,48px)', alignItems: 'start' }}>
              {/* Cover */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ aspectRatio: '4 / 5', width: '100%', borderRadius: 14, overflow: 'hidden', border, background: c.cover_url ? `center/cover no-repeat url(${c.cover_url})` : (c.accent || fallbackCover), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {!c.cover_url && <Icon name={c.icon || 'book-open'} size={64} color="rgba(255,255,255,.85)" />}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to="/courses" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: navy, textDecoration: 'none', background: '#fff' }}>
                    <Icon name="layout-grid" size={15} /> {t('courses')}
                  </Link>
                </div>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: muted }}>{t('course') ?? 'Course'}</div>
                <h1 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 'clamp(26px,3.4vw,38px)', lineHeight: 1.1, margin: '8px 0 6px', letterSpacing: '-.01em' }}>{c.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <StarRating value={c.rating || 0} />
                  <span style={{ color: muted, fontSize: 13, fontWeight: 600 }}>({c.review_count ?? 0})</span>
                </div>
                {c.subtitle && <div style={{ fontSize: 16, color: '#5B6B82', fontWeight: 600 }}>{c.subtitle}</div>}

                <div style={{ margin: '18px 0 4px' }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 34, color: navy }}>{c.price_cents ? money(c.price_cents, c.currency) : t('free')}</span>
                  {c.enrolled_count > 0 && <span style={{ fontSize: 13.5, color: muted, fontWeight: 600, marginLeft: 10 }}>{c.enrolled_count} {t('enrolled') ?? 'enrolled'}</span>}
                </div>

                <div style={{ display: 'flex', gap: 10, margin: '18px 0 22px', flexWrap: 'wrap' }}>
                  <button onClick={buy} disabled={busy} style={{ flex: 1, minWidth: 190, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: gold, color: '#0F2C4C', border: 0, padding: '14px 22px', borderRadius: 11, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                    <Icon name="graduation-cap" size={18} /> {busy ? '…' : t('enrollNow')}
                  </button>
                  <button onClick={share} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#fff', color: navy, border, padding: '14px 20px', borderRadius: 11, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                    <Icon name="share-2" size={18} /> Share
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
                  {tags.map((tag, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F1F4F8', color: '#3C4A5E', fontSize: 13, fontWeight: 600, padding: '6px 12px', borderRadius: 20 }}>
                      <Icon name={tag.icon} size={14} color={muted} /> {tag.label}
                    </span>
                  ))}
                </div>

                {c.description && <div style={{ color: '#33415A', lineHeight: 1.7, fontSize: 15 }}><RichText html={c.description} /></div>}

                {/* Instructor */}
                {c.instructor_name && (
                  <div style={{ marginTop: 26, paddingTop: 20, borderTop: border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20 }}>{c.instructor_name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: navy, fontSize: 14.5 }}>{c.instructor_name}</div>
                        <div style={{ fontSize: 12.5, color: muted, fontWeight: 600 }}>{t('instructor')}</div>
                      </div>
                    </div>
                    {c.instructor_id && <Link to={`/instructors/${c.instructor_id}`} style={{ color: navy, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>{t('profile') ?? 'Profile'} &rarr;</Link>}
                  </div>
                )}
              </div>
            </div>

            {/* Preview + Curriculum */}
            {preview && <video src={preview} controls style={{ width: '100%', borderRadius: 12, margin: '20px 0 0', background: '#000' }} />}
            <h2 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 20, margin: '28px 0 12px' }}>{t('curriculum')}</h2>
            {(c.sections ?? []).map((s: any) => (
              <div key={s.id} style={{ border, borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ padding: '11px 15px', fontWeight: 800, color: navy, background: '#F7F9FC' }}>{s.title}</div>
                {(s.lessons ?? []).map((l: any) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', borderTop: border }}>
                    <Icon name="play-circle" size={15} color={muted} />
                    <span style={{ flex: 1, color: '#334', fontSize: 14 }}>{l.title}</span>
                    {l.is_preview
                      ? <button onClick={() => playPreview(l.id)} style={{ border: 0, background: 'transparent', color: navy, fontWeight: 800, cursor: 'pointer' }}>{t('preview')}</button>
                      : <Icon name="lock" size={13} color="#B7C0CD" />}
                  </div>
                ))}
              </div>
            ))}

            {/* Reviews */}
            <h2 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 20, margin: '28px 0 12px' }}>{t('reviews')}</h2>
            {reviewsLoading ? <Loader /> : !reviews || reviews.length === 0 ? (
              <div style={{ color: muted, fontSize: 14 }}>{t('noReviews')}</div>
            ) : reviews.map((r) => (
              <div key={r.id} style={{ border, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <StarRating value={r.rating} size={14} />
                  {r.title && <span style={{ fontWeight: 800, color: navy, fontSize: 14 }}>{r.title}</span>}
                </div>
                {r.body && <p style={{ color: '#5B6B82', fontSize: 13.5, lineHeight: 1.5, margin: '4px 0' }}>{r.body}</p>}
                <div style={{ color: muted, fontSize: 12, fontWeight: 600 }}>{t('by')} {r.author_name ?? '—'} · {fmtDate(r.created_at)}</div>
              </div>
            ))}
          </div>

          {/* You might also like */}
          {data!.related.length > 0 && (
            <div style={{ padding: '0 clamp(18px,3vw,34px) clamp(24px,4vw,40px)' }}>
              <h2 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 22, margin: '4px 0 18px' }}>You might also like</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="grid-2">
                {data!.related.map((r) => (
                  <Link key={r.id} to={`/courses/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit', border, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ aspectRatio: '1 / 1', background: r.cover_url ? `center/cover no-repeat url(${r.cover_url})` : (r.accent || fallbackCover) }} />
                    <div style={{ padding: '11px 12px 13px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: navy, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{r.title}</div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: gold, marginTop: 6 }}>{r.price_cents ? money(r.price_cents, r.currency) : t('free')}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
