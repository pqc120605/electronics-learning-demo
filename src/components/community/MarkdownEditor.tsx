import { useId, useRef, useState } from 'react'
import { MarkdownView } from './MarkdownView'

type MarkdownEditorProps = {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  maxLength: number
  error?: string
  hint?: string
}

/** Ô soạn markdown đơn giản: chèn đậm / code / khối code và xem trước an toàn. */
export function MarkdownEditor({ label, value, onChange, rows = 8, maxLength, error, hint }: MarkdownEditorProps) {
  const id = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const wrap = (before: string, after: string, placeholder: string) => {
    const element = textareaRef.current
    const start = element?.selectionStart ?? value.length
    const end = element?.selectionEnd ?? value.length
    const selected = value.slice(start, end) || placeholder
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`
    onChange(next.slice(0, maxLength))
    requestAnimationFrame(() => {
      if (!element) return
      element.focus()
      element.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const insertCodeBlock = () => {
    const element = textareaRef.current
    const start = element?.selectionStart ?? value.length
    const needsBreak = start > 0 && value[start - 1] !== '\n'
    wrap(`${needsBreak ? '\n' : ''}\`\`\`cpp\n`, '\n```\n', '// dán code ở đây')
  }

  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className="md-editor">
      <div className="md-editor-head">
        <label htmlFor={id}>{label}</label>
        <div className="md-editor-tools" role="toolbar" aria-label={`Định dạng ${label.toLowerCase()}`}>
          <button type="button" onClick={() => wrap('**', '**', 'chữ đậm')} disabled={preview}>Đậm</button>
          <button type="button" onClick={() => wrap('`', '`', 'code')} disabled={preview}>Code nội dòng</button>
          <button type="button" onClick={insertCodeBlock} disabled={preview}>Chèn khối code</button>
          <button type="button" aria-pressed={preview} onClick={() => setPreview(open => !open)}>{preview ? 'Quay lại soạn' : 'Xem trước'}</button>
        </div>
      </div>
      {preview ? (
        <div className="md-editor-preview" aria-label={`Xem trước ${label.toLowerCase()}`} role="region">
          {value.trim() ? <MarkdownView source={value} /> : <p className="md-editor-empty">Chưa có nội dung để xem trước.</p>}
        </div>
      ) : (
        <textarea ref={textareaRef} id={id} rows={rows} value={value} maxLength={maxLength} aria-invalid={Boolean(error)} aria-describedby={describedBy} onChange={(event) => onChange(event.target.value)} />
      )}
      <p className="md-editor-foot">
        {hint && <span id={`${id}-hint`}>{hint}</span>}
        <span aria-hidden="true">{value.length}/{maxLength}</span>
      </p>
      {error && <p className="community-field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
