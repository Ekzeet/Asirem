import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { moneyFull } from '../../lib/format'
import { Card, Loader, PageWrap } from '../../components/ui'
import { inputCss } from '../../components/Modal'

type Req = { id: string; amount_cents: number; status: string; assigned_instructor_id: string | null; created_at: string; course_id: string | null; user_id: string; course?: { title: string } | null }
type Person = { id: string; name: string }
const STATUSES = ['pending', 'assigned', 'completed', 'cancelled']

export default function AdminRequests() {
  const { me } = useAuth()
  const { t, lang } = useI18n()
  const inst = me!.institutionId

  const { data, loading, reload } = useAsync(async () => {
    const { data: reqs } = await supabase.from('instructor_requests')
      .select('id, amount_cents, status, assigned_instructor_id, created_at, course_id, user_id, course:courses(title)')
      .eq('institution_id', inst).order('created_at', { ascending: false })
    const list = (reqs ?? []) as unknown as Req[]
    const userIds = [...new Set(list.map((r) => r.user_id))]
    const { data: profs } = userIds.length ? await supabase.from('profiles').select('id, full_name').in('id', userIds) : { data: [] as any[] }
    const nameById: Record<string, string> = {}
    for (const p of profs ?? []) nameById[(p as any).id] = (p as any).full_name ?? '—'
    const { data: mem } = await supabase.from('memberships')
      .select('user_id, profiles:profiles!memberships_user_profile_fkey(full_name)')
      .eq('institution_id', inst).eq('status', 'active').in('role', ['teacher', 'institution_admin', 'super_admin'])
    const seen = new Set<string>()
    const instructors: Person[] = []
    for (const m of mem ?? []) { const id = (m as any).user_id; if (!seen.has(id)) { seen.add(id); instructors.push({ id, name: (m as any).profiles?.full_name ?? '—' }) } }
    return { list, nameById, instructors }
  }, [inst])

  async function assign(id: string, instructorId: string) {
    await supabase.from('instructor_requests').update({ assigned_instructor_id: instructorId || null, status: instructorId ? 'assigned' : 'pending' }).eq('id', id)
    reload()
  }
  async function setStatus(id: string, status: string) {
    await supabase.from('instructor_requests').update({ status }).eq('id', id)
    reload()
  }

  if (loading || !data) return <Loader />
  const { list, nameById, instructors } = data
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
  const chip = (s: string) => ({ pending: ['#FBF1E1', '#C99A2E'], assigned: ['#EAF1FB', '#1B5FB0'], completed: ['#EAF6EF', '#1F8A5B'], cancelled: ['#F1F4F8', '#8494A8'] } as any)[s] ?? ['#F1F4F8', '#8494A8']

  return (
    <PageWrap>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 22, color: 'var(--navy-800)', marginBottom: 18 }}>{t('instructorRequests')}</div>
      {list.length === 0 ? (
        <Card style={{ padding: 28, textAlign: 'center', color: '#8494A8', fontWeight: 600 }}>{t('noRequests')}</Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((r) => {
            const [bg, fg] = chip(r.status)
            return (
              <Card key={r.id} style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr', gap: 14, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-800)', fontSize: 14 }}>{r.course?.title ?? '—'}</div>
                  <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{nameById[r.user_id] ?? '—'} · {fmtDate(r.created_at)}</div>
                </div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 800, color: '#1F8A5B' }}>{moneyFull(r.amount_cents)}</div>
                <select value={r.assigned_instructor_id ?? ''} onChange={(e) => assign(r.id, e.target.value)} style={{ ...inputCss, padding: '8px 10px' }}>
                  <option value="">{t('assignInstructor')}</option>
                  {instructors.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: fg, background: bg, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase' }}>{t('reqStatus_' + r.status) || r.status}</span>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} style={{ ...inputCss, padding: '8px 10px', width: 'auto' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{t('reqStatus_' + s) || s}</option>)}
                  </select>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </PageWrap>
  )
}
