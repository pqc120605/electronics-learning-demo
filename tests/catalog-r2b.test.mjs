import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'

let server
before(async () => { server = await createServer({ logLevel:'silent', server:{middlewareMode:true} }) })
after(async () => { await server?.close() })

const pins = {
  cd4051b:'ch4 ch6 com ch7 ch5 inh vee gnd c b a ch3 ch0 ch1 ch2 vcc',
  cd74hc4067:'com ch7 ch6 ch5 ch4 ch3 ch2 ch1 ch0 s0 s1 gnd s3 s2 en ch15 ch14 ch13 ch12 ch11 ch10 ch9 ch8 vcc',
  pcf8574:'a0 a1 a2 p0 p1 p2 p3 gnd p4 p5 p6 p7 int scl sda vcc',
  mcp23017:'gpb0 gpb1 gpb2 gpb3 gpb4 gpb5 gpb6 gpb7 vcc gnd nc11 scl sda nc14 a0 a1 a2 reset intb inta gpa0 gpa1 gpa2 gpa3 gpa4 gpa5 gpa6 gpa7',
  '24lc256':'a0 a1 a2 gnd sda scl wp vcc',
  mcp4921:'vcc cs sck sdi ldac vref gnd vout',
  ads1115:'addr alert gnd ain0 ain1 ain2 ain3 vcc sda scl',
  tca9548a:'a0 a1 reset sd0 sc0 sd1 sc1 sd2 sc2 sd3 sc3 gnd sd4 sc4 sd5 sc5 sd6 sc6 sd7 sc7 a2 scl sda vcc',
  lm358:'out1 in1n in1p gnd in2p in2n out2 vcc',
  lm393:'out1 in1n in1p gnd in2p in2n out2 vcc',
  sn65hvd230:'d gnd vcc r vref canl canh rs',
  max3232:'c1p vp c1n c2p c2n vn dout2 rin2 rout2 din2 din1 rout1 rin1 dout1 gnd vcc',
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
test('R2B exact manufacturer pads, locked footprint files, STEP assets and mounting policy', async () => {
  const { catalogR2bParts, r2bPackages, catalogR2bApproval } = await server.ssrLoadModule('/src/data/catalogR2bParts.ts')
  const { catalogPackageAssets, getComponentMesh } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const { createEmptyFreestyleDoc, placePart } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  assert.equal(sha(await readFile('docs/research/2026-11-26-catalog-fidelity-r2b-proposal.md')), catalogR2bApproval)
  assert.equal(catalogR2bParts.length, 12)
  for (const part of catalogR2bParts) {
    const asset = catalogPackageAssets[part.packageKey]
    const pkg = r2bPackages[part.packageKey]
    assert.deepEqual(part.pins.map(pin => pin.id), pins[part.catalogId].split(' '), part.mpn)
    assert.equal(asset.pads.length, part.pins.length)
    assert.equal(sha(await readFile('public/models/components/catalog-r2b/' + asset.footprint.split('/').at(-1))), pkg.footprintSha)
    assert.equal(sha(await readFile('public' + asset.file)), asset.sha256)
    assert.equal(asset.sourceSha256, pkg.stepSha)
    assert.equal(getComponentMesh(part.id).mount, pkg.mount)
    assert.deepEqual(Object.keys(getComponentMesh(part.id).pinsMm), part.pins.map(pin => pin.id))
    const placement = placePart(createEmptyFreestyleDoc(), part.id)
    assert.ok(placement.partId, part.id)
    assert.equal(placement.doc.parts.at(-1).mount.kind, pkg.mount)
  }
})

test('both analog switches select every channel and pass voltage bidirectionally', async () => {
  const {selectR2bMux, r2bMuxSignal} = await server.ssrLoadModule('/src/simulation/catalogR2bSignals.ts')
  for (const [model, bits, enable] of [['cd4051b',['a','b','c'],'inh'], ['cd74hc4067',['s0','s1','s2','s3'],'en']]) {
    const pins = {vcc:5,gnd:0,vee:0,[enable]:0}
    for (let i = 0; i < 2 ** bits.length; i++) {
      for (const [index,pin] of bits.entries()) pins[pin] = i & (1 << index) ? 5 : 0
      assert.equal(selectR2bMux(model, pin => pins[pin]), i)
      const voltage = model === 'cd4051b' ? 0.25 + 0.5*i : 0.2 + 0.25*i
      assert.equal(r2bMuxSignal(voltage, 'Z'), voltage)
      assert.equal(r2bMuxSignal('Z', voltage), voltage)
    }
    pins[enable]=5
    assert.equal(selectR2bMux(model, pin => pins[pin]), 'Z')
    pins[enable]=0
    pins.gnd='Z'
    assert.equal(selectR2bMux(model, pin => pins[pin]), 'X')
  }
  assert.equal(r2bMuxSignal(5,0),'X')
  assert.equal(r2bMuxSignal(6,'Z'),'X')
})

test('MCP4921 validates 16-bit words, clock mode, LDAC and shutdown', async () => {
  const {createR2bDac} = await server.ssrLoadModule('/src/simulation/catalogR2bSignals.ts')
  const dac = createR2bDac()
  const pins={vcc:5,gnd:0,vref:2.5,cs:5,ldac:5}
  const line=(id,value)=>{pins[id]=value;dac.control(pin=>pins[pin])}
  const write=(word, msb=true, short=false)=>{
    line('cs',0)
    dac.write(word>>8,1000000,0,msb)
    if (!short) dac.write(word&255,1000000,0,msb)
    line('cs',5)
  }
  dac.control(pin=>pins[pin])
  write(0x3800)
  assert.equal(dac.output(),'Z')
  line('ldac',0)
  assert.equal(dac.output(),1.25)
  write(0x1800)
  assert.equal(dac.output(),2.5)
  write(0x3800,false)
  assert.equal(dac.output(),2.5)
  assert.match(dac.error(), /MSB/)
  write(0x3800,true,true)
  assert.equal(dac.output(),2.5)
  write(0x2000)
  assert.equal(dac.output(),'Z')
  line('vcc',0)
  assert.match(dac.error(), /VDD/)
})

test('SN65HVD230 dominant wins, standby releases only the driver and thresholds stay explicit', async () => {
  const {r2bCanDrive,r2bCanBus,r2bCanReceive} = await server.ssrLoadModule('/src/simulation/catalogR2bSignals.ts')
  assert.equal(r2bCanBus([r2bCanDrive(3.3,0,0,0),r2bCanDrive(3.3,0,0,3.3)]),2)
  assert.equal(r2bCanDrive(3.3,0,3.3,0),'Z')
  assert.equal(r2bCanBus(['Z','Z']),0)
  assert.equal(r2bCanReceive(3.3,0,2),0)
  assert.equal(r2bCanReceive(3.3,0,0.9),0)
  assert.equal(r2bCanReceive(3.3,0,0.5),3.3)
  assert.equal(r2bCanReceive(3.3,0,0.7),'X')
  assert.equal(r2bCanDrive(5,0,0,0),'Z')
})

test('MAX3232E inverts the two RS-232 levels and round-trips the bits at 3.3 V', async () => {
  const {r2bRs232} = await server.ssrLoadModule('/src/simulation/catalogR2bSignals.ts')
  for (const input of [0,3.3]) {
    const {tx}=r2bRs232(3.3,0,input,0)
    assert.equal(tx,input===0?5:-5)
    assert.equal(r2bRs232(3.3,0,input,tx).rx,input)
  }
  assert.equal(r2bRs232(0,0,0,5).tx,'Z')
  assert.equal(r2bRs232(3.3,0,0,2).rx,'X')
})

async function i2cFixture(model, extra = {}, addressPin) {
  const {createR2bI2cTarget,createR2bI2cBus} = await server.ssrLoadModule('/src/simulation/catalogR2bI2c.ts')
  let time=0
  const pins={vcc:5,gnd:0,a0:0,a1:0,a2:0,reset:5,wp:0,addr:0,...extra}
  const device=createR2bI2cTarget(model,{read:pin=>pins[pin]??'Z',now:()=>time,addressPin})
  const events=[]
  const bus=createR2bI2cBus(()=>[device],event=>events.push(event))
  const write=(addr, bytes)=>{
    bus.start(false)
    assert.ok(bus.connect(addr,true))
    for (const byte of bytes) assert.ok(bus.write(byte),events.at(-1))
    bus.stop()
  }
  const read=(addr,count,pointer)=>{
    bus.start(false)
    if (pointer) {
      assert.ok(bus.connect(addr,true))
      for (const byte of pointer) assert.ok(bus.write(byte))
      bus.start(true)
    }
    assert.ok(bus.connect(addr,false))
    const bytes=Array.from({length:count},(_,i)=>bus.read(i<count-1))
    bus.stop()
    return bytes
  }
  return {device,bus,pins,write,read,advance:ms=>time+=ms,events}
}
const driven=(device,id)=>device.drives().find(pin=>pin.pin===id)?.value??'Z'

test('PCF8574 POR latch, weak high, INT and I2C addressing', async () => {
  const {device,bus,pins,write,read}=await i2cFixture('pcf8574')
  assert.deepEqual(read(0x20,1),[0xff])
  write(0x20,[0xfe])
  assert.equal(driven(device,'p0'),0)
  assert.equal(device.drives().find(item=>item.pin==='p1').weak,true)
  pins.p1=0
  assert.equal(driven(device,'int'),0)
  assert.deepEqual(read(0x20,1),[0xfc])
  assert.equal(driven(device,'int'),'Z')
  pins.vcc=0
  assert.equal(device.address(),undefined)
  pins.vcc=5
  delete pins.p1
  assert.deepEqual(read(0x20,1),[0xff])
  for (let addr=0;addr<8;addr++) {
    for(let bit=0;bit<3;bit++) pins['a'+bit]=addr&(1<<bit)?5:0
    assert.equal(device.address(),0x20+addr)
  }
  assert.equal(bus.connect(0x20,true),false)
})

test('MCP23017 BANK=0 preserves independent GPIO and captures change interrupts', async () => {
  const {device,pins,write,read}=await i2cFixture('mcp23017')
  assert.deepEqual(read(0x20,2,[0]),[0xff,0xff])
  write(0x20,[0,1,0])
  write(0x20,[0x14,0x80,0x54])
  write(0x20,[0x0c,1])
  write(0x20,[0x04,1])
  write(0x20,[0x0a,4])
  assert.equal(driven(device,'gpa7'),5)
  assert.equal(driven(device,'gpb2'),5)
  assert.deepEqual(read(0x20,2,[0x12]),[0x81,0x54])
  pins.gpa0=0
  assert.equal(driven(device,'inta'),0)
  assert.equal(driven(device,'intb'),'Z')
  assert.deepEqual(read(0x20,1,[0x0e]),[1])
  assert.deepEqual(read(0x20,1,[0x10]),[0x80])
  assert.equal(driven(device,'inta'),'Z')
  write(0x20,[0,0x80])
  assert.match(device.issue(),/GPA7/)
  assert.deepEqual(read(0x20,1,[0x12]),['X'])
  pins.reset=0
  assert.equal(device.address(),undefined)
  pins.reset=5
  assert.deepEqual(read(0x20,2,[0]),[255,255])
})

test('24LC256 page wrapping, repeated START, WP, 5 ms polling and virtual power cycle', async () => {
  const {device,bus,pins,write,read,advance}=await i2cFixture('24lc256')
  write(0x50,[0,0x3f,0xa5,0x5a])
  bus.start(false)
  assert.equal(bus.connect(0x50,true),false)
  bus.stop()
  advance(4.999)
  assert.equal(device.select(true),false)
  advance(.001)
  assert.deepEqual(read(0x50,2,[0,0x3f]),[0xa5,255])
  assert.deepEqual(read(0x50,1,[0,0]),[0x5a])
  pins.wp=5
  write(0x50,[0,0,77])
  assert.deepEqual(read(0x50,1,[0,0]),[0x5a])
  pins.vcc=0
  assert.equal(device.address(),undefined)
  pins.vcc=5
  assert.deepEqual(read(0x50,1,[0,0x3f]),[0xa5])
})

test('ADS1115 signed saturation and single-shot timing at 128 SPS', async () => {
  const {r2bAdcCode}=await server.ssrLoadModule('/src/simulation/catalogR2bI2c.ts')
  assert.equal(r2bAdcCode(1.024,0),0x4000)
  assert.equal(r2bAdcCode(0,.512),0xe000)
  assert.equal(r2bAdcCode(5,0),0x7fff)
  assert.equal(r2bAdcCode(0,5),0x8000)
  assert.equal(r2bAdcCode(5.1,0),'X')
  let suffix=0
  const {device,write,read,advance,pins}=await i2cFixture('ads1115',{ain0:1.024,ain1:0},()=>suffix)
  write(0x48,[1,0x85,0x83])
  assert.equal(read(0x48,2,[1])[0]&128,0)
  assert.deepEqual(read(0x48,2,[0]),[0,0])
  advance(7.8125)
  assert.deepEqual(read(0x48,2,[0]),[0x40,0])
  pins.ain0=0; pins.ain1=.512
  write(0x48,[1,0x85,0x83])
  advance(7.8125)
  assert.deepEqual(read(0x48,2,[0]),[0xe0,0])
  for(suffix=0;suffix<4;suffix++) assert.equal(device.address(),0x48+suffix)
})

test('TCA9548A commits all eight branch bits after STOP and resolves shared-address open-drain reads', async () => {
  const {createR2bI2cBus}=await server.ssrLoadModule('/src/simulation/catalogR2bI2c.ts')
  const {device, bus, pins}=await i2cFixture('tca9548a')
  for(let i=0;i<8;i++) {
    const old=device.mask()
    bus.start(false); assert.ok(bus.connect(0x70,true)); assert.ok(bus.write(1<<i))
    assert.equal(device.mask(),old)
    bus.stop()
    assert.equal(device.mask(),1<<i)
  }
  pins.reset=0
  assert.equal(device.mask(),0)
  pins.reset=5
  const a=await i2cFixture('pcf8574',{p0:0})
  const b=await i2cFixture('pcf8574',{p1:0})
  const events=[]
  const router=createR2bI2cBus(()=>[device,...(device.mask()&1?[a.device]:[]),...(device.mask()&2?[b.device]:[])],e=>events.push(e))
  const route=(mask)=>{router.start(false); assert.ok(router.connect(0x70,true)); router.write(mask);router.stop()}
  const get=()=>{router.start(false);assert.ok(router.connect(0x20,false)); const value=router.read(false);router.stop();return value}
  assert.equal(router.connect(0x20,false),false)
  route(1); assert.equal(get(),0xfe)
  route(2); assert.equal(get(),0xfd)
  route(3); assert.equal(get(),0xfc)
  assert.ok(events.some(e=>e.includes('open-drain')))
})
