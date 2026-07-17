import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export function Modal({ title, subtitle, onClose, children, footer, width = 520 }: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal((
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,32,56,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="lmsfade" style={{ width: '100%', maxWidth: width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(11,32,56,.35)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 17, color: 'var(--navy-800)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: '#fff', color: '#5B6B82', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto' }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 22px', borderTop: '1px solid var(--border)', background: '#FAFBFD' }}>{footer}</div>}
      </div>
    </div>
  ), document.body)
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}

export const inputCss: React.CSSProperties = {
  width: '100%', height: 42, border: '1px solid var(--border)', borderRadius: 11, background: '#F7F9FC', padding: '0 13px', fontSize: 13.5, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--sans)',
}
export const textareaCss: React.CSSProperties = {
  width: '100%', minHeight: 90, border: '1px solid var(--border)', borderRadius: 11, background: '#F7F9FC', padding: '11px 13px', fontSize: 13.5, color: 'var(--ink)', outline: 'none', resize: 'vertical', fontFamily: 'var(--sans)', lineHeight: 1.5,
}

export function BtnPrimary({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ height: 42, padding: '0 18px', borderRadius: 11, background: 'linear-gradient(135deg,#E7B450,#D9A441)', color: '#0F2C4C', border: 'none', fontWeight: 800, fontSize: 13.5, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>{children}</button>
  )
}
export function BtnGhost({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ height: 42, padding: '0 16px', borderRadius: 11, background: '#fff', color: '#5B6B82', border: '1px solid var(--border)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>{children}</button>
  )
}
