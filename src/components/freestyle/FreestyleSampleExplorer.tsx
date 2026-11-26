import { useEffect, useId, useRef, useState } from 'react'
import { matchesCatalogSearch } from '../../lib/catalogSearch'
import { freestyleSamples, type FreestyleSampleId } from '../../lib/freestyle/freestyleSampleLibrary'
import './FreestyleSampleExplorer.css'

const categories = [...new Set(freestyleSamples.map(sample => sample.level))]

type Props = {
  onClose: () => void
  onSelect: (id: FreestyleSampleId) => void
}

export function FreestyleSampleExplorer({ onClose, onSelect }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const matches = freestyleSamples.filter(sample => (
    (!category || sample.level === category)
    && matchesCatalogSearch(`${sample.title} ${sample.summary} ${sample.parts.join(' ')} ${sample.level}`, query)
  ))

  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
  }, [])

  return <dialog ref={dialog} className="freestyle-tools freestyle-sample-explorer" aria-labelledby={titleId} onClose={onClose}>
    <header className="freestyle-tools-head">
      <h2 id={titleId}>Khám phá mạch mẫu</h2>
      <button className="freestyle-button" type="button" onClick={() => dialog.current?.close()}>Đóng</button>
    </header>
    <div className="freestyle-tools-body">
      <div className="freestyle-sample-filters">
        <label>Tìm mạch mẫu
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="DHT22, HC-SR04, PWM…" />
        </label>
        <label>Chủ đề
          <select value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">Tất cả chủ đề</option>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className="freestyle-sample-count">{matches.length} mạch mẫu</p>
      {matches.length ? <ul className="freestyle-sample-results">
        {matches.map(sample => <li key={sample.id}>
          <h3>{sample.title}</h3>
          <p>{sample.summary}</p>
          <p><strong>Cách kiểm tra</strong><br />{sample.observe}</p>
          <button type="button" className="freestyle-button" onClick={() => {
            onSelect(sample.id)
            dialog.current?.close()
          }}>Chọn mẫu <span className="sr-only">{sample.title}</span></button>
        </li>)}
      </ul> : <p>Không tìm thấy mạch. Thử từ khóa khác hoặc đổi chủ đề.</p>}
    </div>
  </dialog>
}
