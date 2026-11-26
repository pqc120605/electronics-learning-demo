import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { R4Part } from '../../data/catalogR4Parts'
import { getR4PartByType } from '../../data/catalogR4Parts'
import type { CircuitDocV2 } from '../../lib/circuitDocV2'
import { useProductRoute } from '../../lib/useProductRoute'
import { createR4Fixture, r4FixtureName } from '../../simulation/catalogR4Fixtures'
import { createR4Lab } from '../../simulation/catalogR4Lab'

type Lab = ReturnType<typeof createR4Lab>
type Result = ReturnType<Lab['exercise']>
const hex = (bytes: number[]) => bytes.map(n=>n.toString(16).toUpperCase().padStart(2,'0')).join(' ')

export function R4CircuitControls({doc, selectedId, showRaw = true, onLeds}: {
  doc: CircuitDocV2; selectedId?: string | null; showRaw?:boolean; onLeds?: (doc:CircuitDocV2, lit:string[])=>void
}) {
  const lab = useMemo(() => createR4Lab(doc), [doc])
  const parts = doc.parts.flatMap(item => {
    const model = getR4PartByType(item.type)
    return model ? [{ id:item.id, model }] : []
  })
  const active = parts.find(item=>item.id===selectedId) ?? parts[0]
  const [view,setView] = useState<{lab:Lab; id:string; result:Result}>()
  if (!active) return null
  const {id,model} = active
  const result=view?.lab===lab&&view.id===id?view.result:undefined
  const show=(result:Result)=>{
    setView({lab,id,result})
    const lit=result.channels?.flatMap(channel=>channel.duty>0&&channel.ledId?[channel.ledId]:[]) ?? result.lit
    if (lit) onLeds?.(doc,lit)
  }
  const targetI2c = parts.some(part=>part.model.bus==='i2c')
  const thermostat = parts.some(part=>part.model.catalogId==='tmp102') && parts.some(part=>part.model.catalogId==='tlc59116')

  function command(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data=new FormData(event.currentTarget)
    const input=String(data.get('bytes')??'').trim()
    if (model.bus==='serial') {
      if (!/^[a-f0-9]{1,48}$/i.test(input)) { show({ok:false,text:'Nhập từ hex tối đa 48 chữ số.'});return }
      show(lab.serial(id,BigInt('0x'+input),{latch:data.has('latch'),blank:data.has('blank')}))
      return
    }
    if (input&&!/^[a-f0-9]{2}( +[a-f0-9]{2})*$/i.test(input)) {
      show({ok:false,text:'Nhập từng byte hex, cách nhau bằng dấu cách.'});return
    }
    const bytes=input?input.split(/ +/).map(value=>parseInt(value,16)):[]
    const delay=Number(data.get('delay'))
    const reply=model.bus==='one-wire'?lab.oneWire(id,Number(data.get('reset')),bytes,delay)
      :lab.i2c(parseInt(String(data.get('address')),16),bytes,Number(data.get('count')),delay)
    show({ok:!reply.error,text:reply.error??(reply.data.length?hex(reply.data):'ACK'),
      ...(model.catalogId==='tlc59116'?{channels:lab.channels(id)}:{})})
  }

  return <section className="part-r1-practice" aria-label="Điều khiển mạch R4">
    <p>{model.mpn} · {model.bus==='i2c'?'I²C 100 kHz':model.bus==='one-wire'?'1-Wire':'Clock, dữ liệu và chân chốt'}</p>
    <div className="catalog-logic-inputs">
      <button className="freestyle-button" type="button" onClick={()=>show(lab.exercise(id,0))}>Chạy mẫu 1</button>
      <button className="freestyle-button" type="button" onClick={()=>show(lab.exercise(id,1))}>Chạy mẫu 2</button>
    </div>
    {thermostat && <form onSubmit={event=>{
      event.preventDefault()
      const t=Number(new FormData(event.currentTarget).get('temperature'))
      show(lab.thermostat(t))
    }}>
      <fieldset className="catalog-logic-inputs">
        <legend>TMP102 điều khiển TLC59116</legend>
        <label>Nhiệt độ ảo (°C)<input type="number" name="temperature" min="-40" max="85" step="0.0625" defaultValue="31" required /></label>
        <button className="freestyle-button" type="submit">Đọc nhiệt độ và cập nhật LED</button>
      </fieldset>
    </form>}
    {showRaw && <details>
      <summary>Gửi lệnh qua dây đang nối</summary>
      <form key={id} onSubmit={command}>
        <fieldset className="catalog-logic-inputs">
          <legend>{model.bus==='i2c'?'Giao dịch I²C':model.bus==='one-wire'?'Giao dịch 1-Wire':'Dịch nối tiếp'}</legend>
          {model.bus==='i2c' && <>
            <label>Địa chỉ I²C hex<input name="address" size={5} maxLength={2} pattern="[0-9a-fA-F]{1,2}" placeholder="48" required /></label>
            <label>Số byte đọc<input name="count" type="number" min="0" max="48" defaultValue="0" required /></label>
          </>}
          {model.bus==='one-wire' && <label>Reset (µs)<input name="reset" type="number" min="1" max="1000" defaultValue="500" required /></label>}
          <label>{model.bus==='serial'?'Từ hex':'Byte ghi hex'}<input name="bytes" maxLength={model.bus==='serial'?48:143} placeholder={model.bus==='one-wire'?'CC BE':model.bus==='serial'?'8001':'00'} /></label>
          {model.bus==='serial' ? <>
            <label><input name="latch" type="checkbox" defaultChecked /> Chốt</label>
            {model.catalogId!=='max6951' && <label><input name="blank" type="checkbox" /> Ngắt ngõ ra</label>}
          </>:<label>Chờ trước lệnh (ms)<input name="delay" type="number" min="0" max="60000" step="any" defaultValue="0" required /></label>}
          <button className="freestyle-button" type="submit">Gửi lệnh R4</button>
        </fieldset>
      </form>
    </details>}
    {result && <>
      <output aria-label="Kết quả mạch R4" data-r4-ok={result.ok}>{result.text}</output>
      {result.channels && <ul className="catalog-logic-inputs" aria-label="Các ngõ ra LED">
        {result.channels.map(({channel,duty,drive,load})=><li key={channel}>OUT{channel} · {Math.round(duty*100)}% · {drive===0?'hút dòng':'Hi-Z'}{load?'':' · hở tải'}</li>)}
      </ul>}
      <details open>
        <summary>Nhật ký giao dịch</summary>
        <ol className="catalog-logic-trace" aria-label={targetI2c?'Trace I²C':'Trace tín hiệu'}>
          {lab.trace().map((entry,i)=><li key={i}>{entry}</li>)}
        </ol>
      </details>
    </>}
  </section>
}

export function CatalogR4Lab({part}:{part:R4Part}) {
  const fixture=useMemo(()=>createR4Fixture(part.catalogId),[part.catalogId])
  const route=useProductRoute()
  return <>
    <R4CircuitControls doc={fixture.doc} showRaw={false} />
    <p><Link to={route('/build/freestyle?fixture='+part.id)}>Mở mạch thử đã nối trên bàn tự do</Link></p>
    {['tmp102','tlc59116'].includes(part.catalogId) && <p>
      <Link to={route('/build/freestyle?fixture='+r4FixtureName)}>Thử TMP102 và TLC59116 trên cùng bus</Link>
    </p>}
  </>
}
