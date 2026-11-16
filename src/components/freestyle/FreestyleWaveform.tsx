import { pinDisplayName } from '../../lib/freestyle/freestyleCircuit'
import { useEffect, useState } from 'react'
import { traceChannels, tracePath, type TraceSample } from '../../lib/freestyle/freestyleTrace'
export function FreestyleWaveform({ samples, boardId, source, running, preferredPins=[] }: { samples: TraceSample[]; boardId: string; source: string; running: boolean; preferredPins?: number[] }) {
  const [focusPin,setFocusPin]=useState<number|undefined>()
  useEffect(()=>setFocusPin(undefined),[boardId])
  const observed=[...new Set(samples.flatMap(sample=>Object.keys(sample.pins).map(Number)))].sort((a,b)=>a-b)
  const channels = traceChannels(samples,preferredPins,focusPin)
  const start = samples[0]?.atMs ?? 0, end = samples.at(-1)?.atMs ?? 0
  return <section className="freestyle-waveform" aria-label="Dạng sóng tín hiệu">
    <header><h3>Dạng sóng logic</h3><span>{source} · {running ? 'đang lấy mẫu' : samples.length ? 'đã dừng' : 'chưa chạy'}</span></header>
    <p>Mẫu trạng thái từ runtime, tối đa 512 mẫu / 8 kênh. Xung nhanh có thể bị bỏ lỡ; khoảng trống là chưa có dữ liệu. HIGH/LOW không phải điện áp đo hay kết quả SPICE.</p>
    {!channels.length ? <p className="freestyle-empty">Chọn board, viết code và bấm Chạy để thu tín hiệu GPIO.</p> : <>
      <label className="freestyle-channel-picker">Ưu tiên kênh<select value={focusPin??''} onChange={event=>setFocusPin(event.target.value===''?undefined:Number(event.target.value))}><option value="">Chân đang nối trong mạch</option>{observed.map(pin=><option key={pin} value={pin}>{pinDisplayName(boardId,pin)}</option>)}</select><span>Đang vẽ {channels.length}/{observed.length} kênh có dữ liệu</span></label>
      <div className="freestyle-wave-axis"><span>{start.toFixed(1)} ms</span><span>{end.toFixed(1)} ms mô phỏng</span></div>
      {channels.map(pin=><div className="freestyle-wave-channel" key={pin} data-wave-pin={pin}>
        <strong>{pinDisplayName(boardId,pin)}</strong><svg viewBox="0 0 1000 72" preserveAspectRatio="none" role="img" aria-label={`${pinDisplayName(boardId,pin)} · ${samples.length} mẫu logic`}>
          <path className="freestyle-wave-grid" d="M0 18H1000M0 54H1000M250 0V72M500 0V72M750 0V72"/>
          <path className="freestyle-wave-path" d={tracePath(samples,pin,start,end)}/>
        </svg>
        <span>{samples.at(-1)?.pins[pin]?.pwm !== undefined ? `PWM ${Math.round(samples.at(-1)!.pins[pin].pwm! * 100)}% (runtime)` : samples.at(-1)?.pins[pin] ? samples.at(-1)!.pins[pin].level ? 'HIGH' : 'LOW' : 'UNKNOWN'}</span>
      </div>)}
    </>}
  </section>
}
