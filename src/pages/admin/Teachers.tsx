import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Avatar, Card, Loader, PageWrap, StatusChip } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { BtnGhost, BtnPrimary, Field, Modal, inputCss } from '../../components/Modal'

type Teacher = {
  userId: string; name: string; status: string; specialty: string
  courses: number; students: number; rating: number | null
}

export default function AdminTeachers() {
  const { me } = useAuth()
  const { t } = useI18n()
  const inst = me!.institutionId

  const [showInvite, setShowInvite] = useState(false)

  const { data, loading, reload } = useAsync(async () => {
    const [{ data: mem }, { data: courses }, { data: enr }] = await Promise.all([
      supabase.from('memberships').select('user_id, status, profiles:profiles!memberships_user_profile_fkey(full_name)').eq('institution_id', inst).eq('role', 'teacher'),
      supabase.from('courses').select('id, instructor_id, category, rating').eq('institution_id', inst),
      supabase.from('enrollments').select('course_id').eq('institution_id', inst),
    ])
    const enrByCourse: Record<string, number> = {}
    for (const e of enr ?? []) enrByCourse[e.course_id] = (enrByCourse[e.course_id] ?? 0) + 1
    const rows: Teacher[] = (mem ?? []).map((m: any) => {
      const cs = (courses ?? []).filter((c) => c.instructor_id === m.user_id)
      const students = cs.reduce((s, c) => s + (enrByCourse[c.id] ?? 0), 0)
      const rated = cs.filter((c) => c.rating != null)
      const rating = rated.length ? Math.round((rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length) * 10) / 10 : null
      const specialty = Array.from(new Set(cs.map((c) => c.category).filter(Boolean))).join(' & ') || '—'
      return { userId: m.user_id, name: m.profiles?.full_name ?? '—', status: m.status, specialty, courses: cs.length, students, rating }
    })
    return rows.sort((a, b) => b.students - a.students)
  }, [inst])

  if (loading || !data) return <Loader />

  return (
    <PageWrap>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: '#7C8AA0', fontWeight: 600 }}>{data.length} {t('instructors')}</div>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowInvite(true)} style={{ height: 40, padding: '0 16px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon name="user-plus" size={16} />{t('inviteTeacher')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {data.map((tc) => (
          <Card key={tc.userId} style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 16 }}>
              <Avatar name={tc.name} size={52} radius={14} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)' }}>{tc.name}</div>
                <div style={{ fontSize: 12, color: '#8494A8', fontWeight: 600 }}>{tc.specialty}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#EAF3FF', color: '#1B5FB0' }}>{t('instructor').replace(/s$/, '')}</span>
              <StatusChip status={tc.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center', paddingTop: 14, borderTop: '1px solid var(--border-soft)' }}>
              {[
                { v: tc.courses, l: t('courses') },
                { v: tc.students, l: t('students') },
                { v: tc.rating != null ? `★${tc.rating}` : '—', l: t('rating'), gold: true },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: s.gold ? '#C99A2E' : 'var(--navy-800)' }}>{s.v}</div>
                  <div style={{ fontSize: 10.5, color: '#93A1B4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {showInvite && <InviteModal institutionId={me!.institutionId} onClose={() => setShowInvite(false)} onSaved={() => { setShowInvite(false); reload() }} />}
    </PageWrap>
  )
}

function InviteModal({ institutionId, onClose, onSaved }: { institutionId: string; onClose: () => void; onSaved: () => void }) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function invite() {
    if (!name.trim() || !email.trim()) return
    setBusy(true); setError(null)
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string },
        body: JSON.stringify({ email: email.trim(), full_name: name.trim(), role, institution_id: institutionId }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error ?? 'Failed'); setBusy(false); return }
      setOk(true); setBusy(false)
      setTimeout(onSaved, 700)
    } catch (e: any) { setError(e.message); setBusy(false) }
  }

  return (
    <Modal title={t('inviteTeacher')} subtitle={t('inviteSub')} onClose={onClose}
      footer={<><BtnGhost onClick={onClose}>{t('cancel')}</BtnGhost><BtnPrimary onClick={invite} disabled={busy || ok}><Icon name="user-plus" size={16} />{ok ? '✓' : t('sendInvite')}</BtnPrimary></>}>
      {error && <div style={{ fontSize: 12.5, color: 'var(--red)', fontWeight: 600, background: '#FBEBEB', padding: '9px 12px', borderRadius: 10, marginBottom: 14 }}>{error}</div>}
      <Field label={t('fullName')}><input value={name} onChange={(e) => setName(e.target.value)} style={inputCss} /></Field>
      <Field label={t('email')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputCss} /></Field>
      <Field label={t('role')}>
        <select value={role} onChange={(e) => setRole(e.target.value as any)} style={inputCss}>
          <option value="teacher">{t('teachers').replace(/s$/, '')}</option>
          <option value="student">{t('student')}</option>
        </select>
      </Field>
      <div style={{ fontSize: 12, color: '#9AA7B8', fontWeight: 600 }}>{t('inviteNote')}</div>
    </Modal>
  )
}
