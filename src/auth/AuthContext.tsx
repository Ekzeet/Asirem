import { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type Role = 'super_admin' | 'institution_admin' | 'teacher' | 'student'

export type Me = {
  userId: string
  email: string
  fullName: string
  institutionId: string
  role: Role
}

type AuthState = {
  session: Session | null
  me: Me | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

async function loadMe(userId: string, email: string): Promise<Me | null> {
  // membership (role + institution) + profile (name), respecting RLS
  const [{ data: mem }, { data: prof }] = await Promise.all([
    supabase
      .from('memberships')
      .select('institution_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
  ])
  if (!mem || !mem.institution_id) return null
  return {
    userId,
    email,
    fullName: prof?.full_name ?? email,
    institutionId: mem.institution_id,
    role: mem.role as Role,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) {
        setMe(await loadMe(data.session.user.id, data.session.user.email ?? ''))
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, s) => {
      setSession(s)
      if (s?.user) {
        setMe(await loadMe(s.user.id, s.user.email ?? ''))
      } else {
        setMe(null)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setMe(null)
  }

  return <Ctx.Provider value={{ session, me, loading, signIn, signOut }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
