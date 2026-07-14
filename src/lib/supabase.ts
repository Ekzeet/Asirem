import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

/** True only when both env vars are present at build time. */
export const supabaseConfigured = Boolean(url && key)

if (!supabaseConfigured) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in your Vercel project env vars and redeploy.')
}

// Use placeholders when unconfigured so createClient does not throw at import time
// (which would crash the whole app to a blank screen). The UI shows a config notice instead.
export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'asirem-auth' } },
)
