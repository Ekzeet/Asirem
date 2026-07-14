/** Seeded demo accounts — all share the same demo password (dev/demo only). */
export const DEMO_PASSWORD = 'asirem2026'

export type DemoAccount = { email: string; name: string; role: 'institution_admin' | 'teacher' | 'student' }

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'amina@meridian.test', name: 'Amina Yusuf', role: 'institution_admin' },
  { email: 'sarah@asirem.test', name: 'Sarah Morel', role: 'teacher' },
  { email: 'lina@asirem.test', name: 'Lina Toussaint', role: 'student' },
]
