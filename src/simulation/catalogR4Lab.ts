import { getR4PartByType, r4ControllerType, type R4Model } from '../data/catalogR4Parts'
import { createNetIndexV2 } from '../lib/circuitNetsV2'
import type { CircuitDocV2 } from '../lib/circuitDocV2'
import { r4Rail, r4Voltage } from './catalogR4Fixtures'
import { createR4Sensor, createR4Ds18b20, compensateR4Bme, decodeR4BmeCalibration, r4Stimulus } from './catalogR4Sensors'
import { createR4Max6951, createR4ShiftDriver, createR4Tlc59116, hexGlyphs, maxSegmentPin } from './catalogR4Drivers'

const hex = (n: number, width=2) => n.toString(16).toUpperCase().padStart(width,'0')
const bytes = (data: readonly number[]) => data.map(n=>hex(n)).join(' ')
const word = (data: readonly number[], i=0) => (data[i]<<8)|data[i+1]
const signed = (n: number) => n<<16>>16
const range = (lo:number,hi:number) => Array.from({length:hi-lo+1},(_,i)=>lo+i)
const dows = (n:number) => n===1?'Chủ Nhật':'Thứ '+n

type R4Result = { ok:boolean; text:string; led?:boolean; lit?:string[]; channels?: Array<{channel:number; duty:number; drive:0|'Z'; load:boolean; ledId?:string}> }
const ok = (text:string): R4Result => ({ok:true,text})
const fail = (text:string): R4Result => ({ok:false,text})
const fixedPower = {
  ds18b20: ['vdd'], tmp102:['vcc'], tmp117:['vcc'], hdc1080:['vdd'], opt3001:['vdd'], bme280:['vdd','vddio'],
  ds3231:['vcc'], adxl345:['vs','vddio'], vl53l0x:['avdd','avddvcsel'], lis3dh:['vdd','vddio'],
  max6951:['vcc'], tlc5940:['vcc'], tlc5928:['vcc'], tlc59116:['vcc'], tlc5916:['vdd'],
} satisfies Record<R4Model,string[]>

function sensorFor(model:R4Model, env:()=>ReturnType<typeof r4Stimulus>) {
  if (model==='ds18b20'||model==='max6951'||model==='tlc5940'||model==='tlc5928'||model==='tlc5916'||model==='tlc59116') return
  return createR4Sensor(model,env)
}

export function createR4Lab(doc:CircuitDocV2) {
  const index=createNetIndexV2(doc)
  const net=(id:string,pin:string)=>index.netOf(id+':'+pin)?.key
  const controller=doc.parts.find(part=>part.type===r4ControllerType)
  const port=(pin:string)=>controller && net(controller.id,pin)
  const refGround=port('gnd'),refSupply=port('vref')
  const excluded=new Set<string>()
  const sources=doc.parts.filter(part=>part.type==='battery').map(part=>({
    id:part.id, voltage:r4Voltage(part.value?.label), positive:net(part.id,'positive'), negative:net(part.id,'negative'),
  }))
  const resistors=doc.parts.filter(part=>part.type==='resistor').map(part=>({
    value:part.value?.ohm, a:net(part.id,'a'),b:net(part.id,'b'),
  }))
  const capacitors=doc.parts.filter(part=>part.type==='capacitor').map(part=>({
    value:part.value?.farad,a:net(part.id,'plus'),b:net(part.id,'minus'),
  }))
  const leds=doc.parts.filter(part=>part.type==='led').map(part=>({id:part.id,a:net(part.id,'anode'),k:net(part.id,'cathode')}))
  const across=(a:string|undefined,b:string|undefined,components:typeof resistors,value:number) =>
    a!==undefined && b!==undefined && a!==b && components.some(item=>item.value===value &&
      (item.a===a&&item.b===b||item.a===b&&item.b===a))
  function voltage(key:string|undefined) {
    if (!key) return
    const rail=sources.filter(p=>p.negative===refGround && !excluded.has(p.id))
    if (key===refGround) return rail.some(p=>p.positive===key)?undefined:0
    const values=rail.filter(p=>p.positive===key).map(p=>p.voltage)
    return values.length && values.every(value=>value===values[0]) ? values[0] : undefined
  }
  const wires=(id:string,pin:string)=>Boolean(index.netOf(id+':'+pin)?.wireIds.size)
  const load=(a:string|undefined,k:string|undefined) => a!==undefined&&k!==undefined&&a!==k?leds.find(led=>led.a===a&&led.k===k)?.id:undefined

  let time=0
  let stimulus=r4Stimulus(0)
  const trace:string[]=[]
  const report=(text:string)=>{
    trace.push(time.toFixed(3)+' ms · '+text)
    if (trace.length>72) trace.shift()
  }
  const devices=doc.parts.flatMap(part=>{
    const definition=getR4PartByType(part.type)
    if (!definition) return []
    const {catalogId:model}=definition
    return [{ id:part.id, definition, model,
      sensor:sensorFor(model,()=>stimulus),
      wire1:model==='ds18b20'?createR4Ds18b20(()=>stimulus):undefined,
      pwm:model==='tlc59116'?createR4Tlc59116():undefined,
      max:model==='max6951'?createR4Max6951():undefined,
      shift:model==='tlc5940'||model==='tlc5928'||model==='tlc5916'?createR4ShiftDriver(model):undefined,
      pointer:0, wasPowered:false,
    }]
  })
  type Device = typeof devices[number]
  const pin=(d:Device,name:string)=>net(d.id,name)
  const wired=(d:Device,name:string)=>wires(d.id,name)
  const pinV=(d:Device,name:string)=>voltage(pin(d,name))
  const onRail=(d:Device,name:string)=>pinV(d,name)===r4Rail(d.model)
  const ground=(d:Device)=>definitionGrounds(d).every(name=>pinV(d,name)===0&&wired(d,name))
  function definitionGrounds(d:Device) {
    return d.definition.pins.filter(entry=>entry.electricalType==='ground').map(entry=>entry.id)
  }
  function powered(d:Device) {
    const {model}=d
    return voltage(refSupply)===r4Rail(model) && ground(d) && fixedPower[model].every(name=>onRail(d,name)) &&
      (model!=='bme280'||onRail(d,'csb')) &&
      (model!=='lis3dh'&&model!=='adxl345'||onRail(d,'cs')) &&
      (model!=='vl53l0x'||onRail(d,'xshut')) &&
      (model!=='tlc59116'||onRail(d,'reset'))
  }
  function advance(ms:number) {
    time+=ms
    for (const d of devices) {
      const active=powered(d)
      if (d.wasPowered && !active && d.model!=='ds3231') {
        d.sensor?.reset(); d.pwm?.reset(); d.pointer=0
        if (d.wire1) d.wire1=createR4Ds18b20(()=>stimulus)
        if (d.max) d.max=createR4Max6951()
        if (d.shift) d.shift=createR4ShiftDriver(d.model as 'tlc5940'|'tlc5928'|'tlc5916')
      }
      const powerUp=active&&!d.wasPowered
      d.wasPowered=active
      const backup=d.model==='ds3231'&&ground(d)&&pinV(d,'vbat')===3
      if (active||d.model==='ds3231') d.sensor?.advance(time,active||backup)
      if (powerUp && d.model!=='ds3231') d.sensor?.reset()
      if (active) d.wire1?.advance(time)
    }
  }
  const bit=(d:Device,name:string)=>pinV(d,name)===0?0:onRail(d,name)?1:undefined
  function address(d:Device) {
    if (!powered(d)) return
    switch (d.model) {
      case 'tmp102': case 'tmp117': case 'opt3001': {
        const strap=pin(d,'addr')
        const mode=strap===port('sda')?2:strap===port('scl')?3:bit(d,'addr')
        return mode===undefined?undefined:(d.model==='opt3001'?0x44:0x48)+mode
      }
      case 'bme280': case 'adxl345': case 'lis3dh': {
        const mode=bit(d,'sdo')
        if (mode===undefined) return
        return d.model==='bme280'?0x76+mode:d.model==='lis3dh'?0x18+mode:mode?0x1D:0x53
      }
      case 'tlc59116': {
        const bits=range(0,3).map(i=>bit(d,'a'+i))
        if (bits.some(value=>value===undefined)) return
        const address=0x60+bits.reduce<number>((n,value,i)=>n+((value??0)<<i),0)
        return address===0x68||address===0x6B?undefined:address
      }
      case 'ds3231': return 0x68
      case 'hdc1080': return 0x40
      case 'vl53l0x': return 0x29
    }
  }

  function i2c(addr:number,tx:readonly number[],length=0,delay=0) {
    const sda=port('sda'),scl=port('scl')
    const r=voltage(refSupply)
    const participants=devices.filter(d=>d.definition.bus==='i2c'&&pin(d,'sda')===sda&&pin(d,'scl')===scl)
    const ohms=participants.length>0&&participants.every(d=>d.model==='opt3001')?10000:4700
    if (!Number.isInteger(addr)||addr<0||addr>127||!Number.isInteger(length)||length<0||length>48||
        tx.length>48||tx.some(byte=>!Number.isInteger(byte)||byte<0||byte>255)||!Number.isFinite(delay)||delay<0||delay>60000) {
      return {error:'Địa chỉ, byte hoặc thời gian I²C ngoài phạm vi.',data:[] as number[]}
    }
    advance(delay)
    if (!sda||!scl||sda===scl||r===undefined||!across(sda,refSupply,resistors,ohms)||!across(scl,refSupply,resistors,ohms)||
        voltage(sda)!==undefined||voltage(scl)!==undefined) {
      report('I²C NACK · kiểm nguồn tham chiếu, dây và hai điện trở kéo lên')
      return {error:'I²C NACK · kiểm dây SDA/SCL, nguồn và pull-up '+ohms+' Ω.',data:[]}
    }
    report('I²C START · 100 kHz')
    advance(0.09)
    const matches=participants.filter(d=>address(d)===addr)
    if (matches.length!==1) {
      const error=matches.length?'I²C xung đột địa chỉ 0x'+hex(addr):'I²C NACK · 0x'+hex(addr)+' · kiểm nguồn, chế độ và dây'
      report(error); report('I²C STOP')
      return {error,data:[]}
    }
    const d=matches[0]
    if (tx.length) {
      report('0x'+hex(addr)+' W ACK · '+bytes(tx))
      advance(0.09*tx.length)
      d.pointer=tx[0]
      if (tx.length===1) d.sensor?.point(d.pointer)
      else {
        const values=tx.slice(1)
        if (d.sensor && !d.sensor.accepts(d.pointer,values)) {
          report('I²C STOP · thanh ghi hoặc chế độ ngoài mô hình R4')
          return {error:'Thanh ghi hoặc chế độ ghi ngoài mô hình R4.',data:[]}
        }
        d.sensor?.write(d.pointer,values)
        d.pwm?.write(d.pointer,values)
      }
    }
    let data:number[]=[]
    if (length) {
      if (tx.length) report('I²C REPEATED START')
      advance(0.09)
      const busy=d.sensor?.busyRead(d.pointer)
      if (busy) {
        report('I²C NACK · thiết bị đang chuyển đổi'); report('I²C STOP')
        return {error:'I²C NACK · thiết bị đang chuyển đổi.',data:[]}
      }
      data=(d.sensor?.read(d.pointer)??d.pwm?.read(d.pointer)??[]).slice(0,length)
      if (data.length<length) {
        report('I²C STOP · vượt số byte trong snapshot')
        return {error:'Số byte đọc vượt phạm vi thanh ghi của mô hình.',data:[]}
      }
      report('0x'+hex(addr)+' R ACK · '+bytes(data)+' · NACK cuối')
      advance(0.09*length)
    } else if (!tx.length) report('0x'+hex(addr)+' W ACK')
    report('I²C STOP')
    return {data}
  }

  const serialPins = {
    max6951:['din','clk','cs'],
    tlc5940:['sin','sclk','xlat','blank','gsclk'],
    tlc5928:['sin','sclk','lat','blank'],
    tlc5916:['sdi','clk','le','oe'],
  } as const
  const serialPorts=['data','clock','latch','blank','gsclk']

  function serialIssue(d:Device) {
    const lines=serialPins[d.model as keyof typeof serialPins]
    if (!powered(d)||!lines) return 'Kiểm nguồn và GND của mạch nối tiếp.'
    const connected=lines.map(name=>pin(d,name))
    if (new Set(connected).size!==connected.length||connected.some((key,i)=>!key||key!==port(serialPorts[i])||voltage(key)!==undefined)) {
      return 'Kiểm dây DATA, CLK, chân chốt và chân điều khiển nối với bộ điều khiển ảo.'
    }
    if (d.model==='max6951') {
      if (!across(pin(d,'iset'),refGround,resistors,56000)||!across(pin(d,'osc'),refGround,capacitors,27e-12)) return 'Kiểm RSET 56 kΩ và CSET 27 pF.'
    } else {
      const ohm=d.model==='tlc5940'?7680:d.model==='tlc5928'?3000:2200
      const bias=d.model==='tlc5916'?'rext':'iref'
      if (!across(pin(d,bias),refGround,resistors,ohm)) return 'Kiểm điện trở đặt dòng '+ohm+' Ω.'
      if (d.model==='tlc5940'&&(bit(d,'vprg')!==0||bit(d,'dcprg')!==0)) return 'Ca grayscale dùng VPRG và DCPRG mức thấp.'
    }
  }

  function serial(id:string,data:bigint,flags:{latch?:boolean;blank?:boolean}={}) {
    const d=devices.find(part=>part.id===id)
    if (!d||!(d.max||d.shift)) return fail('Chọn một IC nối tiếp R4.')
    const issue=serialIssue(d)
    if (issue) return fail(issue)
    const width=d.shift?.length??16
    if (data<0n||data>=(1n<<BigInt(width))) return fail('Từ dữ liệu vượt '+width+' bit.')
    if (d.max) {
      for (let i=width-1;i>=0;i--) {
        const value=Boolean(data>>BigInt(i)&1n)
        d.max.edge(value,false,false); d.max.edge(value,true,false)
      }
      if (flags.latch!==false) d.max.edge(false,false,true)
      advance(width/1000)
      report('SPI · '+width+' bit, MSB trước · '+(flags.latch!==false?'/CS ↑':'chưa chốt'))
    } else if (d.shift) {
      const shift=d.shift,blank=flags.blank??false
      let feedback=0n
      for (let i=width-1;i>=0;i--) {
        const value=Boolean(data>>BigInt(i)&1n)
        shift.edge(value,false,false,blank); shift.edge(value,true,false,blank)
        feedback=feedback<<1n|BigInt(shift.shiftedOut())
      }
      if (flags.latch!==false) shift.edge(false,false,true,d.model==='tlc5940'||blank)
      shift.edge(false,false,false,blank)
      advance(width/1000)
      const output=d.model==='tlc5916'?'sdo':'sout'
      report(width+' cạnh CLK · '+(flags.latch!==false?'chốt':'chưa chốt')+
        (pin(d,output)===port('feedback')?' · '+output.toUpperCase()+' '+feedback.toString(16).toUpperCase():''))
    }
    return {...ok('Đã truyền '+width+' bit.'),...(d.shift?{channels:outputs(d)}:{})}
  }

  function setBlank(id:string,blank:boolean,cycles=0) {
    const d=devices.find(part=>part.id===id)
    if (!d?.shift||serialIssue(d)||!Number.isInteger(cycles)||cycles<0||cycles>4096) return false
    d.shift.edge(false,false,false,blank,false)
    if (d.model==='tlc5940') for (let i=0;i<cycles;i++) {
      d.shift.edge(false,false,false,blank,true);d.shift.edge(false,false,false,blank,false)
    }
    advance(cycles/1000)
    report((d.model==='tlc5916'?'/OE':'BLANK')+(blank?' HIGH · Hi-Z':' LOW')+(cycles?' · GSCLK '+cycles+' xung':''))
    return true
  }

  function outputs(d:Device): NonNullable<R4Result['channels']> {
    const active=powered(d) && (d.model!=='tlc59116'||across(pin(d,'rext'),refGround,resistors,720))
    return range(0,d.shift?.width===8?7:15).map(channel=>{
      const duty=active?d.shift?.duty(channel)??d.pwm?.duty(channel)??0:0
      return {channel,duty,drive:(active?d.shift?.drive(channel)??(duty>0?0:'Z'):'Z') as 0|'Z',
        load:Boolean(load(refSupply,pin(d,'out'+channel))),ledId:load(refSupply,pin(d,'out'+channel))}
    })
  }

  function oneWire(id:string,resetUs:number,commands:readonly number[],delay=0) {
    const d=devices.find(part=>part.id===id)
    const dq=port('dq')
    if (!d?.wire1||!powered(d)||!dq||pin(d,'dq')!==dq||voltage(dq)!==undefined||
        !across(dq,refSupply,resistors,4700)) return {error:'Không có presence · kiểm DQ, VDD, GND và pull-up 4,7 kΩ.',data:[]}
    if (!Number.isFinite(delay)||delay<0||delay>60000||commands.length>12||commands.some(byte=>![0xCC,0x44,0xBE].includes(byte))) return {error:'Lệnh 1-Wire ngoài cấu hình.',data:[]}
    advance(delay)
    const presence=d.wire1.reset(resetUs)
    report('1-Wire RESET '+resetUs+' µs · '+(presence?'presence':'không có presence'))
    if (!presence) return {error:'Xung reset ngoài khoảng presence của ca thử.',data:[]}
    advance(resetUs/1000+0.15)
    let data:number[]=[]
    for (const command of commands) {
      advance(0.52)
      data=d.wire1.command(command)??data
      report('1-Wire TX '+hex(command)+(data.length?' · RX '+bytes(data):''))
    }
    return {data,busy:d.wire1.busy()}
  }

  function exercise(id:string,sample:0|1):R4Result {
    const d=devices.find(part=>part.id===id)
    if (!d) return fail('Chọn linh kiện R4 trên bàn.')
    trace.length=0
    stimulus=r4Stimulus(sample)
    advance(0)
    if (d.wire1) {
      stimulus.temp=sample===0?25.0625:-10.125
      const before=oneWire(id,500,[0xCC,0xBE])
      if (before.error) return fail(before.error)
      const start=oneWire(id,500,[0xCC,0x44])
      if (start.error) return fail(start.error)
      const read=oneWire(id,500,[0xCC,0xBE],750)
      if (read.error) return fail(read.error)
      return ok(bytes(read.data)+' · '+(signed(word(read.data.slice(0,2).reverse()))/16).toFixed(4)+' °C · CRC-8 '+hex(read.data[8]))
    }
    if (d.max) {
      const words=[0x0181,0x0207,0x0307,0x0401,0x2000|(sample?10:2),0x2700|(sample?2:10)]
      for (const word of words) {
        const result=serial(id,BigInt(word))
        if (!result.ok) return result
      }
      let incomplete=false
      const lit:string[]=[]
      const display=d.max.digits().map((mask,digit)=>{
        if (!mask) return '·'
        let visible=0
        for (const seg of range(0,7)) {
          const led=load(pin(d,maxSegmentPin(digit,seg)),pin(d,'seg'+digit))
          if ((mask&(1<<seg)) && led) { visible|=1<<seg;lit.push(led) }
        }
        const glyph=hexGlyphs.indexOf(visible&0x7F)
        if (visible!==mask) incomplete=true
        return !visible?'·':glyph>=0?hex(glyph,1):'?'
      })
      return {...ok(display.join('')+' · cường độ '+Math.round(d.max.intensity()*100)+'%'+(incomplete?' · thiếu nhánh LED':'')),ok:!incomplete,lit}
    }
    if (d.shift) {
      const value=d.model==='tlc5940'?((sample?0xFFFn:1n)<<180n)|(0x800n<<12n)|(sample?0n:0xFFFn):
        d.model==='tlc5928'?BigInt(sample?0x5AA5:0x8001):BigInt(sample?0x5A:0x81)
      const result=serial(id,value)
      if (!result.ok) return result
      setBlank(id,false)
      const channels=outputs(d)
      return {...ok(d.model==='tlc5940'?'OUT1 '+(channels[1].duty*100)+'% · 4096 xung mỗi khung':hex(Number(value),d.shift.width/4)),channels}
    }
    const addr=address(d)
    if (addr===undefined) return fail('I²C NACK · kiểm nguồn, GND, địa chỉ hoặc chân chọn chế độ.')
    function tx(values:number[],count=0,ms=0) {
      const reply=i2c(addr!,values,count,ms)
      if (reply.error) throw new Error(reply.error)
      return reply.data
    }
    try {
      switch (d.model) {
        case 'tmp102': {
          stimulus.temp=sample===0?25.0625:-10.125
          tx([1,0x60,0xA0]);tx([2,0x1C,0]);tx([3,0x1E,0])
          const read=tx([0],2,250)
          return ok(bytes(read)+' · '+signed(word(read))/256+' °C · ALERT '+(d.sensor?.alert()?'LOW':'Hi-Z'))
        }
        case 'tmp117': {
          stimulus.temp=sample===0?25:-10
          tx([0x0F],2);tx([1,0x0C,0])
          const status=tx([1],2,15.5)
          const read=tx([0],2)
          return ok(bytes(read)+' · '+signed(word(read))/128+' °C · DRDY '+((status[0]&32)?1:0))
        }
        case 'hdc1080': {
          tx([0xFE],2);tx([0xFF],2);tx([2,0x10,0]);tx([0])
          const read=tx([],4,13)
          return ok(bytes(read)+' · '+(word(read)*165/65536-40).toFixed(2)+' °C · '+(word(read,2)*100/65536).toFixed(2)+'% RH')
        }
        case 'opt3001': {
          tx([0xFE],2);tx([0xFF],2);tx([1,0xC2,0]);tx([1],2,100)
          const read=tx([0],2)
          const v=word(read)
          return ok(bytes(read)+' · '+(0.01*(v&4095)*2**(v>>12)).toFixed(2)+' lx')
        }
        case 'bme280': {
          tx([0xD0],1);tx([0xE0,0xB6])
          const coefficients=decodeR4BmeCalibration(tx([0x88],24),tx([0xA1],1)[0],tx([0xE1],7))
          tx([0xF2,1]);tx([0xF4,0x25]);tx([0xF3],1)
          const read=tx([0xF7],8,9.3)
          const raw=(at:number)=>read[at]<<12|read[at+1]<<4|read[at+2]>>4
          const sample=compensateR4Bme(raw(3),raw(0),word(read,6),coefficients)
          return ok(sample.temp.toFixed(2)+' °C · '+sample.pressure.toFixed(2)+' Pa · '+sample.humidity.toFixed(2)+'% RH')
        }
        case 'ds3231': {
          tx([0,0x59,0x59,0x23,sample?2:7,sample?0x28:0x31,sample?0x02:0x01,sample?0x28:0x26])
          tx([0x0F,0])
          const data=tx([0],7,1000)
          const status=tx([0x0F],1)
          return ok(hex(data[4])+'/'+hex(data[5])+'/20'+hex(data[6])+' · '+dows(data[3])+' · '+bytes(data.slice(0,3).reverse()).replaceAll(' ',':')+' · OSF '+(status[0]>>7))
        }
        case 'adxl345': {
          tx([0],1); tx([0x2C,0x0A]);tx([0x31,0x08]);tx([0x2D,0x08]);tx([0x30],1,10)
          return ok(bytes(tx([0x32],6))+' · XYZ little-endian · 100 Hz')
        }
        case 'lis3dh': {
          tx([0x0F],1);tx([0x23,0x88]);tx([0x20,0x57])
          return ok(bytes(tx([0xA8],6,10))+' · XYZ 12 bit · 100 Hz')
        }
        case 'vl53l0x': {
          tx([0,1]);tx([0x13],1)
          const status=tx([0x13],1,33)
          if (!status[0]) return fail('Mẫu ToF chưa sẵn sàng.')
          const data=tx([0x14],12)
          tx([0x0B,1])
          return ok(word(data,10)+' mm · '+bytes(data.slice(10)))
        }
        case 'tlc59116': {
          if (!across(pin(d,'rext'),refGround,resistors,720)) return fail('Kiểm REXT 720 Ω và mass.')
          tx([0,1]);tx([3,sample?0x40:0x80]);tx([0x11,sample?0x80:0x40]);tx([0x14,0x09]);tx([0x17,0x80]);tx([0x14],1)
          const channels=outputs(d)
          return {...ok('OUT1 '+Math.round(channels[1].duty*100)+'% · OUT15 '+Math.round(channels[15].duty*100)+'%'),channels}
        }
      }
    } catch (error) { return fail(error instanceof Error?error.message:'Giao dịch chưa thành công.') }
    return fail('Giao thức chưa có trong ca thử R4.')
  }

  function thermostat(temperature:number):R4Result {
    const sensor=devices.find(d=>d.model==='tmp102'&&address(d)===0x48)
    const driver=devices.find(d=>d.model==='tlc59116'&&address(d)===0x60)
    if (!sensor||!driver) return fail('Cần TMP102 0x48 và TLC59116 0x60 đang nối nguồn.')
    stimulus={...stimulus,temp:temperature}
    if (!Number.isFinite(temperature)||temperature< -40||temperature>85) return fail('Nhiệt độ ca mẫu từ −40 đến 85 °C.')
    const reading=i2c(0x48,[0],2,250)
    if (reading.error) return fail(reading.error)
    const measured=signed(word(reading.data))/256
    const previous=i2c(0x60,[0x14],1)
    if (previous.error) return fail(previous.error)
    const on=measured>30||(measured>=28&&(previous.data[0]&3)===1)
    const start=i2c(0x60,[0,1])
    if (start.error) return fail(start.error)
    const result=i2c(0x60,[0x14,on?1:0])
    if (result.error) return fail(result.error)
    const readback=i2c(0x60,[0x14],1)
    if (readback.error) return fail(readback.error)
    const channels=outputs(driver)
    const led=channels[0].duty===1 && channels[0].load && across(pin(driver,'rext'),refGround,resistors,720)
    return {...ok(measured+' °C · LEDOUT0 '+hex(readback.data[0])+' · LED '+(led?'sáng':'tắt')),led,channels}
  }

  advance(0)
  return {exercise,thermostat,i2c,serial,oneWire,setBlank,advance,
    setStimulus:(value:Partial<ReturnType<typeof r4Stimulus>>)=>{stimulus={...stimulus,...value}},
    signal:(id:string,name:string)=>{
      const d=devices.find(part=>part.id===id)
      if (!d||!powered(d)) return 'Z'
      if (d.model==='tmp102'&&name==='alert') return d.sensor?.alert()?0:'Z'
      return 'Z'
    },
    setSupply:(id:string,enabled:boolean)=>{if (enabled) excluded.delete(id); else excluded.add(id);advance(0)},
    channels:(id:string)=>{const d=devices.find(part=>part.id===id);return d?outputs(d):[]},
    trace:()=>[...trace],
  }
}
