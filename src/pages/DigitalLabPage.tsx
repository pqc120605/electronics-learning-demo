import { useRef, type ReactElement } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { digitalLabLessons, type DigitalLabId } from '../data/digitalLabLessons'
import { BcdLab, NandLab, TimerLab, WirelessLab } from '../components/learning/DigitalLabControls'
import { LcdLab, MatrixLab, OledLab } from '../components/learning/DigitalLabDisplays'
import { useProductRoute } from '../lib/useProductRoute'
import './DigitalLabPage.css'

function FirmwareLab() {
  const route = useProductRoute()
  return <Link className="button-primary" to={route('/tools/firmware-hex')}>Mở trình chạy HEX</Link>
}

const panels = {
  nand: NandLab, bcd: BcdLab, timer: TimerLab, lcd: LcdLab,
  oled: OledLab, matrix: MatrixLab, firmware: FirmwareLab, wireless: WirelessLab,
} satisfies Record<DigitalLabId, () => ReactElement>

export function DigitalLabPage() {
  const [params] = useSearchParams()
  const lessonIndex = Math.max(0, digitalLabLessons.findIndex(candidate => candidate.id === params.get('lab')))
  const lesson = digitalLabLessons[lessonIndex]
  const next = digitalLabLessons[lessonIndex + 1]
  const Panel = panels[lesson.id]
  const route = useProductRoute()
  const heading = useRef<HTMLHeadingElement>(null)
  function revealActivity() {
    requestAnimationFrame(() => heading.current?.focus())
  }

  return <div className="digital-lab-page">
    <header>
      <Link to={route('/topics')}>Chủ đề học</Link>
      <h1>Phòng thực hành IC và giao tiếp số</h1>
      <p>Chọn một bài, đổi điều kiện thử và đọc kết quả từ model. Có thể mở bất kỳ bài nào.</p>
    </header>
    <div className="digital-lab-layout">
      <nav className="digital-lab-menu" aria-label="Bài thực hành IC và giao tiếp số">
        {digitalLabLessons.map(item => <Link key={item.id} to={`?lab=${item.id}`} onClick={revealActivity} aria-current={item.id === lesson.id ? 'page' : undefined}>
          <strong>{item.name}</strong><small>{item.model}</small>
        </Link>)}
      </nav>
      <section className="digital-lab-activity" aria-labelledby="digital-activity-title">
        <h2 id="digital-activity-title" tabIndex={-1} ref={heading}>{lesson.name}</h2>
        <p>{lesson.goal}</p>
        <ol>{lesson.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <Panel key={lesson.id} />
        <details className="digital-lab-scope">
          <summary>Phạm vi của model</summary>
          <p>{lesson.scope}</p>
          {'sources' in lesson && <ul>{lesson.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.name} ↗</a></li>)}</ul>}
        </details>
        {next && <Link className="digital-lab-next" to={`?lab=${next.id}`} onClick={revealActivity}>Bài tiếp theo · {next.name} →</Link>}
      </section>
    </div>
  </div>
}
