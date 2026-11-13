import type { DragEvent } from 'react'

export const analogBlockOrder = ['read', 'compare', 'above', 'otherwise', 'below'] as const
export type AnalogBlockId = typeof analogBlockOrder[number]

const blocks: Record<AnalogBlockId, { title: string; description: string }> = {
  read: { title: 'Đọc biến trở', description: 'Đọc mức analog tại chân giữa của biến trở' },
  compare: { title: 'So sánh với ngưỡng', description: 'Nếu giá trị lớn hơn ngưỡng đang chọn' },
  above: { title: 'Bật LED', description: 'Đặt chân LED ở mức HIGH' },
  otherwise: { title: 'Ngược lại', description: 'Nếu điều kiện phía trên không đúng' },
  below: { title: 'Tắt LED', description: 'Đặt chân LED ở mức LOW' },
}

type Props = {
  order: AnalogBlockId[]
  onOrderChange: (order: AnalogBlockId[]) => void
  threshold: number
  onThresholdChange: (threshold: number) => void
  inputPin: number
  outputPin: number
  activeIndex: number
  code: string
}

export function AnalogBlockWorkspace({ order, onOrderChange, threshold, onThresholdChange, inputPin, outputPin, activeIndex, code }: Props) {
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    onOrderChange(next)
  }
  function dropAt(event: DragEvent<HTMLElement>, target: number) {
    event.preventDefault()
    const source = Number(event.dataTransfer.getData('text/plain'))
    if (!Number.isInteger(source) || source < 0 || source >= order.length || source === target) return
    const next = [...order]
    const [moved] = next.splice(source, 1)
    next.splice(target, 0, moved)
    onOrderChange(next)
  }
  const sequenceValid = order.length === analogBlockOrder.length && order.every((item, index) => item === analogBlockOrder[index])
  return <div className="lesson-workspace analog-block-workspace">
    <section className="workspace-help"><strong>Luồng chương trình</strong><p>Đọc cảm biến → so sánh ngưỡng → quyết định bật hoặc tắt LED. Kéo khối hoặc dùng nút mũi tên để sắp xếp; thay đổi ngưỡng ngay trong khối điều kiện.</p></section>
    <div className="analog-block-canvas" aria-label="Các bước chương trình biến trở">
      <div className="block-static block-setup">Khi bắt đầu · LED GPIO {outputPin} là đầu ra, biến trở GPIO {inputPin} là đầu vào</div>
      <div className="block-section-label">LẶP LẠI</div>
      {order.map((id, index) => <article key={`${id}-${index}`} draggable className={`analog-code-block analog-block-${id} ${activeIndex === index ? 'code-block-active' : ''}`} onDragStart={event => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move' }} onDragOver={event => event.preventDefault()} onDrop={event => dropAt(event, index)}>
        <span className="block-grip" aria-hidden="true">⠿</span>
        <div><strong>{blocks[id]?.title ?? 'Khối không xác định'}</strong><p>{id === 'read' ? <>Đọc đầu vào analog · <code>potPercent</code></> : id === 'compare' ? <>Điều kiện: <code>potPercent &gt; {threshold}</code><input aria-label="Ngưỡng bật LED từ 0 đến 100" type="range" min="0" max="100" value={threshold} onChange={event => onThresholdChange(Number(event.target.value))} /><span>{threshold}%</span></> : blocks[id]?.description}</p></div>
        <div className="block-controls"><button type="button" aria-label={`Đưa khối ${blocks[id]?.title} lên`} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Đưa khối ${blocks[id]?.title} xuống`} onClick={() => move(index, 1)}>↓</button></div>
      </article>)}
      {!sequenceValid && <p className="analog-order-warning" role="status">Thứ tự khối chưa hợp lệ. Hãy sắp xếp lại theo luồng: đọc → so sánh → bật LED → ngược lại → tắt LED. Mô phỏng đang tạm dừng để tránh kết quả gây hiểu nhầm.</p>}
      <button className="block-reset" type="button" onClick={() => onOrderChange([...analogBlockOrder])}>Khôi phục thứ tự mẫu</button>
    </div>
    <details className="block-code-preview" open><summary>Code C++ được tạo từ các khối</summary><pre><code>{code}</code></pre></details>
  </div>
}
