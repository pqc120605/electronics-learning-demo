import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, createR4Lab, createR4Fixture
before(async () => {
  server=await createServer({logLevel:'silent',server:{middlewareMode:true}})
  ;({createR4Lab}=await server.ssrLoadModule('/src/simulation/catalogR4Lab.ts'))
  ;({createR4Fixture}=await server.ssrLoadModule('/src/simulation/catalogR4Fixtures.ts'))
})
after(async()=>server?.close())
const lab = id => createR4Lab(createR4Fixture(id).doc)
function reconnect(model, pin, from, part='power') {
  const {doc}=createR4Fixture(model)
  const wire=doc.wires.find(wire=>wire.id==='ic-'+pin)
  assert.ok(wire)
  wire.from={kind:'pin',partId:part,pinId:from}
  return createR4Lab(doc)
}
function read(session, addr, reg, length, delay=0) {
  const result=session.i2c(addr,[reg],length,delay)
  assert.equal(result.error,undefined)
  return result.data
}
const write = (session, addr, ...bytes) => assert.equal(session.i2c(addr,bytes).error,undefined)

test('DS18B20 presence, startup sentinel, conversion interval and CRC',()=>{
  const session=lab('ds18b20')
  assert.match(session.oneWire('ic',100,[0xCC]).error,/presence/i)
  const start=session.oneWire('ic',500,[0xCC,0xBE])
  assert.deepEqual(start.data.slice(0,2),[0x50,0x05])
  session.setStimulus({temp:-10.125})
  assert.equal(session.oneWire('ic',500,[0xCC,0x44]).busy,true)
  const early=session.oneWire('ic',500,[0xCC,0xBE],700)
  assert.equal(early.busy,true)
  assert.deepEqual(early.data.slice(0,2),[0x50,0x05])
  const fresh=session.oneWire('ic',500,[0xCC,0xBE],50)
  assert.equal(fresh.busy,false)
  assert.deepEqual(fresh.data,[0x5E,0xFF,75,70,0x7F,0xFF,0x0C,0x10,0x6A])
})

test('TMP102 addresses follow all four straps and ALERT uses two thresholds',()=>{
  for (const [part,pin,addr] of [['power','positive',0x49],['controller','sda',0x4A],['controller','scl',0x4B]]) {
    const session=reconnect('tmp102','addr',pin,part)
    assert.match(session.i2c(0x48,[]).error,/NACK/)
    assert.equal(session.i2c(addr,[]).error,undefined)
  }
  const session=lab('tmp102')
  write(session,0x48,2,0x1C,0);write(session,0x48,3,0x1E,0)
  for (const [temp,alert] of [[31,0],[29,0],[27,'Z']]) {
    session.setStimulus({temp})
    const data=read(session,0x48,0,2,250)
    assert.equal((data[0]*256+data[1])/256,temp)
    assert.equal(session.signal('ic','alert'),alert)
  }
})

test('TMP117 one-shot updates DRDY and reading status clears it',()=>{
  const session=lab('tmp117')
  assert.deepEqual(read(session,0x48,0x0F,2),[0x01,0x17])
  write(session,0x48,1,0x0C,0)
  assert.equal(read(session,0x48,1,2)[0]&0x20,0)
  assert.equal(read(session,0x48,1,2,15.5)[0]&0x20,0x20)
  assert.equal(read(session,0x48,1,2)[0]&0x20,0)
  assert.deepEqual(read(session,0x48,0,2),[0x0C,0x80])
})

test('HDC1080 NACKs early reads and returns manufacturer, device and paired sample',()=>{
  const session=lab('hdc1080')
  assert.deepEqual(read(session,0x40,0xFE,2),[0x54,0x49])
  assert.deepEqual(read(session,0x40,0xFF,2),[0x10,0x50])
  write(session,0x40,2,0x10,0)
  write(session,0x40,0)
  assert.match(session.i2c(0x40,[],4).error,/chuyển đổi/)
  assert.deepEqual(session.i2c(0x40,[],4,13).data,[0x64,0xD8,0x80,0x00])
})

test('OPT3001 power-up IDs, CRF and alternate address with 10 kΩ pull-ups',()=>{
  const session=reconnect('opt3001','addr','positive')
  assert.deepEqual(read(session,0x45,0xFE,2),[0x54,0x49])
  assert.deepEqual(read(session,0x45,0xFF,2),[0x30,0x01])
  write(session,0x45,1,0xC2,0)
  assert.equal(read(session,0x45,1,2)[1]&0x80,0)
  assert.deepEqual(read(session,0x45,0,2),[0,0])
  assert.equal(read(session,0x45,1,2,100)[1]&0x80,0x80)
  assert.deepEqual(read(session,0x45,0,2),[0x04,0x00])
  assert.match(session.i2c(0x44,[]).error,/NACK/)
})

test('BME280 calibration wire format, forced conversion and standby select',()=>{
  const session=reconnect('bme280','sdo','positive')
  assert.deepEqual(read(session,0x77,0xD0,1),[0x60])
  const calibration=read(session,0x77,0x88,24)
  assert.deepEqual(calibration.slice(0,6),[0x70,0x6B,0x43,0x67,0x18,0xFC])
  assert.deepEqual(read(session,0x77,0xA1,1),[75])
  assert.deepEqual(read(session,0x77,0xE1,7),[0x6A,0x01,0,0x14,0x25,0x03,0x1E])
  write(session,0x77,0xF2,1);write(session,0x77,0xF4,0x25)
  assert.equal(read(session,0x77,0xF3,1)[0]&8,8)
  assert.equal(read(session,0x77,0xF3,1,9.3)[0]&8,0)
  assert.notDeepEqual(read(session,0x77,0xF7,8),Array(8).fill(0))
  assert.match(reconnect('bme280','csb','negative').i2c(0x76,[]).error,/NACK/)
})

test('DS3231 runs while on VBAT, then sets OSF after both rails fail',()=>{
  const session=lab('ds3231')
  write(session,0x68,0,0x59,0x59,0x23,7,0x31,0x01,0x26)
  write(session,0x68,0x0F,0)
  session.setSupply('power',false);session.advance(1000)
  session.setSupply('power',true)
  assert.deepEqual(read(session,0x68,0,7),[0,0,0,1,1,2,0x26])
  assert.equal(read(session,0x68,0x0F,1)[0]&128,0)
  session.setSupply('power',false);session.setSupply('backup',false);session.advance(100)
  session.setSupply('power',true)
  assert.equal(read(session,0x68,0x0F,1)[0]&128,128)
})

test('ADXL345 alternate address, data-ready and standby',()=>{
  const session=reconnect('adxl345','sdo','positive')
  assert.deepEqual(read(session,0x1D,0,1),[0xE5])
  write(session,0x1D,0x2D,8)
  assert.equal(read(session,0x1D,0x30,1,10)[0]&128,128)
  assert.deepEqual(read(session,0x1D,0x32,6),[0,1,0x80,0xFF,0,0])
  write(session,0x1D,0x2D,0)
  assert.equal(read(session,0x1D,0x30,1,20)[0]&128,0)
})

test('VL53L0X requires 2.8 V and XSHUT; GPIO-ready can be cleared',()=>{
  const session=lab('vl53l0x')
  assert.deepEqual(read(session,0x29,0xC0,1),[0xEE])
  write(session,0x29,0,1)
  assert.deepEqual(read(session,0x29,0x13,1),[0])
  assert.deepEqual(read(session,0x29,0x13,1,33),[4])
  assert.deepEqual(read(session,0x29,0x1E,2),[0,120])
  write(session,0x29,0x0B,1)
  assert.deepEqual(read(session,0x29,0x13,1),[0])
  assert.match(reconnect('vl53l0x','xshut','negative').i2c(0x29,[]).error,/NACK/)
})

test('LIS3DH alternate address, BDU sample and auto-increment',()=>{
  const session=reconnect('lis3dh','sdo','positive')
  assert.deepEqual(read(session,0x19,0x0F,1),[0x33])
  write(session,0x19,0x23,0x88);write(session,0x19,0x20,0x57)
  assert.deepEqual(read(session,0x19,0xA8,6,10),[0x80,0x3E,0xC0,0xE0,0,0])
  assert.deepEqual(read(session,0x19,0x28,3),[0x80,0x80,0x80])
})

test('MAX6951 shift, shutdown retention, test and wired display mapping',async()=>{
  const {createR4Max6951,hexGlyphs}=await server.ssrLoadModule('/src/simulation/catalogR4Drivers.ts')
  const target=createR4Max6951()
  const send=(value,latch=true)=>{
    for (let bit=15;bit>=0;bit--) {target.edge(Boolean(value&(1<<bit)),false,false);target.edge(Boolean(value&(1<<bit)),true,false)}
    if(latch)target.edge(false,false,true)
  }
  send(0x0181);send(0x0307);send(0x0401);send(0x2002);send(0x270A,false)
  assert.equal(target.digits()[0],hexGlyphs[2])
  assert.equal(target.digits()[7],hexGlyphs[0])
  target.edge(false,false,true)
  assert.equal(target.digits()[7],hexGlyphs[10])
  send(0x0400);assert.ok(target.digits().every(n=>n===0))
  send(0x0401);assert.equal(target.digits()[7],hexGlyphs[10])
  send(0x0701);assert.ok(target.digits().every(n=>n===255))
  const {doc}=createR4Fixture('max6951')
  doc.wires=doc.wires.filter(wire=>![wire.from,wire.to].some(end=>end.kind==='pin'&&end.partId==='digit0-0'))
  const result=createR4Lab(doc).exercise('ic',0)
  assert.equal(result.ok,false)
})

test('TLC5940 tracks every channel, latch, BLANK and grayscale counts',()=>{
  const session=lab('tlc5940')
  const codes=Array.from({length:16},(_,i)=>i===15?4095:i*256)
  const bits=codes.reduce((value,code,i)=>value|(BigInt(code)<<BigInt(i*12)),0n)
  assert.equal(session.serial('ic',bits,{latch:false}).ok,true)
  assert.ok(session.channels('ic').every(channel=>channel.duty===0))
  session.serial('ic',bits)
  assert.deepEqual(session.channels('ic').map(channel=>channel.duty),codes.map(value=>value/4096))
  session.setBlank('ic',false,2048)
  assert.equal(session.channels('ic')[8].drive,'Z')
  assert.equal(session.channels('ic')[15].drive,0)
  session.setBlank('ic',true)
  assert.ok(session.channels('ic').every(channel=>channel.drive==='Z'))
  session.setBlank('ic',false)
  assert.equal(session.channels('ic')[8].drive,0)
})

for (const [model,word,width] of [['tlc5928',0x5AA5,16],['tlc5916',0x5A,8]]) {
  test(model+' maintains the latch, every output, Hi-Z and serial feedback',()=>{
    const session=lab(model)
    session.serial('ic',BigInt(word),{latch:false})
    assert.ok(session.channels('ic').every(ch=>ch.duty===0))
    session.serial('ic',BigInt(word))
    assert.deepEqual(session.channels('ic').map(ch=>ch.duty),Array.from({length:width},(_,i)=>word>>i&1))
    session.serial('ic',0n,{latch:false})
    assert.match(session.trace().at(-1),new RegExp(word.toString(16).toUpperCase()))
    session.setBlank('ic',true)
    assert.ok(session.channels('ic').every(ch=>ch.drive==='Z'))
    session.setBlank('ic',false)
    assert.deepEqual(session.channels('ic').map(ch=>ch.duty),Array.from({length:width},(_,i)=>word>>i&1))
  })
}

test('TLC59116 distinguishes address straps and output power/reset, with channel PWM',()=>{
  const session=reconnect('tlc59116','a0','positive')
  assert.match(session.i2c(0x60,[]).error,/NACK/)
  assert.ok(session.channels('ic').every(ch=>ch.drive==='Z'))
  write(session,0x61,0,1)
  write(session,0x61,0x82,...Array.from({length:16},(_,i)=>i*16))
  write(session,0x61,0x94,0xAA,0xAA,0xAA,0xAA)
  assert.deepEqual(session.channels('ic').map(ch=>ch.duty),Array.from({length:16},(_,i)=>i/16))
  session.setSupply('power',false);session.setSupply('power',true)
  assert.ok(session.channels('ic').every(ch=>ch.drive==='Z'))
  assert.match(reconnect('tlc59116','reset','negative').i2c(0x60,[]).error,/NACK/)
})
