import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Card, Loader, PageWrap } from '../../components/ui'

export default function Analytics() {
  const { me } = useAuth()
  const { t } = useI18n()
  const inst = me!.institutionId

  const { data, loading } = useAsync(async () => {
    const [{ data: funnel }, { data: cohort }] = await Promise.all([
      supabase.rpc('funnel_stats', { p_institution: inst, p_days: 30 }),
      supabase.rpc('cohort_retention', { p_institution: inst }),
    ])
    return { funnel: (funnel ?? {}) as any, cohort: (cohort ?? []) as { cohort: string; enrolled: number; completed: number }[] }
  }, [inst])

  if (loading || !data) return <Loader />
  const f = data.funnel
  const conv = f.views ? Math.round((Number(f.purchases) / Number(f.views)) * 100) : 0
  const cards = [
    { l: t('views30'), v: String(f.views ?? 0) },
    { l: t('checkouts30'), v: String(f.checkouts ?? 0) },
    { l: t('purchases30'), v: String(f.purchases ?? 0) },
    { l: t('conversion'), v: `${conv}%` },
  ]

  return (
    <PageWrap maxWidth={960}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--navy-800)', marginBottom: 16 }}>{t('analytics')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {cards.map((c, i) => (
          <Card key={i} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600, marginBottom: 6 }}>{c.l}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)' }}>{c.v}</div>
          </Card>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)', marginBottom: 10 }}>{t('cohortRetention')}</div>
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, padding: '11px 18px', background: '#FAFBFD', fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase' }}>
          <span>{t('cohort')}</span><span>{t('enrolled')}</span><span>{t('completed')}</span><span>%</span>
        </div>
        {data.cohort.length === 0 && <div style={{ padding: 18, color: 'var(--muted)', fontSize: 14 }}>{t('noData')}</div>}
        {data.cohort.map((r) => (
          <div key={r.cohort} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, padding: '11px 18px', borderTop: '1px solid #F3F6FA', fontSize: 13, color: 'var(--navy-800)', fontWeight: 600 }}>
            <span>{r.cohort}</span><span>{r.enrolled}</span><span>{r.completed}</span><span>{r.enrolled ? Math.round((r.completed / r.enrolled) * 100) : 0}%</span>
          </div>
        ))}
      </Card>
    </PageWrap>
  )
}
