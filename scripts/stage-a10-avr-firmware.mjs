import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { a10Approval, a10Hash, readA10Proposal, verifyA10Toolchain } from './a10-avr-assets.mjs'
import { compileArduinoSketch, DEFAULT_ARDUINO_CLI } from './arduino-compile-service.mjs'

const proposal = await readA10Proposal()
const data = process.env.ARDUINO_DIRECTORIES_DATA
if (!data) throw new Error('Set ARDUINO_DIRECTORIES_DATA to the existing Arduino15 directory.')
await verifyA10Toolchain(proposal.firmware, DEFAULT_ARDUINO_CLI, data)

const app = await createServer({ configFile: false, envFile: false, logLevel: 'silent',
  optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, watch: null } })
const fixtureHashes = new Map()
try {
  const { buildA10Fixture } = await app.ssrLoadModule('/src/lib/freestyle/a10AvrFixture.ts')
  for (const board of proposal.boards) {
    const fixture = buildA10Fixture(board.fixtureId)
    if (!fixture || fixture.boardId !== board.runnerId) throw new Error(`A10 fixture mismatch: ${board.fixtureId}`)
    fixtureHashes.set(board.fixtureId, a10Hash(JSON.stringify(fixture)))
  }
} finally {
  await app.close()
}

const template = await readFile('firmware/avr-classic-a10/button_led.ino', 'utf8')
const built = []
for (const board of proposal.boards) {
  const { firmware } = proposal
  const source = [
    `#if !defined(__AVR_${board.mcu}__) || F_CPU != ${firmware.clockHz}UL`,
    '#error A10 compiler target or clock mismatch', '#endif',
    `#define A10_INPUT ${board.pins.input.arduino}`,
    `#define A10_LED ${board.pins.output.arduino}`,
    `#define A10_TARGET "${board.uartTargetMarker}"`,
    `#define A10_BAUD ${firmware.uart.baud}`,
    `#define A10_SAMPLE_MS ${firmware.samplePeriodMs}`,
    `#define A10_DEBOUNCE_MS ${firmware.debounceMs}`,
    template,
  ].join('\n')
  const result = await compileArduinoSketch({ source, fqbn: board.fqbn })
  if (!result.ok) throw new Error(`A10 ${board.fqbn}: ${result.log}`)
  built.push({ board, source, hex: result.hex })
}

for (const { board, source, hex } of built) {
  const directory = resolve('.tmp/a10-local-assets', board.id)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'button_led.ino'), source)
  await writeFile(resolve(directory, 'firmware.hex'), hex)
  const manifest = {
    approval: a10Approval,
    boardId: board.id,
    revision: board.boardRevision,
    fixtureId: board.fixtureId,
    fixtureSha256: fixtureHashes.get(board.fixtureId),
    runnerId: board.runnerId,
    mcu: board.mcu,
    fqbn: board.fqbn,
    sourceSha256: a10Hash(source),
    hexSha256: a10Hash(hex),
  }
  await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  console.log(`${board.sku} ${manifest.hexSha256}`)
}
