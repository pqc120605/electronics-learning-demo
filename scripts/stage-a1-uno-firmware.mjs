import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { compileArduinoSketch, DEFAULT_ARDUINO_CLI } from './arduino-compile-service.mjs'
import { a1Approval, a1Sha256, loadApprovedA1 } from './approved-a1-inputs.mjs'

const approved = await loadApprovedA1()
const cli = process.argv[2] ?? DEFAULT_ARDUINO_CLI
const template = await readFile('firmware/uno-peripherals-a1/peripherals.ino', 'utf8')
const output = 'public/firmware/uno-peripherals-a1/'
const dataFile = 'src/data/a1-uno-firmware.json'
const tool = execFileSync(cli, ['version'], { encoding: 'utf8' }).trim()
const cores = JSON.parse(execFileSync(cli, ['core', 'list', '--format', 'json'], { encoding: 'utf8' })).platforms
const core = cores?.find(item => item.id === 'arduino:avr')
if (!core?.installed_version) throw new Error('Arduino AVR core version is unavailable')
const compiler = {
  cli: tool, sha256: a1Sha256(await readFile(cli)), core: 'arduino:avr', coreVersion: core.installed_version,
  fqbn: approved.firmware.fqbn,
}

const pin = label => {
  if (!/^D\d+$/.test(label)) throw new Error('Unrecognized approved Arduino digital pin: ' + label)
  return Number(label.slice(1))
}
const list = (names, pins) => '{' + names.map(name => pin(pins[name])).join(',') + '}'
const modes = { dht11: 11, 'dht22-bare': 22, 'keypad-4x4': 40, 'seven-segment-anode': 70 }
const payloads = []
for (const fixture of approved.fixtures) {
  const mode = modes[fixture.id]
  const definitions = ['#define MODE ' + mode]
  if (fixture.reading) {
    definitions.push('#define DATA_PIN ' + pin(fixture.pins.data), '#define INTERVAL_MS ' + fixture.reading.intervalMs)
  } else if (mode === 40) {
    definitions.push('#define ROW_PINS ' + list(['r1','r2','r3','r4'], fixture.pins),
      '#define COLUMN_PINS ' + list(['c1','c2','c3','c4'], fixture.pins))
  } else {
    definitions.push('#define SEGMENT_PINS ' + list(['a','b','c','d','e','f','g','dp'], fixture.pins))
  }
  const source = definitions.join('\n') + '\n' + template
  const result = await compileArduinoSketch({ source, fqbn: compiler.fqbn, cliPath: cli })
  if (!result.ok) throw new Error(fixture.id + ': ' + result.log)
  payloads.push({ id: fixture.id, source, hex: result.hex, log: result.log })
  console.log('Compiled ' + fixture.id)
}

await mkdir(output, { recursive: true })
const fixtures = {}
for (const { id, source, hex, log } of payloads) {
  const file = '/firmware/uno-peripherals-a1/' + id
  await writeFile(output + id + '.hex', hex)
  await writeFile(output + id + '.ino', source)
  fixtures[id] = { file: file + '.hex', source: file + '.ino', sha256: a1Sha256(hex), sourceSha256: a1Sha256(source), bytes: Buffer.byteLength(hex), log }
}
await writeFile(dataFile, JSON.stringify({ approval: a1Approval, boardId: approved.firmware.boardId, compiler, fixtures }, null, 2) + '\n')
