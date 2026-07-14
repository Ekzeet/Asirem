import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { money, moneyFull, relTime } from '../../lib/format'
import { Icon } from '../../components/Icon'
import { Card, Loader, PageWrap } from '../../components/ui'

type Stats = { revenue_cents: number; revenue_delta: number | null; students: number; students_delta: number | null; courses: number; courses_new: number; completion: number; completion_delta: number | null }
type Month = { label: string; amount_cents: number }
type Mix = { category: string; enrollments: number; pct: number }
type Top = { id: string; title: string; instructor: string; students: number; revenue_cents: number; rating: number | null; accent: string | null; icon: string | null }
type Act = { kind: string; text: string; at: string }

const MIX_FILLS = ['#0F2C4C', '#1B5FB0', '#D9A441', '#7C5CD6', '#1F8A5B', '#C99A2E']
const ACT_ICON: Record<string, [string, string, string]> = {
  enroll: ['user-plus', '#EAF1FB', '#1B5FB0'],
  sale: ['dollar-sign', '#EAF6EF', '#1F8A5B'],
  certificate: ['award', '#FBF1E1', '#C99A2E'],
  post: ['message-square', '#F3EDFB', '#7C5CD6'],
}

export default function AdminDashboard() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const inst = me!.institutionId

  const { data, loading } = useAsync(async () => {
    const [stats, months, mix, top, act] = await Promise.all([
      supabase.rpc('admin_dashboard_stats', { p_institution_id: inst }),
      supabase.rpc('revenue_monthly', { p_institution_id: inst }),
      supabase.rpc('enrollment_mix', { p_institution_id: inst }),
      supabase.rpc('top_courses', { p_institution_id: inst, p_limit: 4 }),
      supabase.rpc('activity_feed', { p_institution_id: inst, p_limit: 5 }),
    ])
    return {
      stats: stats.data as unknown as Stats,
      months: (months.data ?? []) as Month[],
      mix: (mix.data ?? []) as Mix[],
      top: (top.data ?? []) as Top[],
      act: (act.data ?? []) as Act[],
    }
  }, [inst])

  if (loading || !data) return <Loader />
  const { stats, months, mix, top, act } = data
  const maxRev = Math.max(1, ...months.map((m) => m.amount_cents))
  const totalRev = months.reduce((s, m) => s + m.amount_cents, 0)

  const kpis = [
    { icon: 'dollar-sign', tint: '#EAF6EF', color: '#1F8A5B', value: money(stats.revenue_cents), label: t('totalRevenue'), delta: stats.revenue_delta },
    { icon: 'graduation-cap', tint: '#EAF1FB', color: '#1B5FB0', value: String(stats.students), label: t('activeStudents'), delta: stats.students_delta },
    { icon: 'book-open', tint: '#FBF1E1', color: '#C99A2E', value: String(stats.courses), label: t('publishedCourses'), delta: stats.courses_new ? stats.courses_new : null, plus: true },
    { icon: 'percent', tint: '#F3EDFB', color: '#7C5CD6', value: `${Math.round(stats.completion)}%`, label: t('completionRate'), delta: stats.completion_delta },
  ]

  return (
    <PageWrap>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map((k, i) => {
          const up = (k.delta ?? 0) >= 0
          return (
            <Card key={i} style={{ padding: '18px 18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: k.tint, color: k.color }}><Icon name={k.icon} size={18} /></div>
                {k.delta != null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 800, color: up ? '#1F8A5B' : '#D14343', background: up ? '#EAF6EF' : '#FBEBEB', padding: '3px 8px', borderRadius: 8 }}>
                    <Icon name={up ? 'trending-up' : 'trending-down'} size={13} />{k.plus ? '+' : ''}{k.delta}{k.plus ? '' : '%'}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 26, color: 'var(--navy-800)', letterSpacing: '-.5px' }}>{k.value}</div>
              <div style={{ fontSize: 12.5, color: '#7C8AA0', fontWeight: 600, marginTop: 2 }}>{k.label}</div>
            </Card>
          )
        })}
      </div>

      {/* Revenue + mix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)' }}>{t('revenueTitle')}</div>
              <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600 }}>{t('last12')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{moneyFull(totalRev)}</span>
              {stats.revenue_delta != null && <span style={{ color: '#1F8A5B', fontWeight: 700, fontSize: 13 }}>+{stats.revenue_delta}%</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 190, paddingTop: 22 }}>
            {months.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <div title={moneyFull(b.amount_cents)} style={{ width: '100%', maxWidth: 26, borderRadius: '7px 7px 3px 3px', transformOrigin: 'bottom', animation: 'lmsbar .6s ease both', background: i >= months.length - 2 ? 'linear-gradient(180deg,#E7B450,#D9A441)' : 'linear-gradient(180deg,#2E5E93,#1B4B7F)', height: `${Math.round((b.amount_cents / maxRev) * 100)}%` }} />
                <span style={{ fontSize: 10.5, color: '#98A6B8', fontWeight: 600 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: '20px 22px' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)', marginBottom: 3 }}>{t('enrollMix')}</div>
          <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('byCategory')}</div>
          {mix.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t('noData')}</div>}
          {mix.map((m, i) => (
            <div key={i} style={{ marginBottom: 15 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, color: '#3C4A5E', marginBottom: 6 }}><span>{m.category}</span><span style={{ color: '#8494A8' }}>{m.pct}%</span></div>
              <div style={{ height: 8, background: '#EEF2F7', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 6, background: MIX_FILLS[i % MIX_FILLS.length], width: `${m.pct}%` }} /></div>
            </div>
          ))}
        </Card>
      </div>

      {/* Top courses + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px' }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)' }}>{t('topCourses')}</div>
            <button onClick={() => nav('/admin/courses')} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer' }}>{t('viewAll')} →</button>
          </div>
          {top.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderTop: '1px solid var(--border-soft)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, flex: 'none', background: c.accent ?? 'linear-gradient(135deg,#0F2C4C,#1B4B7F)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><Icon name={c.icon ?? 'book-open'} size={18} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--navy-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: 11.5, color: '#8494A8', fontWeight: 600 }}>{c.instructor} · {c.students} {t('students')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 14, color: 'var(--navy-800)' }}>{money(c.revenue_cents)}</div>
                {c.rating != null && <div style={{ fontSize: 11, color: '#C99A2E', fontWeight: 700 }}>★ {c.rating}</div>}
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: '18px 22px' }}>
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--navy-800)', marginBottom: 4 }}>{t('activity')}</div>
          <div style={{ fontSize: 12.5, color: '#8494A8', fontWeight: 600, marginBottom: 14 }}>{t('recent')}</div>
          {act.map((a, i) => {
            const [icon, tint, color] = ACT_ICON[a.kind] ?? ACT_ICON.post
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, flex: 'none', background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#33415A', fontWeight: 600, lineHeight: 1.35 }}>{a.text}</div>
                  <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600, marginTop: 1 }}>{relTime(a.at, lang)}</div>
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </PageWrap>
  )
}
