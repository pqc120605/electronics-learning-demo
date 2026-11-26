import type { R4Model } from '../data/catalogR4Parts'

export type R4Stimulus = { temp: number; humidity: number; lux: number; distance: number; xyz: readonly [number, number, number]; sample: 0 | 1 }
export const r4Stimulus = (sample: 0 | 1): R4Stimulus => sample === 0
  ? { temp: 25, humidity: 50, lux: 10.24, distance: 120, xyz: [1000,-500,0], sample }
  : { temp: 30, humidity: 75, lux: 320, distance: 645, xyz: [-1000,500,1000], sample }

export const be = (value: number) => [(value >> 8) & 255, value & 255]
export const le = (value: number) => be(value).reverse()
const word = (bytes: number[]) => (bytes[0] << 8) | (bytes[1] ?? 0)
const bcd = (n: number) => (Math.floor(n/10)<<4) | n%10
const unBcd = (n: number) => (n>>4)*10 + (n&15)
const clamp = (n: number, min: number, max: number) => Math.max(min,Math.min(max,n))

const calibration = {
  t: [27504,26435,-1000],
  p: [36477,-10685,3024,2855,140,-7,15500,-14600,6000],
  h: [75,362,0,325,50,30],
}
const rawBme = [[519888,415148,30000],[535000,405000,33300]]

export function decodeR4BmeCalibration(main: number[], h1: number, humidity: number[]) {
  const signed=(n:number,bits:number)=>n<<(32-bits)>>(32-bits)
  const read=(data:number[], i:number)=>data[i]|data[i+1]<<8
  const values=Array.from({length:12},(_,i)=>[0,3].includes(i)?read(main,i*2):signed(read(main,i*2),16))
  const [l,h,h3,h4,joined,h5,h6]=humidity
  return {t:values.slice(0,3),p:values.slice(3),h:[h1,signed(l|(h<<8),16),h3,
    signed(h4<<4|(joined&15),12),signed(h5<<4|(joined>>4),12),signed(h6,8)]}
}

export function compensateR4Bme(t: number, p: number, h: number, coefficients: typeof calibration = calibration) {
  const [t1,t2,t3] = coefficients.t
  const [p1,p2,p3,p4,p5,p6,p7,p8,p9] = coefficients.p
  const [h1,h2,h3,h4,h5,h6] = coefficients.h
  const fine = (t/16384-t1/1024)*t2 + ((t/131072-t1/8192)**2)*t3
  const v = fine/2-64000
  const a = (1+(p3*v*v/524288+p2*v)/524288/32768)*p1
  const b = (p6*v*v/32768 + p5*v*2)/4 + p4*65536
  const pressure = (1048576-p-b/4096)*6250/a
  const drift = fine-76800
  const humidity = (h-(h4*64+h5/16384*drift))*(h2/65536*(1+h6/67108864*drift*(1+h3/67108864*drift)))
  return {temp:fine/5120, pressure:pressure+(p9*pressure*pressure/2147483648+p8*pressure/32768+p7)/16,
    humidity:clamp(humidity*(1-h1*humidity/524288),0,100)}
}

type Sensor = Exclude<R4Model, 'ds18b20' | 'max6951' | 'tlc5940' | 'tlc5928' | 'tlc5916' | 'tlc59116'>
type Register = (address: number, data: number[]) => void
const readable: Record<Sensor,readonly number[]> = {
  tmp102:[0,1,2,3], tmp117:[0,1,0x0F], hdc1080:[0,1,2,0xFE,0xFF], opt3001:[0,1,0xFE,0xFF],
  bme280:[0x88,0xA1,0xD0,0xE1,0xF3,0xF7], ds3231:[0,0x0F], adxl345:[0,0x2C,0x2D,0x30,0x31,0x32],
  vl53l0x:[0,0x13,0x14,0x1E,0xC0], lis3dh:[0x0F,0x20,0x23,0x27,0x28],
}
const writable: Record<Sensor,readonly number[]> = {
  tmp102:[1,2,3], tmp117:[1], hdc1080:[2], opt3001:[1], bme280:[0xE0,0xF2,0xF4], ds3231:[0,0x0F],
  adxl345:[0x2C,0x2D,0x31], vl53l0x:[0,0x0B], lis3dh:[0x20,0x23],
}

/** Sensor state advances with the virtual bus clock. An early read keeps the previous snapshot. */
export function createR4Sensor(model: Sensor, env: () => R4Stimulus) {
  const memory = new Uint8Array(256)
  const words = new Map<number,number>()
  let now = 0
  let completeAt = Infinity
  let sampling: R4Stimulus | undefined
  let current: R4Stimulus | undefined
  let interval = 0
  let sampleDue = Infinity
  let ready = false
  let alert = false
  let rtcEpoch: number | undefined
  let rtcAt = 0
  let rtcDow = 1
  let stopped = true
  const store = (at: number, bytes: number[]) => memory.set(bytes,at)
  const temp = (scale: number, alignment: number) => Math.round((current?.temp ?? 0)*scale)*alignment & 65535

  function reset() {
    memory.fill(0)
    words.clear()
    ready=false
    alert=false
    sampling=undefined
    current=undefined
    completeAt=Infinity
    interval=0
    sampleDue=Infinity
    if (model==='tmp102') {
      words.set(1,0x60A0); words.set(2,0x4B00); words.set(3,0x5000)
      interval=250
    }
    if (model==='tmp117') words.set(0x0F,0x0117)
    if (model==='hdc1080') { words.set(2,0x1000); words.set(0xFE,0x5449); words.set(0xFF,0x1050) }
    if (model==='opt3001') { words.set(1,0xC810); words.set(0xFE,0x5449); words.set(0xFF,0x3001) }
    if (model==='bme280') {
      memory[0xD0]=0x60
      store(0x88,[...calibration.t,...calibration.p].flatMap(le))
      const [h1,h2,h3,h4,h5,h6]=calibration.h
      memory[0xA1]=h1
      store(0xE1,[...le(h2),h3,h4>>4,(h5&15)<<4|(h4&15),h5>>4,h6])
    }
    if (model==='adxl345') { memory[0]=0xE5; memory[0x2C]=0x0A }
    if (model==='lis3dh') memory[0x0F]=0x33
    if (model==='vl53l0x') memory[0xC0]=0xEE
    if (interval) sampleDue=now+interval
  }

  function trigger(ms: number) {
    sampling={...env()}
    completeAt=now+ms
    ready=false
  }

  function finish(value: R4Stimulus) {
    current = value
    ready = true
    if (model==='tmp102') {
      const lo=(words.get(2)??0)<<16>>16
      const hi=(words.get(3)??0)<<16>>16
      const t=temp(16,16)<<16>>16
      if (t>=hi) alert=true
      else if (t<lo) alert=false
    }
    if (model==='hdc1080') {
      words.set(0,clamp(Math.round((value.temp+40)*16384/165),0,16383)<<2)
      words.set(1,clamp(Math.round(value.humidity*16384/100),0,16383)<<2)
    }
    if (model==='opt3001') {
      const lx=clamp(value.lux,0,83865)
      const exponent=clamp(Math.ceil(Math.log2(Math.max(1,lx/40.95))),0,11)
      words.set(0,(exponent<<12) | clamp(Math.round(lx*100/2**exponent),0,4095))
    }
    if (model==='bme280') {
      const [t,p,h]=rawBme[value.sample]
      const bits=(n:number)=>[(n>>12)&255,(n>>4)&255,(n&15)<<4]
      store(0xF7,[...bits(p),...bits(t),...be(h)])
      memory[0xF4] &= 0xFC
    }
    if (model==='vl53l0x') { memory[0]=0; memory[0x13]=4; store(0x1E,be(value.distance)) }
    if (model==='adxl345') {
      store(0x32,value.xyz.flatMap(mg=>le(Math.round(clamp(mg,-2000,1996)*256/1000))))
      memory[0x30] |= 0x80
    }
    if (model==='lis3dh') {
      store(0x28,value.xyz.flatMap(mg=>le(Math.round(clamp(mg,-2000,1999))<<4)))
      memory[0x27] |= 0x08
    }
  }

  function advance(time: number, clockPowered: boolean) {
    now=time
    if (model==='ds3231' && !clockPowered) { stopped=true; rtcEpoch=undefined }
    if (sampling && now>=completeAt) {
      finish(sampling)
      sampling=undefined
      completeAt=Infinity
    }
    if (interval && now>=sampleDue) {
      finish(env())
      sampleDue += (1+Math.floor((now-sampleDue)/interval))*interval
    }
  }

  function readRtc() {
    const date=new Date((rtcEpoch ?? Date.UTC(2000,0,1))+Math.max(0,now-rtcAt))
    const elapsedDays=Math.floor(date.valueOf()/86400000)-Math.floor((rtcEpoch??date.valueOf())/86400000)
    store(0,[bcd(date.getUTCSeconds()),bcd(date.getUTCMinutes()),bcd(date.getUTCHours()),(rtcDow-1+elapsedDays)%7+1,
      bcd(date.getUTCDate()),bcd(date.getUTCMonth()+1),bcd(date.getUTCFullYear()%100)])
  }

  function updateCadence(period: number) {
    interval=period
    sampleDue=period ? now+period : Infinity
    if (!period) {
      ready=false
      if (model==='adxl345') memory[0x30]&=0x7F
      if (model==='lis3dh') memory[0x27]&=0xF7
    }
  }

  function accepts(at:number, data:number[]) {
    if (!writable[model].includes(at)) return false
    const value=data[0]
    switch (model) {
      case 'tmp102': return data.length===2 && (at!==1 || [0x60A0,0x61A0].includes(word(data)))
      case 'tmp117': return data.length===2 && word(data)===0x0C00
      case 'hdc1080': return data.length===2 && word(data)===0x1000
      case 'opt3001': return data.length===2 && word(data)===0xC200
      case 'bme280': return data.length===1 && value===(at===0xE0?0xB6:at===0xF2?1:0x25)
      case 'ds3231': return at===0x0F ? data.length===1 : data.length===7 &&
        data.every(byte=> (byte&15)<=9 && (byte>>4)<=9) && value<=0x59 && data[1]<=0x59 && data[2]<=0x23 &&
        data[3]>=1 && data[3]<=7 && data[4]>=1 && data[4]<=0x31 && data[5]>=1 && data[5]<=0x12
      case 'adxl345': return data.length===1 && (at===0x2C ? value===0x0A : at===0x31 ? value===8 : value===0||value===8)
      case 'vl53l0x': return data.length===1 && value===1
      case 'lis3dh': return data.length===1 && (at===0x23?value===0x88:value===0||value===0x57)
    }
  }

  const write: Register = (at,data) => {
    if (model==='ds3231') {
      if (at===0 && data.length===7) {
        rtcEpoch=Date.UTC(2000+unBcd(data[6]),unBcd(data[5])-1,unBcd(data[4]),unBcd(data[2]),unBcd(data[1]),unBcd(data[0]))
        rtcAt=now
        rtcDow=(data[3] & 7) || 1
      }
      if (at===0x0F && rtcEpoch!==undefined) stopped=(data[0]&0x80)!==0
      return
    }
    if (['tmp102','tmp117','opt3001','hdc1080'].includes(model)) {
      if (data.length<2) return
      const value=word(data)
      const writable=(model==='tmp102' && at>=1 && at<=3) || (model==='tmp117' && at===1) ||
        (model==='opt3001' && at>=1 && at<=3) || (model==='hdc1080' && at===2)
      if (!writable) return
      words.set(at,value)
      if (at===1 && model==='tmp102') updateCadence(value&0x100 ? 0 : 250)
      if (at===1 && model==='tmp117' && (value&0x0C00)===0x0C00) trigger(15.5)
      if (at===1 && model==='opt3001' && (value&0x0600)===0x0200) trigger(100)
      return
    }
    store(at,data.slice(0,256-at))
    if (model==='bme280') {
      if (at===0xE0 && data[0]===0xB6) reset()
      if (at===0xF4 && (data[0]&3)===1 && (memory[0xF2]&7)===1) trigger(9.3)
    }
    if (model==='vl53l0x') {
      if (at===0 && data[0]===1) { memory[0x13]=0; trigger(33) }
      if (at===0x0B && (data[0]&1)) memory[0x13]=0
    }
    if (model==='adxl345' && at===0x2D) updateCadence(data[0]&8 ? 10 : 0)
    if (model==='lis3dh' && at===0x20) updateCadence((data[0]&0xF0)===0x50 ? 10 : 0)
  }

  function point(address: number) {
    if (model==='hdc1080' && address===0) trigger(13)
  }

  function busyRead(address: number) {
    return model==='hdc1080' && address===0 && sampling!==undefined
  }

  function read(addr: number) {
    const at=model==='lis3dh' ? addr&127 : addr
    if (!readable[model].includes(at)) return []
    if (model==='ds3231') {
      readRtc()
      memory[0x0F]=stopped?0x80:0
    }
    if (model==='tmp102' || model==='tmp117') {
      if (at===0) {
        if (model==='tmp117') ready=false
        return be(model==='tmp102'?temp(16,16):temp(128,1))
      }
      let value=words.get(at)??0
      if (model==='tmp117' && at===1) {
        value=(value&~0x2000)|(ready?0x2000:0)
        ready=false
      }
      return be(value)
    }
    if (model==='opt3001') {
      if (at===1) {
        const value=((words.get(1)??0)&~0x80)|(ready?0x80:0)
        ready=false
        return be(value)
      }
      return be(words.get(at)??0)
    }
    if (model==='hdc1080') return at===0 ? [...be(words.get(0)??0),...be(words.get(1)??0)] : be(words.get(at)??0)
    if (model==='bme280') memory[0xF3]=sampling?8:0
    const snapshot=Array.from(memory.slice(at))
    if (model==='adxl345' && at===0x32) memory[0x30] &= 0x7F
    if (model==='lis3dh' && at===0x28) memory[0x27] &= 0xF7
    if (model==='lis3dh' && !(addr&128)) return Array(16).fill(snapshot[0]??0) as number[]
    return snapshot
  }

  reset()
  return { advance, write, accepts, point, busyRead, read, reset,
    alert: () => alert, fresh: () => ready,
    sample: () => current,
  }
}

export function createR4Ds18b20(env: () => R4Stimulus) {
  let readyAt = Infinity
  let raw=0x0550
  let pending=0
  let now=0
  let romSelected=false
  let present=false
  function advance(time: number) {
    now=time
    if (time>=readyAt) { raw=pending; readyAt=Infinity }
  }
  function reset(microseconds: number) {
    romSelected=false
    present=microseconds>=480 && microseconds<=960
    return present
  }
  function command(command: number) {
    if (!present) return
    if (command===0xCC) { romSelected=true; return }
    if (!romSelected) return
    if (command===0x44) { pending=Math.round(env().temp*16)&65535; readyAt=now+750 }
    if (command===0xBE) {
      const bytes=[...le(raw),75,70,0x7F,0xFF,0x0C,0x10]
      let crc=0
      for (const value of bytes) {
        crc ^= value
        for (let i=0;i<8;i++) crc=(crc>>>1) ^ (crc&1?0x8C:0)
      }
      return [...bytes,crc]
    }
  }
  return {advance,reset,command,busy:()=>readyAt!==Infinity}
}
