import { useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'

const btn: React.CSSProperties = { minWidth: 30, height: 28, padding: '0 7px', border: '1px solid var(--border)', background: '#fff', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 800, color: '#5B6B82', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }

/** Lightweight Word-style rich-text editor (contentEditable + toolbar). Value is HTML. */
export function RichTextEditor({ value, onChange, minHeight = 120, placeholder }: { value: string; onChange: (html: string) => void; minHeight?: number; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current && ref.current.innerHTML !== (value || '')) ref.current.innerHTML = value || '' }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const emit = () => { if (ref.current) onChange(ref.current.innerHTML) }
  const exec = (cmd: string, arg?: string) => { document.execCommand(cmd, false, arg); ref.current?.focus(); emit() }
  const link = () => { const url = window.prompt('Link URL (https://…)'); if (url) exec('createLink', url) }
  const tools: [string, () => void, React.ReactNode][] = [
    ['Bold', () => exec('bold'), <b>B</b>],
    ['Italic', () => exec('italic'), <i>I</i>],
    ['Underline', () => exec('underline'), <span style={{ textDecoration: 'underline' }}>U</span>],
    ['Heading', () => exec('formatBlock', 'H3'), 'H'],
    ['Bulleted list', () => exec('insertUnorderedList'), '•'],
    ['Numbered list', () => exec('insertOrderedList'), '1.'],
    ['Quote', () => exec('formatBlock', 'BLOCKQUOTE'), '❝'],
    ['Link', link, '🔗'],
    ['Clear', () => exec('removeFormat'), '⌫'],
  ]
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 4, padding: 6, borderBottom: '1px solid var(--border)', background: '#F7F9FC', flexWrap: 'wrap' }}>
        {tools.map(([title, fn, label], i) => (
          <button key={i} type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={fn} style={btn}>{label}</button>
        ))}
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning onInput={emit} data-placeholder={placeholder} className="rte"
        style={{ minHeight, padding: '10px 12px', fontSize: 14, lineHeight: 1.6, color: 'var(--navy-800)', outline: 'none', background: '#fff' }} />
    </div>
  )
}

/** Renders sanitized rich-text HTML (safe against XSS). */
export function RichText({ html, style }: { html: string | null | undefined; style?: React.CSSProperties }) {
  const clean = DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true }, ADD_ATTR: ['target', 'rel'] })
  return <div className="rte-view" style={style} dangerouslySetInnerHTML={{ __html: clean }} />
}
