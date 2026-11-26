import { useEffect, useId, useState } from 'react'
import { practiceValue, type SpicePractice } from '../../simulation/spicePractice'
import type { SpiceSeriesLike } from '../../simulation/spiceProbes'

type Props = {
  practice: SpicePractice
  variantIndex: number
  changeVariant: (index: number) => void
  run: (prediction: number) => void
  running: boolean
  prediction: number | null
  result?: { analysis: string; dataType: string; netlist?: string; series: SpiceSeriesLike[] }
}

const numberText = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })

export function SpiceGuidedPractice({ practice, variantIndex, changeVariant, run, running, prediction, result }: Props) {
  const [guess, setGuess] = useState('')
  const [observations, setObservations] = useState<Record<number, number>>({})
  const titleId = useId()
  const variant = practice.variants[variantIndex]
  const { signal, unit, min, max } = variant.measure ?? practice.measure
  const raw = guess.trim()
  const expected = /^-?\d+(?:[.,]\d+)?$/.test(raw) ? Number(raw.replace(',', '.')) : Number.NaN
  const canRun = Number.isFinite(expected) && expected >= min && expected <= max && !running
  const matchesRun = result?.netlist === variant.netlist && result.analysis === practice.analysis && result.dataType === 'real'
  const measured = matchesRun ? practiceValue(practice, variant, result.series) : undefined

  useEffect(() => {
    if (measured !== undefined) {
      setObservations(previous => previous[variantIndex] === measured
        ? previous
        : { ...previous, [variantIndex]: measured })
    }
  }, [measured, variantIndex])

  return <section className="spice-divider-practice spice-guided-practice" aria-labelledby={titleId}>
    <h3 id={titleId}>{practice.name}</h3>
    <p>{practice.description}</p>
    <label className="spice-practice-case">Điều kiện thử
      <select value={variantIndex} onChange={event => {
        setGuess('')
        changeVariant(Number(event.target.value))
      }}>
        {practice.variants.map((item, index) => <option value={index} key={item.label}>{item.label}</option>)}
      </select>
    </label>
    <form onSubmit={event => {
      event.preventDefault()
      if (canRun) run(expected)
    }}>
      <label htmlFor={`${titleId}-guess`}>Dự đoán {signal.toUpperCase()} ({unit})</label>
      <div className="spice-divider-actions">
        <input id={`${titleId}-guess`} type="text" inputMode={min < 0 ? 'text' : 'decimal'} maxLength={16} placeholder={`${min} đến ${max}`} value={guess} onChange={event => setGuess(event.target.value)} />
        <button type="submit" disabled={!canRun}>Ghi dự đoán và chạy</button>
      </div>
    </form>
    <div role="status">
      {running && prediction !== null && <p>Đang tính bằng ngspice…</p>}
      {matchesRun && measured === undefined && <p>Kết quả hiện tại thiếu kênh hoặc thời điểm cần đo cho bài này.</p>}
      {measured !== undefined && <>
        <p><strong>Ngspice · {signal.toUpperCase()} = {numberText.format(measured)} {unit}</strong>{variant.sampleTime !== undefined && ` tại ${numberText.format(variant.sampleTime * 1000)} ms`}</p>
        {prediction !== null && <p>Dự đoán {numberText.format(prediction)} {unit} · Chênh lệch {numberText.format(Math.abs(prediction - measured))} {unit}.</p>}
        <p>{variant.explanation}</p>
        <p><a href="#spice-results-heading">Mở sơ đồ và số đo</a></p>
      </>}
    </div>
    {Object.keys(observations).length > 1 && <dl className="spice-practice-comparison" aria-label="So sánh số đo trong phiên này">
      {practice.variants.map((item, index) => observations[index] === undefined ? null : <div key={item.label}>
        <dt>{item.label}</dt>
        <dd>{numberText.format(observations[index])} {item.measure?.unit ?? practice.measure.unit}</dd>
      </div>)}
    </dl>}
    <details>
      <summary>Model dùng trong bài</summary>
      <p>{practice.model}</p>
    </details>
  </section>
}
