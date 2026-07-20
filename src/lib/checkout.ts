import { supabase } from './supabase'

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`

export async function startCheckout(opts: { courseId: string; email?: string; coupon?: string }): Promise<void> {
  const { data: sess } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  }
  if (sess?.session?.access_token) headers.Authorization = `Bearer ${sess.session.access_token}`
  const origin = window.location.origin
  const res = await fetch(FN_URL, {
    method: 'POST', headers,
    body: JSON.stringify({
      course_id: opts.courseId, email: opts.email, coupon: opts.coupon,
      success_url: `${origin}/checkout/return`, cancel_url: `${origin}/checkout/return`,
    }),
  })
  const body = await res.json()
  if (body?.url) window.location.href = body.url
  else alert(body?.error ?? 'checkout_failed')
}
