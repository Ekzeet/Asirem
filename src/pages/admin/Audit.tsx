import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { relTime } from '../../lib/format'
import { Avatar, Card, Loader, PageWrap } from '../../components/ui'
import { Icon } from '../../components/Icon'

type Row = { id: string; action: string; entity: string; meta: any; created_at: string; actor: string }

const ACTION: Record<string, [string, string, string]> = {
  delete: ['trash-2', '#FBEBEB', '#D14343'],
  grade: ['award', '#EAF6EF', '#1F8A5B'],
  invite: ['user-plus', '#EAF1FB', '#1B5FB0'],
}

export default function Audit() {
  const { me } = useAuth()
  const { t, lang } = useI18n()

  const { data, loading } = useAsync(async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('id, action, entity, meta, created_at, actor:profiles!audit_log_actor_id_fkey(full_name)')
      .eq('institution_id', me!.institutionId)
      .order('created_at', { ascending: false })
      .limit(100)
    return (data ?? []).map((r: any) => ({ id: r.id, action: r.action, entity: r.entity, meta: r.meta, created_at: r.created_at, actor: r.actor?.full_name ?? '—' })) as Row[]
  }, [me!.institutionId])

  if (loading || !data) return <Loader />

  return (
    <PageWrap maxWidth={900}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)', marginBottom: 4 }}>{t('auditLog')}</div>
      <div style={{ fontSize: 13, color: '#8494A8', fontWeight: 600, marginBottom: 18 }}>{t('auditSub')}</div>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noData')}</div>}
      <Card style={{ overflow: 'hidden' }}>
        {data.map((r) => {
          const [icon, tint, color] = ACTION[r.action] ?? ['activity', '#EEF2F7', '#7C8AA0']
          const label = r.meta?.title || r.meta?.grade != null ? (r.meta?.title ?? `${r.meta.grade}/100`) : r.entity
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: '1px solid var(--border-soft)' }}>
              <div style={{ width: 34, height: 34, flex: 'none', borderRadius: 9, background: tint, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy-800)' }}>{t('action_' + r.action) ?? r.action} · <span style={{ color: '#5B6B82', fontWeight: 600 }}>{r.entity}</span> {label && <span style={{ color: '#8494A8', fontWeight: 600 }}>— {String(label)}</span>}</div>
                <div style={{ fontSize: 11.5, color: '#9AA7B8', fontWeight: 600 }}>{r.actor} · {relTime(r.created_at, lang)}</div>
              </div>
              <Avatar name={r.actor} size={30} radius={8} />
            </div>
          )
        })}
      </Card>
    </PageWrap>
  )
}
