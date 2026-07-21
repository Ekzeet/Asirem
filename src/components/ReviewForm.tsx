import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { supabase } from '../lib/supabase'
import { useAsync } from '../hooks/useAsync'
import { StarRating } from './StarRating'

/** Verified-purchaser review form: loads the user's existing review (if any) for a course and upserts on submit. RLS gates inserts to verified purchasers. */
export function ReviewForm({ courseId, institutionId }: { courseId: string; institutionId: string }) {
  const { me } = useAuth()
  const { t } = useI18n()

  const { data, loading, reload } = useAsync(async () => {
    const { data: existing } = await supabase
      .from('course_reviews')
      .select('rating,title,body')
      .eq('course_id', courseId)
      .eq('user_id', me!.userId)
      .maybeSingle()
    return existing as { rating: number; title: string | null; body: string | null } | null
  }, [courseId, me!.userId])

  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Seed local state once the existing review has loaded (or once we know there is none).
  useEffect(() => {
    if (loading) return
    setRating(data?.rating ?? 0)
    setTitle(data?.title ?? '')
    setBody(data?.body ?? '')
    setSaved(false)
  }, [loading, data])

  const hasExisting = !!data

  async function submit() {
    if (rating === 0) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const { error: upsertError } = await supabase
      .from('course_reviews')
      .upsert(
        { institution_id: institutionId, course_id: courseId, user_id: me!.userId, rating, title, body },
        { onConflict: 'course_id,user_id' },
      )
    setSaving(false)
    if (upsertError) {
      setError(upsertError.message)
      return
    }
    setSaved(true)
    reload()
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15, color: 'var(--navy-800)', marginBottom: 12 }}>{t('rateThisCourse')}</div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8494A8', marginBottom: 6 }}>{t('yourReview')}</div>
        <StarRating value={rating} size={24} onChange={(v) => { setRating(v); setSaved(false) }} />
      </div>

      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setSaved(false) }}
        placeholder={t('reviewTitle')}
        style={{ width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 11, padding: '0 12px', fontSize: 13.5, outline: 'none', marginBottom: 10 }}
      />
      <textarea
        value={body}
        onChange={(e) => { setBody(e.target.value); setSaved(false) }}
        placeholder={t('yourAnswer')}
        style={{ width: '100%', minHeight: 80, border: '1px solid var(--border)', borderRadius: 11, padding: 12, fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'var(--sans)', marginBottom: 10 }}
      />

      {error && <div style={{ fontSize: 12.5, color: '#D14343', fontWeight: 600, marginBottom: 10 }}>{error}</div>}
      {saved && !error && <div style={{ fontSize: 12.5, color: '#1F8A5B', fontWeight: 700, marginBottom: 10 }}>✓ {t('reviewSaved')}</div>}

      <button
        onClick={submit}
        disabled={rating === 0 || saving}
        style={{ height: 42, padding: '0 20px', borderRadius: 11, background: '#0F2C4C', color: '#fff', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: rating === 0 ? 'default' : 'pointer', opacity: rating === 0 || saving ? 0.6 : 1 }}
      >
        {hasExisting ? t('updateReview') : t('rateThisCourse')}
      </button>
    </div>
  )
}

export default ReviewForm
