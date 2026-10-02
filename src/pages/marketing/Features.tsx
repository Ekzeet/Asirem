// "Powerful Features"-style section (EduFlex reference) in the Asirem brand palette
// (navy panels + gold accents). Keeps the original three "Why Asirem Academy" texts,
// with a professional mock illustration per card. Replaces the old blueprint Why grid.

const wrap = { maxWidth: 1180, margin: '0 auto' } as const
const panel: React.CSSProperties = {
  aspectRatio: '16/10', borderRadius: 16, overflow: 'hidden', position: 'relative',
  background: 'linear-gradient(155deg,#0b2143 0%,#1c3a66 100%)',
  boxShadow: '0 20px 40px -20px rgba(11,33,67,.5)',
}
const card: React.CSSProperties = {
  position: 'absolute', background: '#fff', borderRadius: 12,
  boxShadow: '0 14px 34px -12px rgba(0,0,0,.45)', padding: '11px 13px',
}
const gold = '#c6a052'
const navy = '#0b2143'

function Avatar({ letter, ring }: { letter: string; ring?: boolean }) {
  return (
    <div style={{ width: 30, height: 30, flex: 'none', borderRadius: '50%', background: '#e8eaf0', color: navy, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, boxShadow: ring ? `0 0 0 2px ${gold}` : undefined }}>{letter}</div>
  )
}
function Check() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M20 6 9 17l-5-5" /></svg>
}

/* 1 — Concrete skills: stacked "graded return" cards */
function IllusReturns() {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
      <div style={{ ...card, right: 22, width: '80%', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Avatar letter="1040" ring />
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, fontSize: 12.5, color: navy }}>Form 1040 · Individual <Check /></div>
          <div style={{ fontSize: 11.5, color: '#7a808c' }}>Reviewed by instructor — ready to file.</div>
        </div>
      </div>
      <div style={{ ...card, left: 22, width: '80%', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Avatar letter="SC" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12.5, color: navy }}>Individual taxation, sole proprietorship, Schedule C and small business taxation</div>
          <div style={{ fontSize: 11.5, color: '#7a808c' }}>Real client file, week one.</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: navy, background: '#f4edd8', padding: '3px 8px', borderRadius: 20 }}>96%</span>
      </div>
    </div>
  )
}

/* 2 — Professional software: mock tax-app window */
function IllusSoftware() {
  const row = (label: string, w: string) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '7px 0' }}>
      <span style={{ fontSize: 11, color: '#7a808c', fontWeight: 700 }}>{label}</span>
      <span style={{ height: 8, width: w, background: '#e8eaf0', borderRadius: 4 }} />
    </div>
  )
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ ...card, position: 'relative', width: '88%', padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e0554d' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e9b04b' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#57b56a' }} />
          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, color: navy }}>Asirem TaxPro</span>
        </div>
        {row('Gross income', '46%')}
        {row('Deductions', '30%')}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #eef0f4' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: navy }}>Est. refund</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, color: navy }}>$2,480</span>
        </div>
        <div style={{ marginTop: 10, height: 30, borderRadius: 8, background: gold, color: navy, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>Compute return</div>
      </div>
    </div>
  )
}

/* 3 — Recognized certification: certificate card with gold seal + progress */
function IllusCertificate() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 18 }}>
      <div style={{ ...card, position: 'relative', width: '82%', textAlign: 'center', padding: '18px 16px' }}>
        <div style={{ width: 40, height: 40, margin: '0 auto 8px', borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, #e3c877, ${gold})`, display: 'grid', placeItems: 'center', color: navy, boxShadow: '0 6px 16px -4px rgba(198,160,82,.7)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={navy} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7 4.5-2.7 4.5 2.7-1.5-7" /></svg>
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13.5, color: navy, textTransform: 'uppercase', letterSpacing: '.04em' }}>Certificate of Completion</div>
        <div style={{ margin: '8px auto 12px', height: 2, width: '55%', background: '#e8eaf0' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, color: '#7a808c', marginBottom: 5 }}><span>Guided AFSP / With support all the way to your certification.</span><span style={{ color: navy }}>100%</span></div>
        <div style={{ height: 7, borderRadius: 4, background: '#eef0f4', overflow: 'hidden' }}><div style={{ height: '100%', width: '100%', background: gold }} /></div>
      </div>
    </div>
  )
}

const items = [
  { title: 'Concrete skills', desc: 'Real scenarios, not abstract theory. You practice on genuine files from week one.', illus: <IllusReturns /> },
  { title: 'Professional software', desc: 'Master the tax tools used by firms. You graduate job-ready, able to prepare individual and small-business returns for real clients.', illus: <IllusSoftware /> },
  { title: 'Recognized certification', desc: 'Guided AFSP / Exam prep, with support all the way to your certification.', illus: <IllusCertificate /> },
]

export default function Features() {
  return (
    <section style={{ ...wrap, padding: 'clamp(48px,6vw,84px) clamp(20px,5vw,64px)' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto clamp(36px,4vw,52px)' }}>
        <span className="mkt-kicker" style={{ marginBottom: 12 }}>Why Asirem Academy</span>
        <h2 style={{ fontSize: 'clamp(30px,3.6vw,46px)', textTransform: 'uppercase', lineHeight: 1.05, margin: '6px 0 16px' }}>Everything you need to become a tax pro</h2>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--color-neutral-700)' }}>From your first 1040 to your certification — hands-on training, professional software, and expert support at every step.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(24px,3vw,40px)' }} className="grid-3">
        {items.map((it) => (
          <div key={it.title}>
            <div style={panel}>{it.illus}</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 22, color: navy, textTransform: 'uppercase', margin: '18px 0 8px' }}>{it.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-700)' }}>{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
