import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let compileKicadXmlNetlist
let compileKicadIpcD356
let compareKicadIpcD356
let getKicadIpcD356NetNames

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  ;({ compileKicadXmlNetlist, compileKicadIpcD356, compareKicadIpcD356, getKicadIpcD356NetNames } = await server.ssrLoadModule('/src/lib/kicadSpiceImport.ts'))
})

after(async () => { await server?.close() })

const netlist = (extraComponents = '', extraNodes = '') => `<?xml version="1.0"?>
<export version="E">
  <components>
    <comp ref="R1"><value>1k</value><footprint>Resistor_SMD:R_0805</footprint></comp>
    <comp ref="R2"><value>1k</value></comp>
    <comp ref="V1"><value>5V</value></comp>
    ${extraComponents}
  </components>
  <nets>
    <net code="1" name="VIN"><node ref="V1" pin="1"/><node ref="R1" pin="1"/></net>
    <net code="2" name="OUT"><node ref="R1" pin="2"/><node ref="R2" pin="1"/></net>
    <net code="3" name="GND"><node ref="V1" pin="2"/><node ref="R2" pin="2"/></net>
    ${extraNodes}
  </nets>
</export>`

test('imports KiCad XML netlist passives and an explicit voltage source into a safe SPICE .op netlist', () => {
  const result = compileKicadXmlNetlist(netlist())
  assert.equal(result.ok, true)
  assert.match(result.netlist, /V1 .* 0 DC 5/)
  assert.match(result.netlist, /R1 .* 1k/)
  assert.match(result.netlist, /R2 .* 1k/)
  assert.match(result.netlist, /\.op\n\.end$/)
  assert.deepEqual(result.excludedRefs, [])
  assert.ok(result.assumptions.some(item => /KiCad/i.test(item)))
})

test('requires explicit exclusion of unsupported ICs and reports them in the returned subset', () => {
  const source = netlist('<comp ref="U1"><value>MCU</value></comp>', '<net code="4" name="CTRL"><node ref="U1" pin="1"/><node ref="R1" pin="3"/></net>')
  const blocked = compileKicadXmlNetlist(source)
  assert.equal(blocked.ok, false)
  assert.match(blocked.issues.join(' '), /U1/)
  const selected = compileKicadXmlNetlist(source, ['U1'])
  assert.equal(selected.ok, false)
  assert.match(selected.issues.join(' '), /R1: linh kiện R cần đúng hai chân/i)
})

test('does not infer ground, electrical direction, or values and rejects malformed or dangerous XML', () => {
  const noGround = netlist().replace('name="GND"', 'name="RETURN"')
  assert.match(compileKicadXmlNetlist(noGround).issues.join(' '), /GND|mass/i)
  const noSource = netlist().replace('<comp ref="V1"><value>5V</value></comp>', '').replaceAll('<node ref="V1" pin="1"/>', '').replaceAll('<node ref="V1" pin="2"/>', '')
  assert.match(compileKicadXmlNetlist(noSource).issues.join(' '), /nguồn/i)
  assert.equal(compileKicadXmlNetlist('<!DOCTYPE export [<!ENTITY x SYSTEM "file:///secret">]><export>&x;</export>').ok, false)
  assert.equal(compileKicadXmlNetlist(netlist().replace('name="VIN"', 'name="V&IN"')).ok, false)
  assert.equal(compileKicadXmlNetlist('x'.repeat(1_000_001)).ok, false)
})

test('validates KiCad component value units before mapping them to SPICE quantities', () => {
  const wrongResistorUnit = netlist().replace('<value>1k</value><footprint', '<value>5 V</value><footprint')
  assert.match(compileKicadXmlNetlist(wrongResistorUnit).issues.join(' '), /đơn vị|điện trở/i)

  const wrongCapacitorUnit = netlist('<comp ref="C1"><value>100 Ohm</value></comp>', '<net code="4" name="VIN"><node ref="C1" pin="1"/></net><net code="5" name="GND"><node ref="C1" pin="2"/></net>')
  assert.match(compileKicadXmlNetlist(wrongCapacitorUnit).issues.join(' '), /đơn vị|tụ điện/i)

  const validCapacitor = netlist('<comp ref="C1"><value>100 µF</value></comp>', '<net code="4" name="VIN"><node ref="C1" pin="1"/></net><net code="5" name="GND"><node ref="C1" pin="2"/></net>')
  const imported = compileKicadXmlNetlist(validCapacitor)
  assert.equal(imported.ok, true)
  assert.match(imported.netlist, /C1 .* 100u/)

  const megaOhm = compileKicadXmlNetlist(netlist().replace('<value>1k</value><footprint', '<value>1MOhm</value><footprint'))
  assert.equal(megaOhm.ok, true)
  assert.match(megaOhm.netlist, /R1 .* 1meg/)
})

test('requires explicit exclusions for unsupported parts and safely imports the remaining analog subset', () => {
  const source = netlist('<comp ref="U1"><value>Unknown IC</value></comp>', '<net code="4" name="NC"><node ref="U1" pin="1"/></net>')
  const result = compileKicadXmlNetlist(source, ['U1'])
  assert.equal(result.ok, true)
  assert.deepEqual(result.excludedRefs, ['U1'])
  assert.match(result.assumptions.join(' '), /loại trừ theo lựa chọn: U1/i)
  assert.doesNotMatch(result.netlist, /U1/)
})

test('rejects shorted passive terminals and markup hidden inside XML comments', () => {
  const shorted = netlist().replace(
    '<net code="2" name="OUT"><node ref="R1" pin="2"/><node ref="R2" pin="1"/></net>',
    '<net code="2" name="VIN"><node ref="R1" pin="2"/><node ref="R2" pin="1"/></net>',
  )
  assert.match(compileKicadXmlNetlist(shorted).issues.join(' '), /cùng một net/i)
  const commented = netlist().replace('<components>', '<!-- <comp ref="BAD"><value>1k</value></comp> --><components>')
  assert.equal(compileKicadXmlNetlist(commented).ok, true)
})

function ipcPad(net, ref, pin) {
  return `327${net.padEnd(16)}${ref.padEnd(6)}${String(-pin).padStart(4)}          A01X+001000Y-001000X0100Y0100R000 S2`
}

const pcbNetlist = [
  'C  IPC-D-356A generated by KiCad',
  ipcPad('VIN', 'V1', 1), ipcPad('VIN', 'R1', 1),
  ipcPad('OUT', 'R1', 2), ipcPad('OUT', 'R2', 1),
  ipcPad('GND', 'V1', 2), ipcPad('GND', 'R2', 2),
  '317VIN              TP1   -1          A01X+001000Y-001000X0100Y0100R000 S2',
  '999',
].join('\n')

test('imports a PCB IPC-D-356 net topology only when every supported pin agrees with its schematic XML net', () => {
  const result = compileKicadIpcD356(pcbNetlist, netlist())
  assert.equal(result.ok, true)
  assert.match(result.netlist, /V1 .* 0 DC 5/)
  assert.match(result.netlist, /R1 .* 1k/)
  assert.match(result.assumptions.join(' '), /IPC-D-356/i)
  assert.match(result.assumptions.join(' '), /không.*parasitic|parasitic.*không/i)
  assert.deepEqual(result.excludedRefs, [])
})

test('compares all connected KiCad schematic pins with PCB IPC-D-356 topology, independent of net labels', () => {
  const renamedBoardNets = pcbNetlist.replaceAll('VIN', '/BOARD_IN').replaceAll('OUT', '/BOARD_OUT').replaceAll('GND', '/BOARD_GND')
  const boardWithTestPoint = [...renamedBoardNets.split('\n').filter(line => !line.startsWith('999')), ipcPad('BOARD_OUT', 'TP1', 1), '999'].join('\n')
  const result = compareKicadIpcD356(boardWithTestPoint, netlist())

  assert.equal(result.ok, true)
  assert.equal(result.status, 'match')
  assert.equal(result.schematicConnectedPins, 6)
  assert.equal(result.comparedPins, 6)
  assert.equal(result.matchedPins, 6)
  assert.equal(result.netMismatchPins, 0)
  assert.deepEqual(result.missingBoardPinSamples, [])
  assert.deepEqual(result.boardOnlyReferences, ['TP1'])
})

test('reads IPC-D-356 317 plated-through-hole pad records as connected board pins', () => {
  const connectorSchematic = '<export version="E"><components><comp ref="J1"><value>Header</value></comp></components><nets><net code="1" name="SIGNAL"><node ref="J1" pin="1"/></net></nets></export>'
  const viaRecord = '317SIGNAL            VIA        MD0118PA00X+061350Y-044330X0236Y0000R000 S3'
  const connectorBoard = `C  IPC-D-356A generated by KiCad\n${ipcPad('SIGNAL', 'J1', 1).replace(/^327/, '317')}\n${viaRecord}\n999`
  const result = compareKicadIpcD356(connectorBoard, connectorSchematic)
  assert.equal(result.ok, true)
  assert.equal(result.status, 'match')
  assert.equal(result.comparedPins, 1)
  assert.deepEqual(getKicadIpcD356NetNames(connectorBoard), ['SIGNAL'])
})

test('reports schematic pins missing from the PCB export and electrical-net partition mismatches', () => {
  const missingPadBoard = pcbNetlist.replace(ipcPad('GND', 'R2', 2), '')
  const missing = compareKicadIpcD356(missingPadBoard, netlist())
  assert.equal(missing.ok, true)
  assert.equal(missing.status, 'mismatch')
  assert.equal(missing.missingBoardPins, 1)
  assert.deepEqual(missing.missingBoardPinSamples, ['R2:2'])

  const splitNetBoard = pcbNetlist.replace(ipcPad('OUT', 'R2', 1), ipcPad('A_DIFFERENT_NET', 'R2', 1))
  const split = compareKicadIpcD356(splitNetBoard, netlist())
  assert.equal(split.ok, true)
  assert.equal(split.status, 'mismatch')
  assert.ok(split.netMismatchPins > 0)
  assert.ok(split.netMismatchPinSamples.length > 0)
})

test('rejects a PCB export that assigns one designator pin to multiple nets during the full net audit', () => {
  const duplicatedPin = [...pcbNetlist.split('\n').filter(line => !line.startsWith('999')), ipcPad('OTHER', 'R1', 1), '999'].join('\n')
  const result = compareKicadIpcD356(duplicatedPin, netlist())
  assert.equal(result.ok, false)
  assert.match(result.issues.join(' '), /nhiều net|trùng/i)
})

test('ignores KiCad no-connect schematic markers but refuses one physical pin assigned to multiple connected nets', () => {
  const unsupported = '<comp ref="U1"><value>IC</value></comp>'
  const noConnectNodes = '<net code="4" name="NC_A"><node ref="U1" pin="18" pintype="no_connect"/></net><net code="5" name="NC_B"><node ref="U1" pin="18" pintype="power_in+no_connect"/></net>'
  const noConnect = compareKicadIpcD356(pcbNetlist, netlist(unsupported, noConnectNodes))
  assert.equal(noConnect.ok, true)
  assert.equal(noConnect.status, 'match')
  assert.equal(noConnect.missingBoardPins, 0)
  assert.equal(noConnect.pcbPadsOnSchematicNoConnect, 0)

  const noConnectPinInSchematic = netlist(unsupported, `${noConnectNodes}<net code="6" name="NC_UNUSED"><node ref="U1" pin="17" pintype="no_connect"/></net>`)
  const isolatedNoConnectBoard = [...pcbNetlist.split('\n').filter(line => !line.startsWith('999')), ipcPad('M0001', 'U1', 18), '999'].join('\n')
  const isolatedNoConnect = compareKicadIpcD356(isolatedNoConnectBoard, noConnectPinInSchematic)
  assert.equal(isolatedNoConnect.ok, true)
  assert.equal(isolatedNoConnect.status, 'match')
  assert.equal(isolatedNoConnect.pcbPadsOnSchematicNoConnect, 1)
  assert.equal(isolatedNoConnect.noConnectPadsSharingPcbNet, 0)

  const sharedNoConnectBoard = [...pcbNetlist.split('\n').filter(line => !line.startsWith('999')), ipcPad('VIN', 'U1', 18), '999'].join('\n')
  const sharedNoConnect = compareKicadIpcD356(sharedNoConnectBoard, noConnectPinInSchematic)
  assert.equal(sharedNoConnect.ok, true)
  assert.equal(sharedNoConnect.status, 'mismatch')
  assert.equal(sharedNoConnect.noConnectPadsSharingPcbNet, 1)

  const connectedConflict = '<net code="4" name="NET_A"><node ref="U1" pin="18"/></net><net code="5" name="NET_B"><node ref="U1" pin="18"/></net>'
  const conflict = compareKicadIpcD356(pcbNetlist, netlist(unsupported, connectedConflict))
  assert.equal(conflict.ok, false)
  assert.match(conflict.issues.join(' '), /U1:18|nhiều net schematic/i)
})

test('accepts KiCad IPC-D-356 root-path net labels such as /3.3V and /GND without changing connectivity', () => {
  const rootPathBoard = pcbNetlist.replaceAll('VIN', '/VIN').replaceAll('OUT', '/OUT').replaceAll('GND', '/GND')
  const result = compileKicadIpcD356(rootPathBoard, netlist())
  assert.equal(result.ok, true)
  assert.match(result.netlist, /V1 .* 0 DC 5/)
  assert.match(result.assumptions.join(' '), /IPC-D-356/i)
})

test('blocks PCB and schematic connectivity or pad-number disagreement instead of silently choosing one', () => {
  const changedConnectivity = pcbNetlist.replace(ipcPad('OUT', 'R1', 2), ipcPad('GND', 'R1', 2))
  const mismatch = compileKicadIpcD356(changedConnectivity, netlist())
  assert.equal(mismatch.ok, false)
  assert.match(mismatch.issues.join(' '), /không khớp|khác nhau/i)

  const missingPad = pcbNetlist.replace(ipcPad('OUT', 'R1', 2), '')
  const incomplete = compileKicadIpcD356(missingPad, netlist())
  assert.equal(incomplete.ok, false)
  assert.match(incomplete.issues.join(' '), /R1|chân|pad/i)
})

test('requires explicit exclusion of non-passive board parts and keeps the excluded boundary visible', () => {
  const source = netlist('<comp ref="U1"><value>MCU</value></comp>', '<net code="4" name="OUT"><node ref="U1" pin="1"/></net><net code="5" name="OTHER"><node ref="U1" pin="1"/></net>')
  const board = [...pcbNetlist.split('\n').filter(line => !line.startsWith('999')), ipcPad('OUT', 'U1', 1), ipcPad('OTHER', 'U1', 1), '999'].join('\n')
  const blocked = compileKicadIpcD356(board, source)
  assert.equal(blocked.ok, false)
  assert.match(blocked.issues.join(' '), /U1/)
  const imported = compileKicadIpcD356(board, source, ['U1'])
  assert.equal(imported.ok, true)
  assert.deepEqual(imported.excludedRefs, ['U1'])
  assert.match(imported.assumptions.join(' '), /loại trừ.*U1/i)
})

test('allows an explicitly declared bounded external DC test source when the CAD has no source component', () => {
  const noSourceXml = netlist()
    .replace('<comp ref="V1"><value>5V</value></comp>', '')
    .replaceAll('<node ref="V1" pin="1"/>', '')
    .replaceAll('<node ref="V1" pin="2"/>', '')
  const noSourceBoard = [
    'C  IPC-D-356A generated by KiCad',
    ipcPad('VIN', 'R1', 1), ipcPad('OUT', 'R1', 2), ipcPad('OUT', 'R2', 1), ipcPad('GND', 'R2', 2), '999',
  ].join('\n')
  const result = compileKicadIpcD356(noSourceBoard, noSourceXml, [], { positiveNet: 'VIN', referenceNet: 'GND', voltage: '3.3' })
  assert.equal(result.ok, true)
  assert.match(result.netlist, /VTEST N\d{3} 0 DC 3\.3/)
  assert.match(result.assumptions.join(' '), /nguồn thử ngoài|external/i)
  assert.equal(compileKicadIpcD356(noSourceBoard, noSourceXml, [], { positiveNet: 'VIN', referenceNet: 'GND', voltage: '1000' }).ok, false)
})
