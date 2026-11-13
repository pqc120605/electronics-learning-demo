import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { compareKicadIpcD356, compileKicadIpcD356, getKicadIpcD356NetNames, type KicadSpiceImportResult } from '../../lib/kicadSpiceImport'

const MAX_CAD_FILE_BYTES = 1_000_000
type Props = { onApply: (netlist: string) => void }

function isFailure(value: string[] | KicadSpiceImportResult | undefined): value is Extract<KicadSpiceImportResult, { ok: false }> {
  return Boolean(value && !Array.isArray(value) && !value.ok)
}

export function KicadPcbSpiceImport({ onApply }: Props) {
  const [boardSource, setBoardSource] = useState('')
  const [boardFileName, setBoardFileName] = useState('')
  const [schematicSource, setSchematicSource] = useState('')
  const [schematicFileName, setSchematicFileName] = useState('')
  const [excludedRefs, setExcludedRefs] = useState<string[]>([])
  const [useExternalSource, setUseExternalSource] = useState(false)
  const [positiveNet, setPositiveNet] = useState('')
  const [referenceNet, setReferenceNet] = useState('')
  const [voltage, setVoltage] = useState('3.3')
  const [status, setStatus] = useState('')

  const namesResult = useMemo(() => boardSource ? getKicadIpcD356NetNames(boardSource) : undefined, [boardSource])
  const availableNets = Array.isArray(namesResult) ? namesResult : []
  const result = useMemo(() => boardSource && schematicSource
    ? compileKicadIpcD356(boardSource, schematicSource, excludedRefs, useExternalSource ? { positiveNet, referenceNet, voltage } : undefined)
    : undefined,
  [boardSource, schematicSource, excludedRefs, useExternalSource, positiveNet, referenceNet, voltage])
  const connectionAudit = useMemo(() => boardSource && schematicSource ? compareKicadIpcD356(boardSource, schematicSource) : undefined, [boardSource, schematicSource])
  const unsupportedRefs = result && !result.ok ? result.unsupportedRefs ?? [] : []
  const needsExternalSource = Boolean(result && !result.ok && result.issues.some(issue => /không có linh kiện nguồn V/i.test(issue)))

  useEffect(() => {
    setPositiveNet(current => availableNets.includes(current) ? current : availableNets.find(net => !['0', 'GND', 'GROUND'].includes(net.trim().replace(/^\/+/, '').toUpperCase())) ?? '')
    setReferenceNet(current => availableNets.includes(current) ? current : availableNets.find(net => ['0', 'GND', 'GROUND'].includes(net.trim().replace(/^\/+/, '').toUpperCase())) ?? availableNets[0] ?? '')
  }, [namesResult])

  async function readFile(event: ChangeEvent<HTMLInputElement>, kind: 'board' | 'schematic') {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    if (file.size > MAX_CAD_FILE_BYTES) {
      setStatus('Mỗi tệp CAD phải nhỏ hơn 1 MB. Netlist hiện tại chưa thay đổi.')
      return
    }
    try {
      const source = await file.text()
      if (kind === 'board') {
        setBoardSource(source)
        setBoardFileName(file.name)
      } else {
        setSchematicSource(source)
        setSchematicFileName(file.name)
      }
      setExcludedRefs([])
      setUseExternalSource(false)
      setStatus('Đã đọc tệp cục bộ. Hệ thống sẽ kiểm tra pad/net của PCB với pin/net schematic trước khi cho phép nhập.')
    } catch {
      setStatus('Không đọc được tệp CAD. Netlist đang soạn được giữ nguyên.')
    }
  }

  function toggleExcluded(ref: string, checked: boolean) {
    setExcludedRefs(current => checked ? [...new Set([...current, ref])] : current.filter(item => item !== ref))
  }

  const nameError = isFailure(namesResult) ? namesResult.issues.join(' ') : ''
  return <section className="spice-kicad-import" aria-labelledby="spice-pcb-kicad-title">
    <div>
      <p className="spice-kicad-kicker">TỪ PCB + SCHEMATIC CAD</p>
      <h3 id="spice-pcb-kicad-title">Nối net PCB vào mạch tương đương SPICE</h3>
      <p>Chọn IPC-D-356 từ PCB Editor và XML từ Eeschema của cùng phiên bản thiết kế. Net/pad lấy từ PCB, trị số lấy từ schematic. Hệ thống chặn nếu chân hoặc topology của R/C/L/V không khớp.</p>
    </div>
    <label className="spice-kicad-file-label">Chọn IPC-D-356 của PCB<input type="file" accept=".d356,.net,.txt,text/plain" onChange={event => void readFile(event, 'board')} /></label>
    {boardFileName && <p className="spice-kicad-filename">PCB: <strong>{boardFileName}</strong></p>}
    <label className="spice-kicad-file-label">Chọn netlist XML của schematic<input type="file" accept=".xml,application/xml,text/xml" onChange={event => void readFile(event, 'schematic')} /></label>
    {schematicFileName && <p className="spice-kicad-filename">Schematic: <strong>{schematicFileName}</strong></p>}
    {nameError && <p className="spice-kicad-error" role="alert">{nameError}</p>}

    {connectionAudit?.ok && <section className={`spice-kicad-net-audit ${connectionAudit.status}`} aria-labelledby="spice-kicad-net-audit-title" aria-live="polite">
      <strong id="spice-kicad-net-audit-title">{connectionAudit.status === 'match' ? 'Topology khớp trên các chân đã đối chiếu' : 'Có khác biệt giữa schematic và PCB'}</strong>
      <p>Đã so {connectionAudit.comparedPins}/{connectionAudit.schematicConnectedPins} chân có net trong schematic · {connectionAudit.matchedPins} chân khớp · {connectionAudit.netMismatchPins} chân lệch nhóm net · {connectionAudit.missingBoardPins} chân schematic thiếu trên PCB · {connectionAudit.extraBoardPins} pad PCB chưa có node tương ứng · {connectionAudit.pcbPadsOnSchematicNoConnect} pad được đánh dấu NC trong schematic.</p>
      {connectionAudit.noConnectPadsSharingPcbNet > 0 && <p className="spice-kicad-net-audit-warning">{connectionAudit.noConnectPadsSharingPcbNet} pad được đánh dấu NC nhưng chia sẻ net PCB với pad khác; cần kiểm tra lại nguồn CAD.</p>}
      {connectionAudit.boardOnlyReferences.length > 0 && <p>Designator chỉ có trong PCB export (có thể là test point/footprint ngoài schematic): {connectionAudit.boardOnlyReferences.join(', ')}.</p>}
      {(connectionAudit.status === 'mismatch' || connectionAudit.boardOnlyReferences.length > 0) && <details>
        <summary>Xem ví dụ khác biệt và phạm vi đối chiếu</summary>
        {connectionAudit.netMismatchPinSamples.length > 0 && <p>Chân làm lộ khác biệt nhóm net: {connectionAudit.netMismatchPinSamples.join(', ')}{connectionAudit.netMismatchPins > connectionAudit.netMismatchPinSamples.length ? ', …' : ''}</p>}
        {connectionAudit.missingBoardPinSamples.length > 0 && <p>Chân schematic chưa thấy trong IPC-D-356: {connectionAudit.missingBoardPinSamples.join(', ')}{connectionAudit.missingBoardPins > connectionAudit.missingBoardPinSamples.length ? ', …' : ''}</p>}
        {connectionAudit.extraBoardPinSamples.length > 0 && <p>Pad PCB không có node cùng tên chân trong schematic: {connectionAudit.extraBoardPinSamples.join(', ')}{connectionAudit.extraBoardPins > connectionAudit.extraBoardPinSamples.length ? ', …' : ''}</p>}
        <p>So sánh quan hệ kết nối theo designator/chân, không dựa vào tên net. Kết quả không chứng minh hai tệp cùng revision, linh kiện đã lắp đúng, hoặc PCB sản xuất khớp CAD.</p>
      </details>}
    </section>}
    {connectionAudit && !connectionAudit.ok && <p className="spice-kicad-error" role="alert">Không thể đối chiếu toàn bộ net: {connectionAudit.issues.join(' ')}</p>}

    {needsExternalSource && <fieldset className="spice-pcb-source">
      <legend>Thêm nguồn thử ngoài (không suy ra từ board)</legend>
      <label className="spice-pcb-source-toggle"><input type="checkbox" checked={useExternalSource} onChange={event => setUseExternalSource(event.currentTarget.checked)} /> Khai báo một nguồn thử DC lý tưởng</label>
      {useExternalSource && <div className="spice-pcb-source-fields">
        <label>Net dương<select value={positiveNet} onChange={event => setPositiveNet(event.target.value)}>{availableNets.map(net => <option key={net} value={net}>{net}</option>)}</select></label>
        <label>Net tham chiếu<select value={referenceNet} onChange={event => setReferenceNet(event.target.value)}>{availableNets.map(net => <option key={net} value={net}>{net}</option>)}</select></label>
        <label>Điện áp DC (V)<input type="number" min="0.01" max="60" step="0.01" value={voltage} onChange={event => setVoltage(event.target.value)} /></label>
      </div>}
      <small>Nguồn VTEST là giả định đầu vào cho bài thử; không đại diện cho regulator, USB, pin hay nguồn thật trên board.</small>
    </fieldset>}

    {unsupportedRefs.length > 0 && <fieldset className="spice-kicad-exclusions">
      <legend>Chọn rõ linh kiện không mô phỏng trong mạch tương đương</legend>
      <button type="button" className="spice-kicad-exclude-all" onClick={() => setExcludedRefs(unsupportedRefs)}>Loại trừ rõ tất cả {unsupportedRefs.length} phần tử chưa hỗ trợ</button>
      {unsupportedRefs.map(ref => <label key={ref}><input type="checkbox" checked={excludedRefs.includes(ref)} onChange={event => toggleExcluded(ref, event.currentTarget.checked)} /> Loại {ref} khỏi mạch tương đương</label>)}
    </fieldset>}
    {result?.ok && <div className="spice-kicad-preview" role="status"><strong>Đã kiểm tra hai nguồn CAD · mạch tương đương sẵn sàng · {result.excludedRefs.length} phần tử bị loại</strong><ul>{result.assumptions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>}
    {result && !result.ok && <p className="spice-kicad-error" role="alert">{result.issues.join(' ')}</p>}
    {status && <p className="spice-kicad-status" role="status">{status}</p>}
    <button className="spice-kicad-apply" type="button" disabled={!result?.ok} onClick={() => result?.ok && onApply(result.netlist)}>Dùng netlist PCB tương đương trong editor</button>
    <small>Xuất PCB bằng KiCad PCB Editor → File → Fabrication Outputs → IPC-D-356; xuất schematic bằng Eeschema → File → Export → Netlist → KiCad XML. Không mô phỏng đường đồng/parasitic, linh kiện bị loại, IC, MCU hoặc firmware. Tệp được xử lý cục bộ trong trình duyệt.</small>
  </section>
}
