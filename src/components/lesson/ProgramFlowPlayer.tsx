import { useEffect } from 'react'
import { getProgramActions, type LedProgramIr } from '../../lib/lessonProgramIr'

type Props = { program: LedProgramIr | null; activeIndex: number; onActiveIndex: (index: number) => void; playing: boolean; onPlaying: (playing: boolean) => void; onUnsupported?: string }
export function ProgramFlowPlayer({ program, activeIndex, onActiveIndex, playing, onPlaying, onUnsupported }: Props) {
  const steps = program ? getProgramActions(program) : []
  useEffect(() => { if (!playing || !steps.length) return; const timer = window.setInterval(() => onActiveIndex((activeIndex + 1) % steps.length), 900); return () => window.clearInterval(timer) }, [playing, steps.length, activeIndex, onActiveIndex])
  const step = steps[activeIndex]
  return <section className="program-flow" aria-label="Luồng chương trình trên mạch">
    <div className="flow-heading"><div><p className="eyebrow">CODE → TÍN HIỆU → LINH KIỆN</p><h3>Luồng hoạt động của mạch</h3></div><span className="concept-label">Minh họa khái niệm</span></div>
    {!program ? <div className="flow-unsupported" role="status"><strong>Chưa thể phát luồng này</strong><p>{onUnsupported || 'Code có cú pháp ngoài phần bài học hỗ trợ. Code của bạn vẫn được giữ nguyên.'}</p></div> : <>
      <div className="flow-diagram"><div className={`flow-node ${step?.action.kind === 'write' ? 'flow-node-active' : ''}`}><small>CHƯƠNG TRÌNH</small><strong>{step?.title ?? 'Đợi bắt đầu'}</strong><span>{step?.explanation}</span></div><i aria-hidden="true">→</i><div className={`flow-node ${step?.action.kind === 'write' || step?.action.kind === 'pinMode' ? 'flow-node-active' : ''}`}><small>ĐẦU RA</small><strong>GPIO {program.pin}</strong><span>Chân được cấu hình và gửi tín hiệu số.</span></div><i aria-hidden="true">→</i><div className={`flow-node flow-led ${step?.ledLit ? 'flow-led-on' : ''}`}><small>MẠCH LED</small><strong>{step?.ledLit ? 'LED sáng' : 'LED tắt / chờ'}</strong><span>GPIO → điện trở → LED → GND</span></div></div>
      <div className="flow-controls"><button type="button" onClick={() => { onPlaying(false); onActiveIndex(Math.max(0, activeIndex - 1)) }}>← Bước trước</button><button type="button" className="button-primary" onClick={() => onPlaying(!playing)}>{playing ? 'Tạm dừng' : 'Chạy luồng'}</button><button type="button" onClick={() => { onPlaying(false); onActiveIndex((activeIndex + 1) % steps.length) }}>Bước tiếp →</button><button type="button" onClick={() => { onPlaying(false); onActiveIndex(0) }}>Bắt đầu lại</button></div>
      <ol className="flow-timeline">{steps.map((item, index) => <li className={index === activeIndex ? 'flow-step-active' : ''} key={`${item.title}-${index}`}><button type="button" onClick={() => { onPlaying(false); onActiveIndex(index) }}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><small>{item.section === 'setup' ? 'setup()' : 'loop()'} · {item.action.line ? `dòng ${item.action.line}` : 'khối lệnh'}</small></button></li>)}</ol>
    </>}
    <p className="flow-disclaimer">Đây là luồng giải thích bằng hình ảnh, không biên dịch code, không chạy firmware và không mô phỏng chính xác điện áp hay thời gian vi điều khiển.</p>
  </section>
}
