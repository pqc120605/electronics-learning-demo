import { useMemo, useState, type DragEvent } from 'react'
import { generateLedCpp, starterLedProgram, type LedAction, type LedProgramIr } from '../../lib/lessonProgramIr'

type Props = { program: LedProgramIr; onChange: (program: LedProgramIr) => void; activeActionIndex: number; onActiveAction: (index: number) => void }
const choices: Array<{kind: LedAction['kind']; label: string}> = [
  { kind: 'write', label: 'Đặt mức GPIO' }, { kind: 'delay', label: 'Chờ một khoảng' },
]

export function BlockCodeWorkspace({ program, onChange, activeActionIndex, onActiveAction }: Props) {
  const [showHelp, setShowHelp] = useState(true)
  const code = useMemo(() => generateLedCpp(program), [program])
  const actions = program.loop
  function update(index: number, next: LedAction) { onChange({ ...program, loop: actions.map((action, i) => i === index ? next : action) }) }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= actions.length) return
    const next = [...actions]; [next[index], next[target]] = [next[target], next[index]]; onChange({ ...program, loop: next })
  }
  function dropAt(event: DragEvent<HTMLElement>, target: number) {
    event.preventDefault()
    const source = Number(event.dataTransfer.getData('text/plain'))
    if (!Number.isInteger(source) || source < 0 || source >= actions.length || source === target) return
    const next = [...actions]
    const [moved] = next.splice(source, 1)
    next.splice(target, 0, moved)
    onChange({ ...program, loop: next })
  }
  function add(kind: LedAction['kind']) {
    if(actions.length>=4)return
    const next = kind === 'write' ? { kind: 'write' as const, pin: program.pin, value: 'HIGH' as const } : { kind: 'delay' as const, milliseconds: 500 }
    onChange({ ...program, loop: [...actions, next] })
  }
  return <div className="lesson-workspace">
    {showHelp && <section className="workspace-help"><button type="button" aria-label="Ẩn hướng dẫn" onClick={() => setShowHelp(false)}>×</button><strong>Lắp chương trình bằng các khối</strong><p>Thêm khối ở bên trái, đổi giá trị rồi sắp xếp theo thứ tự ghi mức → chờ → ghi mức → chờ. Chân mẫu GPIO {program.pin} phù hợp với mạch LED trong bài.</p></section>}
    {!showHelp && <button className="workspace-help-reopen" type="button" onClick={() => setShowHelp(true)}>Mở hướng dẫn</button>}
    <div className="block-workspace-grid">
      <section className="block-toolbox"><p>THÊM KHỐI · tối đa 4 khối cho mẫu LED</p><span>BẮT ĐẦU</span><div className="block-static">Thiết lập đầu ra · GPIO {program.pin}</div><span>ĐIỀU KHIỂN LED</span>{choices.map((choice) => <button key={choice.kind} type="button" disabled={actions.length>=4} onClick={() => add(choice.kind)}>{choice.label} <b>＋</b></button>)}</section>
      <div className="block-canvas" aria-label="Các khối chương trình theo thứ tự">
        <div className="block-section-label">KHI BẮT ĐẦU</div><div className="block-static block-setup">Đặt GPIO {program.pin} thành đầu ra</div>
        <div className="block-section-label">LẶP MÃI MÃI</div>
        {actions.map((action, index) => <article className={`code-block block-${action.kind} ${activeActionIndex === index + 1 ? 'code-block-active' : ''}`} key={`${index}-${action.kind}`} draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move' }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropAt(event, index)} onClick={() => onActiveAction(index + 1)}>
          <div className="block-grip" aria-label={`Kéo để sắp xếp khối ${index + 1}`} title="Kéo để sắp xếp">⠿</div>
          {action.kind === 'write' ? <label>Đặt GPIO <strong>{program.pin}</strong> thành <select aria-label="Mức tín hiệu" value={action.value} onChange={(event) => update(index, { ...action, pin: program.pin, value: event.target.value as 'HIGH' | 'LOW' })}><option>HIGH</option><option>LOW</option></select></label> : action.kind === 'delay' ? <label>Chờ <input type="number" min="1" max="10000" aria-label="Thời gian chờ" value={action.milliseconds} onChange={(event) => update(index, { ...action, milliseconds: Math.min(10000, Math.max(1, Number(event.target.value))) })} /> ms</label> : <label>Đặt GPIO {program.pin} thành đầu ra</label>}
          <div className="block-controls"><button type="button" aria-label="Đưa khối lên" onClick={(event) => { event.stopPropagation(); move(index, -1) }}>↑</button><button type="button" aria-label="Đưa khối xuống" onClick={(event) => { event.stopPropagation(); move(index, 1) }}>↓</button><button type="button" aria-label="Xóa khối" onClick={(event) => { event.stopPropagation(); onChange({ ...program, loop: actions.filter((_, i) => i !== index) }) }}>×</button></div>
        </article>)}
        {actions.length === 0 && <p className="block-empty">Chưa có khối trong vòng lặp. Hãy thêm một khối điều khiển LED.</p>}
        <button className="block-reset" type="button" onClick={() => onChange(structuredClone(starterLedProgram))}>Khôi phục ví dụ</button>
      </div>
    </div>
    <details className="block-code-preview" open><summary>Code C++ được tạo từ các khối</summary><pre><code>{code}</code></pre></details>
  </div>
}
