import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  calculateAdcDivider,
  calculateI2cPullup,
  calculateLedResistor,
  calculateRc,
  type I2cSpeed,
} from '../lib/electronicsCalculators'
import { getAdcFieldErrors, getI2cFieldErrors, getLedFieldErrors, getRcFieldErrors } from '../lib/calculatorValidation'
import { useProductRoute } from '../lib/useProductRoute'
import { createCalculatorSpiceHandoff, serializeCalculatorSpiceHandoff, type CalculatorSpiceId, type CalculatorSpiceInputMap } from '../lib/calculatorSpice'
import './ElectronicsCalculatorsPage.css'

const number = (value: number, digits = 3) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(value)
const ohms = (value: number) => value >= 1_000_000 ? `${number(value / 1_000_000)} MΩ` : value >= 1_000 ? `${number(value / 1_000)} kΩ` : `${number(value)} Ω`

function Field({ id, label, value, unit, error, onChange, min = '0.001', step = 'any' }: { id: string; label: string; value: string; unit: string; error?: string; onChange: (value: string) => void; min?: string; step?: string }) {
  return <label className={`electronics-field${error ? ' electronics-field-invalid' : ''}`}><span>{label}</span><span className="electronics-field-control"><input id={id} type="number" min={min} step={step} value={value} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onChange(event.target.value)} /><small>{unit}</small></span>{error && <small className="electronics-field-error" id={`${id}-error`}>{error}</small>}</label>
}

function result<T>(calculate: () => T): { value?: T; error?: string } {
  try { return { value: calculate() } }
  catch (error) { return { error: error instanceof Error ? error.message : 'Thông số chưa hợp lệ.' } }
}

export function ElectronicsCalculatorsPage() {
  const productRoute = useProductRoute()
  const navigate = useNavigate()
  const [led, setLed] = useState({ supply: '3.3', vf: '2', current: '10' })
  const [adc, setAdc] = useState({ input: '12', maximum: '3.1', lower: '10' })
  const [i2c, setI2c] = useState({ supply: '3.3', capacitance: '100', speed: 'fast' as I2cSpeed })
  const [rc, setRc] = useState({ resistance: '10', capacitance: '1' })

  const ledResult = useMemo(() => result(() => calculateLedResistor(Number(led.supply), Number(led.vf), Number(led.current))), [led])
  const adcResult = useMemo(() => result(() => calculateAdcDivider(Number(adc.input), Number(adc.maximum), Number(adc.lower))), [adc])
  const i2cResult = useMemo(() => result(() => calculateI2cPullup(Number(i2c.supply), Number(i2c.capacitance), i2c.speed)), [i2c])
  const rcResult = useMemo(() => result(() => calculateRc(Number(rc.resistance), Number(rc.capacitance))), [rc])
  const ledErrors = useMemo(() => getLedFieldErrors(led), [led])
  const adcErrors = useMemo(() => getAdcFieldErrors(adc), [adc])
  const i2cErrors = useMemo(() => getI2cFieldErrors(i2c), [i2c])
  const rcErrors = useMemo(() => getRcFieldErrors(rc), [rc])
  const [handoffError, setHandoffError] = useState('')

  function openInSpice<T extends CalculatorSpiceId>(calculator: T, inputs: CalculatorSpiceInputMap[T]) {
    try {
      const calculatorSpice = createCalculatorSpiceHandoff(calculator, inputs)
      setHandoffError('')
      const serialized = serializeCalculatorSpiceHandoff(calculatorSpice)
      if (!serialized) throw new Error('Không thể giữ bản nháp SPICE hợp lệ trong đường dẫn.')
      const search = new URLSearchParams({ calculatorSpice: serialized }).toString()
      navigate(`${productRoute('/tools/spice')}?${search}`, { state: { calculatorSpice } })
    } catch (error) {
      setHandoffError(error instanceof Error ? error.message : 'Không tạo được netlist SPICE từ phép tính này.')
    }
  }

  return (
    <div className="electronics-calculators-page">
      <header className="electronics-calculators-hero">
        <p className="eyebrow"><span className="eyebrow-line" /> BỘ CÔNG CỤ · TÍNH TOÁN CƠ BẢN</p>
        <h1>Tính nhanh, <span>hiểu rõ giả định.</span></h1>
        <p>Ước lượng linh kiện và thời gian mạch từ thông số bạn nhập. Mỗi kết quả đi kèm công thức để bạn kiểm tra lại.</p>
        <Link to={productRoute('/build')}>Thử lắp mạch <span aria-hidden="true">↗</span></Link>
      </header>

      {handoffError && <p className="electronics-error" role="alert">{handoffError}</p>}

      <div className="electronics-calculator-grid">
        <section className="electronics-calculator-card" aria-labelledby="calc-led-title">
          <div className="electronics-calculator-heading"><span>01</span><div><p>ĐẦU RA · LED</p><h2 id="calc-led-title">Điện trở hạn dòng LED</h2></div></div>
          <div className="electronics-fields">
            <Field id="calc-led-supply" label="Điện áp nguồn" value={led.supply} unit="V" error={ledErrors.supply} onChange={supply => setLed({ ...led, supply })} />
            <Field id="calc-led-vf" label="Điện áp thuận LED (Vf)" value={led.vf} unit="V" error={ledErrors.vf} onChange={vf => setLed({ ...led, vf })} />
            <Field id="calc-led-current" label="Dòng mục tiêu" value={led.current} unit="mA" error={ledErrors.current} onChange={current => setLed({ ...led, current })} />
          </div>
          {ledResult.value ? <div className="electronics-result" aria-live="polite" aria-atomic="true"><small>Điện trở E24 đề xuất</small><strong>{ohms(ledResult.value.standardOhms)}</strong><p>Dòng ước tính {number(ledResult.value.actualCurrentMilliAmps)} mA · Công suất trên R {number(ledResult.value.resistorPowerMilliwatts)} mW</p><button className="electronics-spice-action" type="button" onClick={() => openInSpice('led', { supplyVolts: Number(led.supply), forwardVolts: Number(led.vf), currentMilliAmps: Number(led.current) })}>Mô phỏng giá trị này trong SPICE</button></div> : <p className="electronics-error" role="alert">{ledResult.error}</p>}
          <p className="electronics-formula">R = (V nguồn − Vf) / I · Chọn giá trị E24 bằng hoặc lớn hơn giá trị tính.</p>
        </section>

        <section className="electronics-calculator-card" aria-labelledby="calc-adc-title">
          <div className="electronics-calculator-heading"><span>02</span><div><p>ĐẦU VÀO · ADC</p><h2 id="calc-adc-title">Bộ chia áp bảo vệ ADC</h2></div></div>
          <div className="electronics-fields">
            <Field id="calc-adc-input" label="Điện áp đầu vào tối đa" value={adc.input} unit="V" error={adcErrors.input} onChange={input => setAdc({ ...adc, input })} />
            <Field id="calc-adc-maximum" label="Giới hạn ADC" value={adc.maximum} unit="V" error={adcErrors.maximum} onChange={maximum => setAdc({ ...adc, maximum })} />
            <Field id="calc-adc-lower" label="Điện trở dưới (R2)" value={adc.lower} unit="kΩ" error={adcErrors.lower} onChange={lower => setAdc({ ...adc, lower })} />
          </div>
          {adcResult.value ? <div className="electronics-result" aria-live="polite" aria-atomic="true"><small>Điện trở trên tối thiểu theo E24</small><strong>{ohms(adcResult.value.standardR1Ohms)}</strong><p>Vout ước tính {number(adcResult.value.outputAtMaxVolts)} V · Dòng qua cầu chia {number(adcResult.value.inputCurrentMicroAmps)} µA</p><button className="electronics-spice-action" type="button" onClick={() => openInSpice('adc-divider', { inputMaxVolts: Number(adc.input), adcMaxVolts: Number(adc.maximum), lowerResistorKOhms: Number(adc.lower) })}>Mô phỏng giá trị này trong SPICE</button></div> : <p className="electronics-error" role="alert">{adcResult.error}</p>}
          <p className="electronics-formula">Vout = Vin × R2 / (R1 + R2) · Kiểm tra giới hạn ADC và trở kháng nguồn trong datasheet.</p>
        </section>

        <section className="electronics-calculator-card" aria-labelledby="calc-i2c-title">
          <div className="electronics-calculator-heading"><span>03</span><div><p>BUS · I²C</p><h2 id="calc-i2c-title">Điện trở kéo lên I²C</h2></div></div>
          <div className="electronics-fields">
            <Field id="calc-i2c-supply" label="Điện áp bus (VDD)" value={i2c.supply} unit="V" error={i2cErrors.supply} onChange={supply => setI2c({ ...i2c, supply })} />
            <Field id="calc-i2c-capacitance" label="Điện dung bus ước tính" value={i2c.capacitance} unit="pF" error={i2cErrors.capacitance} onChange={capacitance => setI2c({ ...i2c, capacitance })} />
            <label className="electronics-field"><span>Tốc độ bus</span><select value={i2c.speed} onChange={event => setI2c({ ...i2c, speed: event.target.value as I2cSpeed })}><option value="standard">Standard · 100 kHz</option><option value="fast">Fast · 400 kHz</option><option value="fastPlus">Fast Plus · 1 MHz</option></select></label>
          </div>
          {i2cResult.value ? <div className="electronics-result" aria-live="polite" aria-atomic="true"><small>Dải R ước tính · khuyến nghị E24</small><strong>{ohms(i2cResult.value.recommendedOhms)}</strong><p>{ohms(i2cResult.value.minimumOhms)} – {ohms(i2cResult.value.maximumOhms)} · tr lên tối đa {i2cResult.value.maximumRiseTimeNs} ns</p><button className="electronics-spice-action" type="button" onClick={() => openInSpice('i2c-pullup', { supplyVolts: Number(i2c.supply), busCapacitancePf: Number(i2c.capacitance), speed: i2c.speed })}>Mô phỏng sườn lên tương đương trong SPICE</button></div> : <p className="electronics-error" role="alert">{i2cResult.error}</p>}
          {Number(i2c.capacitance)>(i2c.speed==='fastPlus'?550:400)&&<p className="electronics-error" role="status">Điện dung bus vượt giới hạn tải điện dung danh định của chế độ I²C đã chọn theo UM10204 (400 pF ở Standard/Fast, 550 pF ở Fast-mode Plus). Kiểm tra đặc tính thiết bị và cân nhắc buffer hoặc phân đoạn bus.</p>}
          <p className="electronics-formula">Rmin theo dòng kéo xuống; Rmax ≈ tr / (0,8473 × Cbus). Kết quả phụ thuộc điện dung thực, mức VOL và chuẩn bus.</p>
        </section>

        <section className="electronics-calculator-card" aria-labelledby="calc-rc-title">
          <div className="electronics-calculator-heading"><span>04</span><div><p>TÍN HIỆU · RC</p><h2 id="calc-rc-title">Hằng số thời gian RC</h2></div></div>
          <div className="electronics-fields">
            <Field id="calc-rc-resistance" label="Điện trở" value={rc.resistance} unit="kΩ" error={rcErrors.resistance} onChange={resistance => setRc({ ...rc, resistance })} />
            <Field id="calc-rc-capacitance" label="Tụ điện" value={rc.capacitance} unit="µF" error={rcErrors.capacitance} onChange={capacitance => setRc({ ...rc, capacitance })} />
          </div>
          {rcResult.value ? <div className="electronics-result" aria-live="polite" aria-atomic="true"><small>Hằng số thời gian (τ)</small><strong>{number(rcResult.value.timeConstantMs)} ms</strong><p>Đạt 63,2% sau 1τ · tần số cắt −3 dB khoảng {number(rcResult.value.cutoffHz)} Hz</p><button className="electronics-spice-action" type="button" onClick={() => openInSpice('rc', { resistanceKOhms: Number(rc.resistance), capacitanceMicroFarads: Number(rc.capacitance) })}>Mô phỏng giá trị này trong SPICE</button></div> : <p className="electronics-error" role="alert">{rcResult.error}</p>}
          <p className="electronics-formula">τ = R × C · Mốc phần trăm giả định bước điện áp và mạch RC lý tưởng bậc một.</p>
        </section>
      </div>

      <section className="electronics-calculator-disclaimer"><strong>Phạm vi và an toàn</strong><p>Các kết quả là phép tính giáo dục lý tưởng, chưa mô phỏng sai số linh kiện, tải, nhiệt, dung sai, công suất thực tế hay toàn bộ đặc tính MCU. Đối chiếu datasheet, điện áp tuyệt đối tối đa và công suất linh kiện trước khi lắp mạch thật. Công cụ này không phải SPICE/ERC.</p></section>
    </div>
  )
}
