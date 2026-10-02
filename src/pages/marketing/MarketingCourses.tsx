import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAsync } from '../../hooks/useAsync'
import { useDocumentHead } from '../../lib/seo'
import { Loader } from '../../components/ui'
import CourseCard, { PublicCourse } from './CourseCard'

const wrap = { maxWidth: 1180, margin: '0 auto' } as const
const chipBase: React.CSSProperties = { fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 14, textTransform: 'uppercase', letterSpacing: '.03em', padding: '9px 18px', border: '1px solid var(--color-divider)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer', lineHeight: 1 }
const chipActive: React.CSSProperties = { ...chipBase, border: '1px solid var(--color-accent)', background: 'var(--color-accent)', color: 'var(--color-bg)' }

export default function MarketingCourses() {
  useDocumentHead({ title: 'Asirem Academy · Courses', description: 'From individual tax preparation to health insurance, choose the program that matches your career goal.' })
  const [filter, setFilter] = useState('All')
  const { data, loading } = useAsync(async () => {
    const { data } = await supabase.rpc('list_public_courses')
    return (data ?? []) as PublicCourse[]
  }, [])
  if (loading || !data) return <Loader />

  const cats = ['All', ...Array.from(new Set(data.map((c) => c.category).filter(Boolean) as string[]))]
  const shown = filter === 'All' ? data : data.filter((c) => c.category === filter)

  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <section style={{ ...wrap, padding: 'clamp(44px,6vw,76px) clamp(20px,5vw,64px) clamp(24px,3vw,36px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 14 }}>Catalog</span>
        <h1 style={{ fontSize: 'clamp(36px,4.6vw,60px)', textTransform: 'uppercase', lineHeight: 1.02, maxWidth: '16ch' }}>Our programs</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, maxWidth: '58ch', color: 'var(--color-neutral-700)', margin: '22px 0 0' }}>From individual tax preparation to health insurance, choose the program that matches your career goal.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
          {cats.map((c) => (
            <button key={c} type="button" onClick={() => setFilter(c)} style={filter === c ? chipActive : chipBase}>{c}</button>
          ))}
        </div>
      </section>
      <section style={{ ...wrap, padding: '0 clamp(20px,5vw,64px) clamp(48px,7vw,88px)' }}>
        {shown.length === 0 ? (
          <div style={{ color: 'var(--color-neutral-600)', fontSize: 15 }}>No courses in this category yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3vw,32px)' }} className="grid-3">
            {shown.map((c) => <CourseCard key={c.id} c={c} />)}
          </div>
        )}
      </section>
    </div>
  )
}
