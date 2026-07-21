import { supabase } from './supabase'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`

/** A referral code captured from ?ref= is stashed in localStorage and attached to checkout. */
export function captureRef() {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (ref) try { localStorage.setItem('asirem-ref', ref) } catch { /* ignore */ }
}

export async function startCheckout(opts: { courseId?: string; pathId?: string; planId?: string; email?: string; coupon?: string }): Promise<void> {
  const { data: sess } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string }
  if (sess?.session?.access_token) headers.Authorization = `Bearer ${sess.session.access_token}`
  let ref: string | null = null
  try { ref = localStorage.getItem('asirem-ref') } catch { /* ignore */ }
  const res = await fetch(FN_URL, {
    method: 'POST', headers,
    body: JSON.stringify({ course_id: opts.courseId, path_id: opts.pathId, plan_id: opts.planId, email: opts.email, coupon: opts.coupon, ref }),
  })
  const body = await res.json()
  if (body?.url) window.location.href = body.url
  else alert(body?.error ?? 'checkout_failed')
}
