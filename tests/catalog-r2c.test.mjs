import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { Simulation } from 'eecircuit-engine'
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
before(async () => { server = await createServer({ logLevel: 'silent', server: { middlewareMode: true } }) })
after(async () => { await server?.close() })

const full = 'adafruit-239-r2c-1'
const mini = 'adafruit-65-r2c-1'
const endpoint = holeId => ({kind:'hole',holeId})
const base = spec => ({
  schema:2, lessonId:'freestyle', breadboards:[{id:'bb1',spec,railSplit:false}], parts:[], wires:[],
  expect:{partCount:0,wireCount:0,netCount:0},
})

test('each R2C profile validates its exact holes, physical coordinates and group count', async () => {
  const { allBreadboardHoles, parseHole, holeNet, holeToMm } = await server.ssrLoadModule('/src/lib/breadboardGrid.ts')
  const { getR2cBreadboard } = await server.ssrLoadModule('/src/data/catalogR2cBoards.ts')
  for (const [spec,count,groups,columns] of [[full,830,130,63],[mini,170,34,17]]) {
    const { grid } = getR2cBreadboard(spec)
    const holes = allBreadboardHoles(spec)
    assert.equal(holes.length,count)
    assert.equal(new Set(holes.map(hole=>holeNet(hole,{spec}))).size,groups)
    const a = holeToMm(parseHole('bb1:1a',spec),grid)
    const j = holeToMm(parseHole('bb1:'+columns+'j',spec),grid)
    assert.deepEqual(a,[-(columns-1)*2.54/2,8,13.97])
    assert.deepEqual(j,[(columns-1)*2.54/2,8,-13.97])
    assert.equal(parseHole('bb1:'+(columns+1)+'a',spec),null)
    assert.equal(holeNet('bb1:4a',{spec}),holeNet('bb1:4e',{spec}))
    assert.notEqual(holeNet('bb1:4e',{spec}),holeNet('bb1:4f',{spec}))
  }
  assert.equal(parseHole('bb1:T+:1',mini),null)
  const {grid} = getR2cBreadboard(full)
  const left = holeToMm(parseHole('bb1:T+:1',full),grid)
  const right = holeToMm(parseHole('bb1:T+:50',full),grid)
  assert.deepEqual(left,[-73.66,8,-21])
  assert.deepEqual(right,[73.66,8,-21])
  assert.equal(holeNet('bb1:T+:1',{spec:full}),holeNet('bb1:T+:50',{spec:full}))
  assert.notEqual(holeNet('bb1:T+:1',{spec:full}),holeNet('bb1:B+:1',{spec:full}))
})

test('CircuitDoc rejects absent holes and resolves an explicit jumper without changing hole IDs', async () => {
  const { createNetIndexV2 } = await server.ssrLoadModule('/src/lib/circuitNetsV2.ts')
  const { validateCircuitDoc } = await server.ssrLoadModule('/src/lib/circuitDocV2.ts')
  const open = base(full)
  const closed = {...open,expect:{...open.expect,wireCount:1},wires: [{id:'jump',from:endpoint('bb1:T+:25'),to:endpoint('bb1:B+:26')}]}
  const net = createNetIndexV2(open)
  assert.notEqual(net.netOf('bb1:T+:1'),net.netOf('bb1:B+:50'))
  const linked = createNetIndexV2(closed)
  assert.equal(linked.netOf('bb1:T+:1'),linked.netOf('bb1:B+:50'))
  assert.equal(linked.netOf('bb1:T+:1').holes.size,100)
  assert.ok(!validateCircuitDoc(closed).some(issue=>issue.severity==='error'))
  const absent = {...base(mini),wires:closed.wires}
  assert.ok(validateCircuitDoc(absent).some(issue=>issue.severity==='error'))
  assert.equal(createNetIndexV2(absent).netOf('bb1:T+:25'),undefined)
})


const digest = bytes => createHash('sha256').update(bytes).digest('hex').toUpperCase()

test('locally supplied R2C manufacturer references match their recorded hashes', async t => {
  const evidence = 'docs/research/downloads/2026-11-26-catalog-r2c/'
  try {
    await stat(evidence)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    t.skip('Manufacturer reference files are kept outside the public checkout.')
    return
  }
  const { r2cBreadboards } = await server.ssrLoadModule('/src/data/catalogR2cBoards.ts')
  for (const profile of r2cBreadboards) {
    assert.equal(digest(await readFile(evidence + profile.sourceFile)), profile.drawingSha256)
    assert.equal(digest(await readFile(evidence + profile.photoFile)), profile.photoSha256)
  }
})

test('both shipped footprints and GLBs put every opening at the same 2D and 3D coordinates', async () => {
  const { allBreadboardHoles,formatHole,holeToMm } = await server.ssrLoadModule('/src/lib/breadboardGrid.ts')
  const { getR2cBreadboard,R2C_SHA256 } = await server.ssrLoadModule('/src/data/catalogR2cBoards.ts')
  const { getComponentMesh } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const { buildBreadboardDiagram } = await server.ssrLoadModule('/src/lib/breadboardDiagram.ts')
  const { assemblyHolePoint } = await server.ssrLoadModule('/src/lib/assemblyLayout.ts')
  const { freestyleAssembly } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAssembly.ts')
  assert.equal(digest(await readFile('docs/research/2026-11-26-catalog-fidelity-r2c-proposal.md')),R2C_SHA256)
  for (const spec of [full,mini]) {
    const profile = getR2cBreadboard(spec)
    const { grid,sizeMm,catalogId } = profile
    const output = getComponentMesh(catalogId)
    const bytes = await readFile('public'+output.file)
    assert.equal(digest(bytes),output.sha256)
    assert.equal(bytes.toString('ascii',0,4),'glTF')
    const jsonEnd = 20 + bytes.readUInt32LE(12)
    const mesh = JSON.parse(bytes.toString('utf8',20,jsonEnd))
    const socket = mesh.meshes[0].primitives.find(item=>item.material===1)
    const position = mesh.accessors[socket.attributes.POSITION]
    const socketStart = jsonEnd+8+mesh.bufferViews[position.bufferView].byteOffset
    const rim = new Set()
    const normalize = n => Math.round(n*100)/100
    for (let i=0; i<position.count; i++) {
      const start = socketStart+i*12
      if (normalize(bytes.readFloatLE(start+4)*1000)!==8) continue
      rim.add(normalize(bytes.readFloatLE(start)*1000)+':'+normalize(bytes.readFloatLE(start+8)*1000))
    }
    assert.equal(rim.size,profile.pointCount*4)
    const footprint = await readFile('public/models/components/catalog-r2c/'+profile.footprintFile,'utf8')
    const rects = Array.from(footprint.matchAll(/\(fp_rect \(start ([^ ]+) ([^\)]+)\) \(end ([^ ]+) ([^\)]+)\)/g),match=>match.slice(1).map(Number))
    assert.equal(rects.length,profile.pointCount+1)
    assert.doesNotMatch(footprint,/\(pad |\(drill /)
    assert.deepEqual(rects[0],[-sizeMm[0]/2,-sizeMm[2]/2,sizeMm[0]/2,sizeMm[2]/2])
    const diagram = buildBreadboardDiagram(base(spec))
    assert.equal(diagram.holes.length,profile.pointCount)
    const indexed = new Map(diagram.holes.map(hole=>[hole.id,hole]))
    const plan = freestyleAssembly(base(spec),'',{})
    assert.match(plan.placements.find(part=>part.partId==='bb1').assetUrl,new RegExp('/adafruit-'+profile.pid+'\\.glb'))
    for (const [index,hole] of allBreadboardHoles(spec).entries()) {
      const id = formatHole(hole,spec)
      const [x,y,z] = holeToMm(hole,grid)
      assert.deepEqual(mesh.nodes[0].extras.holes[index],[id,x,y,z])
      assert.deepEqual(output.pinsMm[id],[x,y,z])
      assert.deepEqual(rects[index+1],[normalize(x-.5),normalize(z-.5),normalize(x+.5),normalize(z+.5)])
      for (const dx of [-.5,.5]) for (const dz of [-.5,.5]) assert.ok(rim.has(normalize(x+dx)+':'+normalize(z+dz)))
      const {x:sx,y:sy} = indexed.get(id)
      assert.ok(Math.abs(sx-diagram.breadboard.x-(x+sizeMm[0]/2)*9.2)<1e-6)
      assert.ok(Math.abs(sy-diagram.breadboard.y-(z+sizeMm[2]/2)*9.2)<1e-6)
      assert.deepEqual(assemblyHolePoint(id,plan.grid),[x+plan.grid.originX,y,z+plan.grid.originZ])
    }
  }
})

test('mini board fits both approved DIP sizes across e–f in two orientations and refuses overhang', async () => {
  const { footprintHoles, canMount } = await server.ssrLoadModule('/src/lib/mountResolve.ts')
  const { placePart, rotatePart } = await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  for (const [type,count] of [['24lc256-r2b',8],['sn74hc595-r1',16]]) {
    const doc = base(mini)
    const placed = placePart(doc,type)
    const part = placed.doc.parts[0]
    assert.ok(part?.mount.kind==='breadboard',String(placed.error))
    assert.equal(part.mount.rotation,0)
    const rotated = rotatePart(placed.doc,part.id)
    assert.ok(!rotated.error,rotated.error)
    assert.equal(rotated.doc.parts[0].mount.rotation,180)
    const occupied = candidate => (footprintHoles(candidate,undefined,mini) ?? []).map(hole=>hole.column+hole.row).sort()
    assert.equal(occupied(part).length,count)
    assert.deepEqual(occupied(part),occupied(rotated.doc.parts[0]))
    assert.ok(occupied(part).every(id=>/[ef]$/.test(id)))
    assert.equal(canMount(part,{...part.mount,col:18},doc).ok,false)
  }
})

test('portable R2C drafts keep the model and exact wire IDs and refuse remapping populated boards', async () => {
  const { blankFreestyleWorkspace, canChangeFreestyleBreadboard, withFreestyleBreadboard, addFreestyleWire, parseFreestyleWorkspace } =
    await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
  const { portableWorkspace } = await server.ssrLoadModule('/src/lib/freestyle/freestyleShare.ts')
  const workspace = blankFreestyleWorkspace()
  for (const spec of [full,mini]) {
    const doc = withFreestyleBreadboard(workspace.doc,spec)
    const wire = spec===full ? ['bb1:T+:50','bb1:B+:50'] : ['bb1:17e','bb1:17f']
    const wired = addFreestyleWire(doc,endpoint(wire[0]),endpoint(wire[1]))
    assert.equal(canChangeFreestyleBreadboard(wired),false)
    assert.equal(withFreestyleBreadboard(wired,'400-30'),wired)
    const exported = portableWorkspace({...workspace,doc:wired})
    const imported = parseFreestyleWorkspace(JSON.stringify(exported))
    assert.deepEqual(imported.doc,wired)
    assert.equal(parseFreestyleWorkspace(JSON.stringify({...exported,doc:{...wired,breadboards:[{id:'bb1',spec,railSplit:true}]}})),null)
  }
})

const pin = (partId,pinId) => ({kind:'pin',partId,pinId})
const bench = (id,type,value) => ({id,type,mount:{kind:'bench',lane:'right',order:0},value})
const wire = (id,from,to) => ({id,from,to})

test('Uno Blink HEX crosses R2C strips and only lights the wired LED when the two + rails are bridged', async () => {
  const { createAvrLiveMachine } = await server.ssrLoadModule('/src/lib/avrLiveMachine.ts')
  const { compileCoupledCircuit } = await server.ssrLoadModule('/src/lib/freestyle/coupledCircuit.ts')
  const { footprintHoles } = await server.ssrLoadModule('/src/lib/mountResolve.ts')
  const { getCatalogPart } = await server.ssrLoadModule('/src/data/catalogParts.ts')
  const gate = {id:'ic',type:'sn74hc08-r1',mount:{kind:'breadboard',board:'bb1',col:57,row:4,rotation:0}}
  let holes = footprintHoles(gate,undefined,full)
  if (!holes) { gate.mount.row=5; holes=footprintHoles(gate,undefined,full) }
  assert.ok(holes?.length===14)
  const freeHole = pinId => {
    const part = getCatalogPart(gate.type)
    const {column,row} = holes[part.pins.findIndex(pin=>pin.id===pinId)]
    return endpoint('bb1:'+column+('abcde'.includes(row)?'a':'j'))
  }
  const parts = [bench('uno','board'),gate,bench('r','resistor',{ohm:220}),bench('led1','led')]
  const wires = [
    wire('gpio',pin('uno','ledOut'),freeHole('1a')),
    wire('supply',pin('uno','vcc'),endpoint('bb1:T+:1')),
    wire('vcc',endpoint('bb1:B+:50'),freeHole('vcc')),
    wire('bias',endpoint('bb1:B+:49'),freeHole('1b')),
    wire('ground',pin('uno','gnd'),endpoint('bb1:T-:1')),
    wire('gateGround',endpoint('bb1:T-:50'),freeHole('gnd')),
    wire('out',freeHole('1y'),pin('r','a')),
    wire('current',pin('r','b'),pin('led1','anode')),
    wire('return',pin('led1','cathode'),endpoint('bb1:T-:49')),
  ]
  const hex = await readFile('public/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex','utf8')
  for (const bridged of [true,false]) {
    const doc = {...base(full),parts,wires:bridged?[...wires,wire('bridge',endpoint('bb1:T+:25'),endpoint('bb1:B+:26'))]:wires}
    const compiled = compileCoupledCircuit(doc,'arduino-uno-r3',{ledOut:13})
    assert.ok(compiled.ok,JSON.stringify(compiled))
    const runtime = createAvrLiveMachine(hex,'arduino-uno-r3',{graph:compiled.graph,stimuli:{}})
    const samples = Array.from({length:12},()=>runtime.runFor(125))
    assert.equal(samples.some(sample=>sample.pins[13]?.level===true),true)
    assert.equal(samples.some(sample=>sample.coupled.litParts.includes('led1')),bridged)
    assert.ok(samples.some(sample=>!sample.coupled.litParts.includes('led1')))
  }
})

test('mini DC diode is open across e–f and reads the expected ngspice drop with the jumper', async () => {
  const { compileFreestyleAnalog } = await server.ssrLoadModule('/src/lib/freestyle/freestyleAnalogSpice.ts')
  const doc = {...base(mini),parts:[
    bench('source','battery',{label:'5 V'}),
    {id:'r',type:'resistor',value:{ohm:1000},mount:{kind:'breadboard',board:'bb1',col:3,row:2,rotation:0}},
    bench('dio','1n4148-r1'),
  ],wires:[
    wire('source',pin('source','positive'),endpoint('bb1:3a')),
    wire('return',pin('source','negative'),endpoint('bb1:11f')),
    wire('diodePlus',pin('dio','a'),endpoint('bb1:7j')),
    wire('diodeMinus',pin('dio','k'),endpoint('bb1:11j')),
  ]}
  assert.equal(compileFreestyleAnalog(doc,'5 V',25).ok,false)
  const bridged = {...doc,wires:[...doc.wires,wire('bridge',endpoint('bb1:7a'),endpoint('bb1:7f'))]}
  const result = compileFreestyleAnalog(bridged,'5 V',25)
  assert.ok(result.ok,JSON.stringify(result))
  const output = result.netlist.match(/D\d+ (n\d+) 0 MM4148/)[1]
  const simulation = new Simulation()
  await simulation.start()
  simulation.setNetList(result.netlist)
  const measurement = await simulation.runSim()
  const voltage = measurement.data.find(signal=>signal.name.toLowerCase()==='v('+output+')').values[0]
  assert.ok(voltage>=.60 && voltage<=.72,String(voltage))
  console.log('R2C 65 ngspice diode drop',voltage)
})
