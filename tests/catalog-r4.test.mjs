import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

const cases = {
  ds18b20: ['91 01', '5E FF'], tmp102: ['19 10', 'F5 E0'], tmp117: ['0C 80', 'FB 00'],
  hdc1080: ['64 D8 80 00', '6C 9C C0 00'], opt3001: ['04 00', '3F A0'],
  bme280: ['25.08 °C', '29.81 °C'], ds3231: ['01/02/2026', '29/02/2028'],
  adxl345: ['00 01 80 FF 00 00', '00 FF 80 00 00 01'], vl53l0x: ['120 mm', '645 mm'],
  lis3dh: ['80 3E C0 E0 00 00', '80 C1 40 1F 80 3E'], max6951: ['2······A', 'A······2'],
  tlc5940: ['50%', '50%'], tlc5928: ['8001', '5AA5'], tlc59116: ['50%', '25%'],
  tlc5916: ['81', '5A'],
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
let server
const load = name => server.ssrLoadModule('/src/' + name + '.ts')
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

test('approved R4 revision stays byte-for-byte locked', async () => {
  assert.equal(sha(await readFile('docs/research/2026-11-26-catalog-fidelity-r4-proposal.md')),
    '674fd405fcb4ca7641fe2f20e29023d2727f03e5edcc1cfbe64dfeae6803faa3')
})

for (const [id,[first,second]] of Object.entries(cases)) {
  test(id + ' has matching physical assets, a wired measurement and disconnection behavior', async () => {
    const {getCatalogPart} = await load('data/catalogParts')
    const {catalogPackageAssets, getComponentMesh} = await load('data/componentModels')
    const part = getCatalogPart(id)
    assert.equal(part?.revision, 'R4')
    const mesh = getComponentMesh(part.id)
    const asset = catalogPackageAssets[part.packageKey]
    assert.equal(sha(await readFile('public' + mesh.file)), mesh.sha256)
    assert.equal(sha(await readFile('public/models/components/catalog-r4/' + asset.footprint.split('/').at(-1))), asset.footprintSha256)
    assert.deepEqual([...new Set(asset.pads.map(pin => pin.pad))].sort((a,b) => a-b), part.pins.map(pin => pin.pad))
    assert.ok(mesh.legsMm.every(leg => Number.isFinite(leg.x) && Number.isFinite(leg.z)))
    if (id==='bme280') {
      assert.equal(mesh.sizeMm[0],2.5)
      assert.ok(Math.abs(mesh.sizeMm[1]-0.93)<0.005)
      assert.equal(mesh.sizeMm[2],2.5)
    }
    if (id==='tlc5928') assert.ok(mesh.sizeMm[1]<=1.2)
    const {createEmptyFreestyleDoc, placePart} = await load('lib/freestyle/freestyleCircuit')
    const {footprintHoles} = await load('lib/mountResolve')
    const placement=placePart(createEmptyFreestyleDoc(),part.id)
    const placed=placement.doc.parts.find(item=>item.id===placement.partId)
    assert.ok(placed,id)
    const dip=['tlc5940','tlc5916'].includes(id)
    assert.equal(placed.mount.kind,dip?'breadboard':'bench')
    if (dip) assert.equal(footprintHoles(placed).length,part.pins.length)
    const {createR4Fixture} = await load('simulation/catalogR4Fixtures')
    const {createR4Lab} = await load('simulation/catalogR4Lab')
    const fixture = createR4Fixture(id)
    const {validateCircuitDoc}=await load('lib/circuitDocV2')
    assert.deepEqual(validateCircuitDoc(fixture.doc).filter(issue=>issue.severity==='error'),[],id)
    const graph = createR4Lab(fixture.doc)
    assert.match(graph.exercise('ic', 0).text, new RegExp(first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.ok(graph.exercise('ic', 1).text.includes(second))
    const {wireId, deviceId} = fixture.disconnect
    const faulty = { ...fixture.doc, wires: fixture.doc.wires.filter(wire => wire.id !== wireId) }
    assert.equal(createR4Lab(faulty).exercise(deviceId, 0).ok, false)
  })
}

test('R4 boardless drafts preserve parts, endpoints and bends when recovering interim aliases', async () => {
  const {createR4Fixture}=await load('simulation/catalogR4Fixtures')
  const {blankFreestyleWorkspace,parseFreestyleWorkspace}=await load('lib/freestyle/freestyleCircuit')
  const {doc}=createR4Fixture('i2c-led')
  const workspace={...blankFreestyleWorkspace(),doc}
  assert.deepEqual(parseFreestyleWorkspace(JSON.stringify(workspace))?.doc, doc)
  const leds=new Set(doc.parts.filter(p=>p.type==='led').map(p=>p.id))
  const legacy=endpoint=>endpoint.kind==='pin'&&leds.has(endpoint.partId)?{
    ...endpoint,pinId:endpoint.pinId==='anode'?'a':'k',
  }:endpoint
  const interim={...doc,wires:doc.wires.map(w=>({...w,
    id:w.id==='wire-driver-rext'?'driver-rext':w.id,from:legacy(w.from),to:legacy(w.to)}))}
  const bend={x:152,y:239}
  const restored=parseFreestyleWorkspace(JSON.stringify({...workspace,doc:interim,wireLayout:{'driver-rext':bend}}))
  assert.deepEqual(restored?.doc,doc)
  assert.deepEqual(restored?.wireLayout,{'wire-driver-rext':bend})
})

test('R4 sensor and driver exchange data over a shared bus and detect a collision', async () => {
  const {createR4Fixture} = await load('simulation/catalogR4Fixtures')
  const {createR4Lab} = await load('simulation/catalogR4Lab')
  const {doc} = createR4Fixture('i2c-led')
  const lab = createR4Lab(doc)
  assert.equal(lab.thermostat(31).led, true)
  assert.equal(lab.thermostat(29).led, true)
  assert.equal(lab.thermostat(27).led, false)
  const duplicate = { id: 'duplicate', type: 'tmp102-r4', mount: { kind: 'bench', lane: 'right', order: 500 } }
  const wires = ['vcc','gnd','addr','sda','scl'].map(pinId => ({
    id: 'duplicate-' + pinId, from: {kind:'pin',partId:'ic',pinId}, to: {kind:'pin',partId:duplicate.id,pinId},
  }))
  const conflict = createR4Lab({...doc, parts:[...doc.parts,duplicate], wires:[...doc.wires,...wires]})
  assert.match(conflict.thermostat(31).text, /xung đột/i)
})
