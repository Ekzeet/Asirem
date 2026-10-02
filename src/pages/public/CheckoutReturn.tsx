import { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'
import { supabase } from '../../lib/supabase'

export default function CheckoutReturn() {
  const [sp] = useSearchParams()
  const { t } = useI18n()
  const ok = sp.get('status') === 'success'

  // On success: wait for the webhook to grant the enrollment, then send the student
  // to their dashboard with a fresh page load (so `hasCourses` reflects the purchase).
  useEffect(() => {
    if (!ok) return
    let tries = 0
    let stop = false
    const tick = async () => {
      if (stop) return
      tries++
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'active')
      if ((count ?? 0) > 0 || tries >= 12) { window.location.href = '/student'; return }
      setTimeout(tick, 1500)
    }
    tick()
    return () => { stop = true }
  }, [ok])

  return (
    <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 44 }}>{ok ? '✅' : '↩️'}</div>
      <h1 style={{ fontFamily: 'var(--display)', color: 'var(--navy-800)' }}>{ok ? t('purchaseThanks') : t('purchaseCancelled')}</h1>
      <p style={{ color: '#5B6B82', fontWeight: 600 }}>{ok ? t('purchaseThanksSub') : t('purchaseCancelledSub')}</p>
      {ok ? (
        <div style={{ marginTop: 16, color: '#8494A8', fontWeight: 700, fontSize: 14 }}>
          <div>{t('loading')}…</div>
          <Link to="/student" style={{ display: 'inline-block', marginTop: 10, background: 'var(--navy-800)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('myCourses')}</Link>
        </div>
      ) : (
        <Link to="/login" style={{ display: 'inline-block', marginTop: 14, background: 'var(--navy-800)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>{t('login')}</Link>
      )}
    </div>
  )
}
