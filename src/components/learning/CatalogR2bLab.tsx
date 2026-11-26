import { useState } from 'react'
import type { CatalogR2bPart } from '../../data/catalogR2bParts'
import { isR2bI2c } from '../../simulation/catalogR2bCircuit'
import { runR2bI2cDemo } from '../../simulation/catalogR2bDemo'
import { createR2bDac, r2bCanBus, r2bCanDrive, r2bCanReceive, r2bMuxSignal, r2bRs232, selectR2bMux, type R2bSignal } from '../../simulation/catalogR2bSignals'

const alternateLabel: Record<string,string> = {
  pcf8574:'Giữ P1 cao', mcp23017:'Đọc INTCAPA sau đổi mức', '24lc256':'Bật WP và ngắt nguồn ảo',
  ads1115:'Vi sai −0,512 V', tca9548a:'Mở đồng thời nhánh 0 và 1', mcp4921:'Gain 2×, /LDAC giữ thấp',
  sn65hvd230:'Standby ở nút 1', max3232:'Đặt DIN = 1',
}
const volts = (value: R2bSignal) => typeof value === 'number'
  ? value.toLocaleString('vi-VN',{maximumFractionDigits:5}) + ' V' : value

export function CatalogR2bLab({part}: {part: CatalogR2bPart}) {
  const model = part.catalogId
  const mux = model === 'cd4051b' || model === 'cd74hc4067'
  const [alternate, setAlternate] = useState(false)
  const [channel, setChannel] = useState(0)
  const [reverse, setReverse] = useState(false)
  const [inhibit, setInhibit] = useState(false)
  const [result, setResult] = useState<{title:string;trace:string[]}>()

  function run() {
    if (isR2bI2c(model)) { setResult(runR2bI2cDemo(model,alternate)); return }
    if (model === 'cd4051b' || model === 'cd74hc4067') {
      const keys = model === 'cd4051b' ? ['a','b','c'] : ['s0','s1','s2','s3']
      const pins: Record<string,R2bSignal> = {vcc:5,gnd:0,vee:0,inh:inhibit?5:0,en:inhibit?5:0}
      keys.forEach((pin,i)=>{pins[pin]=channel & (1<<i)?5:0})
      const selected = selectR2bMux(model,pin=>pins[pin])
      const source = model === 'cd4051b' ? .25+.5*channel : .2+.25*channel
      const value: R2bSignal = typeof selected === 'number' ? r2bMuxSignal(source,'Z') : selected
      const title=(reverse?'CH'+channel:'COM')+' = '+volts(value)
      setResult({title,trace:[reverse?'COM → CH'+channel:'CH'+channel+' → COM','Nguồn thử '+volts(source)]})
    } else if (model === 'mcp4921') {
      const dac=createR2bDac()
      const read=(cs:number,ldac:number)=>(pin:string):R2bSignal=>{
        const map: Record<string,number>={cs,ldac,vcc:5,gnd:0,vref:2.5}
        return map[pin] ?? 'Z'
      }
      dac.control(read(0,alternate?0:5))
      dac.write(alternate?0x18:0x38,1000000,0,true)
      dac.write(0,1000000,0,true)
      dac.control(read(5,alternate?0:5))
      const before=dac.output()
      dac.control(read(5,0))
      setResult({title:'VOUT = '+volts(dac.output()),trace:[
        alternate?'0x1800 · gain 2':'0x3800 · gain 1','Sau /CS, trước xung /LDAC: '+volts(before),
      ]})
    } else if (model === 'sn65hvd230') {
      const differential=r2bCanBus([r2bCanDrive(3.3,0,alternate?3.3:0,0),r2bCanDrive(3.3,0,0,3.3)])
      setResult({title:'Vi sai '+volts(differential)+' · R = '+volts(r2bCanReceive(3.3,0,differential)),
        trace:[alternate?'Nút 1 nhả bus trong standby':'Nút 1 dominant, nút 2 nhả bus','Hai đầu tuyến 120 Ω']})
    } else if (model === 'max3232') {
      const input=alternate?3.3:0
      const {tx}=r2bRs232(3.3,0,input,'Z')
      const {rx}=r2bRs232(3.3,0,input,tx)
      setResult({title:'TOUT = '+volts(tx)+' · ROUT = '+volts(rx),
        trace:['DIN '+volts(input),'TX nối vòng về RX. C1–C4 = 100 nF, tải phát 3 kΩ.']})
    }
  }
  return <div role="group" aria-label={'Thử tín hiệu '+part.mpn} className="catalog-logic">
    {mux ? <div className="catalog-logic-inputs">
      <label>Kênh<select value={channel} onChange={event=>setChannel(Number(event.target.value))}>
        {Array.from({length:model==='cd4051b'?8:16},(_,i)=><option key={i} value={i}>CH{i}</option>)}
      </select></label>
      <label><input type="checkbox" checked={reverse} onChange={event=>setReverse(event.target.checked)}/> Đảo chiều</label>
      <label><input type="checkbox" checked={inhibit} onChange={event=>setInhibit(event.target.checked)}/> Ngắt kênh</label>
    </div> : <label><input type="checkbox" checked={alternate} onChange={event=>setAlternate(event.target.checked)}/> {alternateLabel[model]}</label>}
    <div className="catalog-logic-actions"><button type="button" onClick={run}>Chạy bài thử</button></div>
    {result && <>
      <output aria-label="Kết quả tín hiệu">{result.title}</output>
      <ol className="catalog-logic-trace">{result.trace.map((line,i)=><li key={i}>{line}</li>)}</ol>
    </>}
  </div>
}
