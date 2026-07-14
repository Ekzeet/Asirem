import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { relTime } from '../../lib/format'
import { Avatar, Card, Loader, PageWrap, ProgressBar } from '../../components/ui'

type Row = {
  userId: string; name: string; email: string; courses: number; pct: number; last: string; plan: string
}

export default function AdminStudents() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId

  const { data, loading } = useAsync(async () => {
    // members with student role, their enrollments (+ plan) and progress
    const [{ data: mem }, { data: enr }, { data: prog }, { data: plans }] = await Promise.all([
      supabase.from('memberships').select('user_id, role, profiles:profiles!memberships_user_profile_fkey(full_name)').eq('institution_id', inst).eq('role', 'student'),
      supabase.from('enrollments').select('user_id, course_id, plan_id, last_active_at').eq('institution_id', inst),
      supabase.from('course_progress').select('user_id, pct'),
      supabase.from('plans').select('id, code, name').eq('institution_id', inst),
    ])
    const planById: Record<string, string> = {}
    for (const p of plans ?? []) planById[p.id] = p.name
    const rows: Row[] = (mem ?? []).map((m: any) => {
      const es = (enr ?? []).filter((e) => e.user_id === m.user_id)
      const ps = (prog ?? []).filter((p) => p.user_id === m.user_id)
      const avgPct = ps.length ? Math.round(ps.reduce((s, p) => s + (p.pct ?? 0), 0) / ps.length) : 0
      const lastActive = es.map((e) => e.last_active_at).sort().at(-1) ?? new Date().toISOString()
      const topPlan = es.map((e) => (e.plan_id ? planById[e.plan_id] : 'Gratuit')).sort().at(0) ?? 'Gratuit'
      return { userId: m.user_id, name: m.profiles?.full_name ?? '—', email: '', courses: es.length, pct: avgPct, last: lastActive, plan: topPlan }
    })
    // emails aren't in profiles; show a friendly handle instead
    return rows.sort((a, b) => b.pct - a.pct)
  }, [inst])

  if (loading || !data) return <Loader />

  const stats = [
    { label: t('totalStudents'), value: String(data.length) },
    { label: t('activeWeek'), value: String(data.filter((r) => Date.now() - new Date(r.last).getTime() < 7 * 864e5).length) },
    { label: t('enrolledCourses'), value: String(data.reduce((s, r) => s + r.courses, 0)) },
    { label: t('premiumSubs'), value: String(data.filter((r) => r.plan.toLowerCase().includes('premium')).length) },
  ]
  const gridCols = '2.4fr 1.4fr 1fr 1.3fr 90px'

  const planChip = (p: string) => {
    const low = p.toLowerCase()
    const [bg, fg] = low.includes('premium') ? ['#EAF1FB', '#1B5FB0'] : low.includes('unique') || low.includes('one') ? ['#FBF1E1', '#C99A2E'] : ['#EEF2F7', '#7C8AA0']
    return { background: bg, color: fg }
  }

  return (
    <PageWrap>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: '15px 17px', borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 23, color: 'var(--navy-800)', marginTop: 3 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, padding: '13px 22px', background: '#FAFBFD', borderBottom: '1px solid #EEF2F7', fontSize: 11, fontWeight: 800, color: '#8494A8', textTransform: 'uppercase', letterSpacing: .5 }}>
          <span>{t('student')}</span><span>{t('enrolledCourses')}</span><span>{t('progress')}</span><span>{t('lastActive')}</span><span></span>
        </div>
        {data.map((s) => {
          const chip = planChip(s.plan)
          return (
            <div key={s.userId} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, alignItems: 'center', padding: '13px 22px', borderTop: '1px solid #F3F6FA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar name={s.name} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy-800)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: '#93A1B4', fontWeight: 600 }}>{s.courses} {t('courses').toLowerCase()}</div>
                </div>
              </div>
              <span style={{ fontSize: 12.5, color: '#3C4A5E', fontWeight: 600 }}>{s.courses} {t('courses').toLowerCase()}</span>
              <div>
                <div style={{ marginBottom: 4 }}>
                  <ProgressBar pct={s.pct} from={s.pct >= 75 ? '#1F8A5B' : s.pct >= 40 ? '#D9A441' : '#D14343'} to={s.pct >= 75 ? '#35A874' : s.pct >= 40 ? '#E7B450' : '#E86A6A'} />
                </div>
                <span style={{ fontSize: 11, color: '#8494A8', fontWeight: 700 }}>{s.pct}%</span>
              </div>
              <span style={{ fontSize: 12.5, color: '#7C8AA0', fontWeight: 600 }}>{relTime(s.last, lang)}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, ...chip }}>{s.plan}</span>
              </div>
            </div>
          )
        })}
      </Card>
    </PageWrap>
  )
}
