import { useRef, useState } from 'react'
import { generateLedCpp, starterLedProgram, type LedProgramIr } from '../../lib/lessonProgramIr'
import { parseSupportedArduinoSubset } from '../../lib/parseSupportedArduinoSubset'

type Props = { source: string; onSource: (source: string) => void; onImport: (program: LedProgramIr) => void; onActiveLine: (line: number | null) => void; onResetSample?: () => void; activeLine?: number }
export function CppPracticeEditor({ source, onSource, onImport, onActiveLine, onResetSample, activeLine }: Props) {
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  async function copy() { try { await navigator.clipboard.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { setMessage('Không thể sao chép tự động. Hãy chọn code và sao chép thủ công.') } }
  function importToBlocks() { const result = parseSupportedArduinoSubset(source); if (result.ok) { onImport(result.program); setMessage('Đã chuyển chương trình hỗ trợ sang các khối.') } else setMessage(`Dòng ${result.line}: ${result.message}`) }
  return <div className="cpp-practice"><div className="cpp-toolbar"><span>THỰC HÀNH C++ · CODE KHÔNG ĐƯỢC CHẠY TRÊN WEB</span><div><button type="button" onClick={copy}>{copied ? 'Đã sao chép ✓' : 'Sao chép'}</button><button type="button" onClick={() => { if(onResetSample)onResetSample();else onSource(generateLedCpp(starterLedProgram));setMessage('Đã khôi phục code mẫu.') }}>Khôi phục mẫu</button></div></div>
    <label className="sr-only" htmlFor="cpp-source">Code Arduino C++</label><div className="cpp-editor-frame"><div className="cpp-line-gutter" ref={gutterRef} aria-hidden="true">{source.split('\n').map((_, index) => <span className={(activeLine ?? selectedLine) === index + 1 ? 'cpp-line-active' : ''} key={index}>{index + 1}</span>)}</div><textarea id="cpp-source" spellCheck={false} value={source} onChange={(event) => onSource(event.target.value)} onScroll={(event) => { if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop }} onSelect={(event) => { const selection = event.currentTarget.value.slice(0, event.currentTarget.selectionStart); const line = selection.split('\n').length; setSelectedLine(line); onActiveLine(line) }} /></div>
    <div className="cpp-footer"><button className="button-primary" type="button" onClick={importToBlocks}>Đưa code hỗ trợ sang khối</button><p aria-live="polite">{activeLine ? `Luồng đang minh họa quanh dòng ${activeLine}. ` : selectedLine ? `Đang chọn dòng ${selectedLine}. ` : ''}{message || 'Có thể sửa code tự do. Chỉ cú pháp bài LED được dùng để tạo luồng minh họa.'}</p></div>
  </div>
}
