import { catalogR4Parts, r4ControllerType, r4ControllerSignals, type R4Model } from '../data/catalogR4Parts'
import { createNetIndexV2 } from '../lib/circuitNetsV2'
import type { CircuitDocV2, CircuitPartV2, CircuitEndpointV2 } from '../lib/circuitDocV2'
import { maxSegmentPin } from './catalogR4Drivers'


export const r4FixtureName = 'r4-i2c-led'
export const r4Rail = (model: R4Model) => model==='tlc5940' ? 5 : model==='vl53l0x' ? 2.8 : 3.3
export const r4Voltage = (label?: string) => {
  const match = label?.trim().match(/^(?:Nguồn )?(\d+(?:[.,]\d+)?)\s*V(?: lý tưởng)?$/i)
  return match ? Number(match[1].replace(',','.')) : undefined
}
const fixedGrounds = Object.fromEntries(Array.from({length:8},(_,i)=>['nc'+(i+5),'gnd']))

export function createR4Fixture(model: R4Model | 'i2c-led') {
  const part = catalogR4Parts.find(part => part.catalogId===(model==='i2c-led'?'tmp102':model))!
  const doc: CircuitDocV2 = {schema:2,lessonId:'freestyle',breadboards:[],parts:[],wires:[],expect:{partCount:0,wireCount:0,netCount:0}}
  const nets = new Map<string,CircuitEndpointV2[]>()
  function add(id: string, type: string, connections: Record<string,string>, value?: CircuitPartV2['value']) {
    doc.parts.push({id,type,...(value?{value}:{}),mount:{kind:'bench',lane:id==='controller'||id==='power'?'left':'right',order:doc.parts.length}})
    for (const [pinId,node] of Object.entries(connections)) {
      const endpoints=nets.get(node)??[]
      endpoints.push({kind:'pin',partId:id,pinId})
      nets.set(node,endpoints)
    }
  }
  const resistor = (id: string, left: string, right: string, ohm: number) => add(id,'resistor',{a:left,b:right},{ohm})
  const connect = (...pins: readonly string[]) => Object.fromEntries(pins.map(pin=>[pin,pin]))
  add('controller',r4ControllerType,{...connect(...r4ControllerSignals),gnd:'gnd',vref:'vcc'})
  add('power','battery',{positive:'vcc',negative:'gnd'},{label:`${r4Rail(part.catalogId)} V`})
  const bus = part.bus==='i2c' ? connect('sda','scl') : {}
  const pins: Record<string,string> = {...bus,gnd:'gnd'}
  const pullup = (pin:string,ohm=4700) => resistor('pull-'+pin,pin,'vcc',ohm)
  if (part.bus==='i2c') {
    const ohm=model==='opt3001'?10000:4700
    pullup('sda',ohm); pullup('scl',ohm)
  }
  const seriesLed = (index:number, ic='ic') => add(ic+'-led'+index,'led',{anode:'vcc',cathode:ic+'-out'+index})
  function sinks(id: string, width: number) {
    const loadPins: Record<string,string>={}
    for (let index=0;index<width;index++) {
      seriesLed(index,id)
      loadPins['out'+index]=id+'-out'+index
    }
    return loadPins
  }
  const tlc59116 = (id:string) => {
    resistor(id+'-rext',id+'-bias','gnd',720)
    return {...connect('sda','scl'),...sinks(id,16),vcc:'vcc',gnd:'gnd',gnd10:'gnd',gnd19:'gnd',reset:'vcc',
      a0:'gnd',a1:'gnd',a2:'gnd',a3:'gnd',rext:id+'-bias'}
  }

  switch (part.catalogId) {
    case 'ds18b20':
      Object.assign(pins,{vdd:'vcc',dq:'dq'})
      pullup('dq')
      break
    case 'tmp102':
    case 'tmp117':
      Object.assign(pins,{vcc:'vcc',addr:'gnd',alert:'alert'})
      pullup('alert')
      break
    case 'hdc1080':
    case 'opt3001':
      Object.assign(pins,{vdd:'vcc',...(part.catalogId==='opt3001'?{addr:'gnd',int:'alert'}:{})})
      if (part.catalogId==='opt3001') pullup('alert',10000)
      break
    case 'bme280':
      Object.assign(pins,{vdd:'vcc',vddio:'vcc',csb:'vcc',gnd7:'gnd',sdo:'gnd'})
      break
    case 'ds3231':
      Object.assign(pins,{vcc:'vcc',...fixedGrounds,vbat:'vbat'})
      add('backup','battery',{positive:'vbat',negative:'gnd'},{label:'3 V'})
      break
    case 'adxl345':
      Object.assign(pins,{vs:'vcc',vddio:'vcc',cs:'vcc',sdo:'gnd',gnd2:'gnd',gnd4:'gnd',gnd5:'gnd'})
      delete pins.gnd
      break
    case 'lis3dh':
      Object.assign(pins,{vdd:'vcc',vddio:'vcc',cs:'vcc',sdo:'gnd',gnd5:'gnd',res:'gnd'})
      break
    case 'vl53l0x':
      Object.assign(pins,{avdd:'vcc',avddvcsel:'vcc',avssvcsel:'gnd',gnd2:'gnd',gnd3:'gnd',gnd4:'gnd',xshut:'vcc',gpio1:'alert'})
      pullup('alert')
      break
    case 'max6951':
      Object.assign(pins,{vcc:'vcc',din:'data',clk:'clock',cs:'latch',iset:'bias',osc:'osc'})
      resistor('iset','bias','gnd',56000)
      add('cset','capacitor',{plus:'osc',minus:'gnd'},{farad:27e-12,label:'27 pF'})
      for (let pin=0;pin<9;pin++) pins['seg'+pin]='seg'+pin
      for (const digit of [0,7]) for (let segment=0;segment<8;segment++) {
        add('digit'+digit+'-'+segment,'led',{anode:maxSegmentPin(digit,segment),cathode:'seg'+digit})
      }
      break
    case 'tlc5940':
      Object.assign(pins,{vcc:'vcc',sin:'data',sclk:'clock',xlat:'latch',blank:'blank',gsclk:'gsclk',
        sout:'feedback',iref:'bias',vprg:'gnd',dcprg:'gnd',...sinks('ic',16)})
      resistor('iref','bias','gnd',7680)
      break
    case 'tlc5928':
      Object.assign(pins,{vcc:'vcc',sin:'data',sclk:'clock',lat:'latch',blank:'blank',sout:'feedback',
        iref:'bias',ep:'gnd',...sinks('ic',16)})
      resistor('iref','bias','gnd',3000)
      break
    case 'tlc5916':
      Object.assign(pins,{vdd:'vcc',sdi:'data',clk:'clock',le:'latch',oe:'blank',sdo:'feedback',rext:'bias',...sinks('ic',8)})
      resistor('rext','bias','gnd',2200)
      break
    case 'tlc59116':
      Object.assign(pins,tlc59116('ic'))
      break
  }
  add('ic',part.id,pins)
  if (model==='i2c-led') add('driver','tlc59116-r4',tlc59116('driver'))

  const partIds=new Set(doc.parts.map(part=>part.id))
  for (const [node,endpoints] of nets) {
    const role=node==='gnd'?'ground':node==='vcc'||node==='vbat'?'power':'signal'
    for (const endpoint of endpoints.slice(1)) {
      if (endpoint.kind!=='pin') continue
      const id=`${endpoint.partId}-${endpoint.pinId}`
      doc.wires.push({id:partIds.has(id)?'wire-'+id:id,from:endpoints[0],to:endpoint,role})
    }
  }
  doc.expect={partCount:doc.parts.length,wireCount:doc.wires.length,netCount:createNetIndexV2(doc).netsList().filter(net=>net.wireIds.size>0).length}
  const disconnectPin=part.bus==='i2c'?'sda':part.bus==='one-wire'?'dq':pins.clk?'clk':'sclk'
  return {doc,disconnect:{deviceId:'ic',wireId:'ic-'+disconnectPin}}
}

export function getR4CircuitFixture(id: string) {
  if (id===r4FixtureName) return createR4Fixture('i2c-led')
  const part=catalogR4Parts.find(part=>part.id===id)
  if (part) return createR4Fixture(part.catalogId)
}
