import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { CircuitSchematicV2 } from '../components/builder/CircuitSchematicV2'
import { PRODUCT_ROUTES } from '../data/productRoutes'
import { createNetIndexV2 } from '../lib/circuitNetsV2'
import {
  CAPSTONE_MAX_FILE_BYTES, CAPSTONE_MAX_NOTES, CAPSTONE_MAX_OBSERVATIONS, CAPSTONE_STORAGE_KEY,
  capstoneBoards, decodeCapstone, emptyCapstone, encodeCapstone, getCapstoneCircuit, getCapstoneSkillSteps,
  getCapstoneThresholdComparison, newCapstoneId, observeCapstone,
  type CapstoneObservation, type CapstonePrediction, type CapstoneReport, type CapstoneSettings,
} from '../lib/localCapstone'
import { useProductRoute } from '../lib/useProductRoute'
import { downloadBeginnerText } from '../lib/useBeginnerCourse'
import { LocalCapstoneLibrary } from '../components/learning/LocalCapstoneLibrary'
import { replaceActiveCapstone } from '../lib/localCapstoneLibrary'
import './LocalCapstonePage.css'

type LocalRecord = { report: CapstoneReport; raw: string | null; protected: boolean; status: string }

function readRecord(): LocalRecord {
  const report = emptyCapstone()
  try {
    const raw = localStorage.getItem(CAPSTONE_STORAGE_KEY)
    if (raw === null) return { report, raw, protected: false, status: 'Hồ sơ mới trên thiết bị này.' }
    const decoded = decodeCapstone(raw)
    if (decoded.ok) return { report: decoded.report, raw, protected: false, status: 'Đã mở hồ sơ lưu trên trình duyệt này.' }
    return { report, raw, protected: true, status: `${decoded.error} Bản lưu cũ được giữ lại. Thay đổi mới chỉ ở tab này.` }
  } catch {
    return { report, raw: null, protected: false, status: 'Không đọc được bộ nhớ trình duyệt. Hãy tải hồ sơ để giữ kết quả.' }
  }
}

const ledText = (on: boolean) => on ? 'LED sáng' : 'LED tắt'

export function LocalCapstonePage() {
  const route = useProductRoute()
  const [record, setRecord] = useState(readRecord)
  const [prediction, setPrediction] = useState<CapstonePrediction | ''>('')
  const [latest, setLatest] = useState<CapstoneObservation | null>(null)
  const [candidate, setCandidate] = useState<CapstoneReport | null>(null)
  const [notice, setNotice] = useState('')
  const [selected, select] = useState<string | null>(null)
  const [selectedEndpoint, selectEndpoint] = useState<string | null>(null)
  const [selectedNet, selectNet] = useState<string | null>(null)
  const importRequest = useRef(0)
  const { report, raw } = record
  const { settings } = report
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === CAPSTONE_STORAGE_KEY || event.key === null) setRecord(previous => ({ ...previous, protected: true, status: 'Bản lưu đã đổi ở tab khác. Tab này đã khóa ghi; tải hồ sơ đang làm trước khi mở lại trang.' }))
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  const { boardId, threshold, gndConnected } = settings
  const circuit = useMemo(() => getCapstoneCircuit({ boardId, threshold, gndConnected }), [boardId, threshold, gndConnected])
  const index = useMemo(() => circuit && createNetIndexV2(circuit.doc), [circuit])
  const activeEndpoints = useMemo(() => {
    const wireIds = new Set(latest?.result.activeWireIds)
    const endpoints = new Set<string>()
    for (const net of index?.netsList() ?? []) {
      if ([...net.wireIds].some(wire => wireIds.has(wire))) {
        for (const endpoint of net.endpoints) endpoints.add(endpoint)
      }
    }
    return endpoints
  }, [index, latest])
  const full = report.observations.length >= CAPSTONE_MAX_OBSERVATIONS
  const checklist = getCapstoneSkillSteps(report)
  const nextSkill = checklist.find(item => !item.verified)
  const verifiedCount = checklist.filter(item => item.verified).length
  const comparison = useMemo(() => getCapstoneThresholdComparison(report.observations, boardId), [report.observations, boardId])

  function save(next: CapstoneReport) {
    let status = record.status
    let nextRaw = raw
    let protectedData = record.protected
    if (!record.protected) {
      try {
        if (localStorage.getItem(CAPSTONE_STORAGE_KEY) !== raw) {
          status = 'Bản lưu đã đổi ở tab khác. Công việc trong tab này vẫn có thể tải xuống.'
          protectedData = true
        } else {
          const encoded = encodeCapstone(next)
          localStorage.setItem(CAPSTONE_STORAGE_KEY, encoded)
          nextRaw = encoded
          status = 'Đã lưu trên trình duyệt này.'
        }
      } catch {
        status = 'Không ghi được bộ nhớ. Hãy tải hồ sơ trước khi đóng tab.'
      }
    }
    setRecord({ ...record, report: next, raw: nextRaw, protected: protectedData, status })
  }

  function updateSettings(patch: Partial<CapstoneSettings>) {
    save({ ...report, settings: { ...settings, ...patch } })
    setLatest(null)
    setPrediction('')
    setNotice('')
    if (patch.boardId !== undefined || patch.gndConnected !== undefined) {
      select(null)
      selectEndpoint(null)
      selectNet(null)
    }
  }

  function run() {
    if (!prediction || full) return
    const result = observeCapstone(settings)
    if (!result) { setNotice('Không có cấu hình mạch hợp lệ để chạy.'); return }
    const observation = { ...settings, prediction, result }
    save({ ...report, observations: [...report.observations, observation] })
    setLatest(observation)
    setPrediction('')
    setNotice('')
  }

  async function readImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    const request = ++importRequest.current
    setCandidate(null)
    try {
      if (file.size > CAPSTONE_MAX_FILE_BYTES) { setNotice('Hồ sơ vượt quá 96 KiB.'); return }
      const decoded = decodeCapstone(await file.text())
      if (request !== importRequest.current) return
      if (decoded.ok) { setCandidate(decoded.report); setNotice('') }
      else setNotice(decoded.error)
    } catch {
      if (request === importRequest.current) setNotice('Không đọc được tệp. Hãy chọn lại tệp trên máy.')
    }
  }

  function openLibraryReport(next: CapstoneReport) {
    if (record.protected) { setNotice('Hồ sơ đang làm đã khóa ghi. Tải hồ sơ và bản lưu gốc trước khi mở lại trang.'); return false }
    try {
      const nextRaw = replaceActiveCapstone(localStorage, raw, next)
      setRecord({ report: next, raw: nextRaw, protected: false, status: 'Đã mở hồ sơ trên trình duyệt này.' })
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không mở được hồ sơ.')
      return false
    }
    setCandidate(null)
    setLatest(null)
    setPrediction('')
    select(null)
    selectEndpoint(null)
    selectNet(null)
    setNotice('Đã mở hồ sơ.')
    return true
  }

  function openReport() {
    if (candidate) openLibraryReport(candidate)
  }

  return <div className="capstone-page">
    <Link to={route(PRODUCT_ROUTES.publicBasics)}>← Nền tảng điện tử</Link>
    <header className="capstone-header">
      <h1>Đèn cảnh báo theo ngưỡng</h1>
      <p>Thiết kế một đèn chỉ sáng khi <strong>nhấn nút</strong> và <strong>biến trở vượt ngưỡng</strong>. Thử ở sát ngưỡng, rồi tìm nguyên nhân khi nhấn nút mà đèn vẫn tắt.</p>
      <p className="capstone-source">Mô hình logic giáo dục dùng net của mạch. Code Arduino là mẫu đối chiếu. Kết quả là mức logic và mã ADC mô hình.</p>
    </header>
    <section className="capstone-card capstone-journey" aria-labelledby="capstone-journey">
      <h2 id="capstone-journey">Từ nút nhấn đến đèn cảnh báo</h2>
      <ol>
        <li><Link to={route('/learn/button-led')}>Đèn điều khiển bằng nút</Link></li>
        <li><Link to={route('/learn/analog-ldr')}>Đèn theo ánh sáng</Link></li>
        <li aria-current="step">Đèn cảnh báo theo ngưỡng · Đang làm</li>
      </ol>
      <p>{boardId ? `${verifiedCount}/3 kỹ năng có bằng chứng với board và ngưỡng đang chọn.` : 'Chọn board để bắt đầu chặng đèn cảnh báo.'}</p>
      <Link to={route(`${PRODUCT_ROUTES.publicBasics}?repair=return-wire`)}>Luyện lại cách tìm dây hồi bị hở</Link>
    </section>
    <section className="capstone-card capstone-controls" aria-labelledby="capstone-setup">
      <h2 id="capstone-setup" tabIndex={-1}>Cấu hình đèn cảnh báo</h2>
      <label>Board của mini-project<select value={boardId} onChange={event => updateSettings({ boardId: event.target.value as CapstoneSettings['boardId'] })}>
        <option value="">Chọn board để bắt đầu</option>
        {capstoneBoards.map(board => <option key={board.id} value={board.id}>{board.name}</option>)}
      </select></label>
      {boardId && !circuit && <p role="alert">Không dựng được mạch cho board này.</p>}
      {circuit && <>
        <label>Ngưỡng cảnh báo <strong>{threshold}%</strong><input aria-label="Ngưỡng cảnh báo" type="range" min="1" max="99" value={threshold} onChange={event => updateSettings({ threshold: event.target.valueAsNumber })}/></label>
        <label>Vị trí biến trở <strong>{settings.inputPercent}%</strong><input aria-label="Vị trí biến trở" type="range" min="0" max="100" value={settings.inputPercent} onChange={event => updateSettings({ inputPercent: event.target.valueAsNumber })}/></label>
        <div className="capstone-toggles">
          <label><input type="checkbox" checked={settings.pressed} onChange={event => updateSettings({ pressed: event.target.checked })}/> Nhấn nút thử</label>
          <label><input type="checkbox" checked={gndConnected} onChange={event => updateSettings({ gndConnected: event.target.checked })}/> Nối dây GND của nút</label>
        </div>
      </>}
    </section>
    {circuit && <div className="capstone-lab">
      <section className="capstone-card" aria-labelledby="capstone-run">
        <h2 id="capstone-run" tabIndex={-1}>Dự đoán và quan sát</h2>
        <form onSubmit={event => { event.preventDefault(); run() }}>
          <label>Dự đoán LED<select value={prediction} onChange={event => setPrediction(event.target.value as CapstonePrediction | '')}>
            <option value="">Chọn dự đoán</option><option value="on">LED sáng</option><option value="off">LED tắt</option>
          </select></label>
          <button className="capstone-primary" disabled={!prediction || full}>Chạy và ghi kết quả</button>
        </form>
        {full && <p>Nhật ký đã đủ {CAPSTONE_MAX_OBSERVATIONS} lần. Tải hồ sơ rồi xóa một lần thử để tiếp tục.</p>}
        <div className="capstone-result" role="status" aria-live="polite">
          {latest ? <>
            <strong>{ledText(latest.result.ledOn)}</strong>
            <p>D2 {latest.result.buttonHigh ? 'HIGH' : 'LOW'} · A0 {latest.result.inputAdc} / 1023 · Ngưỡng {latest.result.thresholdAdc} · D9 {latest.result.outputHigh ? 'HIGH' : 'LOW'}</p>
            <p>{latest.result.buttonHigh ? 'INPUT_PULLUP giữ D2 ở HIGH.' : 'Nút nối D2 xuống GND.'} {latest.result.inputAdc > latest.result.thresholdAdc ? 'Mã ADC vượt ngưỡng.' : 'Mã ADC chưa vượt ngưỡng.'}</p>
          </> : <p>Chọn một dự đoán và chạy để xem tín hiệu.</p>}
        </div>
        <h3>Ba phép thử cần ghi</h3>
        <ul className="capstone-checklist">{checklist.map(item => <li key={item.id}>
          <span>{item.recorded ? 'Đã ghi' : 'Chưa ghi'}</span> {item.title}
          <small>{item.verified ? `Đã thực hành: ${item.skill}` : `Cần dự đoán và thử: ${item.skill}`}</small>
        </li>)}</ul>
        {nextSkill && <div className="capstone-variation">
          <button type="button" disabled={full} onClick={() => {
            updateSettings(nextSkill.next)
            document.getElementById('capstone-setup')?.focus()
          }}>Chuẩn bị phép thử: {nextSkill.skill}</button>
        </div>}
        {checklist.every(item => item.recorded) && <div className="capstone-variation"><h3>Thử một ngưỡng khác</h3><p>Chạy ở ngưỡng hiện tại. Sau đó chỉ đổi ngưỡng, dự đoán và chạy lại. Cả hai lần thử được lưu trong hồ sơ.</p><button type="button" disabled={full} onClick={() => {
          updateSettings({ threshold: threshold === 70 ? 30 : 70 })
          document.getElementById('capstone-run')?.focus()
        }}>Đổi ngưỡng sang {threshold === 70 ? 30 : 70}%</button></div>}
      </section>
      <section className="capstone-card capstone-maps" aria-labelledby="capstone-circuit">
        <h2 id="capstone-circuit">Mạch và code</h2>
        <p>D2 đọc nút với <code>INPUT_PULLUP</code>, A0 đọc biến trở, D9 chạy LED qua điện trở. Dây về GND của nút đang <strong>{gndConnected ? 'nối' : 'hở'}</strong>.</p>
        <CircuitSchematicV2
          doc={circuit.doc} boardLabel={circuit.board.short} boardPinLabels={{ trig: 'D2', input: 'A0', ledOut: 'D9', vcc: '5 V', gnd: 'GND' }}
          selectedKey={selected} onSelectPart={select}
          selectedEndpointKey={selectedEndpoint} highlightedNetKey={selectedNet}
          onSelectEndpoint={endpoint => { selectEndpoint(endpoint); selectNet(index?.netOf(endpoint)?.key ?? null) }}
          onSelectNet={net => { selectEndpoint(null); selectNet(net) }}
          activeKeys={activeEndpoints}
        />
        {latest && <p>Đường màu cam đánh dấu tín hiệu HIGH ở lần chạy vừa ghi.</p>}
        <details><summary>Code Arduino ứng với cấu hình</summary><pre tabIndex={0}><code>{circuit.code}</code></pre></details>
      </section>
    </div>}
    <section className="capstone-card capstone-report" aria-labelledby="capstone-report">
      <h2 id="capstone-report">Hồ sơ thực hành</h2>
      <label htmlFor="capstone-notes">Ghi lại lỗi đã thấy và cách bạn sửa</label>
      <textarea id="capstone-notes" value={report.notes} rows={3} maxLength={CAPSTONE_MAX_NOTES} onChange={event => save({ ...report, notes: event.target.value })}/>
      {comparison && <section className="capstone-ab" aria-labelledby="capstone-ab-heading">
        <h3 id="capstone-ab-heading">So sánh hai lần thử ngưỡng</h3>
        <p>{capstoneBoards.find(board => board.id === boardId)?.name} · Biến trở {comparison.first.inputPercent}% (ADC {comparison.first.result.inputAdc}/1023) · {comparison.first.pressed ? 'Nhấn nút' : 'Nhả nút'} · GND {comparison.first.gndConnected ? 'nối' : 'hở'}</p>
        <table aria-label="So sánh thí nghiệm A và B">
          <thead><tr><th scope="col">Lần</th><th scope="col">Ngưỡng</th><th scope="col">Dự đoán</th><th scope="col">Quan sát</th></tr></thead>
          <tbody>{[comparison.first, comparison.second].map((trial, index) => <tr key={trial.threshold}>
            <th scope="row">{index === 0 ? 'A' : 'B'}</th><td>{trial.threshold}%</td>
            <td>{ledText(trial.prediction === 'on')}</td><td>{ledText(trial.result.ledOn)}</td>
          </tr>)}</tbody>
        </table>
      </section>}
      {report.observations.length ? <ol className="capstone-observations">
        {report.observations.map((item, index) => <li key={index}>
          <strong>{ledText(item.result.ledOn)}</strong>
          <span>{capstoneBoards.find(board => board.id === item.boardId)?.name} · Biến trở {item.inputPercent}% · Ngưỡng {item.threshold}% · {item.pressed ? 'Nhấn nút' : 'Nhả nút'} · GND {item.gndConnected ? 'nối' : 'hở'}</span>
          <span>Dự đoán {ledText(item.prediction === 'on').toLowerCase()} · {item.result.ledOn === (item.prediction === 'on') ? 'Khớp kết quả' : 'Khác kết quả'}</span>
          <button type="button" aria-label={`Xóa lần thử ${index + 1}`} onClick={() => { save({ ...report, observations: report.observations.filter((_, i) => i !== index) }); if (latest === item) setLatest(null) }}>Xóa</button>
        </li>)}
      </ol> : <p>Chưa có lần thử nào.</p>}
      <p role="status">{record.status}</p>
      <div className="capstone-actions">
        <button type="button" onClick={() => downloadBeginnerText(encodeCapstone(report), 'mach-mo-den-canh-bao.json')}>Tải hồ sơ JSON</button>
        <button type="button" onClick={() => downloadBeginnerText(encodeCapstone({ ...report, projectId: newCapstoneId() }), 'mach-mo-den-canh-bao-ban-sao.json')}>Tải bản sao JSON</button>
        {record.protected && raw !== null && <button type="button" onClick={() => downloadBeginnerText(raw, 'mach-mo-ho-so-cu.json')}>Tải bản lưu gốc</button>}
        <label htmlFor="capstone-import">Chọn hồ sơ JSON để mở</label>
        <input id="capstone-import" type="file" accept=".json,application/json" onChange={readImport}/>
      </div>
      {notice && <p role="status">{notice}</p>}
      {candidate && <div role="group" aria-label="Xác nhận mở hồ sơ" className="capstone-import">
        <p>Hồ sơ có {candidate.observations.length} lần thử. Tải hồ sơ đang làm nếu bạn muốn giữ một bản trước khi mở tệp này.</p>
        <button type="button" onClick={openReport}>Mở và thay hồ sơ hiện tại</button>
        <button type="button" onClick={() => setCandidate(null)}>Hủy</button>
      </div>}
    </section>
    <LocalCapstoneLibrary report={report} onOpen={openLibraryReport}/>
  </div>
}
