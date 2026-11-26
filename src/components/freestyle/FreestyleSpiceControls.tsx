import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getR3PartByType } from '../../data/catalogR3Parts'
import { compileFreestyleAnalog } from '../../lib/freestyle/freestyleAnalogSpice'
import { storeWorkspaceSpiceHandoff } from '../../lib/workspaceSpice'
import { getBrowserStorage } from '../../lib/workspaceStorage'
import { useProductRoute } from '../../lib/useProductRoute'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'

export function FreestyleSpiceControls({ doc, logicLevel, enabled }: { doc: CircuitDocV2; logicLevel: string; enabled: boolean }) {
  const [temperature, setTemperature] = useState(25)
  const [issues, setIssues] = useState<string[]>([])
  const navigate = useNavigate()
  const route = useProductRoute()
  function openSpice() {
    const result = compileFreestyleAnalog(doc, logicLevel, temperature)
    if (!result.ok) { setIssues(result.issues); return }
    const revision = doc.parts.some(part => getR3PartByType(part.type)) ? 'R3'
      : doc.parts.some(part => part.type === 'lm358-r2b' || part.type === 'lm393-r2b') ? 'R2B' : 'R1'
    const id = storeWorkspaceSpiceHandoff(getBrowserStorage('sessionStorage'), result, 'Mạch tự do ' + revision + ' · DC',
      Date.now(), undefined, route('/build/freestyle?resume=1'))
    if (id) navigate(route('/tools/spice?workspaceSpice=' + id))
    else setIssues(['Không lưu được bản chuyển mạch trong phiên trình duyệt.'])
  }
  return <details className="freestyle-card">
    <summary>Phân tích DC mạch đang lắp</summary>
    <p>Chuyển dây, nhóm lỗ breadboard, nguồn, điện trở và linh kiện analog có model DC sang ngspice.</p>
    {doc.parts.some(part => part.type === 'tmp36-r1') && <label>Nhiệt độ TMP36 (°C) <input type="number" min={0} max={75} value={temperature}
      onChange={event => setTemperature(event.target.valueAsNumber)} /></label>}
    <button type="button" className="freestyle-button" disabled={!enabled} onClick={openSpice}>Mở mạch này trong ngspice</button>
    {issues.length > 0 && <ul role="status">{issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
  </details>
}
