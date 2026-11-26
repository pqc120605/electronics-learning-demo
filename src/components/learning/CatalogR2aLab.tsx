import { useState } from 'react'
import type { CatalogR2aPart } from '../../data/catalogR2aParts'
import type { Logic } from '../../simulation/catalogR1Digital'
import { stepR2a, type R2aState } from '../../simulation/catalogR2aDigital'

type Signals = Record<string, Logic>

function run(part: CatalogR2aPart, powered: boolean, inputs: Signals, state?: R2aState) {
  return { powered, inputs, ...stepR2a(part.model, powered, pin => inputs[pin] ?? 'Z', state) }
}

function initial(part: CatalogR2aPart) {
  const inputs: Signals = {}
  for (const pin of part.pins) {
    if (pin.electricalType === 'bidirectional') inputs[pin.id] = 'Z'
    if (pin.electricalType === 'input') inputs[pin.id] = 0
  }
  if (part.model === '245') { inputs.dir = 1; inputs.oe = 1 }
  return run(part, true, inputs)
}

function busLevel(external: Logic, chip: Logic): Logic {
  if (external === 'Z') return chip
  if (chip === 'Z') return external
  return external === chip ? chip : 'X'
}

export function CatalogR2aLab({ part }: { part: CatalogR2aPart }) {
  const [lab, setLab] = useState(() => initial(part))
  const inputs = part.pins.filter(pin => pin.electricalType === 'input' || pin.electricalType === 'bidirectional')
  const outputs = part.pins.filter(pin => pin.electricalType === 'output' || pin.electricalType === 'bidirectional')
  function pulse() {
    setLab(previous => ([0, 1, 0] as const).reduce((sample, clk) =>
      run(part, sample.powered, { ...sample.inputs, clk }, sample.state), previous))
  }

  return <div role="group" aria-label={'Thử logic ' + part.mpn} className="catalog-logic">
    <p>Nguồn lý tưởng 5 V. Thử thay mức vào rồi đọc từng chân. X là chưa xác định hoặc xung đột. Z là ngõ nhả.</p>
    <label><input type="checkbox" checked={lab.powered}
      onChange={event => setLab(run(part, event.target.checked, lab.inputs, lab.state))} /> Cấp nguồn bài thử</label>
    <div className="catalog-logic-inputs">
      {inputs.map(pin => <label key={pin.id}>{pin.label}
        <select aria-label={pin.label} value={lab.inputs[pin.id]}
          title={pin.electricalType === 'bidirectional' ? 'Mức do nguồn bên ngoài đặt lên chân' : 'Mức ngõ vào'}
          onChange={event => {
            const value = event.target.value
            const drive = value === '0' ? 0 : value === '1' ? 1 : 'Z'
            setLab(run(part, lab.powered, { ...lab.inputs, [pin.id]: drive }, lab.state))
          }}>
          <option value="0">0</option><option value="1">1</option><option value="Z">Hở (Z)</option>
        </select>
      </label>)}
    </div>
    <div className="catalog-logic-actions">
      {part.model === '164' || part.model === '165' ? <button type="button" onClick={pulse}>Phát một xung CLK</button> : null}
      <button type="button" onClick={() => setLab(initial(part))}>Đặt lại</button>
    </div>
    {part.model === '245' && <p>Các ô A1–A8 và B1–B8 đặt nguồn ngoài lên bus. Kết quả hiện cả mức net và mức IC đang lái.</p>}
    <output aria-label="Kết quả logic" className="catalog-logic-outputs">
      {outputs.map(pin => {
        const chip = lab.outputs[pin.id]
        const bidirectional = pin.electricalType === 'bidirectional'
        const observed = bidirectional ? busLevel(lab.inputs[pin.id], chip) : chip
        return <span key={pin.id} data-logic-pin={pin.id} data-logic-value={observed} data-chip-drive={chip}>
          {pin.label} = <strong>{observed}</strong>
          {bidirectional && <small> · IC {chip}</small>}
        </span>
      })}
    </output>
  </div>
}
