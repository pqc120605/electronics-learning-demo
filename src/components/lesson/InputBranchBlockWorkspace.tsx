import type { DragEvent } from 'react'

export const inputBranchBlockOrder = ['read', 'compare', 'on', 'off'] as const
export type InputBranchBlockId = typeof inputBranchBlockOrder[number]

type Props = {
  order: InputBranchBlockId[]
  onOrderChange: (order: InputBranchBlockId[]) => void
  sensorName: string
  sourceName: string
  expectedLevel: 'HIGH' | 'LOW'
  outputPin: number
  activeIndex: number
  code: string
}

export function InputBranchBlockWorkspace({ order, onOrderChange, sensorName, sourceName, expectedLevel, outputPin, activeIndex, code }: Props) {
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
  const content: Record<InputBranchBlockId, { title: string; text: string }> = {
    read: { title: `Đọc ${sensorName}`, text: `${sourceName} đưa tín hiệu số vào chân cảm biến` },
    compare: { title: 'Kiểm tra điều kiện', text: `Nếu digitalRead(${sensorName}) == ${expectedLevel}` },
    on: { title: 'Bật LED', text: `Đặt GPIO ${outputPin} thành HIGH` },
    off: { title: 'Ngược lại · tắt LED', text: `Đặt GPIO ${outputPin} thành LOW` },
  }
  const valid = order.length === inputBranchBlockOrder.length && order.every((item, index) => item === inputBranchBlockOrder[index])
  return <div className="lesson-workspace analog-block-workspace input-branch-workspace">
    <section className="workspace-help"><strong>Từ tín hiệu vào đến đầu ra</strong><p>Thử đầu vào ảo ở bảng mô phỏng: nhấn nút hoặc bật phát hiện vật cản. Quan sát giá trị đọc, điều kiện HIGH/LOW và LED phản hồi.</p></section>
    <div className="analog-block-canvas" aria-label="Các bước chương trình điều kiện đầu vào">
      <div className="block-static block-setup">Khi bắt đầu · LED GPIO {outputPin} là đầu ra</div>
      <div className="block-section-label">LẶP LẠI</div>
      {order.map((id, index) => <article key={`${id}-${index}`} draggable className={`analog-code-block input-branch-block input-branch-${id} ${activeIndex === index ? 'code-block-active' : ''}`} onDragStart={event => { event.dataTransfer.setData('text/plain', String(index)); event.dataTransfer.effectAllowed = 'move' }} onDragOver={event => event.preventDefault()} onDrop={event => dropAt(event, index)}>
        <span className="block-grip" aria-hidden="true">⠿</span><div><strong>{content[id]?.title ?? 'Khối không xác định'}</strong><p>{content[id]?.text}</p></div>
        <div className="block-controls"><button type="button" aria-label={`Đưa khối ${content[id]?.title} lên`} onClick={() => move(index, -1)}>↑</button><button type="button" aria-label={`Đưa khối ${content[id]?.title} xuống`} onClick={() => move(index, 1)}>↓</button></div>
      </article>)}
      {!valid && <p className="analog-order-warning" role="status">Thứ tự khối chưa đúng. Sắp xếp: đọc tín hiệu → kiểm tra điều kiện → bật LED → ngược lại tắt LED.</p>}
      <button className="block-reset" type="button" onClick={() => onOrderChange([...inputBranchBlockOrder])}>Khôi phục thứ tự mẫu</button>
    </div>
    <details className="block-code-preview" open><summary>Code C++ được tạo từ các khối</summary><pre><code>{code}</code></pre></details>
  </div>
}
