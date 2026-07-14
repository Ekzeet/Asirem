import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DICT, roleLabel, type Lang } from './dict'

type I18n = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  roleName: (role: string) => string
}

const Ctx = createContext<I18n | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('asirem-lang') as Lang) || 'fr')

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('asirem-lang', l)
  }, [])

  const t = useCallback((key: string) => DICT[lang][key] ?? DICT.en[key] ?? key, [lang])
  const roleName = useCallback((role: string) => roleLabel[lang][role] ?? role, [lang])

  const value = useMemo(() => ({ lang, setLang, t, roleName }), [lang, setLang, t, roleName])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useI18n must be used within I18nProvider')
  return c
}
