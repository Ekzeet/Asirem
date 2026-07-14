import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { Icon } from '../../components/Icon'
import { Loader, PageWrap } from '../../components/ui'

type Cert = { id: string; serial: string; issued_at: string; title: string }

export default function Certificates() {
  const { me } = useAuth()
  const { t, lang } = useI18n()

  const { data, loading } = useAsync(async () => {
    const { data: rows } = await supabase
      .from('certificates')
      .select('id, serial, issued_at, course:courses(title)')
      .eq('user_id', me!.userId)
      .order('issued_at', { ascending: false })
    return (rows ?? []).map((r: any) => ({ id: r.id, serial: r.serial, issued_at: r.issued_at, title: r.course?.title ?? '—' })) as Cert[]
  }, [me!.userId])

  if (loading || !data) return <Loader />
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <PageWrap>
      {data.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14 }}>{t('noData')}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
        {data.map((c) => (
          <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#0F2C4C,#123C69)', padding: '22px 24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -24, top: -24, width: 120, height: 120, borderRadius: '50%', background: 'rgba(217,164,65,.16)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, position: 'relative' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#E7B450,#D9A441)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F2C4C' }}><Icon name="award" size={20} /></div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, letterSpacing: .5 }}>ASIREM ACADEMY</div>
              </div>
              <div style={{ fontSize: 11, color: '#9DB4D0', fontWeight: 700, position: 'relative' }}>{t('certificate')}</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 18, lineHeight: 1.3, marginTop: 4, position: 'relative' }}>{c.title}</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11.5, color: '#93A1B4', fontWeight: 700 }}>{t('issuedTo')} {me!.fullName}</div>
                <div style={{ fontSize: 12.5, color: 'var(--navy-800)', fontWeight: 700, marginTop: 2 }}>{fmt(c.issued_at)}</div>
                <div style={{ fontSize: 11, color: '#9AA7B8', fontWeight: 600, marginTop: 4, fontFamily: 'var(--display)' }}>{c.serial}</div>
              </div>
              <button style={{ height: 40, padding: '0 16px', borderRadius: 11, border: '1px solid var(--border)', background: '#fff', color: 'var(--navy-800)', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="download" size={16} />{t('downloadCert')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </PageWrap>
  )
}
