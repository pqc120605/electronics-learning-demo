import { byteHex, createR2bI2cBus, createR2bI2cTarget, type R2bI2cModel } from './catalogR2bI2c'
import type { R2bSignal } from './catalogR2bSignals'

export function runR2bI2cDemo(model: R2bI2cModel, alternate: boolean) {
  let time = 0
  const pins: Record<string,R2bSignal> = { vcc:5,gnd:0,reset:5,a0:0,a1:0,a2:0,addr:0,wp:0 }
  const target = createR2bI2cTarget(model,{read:pin=>pins[pin] ?? 'Z',now:()=>time})
  const pcfs = [0,1].map(low=>createR2bI2cTarget('pcf8574',{
    read:pin=>pin === 'p'+low ? 0 : pins[pin] ?? 'Z',now:()=>time,
  }))
  const trace: string[] = []
  const bus = createR2bI2cBus(() => [target,...pcfs.filter((_,i)=>target.mask() & (1<<i))], detail=>trace.push(detail))
  const address = target.address()!
  const write = (bytes:number[]) => {
    bus.start(false)
    bus.connect(address,true)
    for (const byte of bytes) bus.write(byte)
    bus.stop()
  }
  function read(addr:number,count:number,pointer?:number[]) {
    bus.start(false)
    if (pointer) {
      bus.connect(addr,true)
      for (const byte of pointer) bus.write(byte)
      bus.start(true)
    }
    bus.connect(addr,false)
    const values=Array.from({length:count},(_,i)=>bus.read(i<count-1))
    bus.stop()
    return values.map(byte=>byte==='X'?'X':byteHex(byte)).join(' ')
  }
  let title: string
  switch (model) {
    case 'pcf8574': {
      write([0xfe])
      if (!alternate) pins.p1=0
      const irq=target.drives().find(drive=>drive.pin==='int')?.value
      title='GPIO '+read(address,1)+' · /INT trước đọc = '+irq
      break
    }
    case 'mcp23017':
      pins.gpa0=5
      write([0,1,0])
      write([0x14,0x80,0x54])
      write([0x04,1])
      if (alternate) { pins.gpa0=0; title='INTCAPA '+read(address,1,[0x10]) }
      else title='GPIOA/B '+read(address,2,[0x12])
      break
    case '24lc256':
      write([0,0x3f,0xa5,0x5a])
      bus.start(false)
      const busy=!bus.connect(address,true)
      bus.stop()
      time=5
      if (alternate) {
        pins.wp=5
        write([0,0,77])
        pins.vcc=0
        target.address()
        pins.vcc=5
      }
      title='0x003F/0x0040 = '+read(address,2,[0,0x3f])+' · 0x0000 = '+read(address,1,[0,0])+(busy?' · NACK khi bận':'')
      break
    case 'ads1115':
      pins.ain0=alternate?0:1.024
      pins.ain1=alternate ? 0.512 : 0
      write([1,0x85,0x83])
      read(address,2,[1])
      time=7.8125
      title='Conversion '+read(address,2,[0])+' tại 7,8125 ms'
      break
    case 'tca9548a':
      write([alternate?3:1])
      title='Mặt nạ '+byteHex(target.mask())+' · thiết bị 0x20 đọc '+read(0x20,1)
  }
  return {title,trace}
}
