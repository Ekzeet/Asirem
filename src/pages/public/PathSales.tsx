import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useI18n } from '../../i18n/I18nContext'
import { useDocumentHead } from '../../lib/seo'
import { Icon } from '../../components/Icon'
import { Loader } from '../../components/ui'

const navy = 'var(--navy-800)'
const gold = 'var(--gold-500,#E7B450)'
const muted = '#8494A8'
const border = '1px solid var(--border-soft)'
const fallbackCover = 'linear-gradient(135deg,#0F2C4C,#1B4B7F)'
function money(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format((cents || 0) / 100)
}

export default function PathSales() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [fav, setFav] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data, loading } = useAsync(async () => {
    const [{ data: path }, { data: rel }] = await Promise.all([
      supabase.rpc('get_public_path', { p_slug: slug! }),
      supabase.rpc('list_public_paths'),
    ])
    const related = ((rel ?? []) as any[]).filter((r) => r.slug !== slug).slice(0, 4)
    return { path: path as any, related }
  }, [slug])
  useDocumentHead({ title: data?.path?.title, description: data?.path?.subtitle })

  if (loading) return <Loader />
  const p = data?.path
  if (!p) return <div style={{ padding: 24 }}>{t('noData')}</div>
  const courseCount = (p.courses ?? []).length

  function buy() {
    if (!p.price_cents) { window.location.href = '/login'; return }
    setBusy(true)
    nav(`/checkout?path=${slug}`, { state: { item: { kind: 'path', id: p.id, title: p.title, priceCents: p.price_cents, currency: p.currency } } })
  }
  function share() {
    const url = window.location.href
    if (navigator.share) { navigator.share({ title: p.title, url }).catch(() => {}); return }
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {})
  }

  const iconBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border, background: '#fff', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }
  const tags = [
    { icon: 'layers', label: `${courseCount} ${t('courses').toLowerCase()}` },
    { icon: 'badge-percent', label: t('bundleSave') },
    { icon: 'award', label: t('certificateOfCompletion') },
  ]

  return (
    <div style={{ background: '#F4F6F9' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(16px,3vw,32px)' }}>
        <div style={{ background: '#fff', borderRadius: 20, border, boxShadow: '0 10px 34px rgba(15,44,76,.07)', overflow: 'hidden' }}>
          <div style={{ padding: 'clamp(18px,3vw,34px)' }}>
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: muted, marginBottom: 10, flexWrap: 'wrap' }}>
              {[{ label: 'Home', href: '/' }, { label: t('learningPaths'), href: '/paths' }, { label: p.title, href: `/paths/${p.slug}` }].map((b, i, arr) => (
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ aspectRatio: '4 / 5', width: '100%', borderRadius: 14, overflow: 'hidden', border, background: fallbackCover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="layers" size={64} color="rgba(255,255,255,.85)" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link to="/paths" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: navy, textDecoration: 'none', background: '#fff' }}>
                    <Icon name="layout-grid" size={15} /> {t('learningPaths')}
                  </Link>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: muted }}>{t('learningPaths')}</div>
                <h1 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 'clamp(26px,3.4vw,38px)', lineHeight: 1.1, margin: '8px 0 6px', letterSpacing: '-.01em' }}>{p.title}</h1>
                {p.subtitle && <div style={{ fontSize: 16, color: '#5B6B82', fontWeight: 600 }}>{p.subtitle}</div>}

                <div style={{ margin: '18px 0 4px' }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 34, color: navy }}>{p.price_cents ? money(p.price_cents, p.currency) : t('free')}</span>
                  <span style={{ fontSize: 13.5, color: muted, fontWeight: 600, marginLeft: 10 }}>{courseCount} {t('courses').toLowerCase()} · {t('bundleSave')}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, margin: '18px 0 22px', flexWrap: 'wrap' }}>
                  <button onClick={buy} disabled={busy} style={{ flex: 1, minWidth: 190, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: gold, color: '#0F2C4C', border: 0, padding: '14px 22px', borderRadius: 11, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                    <Icon name="layers" size={18} /> {busy ? '…' : t('getBundle')}
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

                {p.description && <div style={{ color: '#33415A', lineHeight: 1.7, fontSize: 15, whiteSpace: 'pre-wrap' }}>{p.description}</div>}

                <div style={{ marginTop: 26, paddingTop: 20, borderTop: border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 20 }}>A</div>
                    <div>
                      <div style={{ fontWeight: 800, color: navy, fontSize: 14.5 }}>Asirem Academy</div>
                      <div style={{ fontSize: 12.5, color: muted, fontWeight: 600 }}>{t('learningPaths')}</div>
                    </div>
                  </div>
                  <Link to="/paths" style={{ color: navy, fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>{t('learningPaths')} &rarr;</Link>
                </div>
              </div>
            </div>

            {/* Included courses */}
            <h2 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 20, margin: '28px 0 12px' }}>{t('includedCourses')}</h2>
            {(p.courses ?? []).map((c: any, i: number) => (
              <Link key={c.slug} to={`/courses/${c.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 15px', border, borderRadius: 12, marginBottom: 8, textDecoration: 'none' }}>
                <span style={{ width: 26, height: 26, flex: 'none', borderRadius: '50%', background: '#EAF1FB', color: '#1B5FB0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
                <span style={{ flex: 1, color: navy, fontWeight: 700, fontSize: 14 }}>{c.title}</span>
                <Icon name="chevron-right" size={16} color={muted} />
              </Link>
            ))}
          </div>

          {/* You might also like */}
          {data!.related.length > 0 && (
            <div style={{ padding: '0 clamp(18px,3vw,34px) clamp(24px,4vw,40px)' }}>
              <h2 style={{ fontFamily: 'var(--display)', color: navy, fontSize: 22, margin: '4px 0 18px' }}>You might also like</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }} className="grid-2">
                {data!.related.map((r) => (
                  <Link key={r.id} to={`/paths/${r.slug}`} style={{ textDecoration: 'none', color: 'inherit', border, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <div style={{ aspectRatio: '1 / 1', background: fallbackCover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="layers" size={30} color="rgba(255,255,255,.85)" /></div>
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
