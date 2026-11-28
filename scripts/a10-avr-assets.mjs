import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { ARDUINO_FQBN } from './arduino-compile-service.mjs'

const approval = 'ad4e9498355e8284f1e3d3beb4cb22970312a0d98424102f8d11702e30f4c1cd'
const proposalPath = 'docs/research/2026-11-27-avr-classic-electrical-firmware-a10-proposal.json'
export const a10Hash = bytes => createHash('sha256').update(bytes).digest('hex')

async function checked(path, expected) {
  const bytes = await readFile(path)
  if (a10Hash(bytes) !== expected) throw new Error(`A10 SHA-256 mismatch: ${path}`)
  return bytes
}

export async function readA10Proposal(root = process.cwd()) {
  const proposal = JSON.parse(await checked(resolve(root, proposalPath), approval))
  const pads = JSON.parse(await checked(resolve(root, proposal.headerSource.path), proposal.headerSource.sha256))
  await checked(resolve(root, proposal.electrical.engine.path), proposal.electrical.engine.sha256)
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8')).packages['node_modules/avr8js']
  if (lock.version !== '0.21.1' || lock.integrity !== proposal.firmware.engineIntegrity) throw new Error('A10 avr8js lock mismatch')
  for (const board of proposal.boards) {
    if (ARDUINO_FQBN[board.runnerId] !== board.fqbn || pads[board.id].length !== board.padCount) {
      throw new Error(`A10 board mismatch: ${board.id}`)
    }
    for (const pin of Object.values(board.pins)) {
      const actual = pads[board.id].find(candidate => candidate.id === pin.id)
      if (!actual || `${actual.headerReference}.${actual.padNumber}` !== pin.pad || actual.label !== pin.label.replace(/\/TX0?$/, '')) {
        throw new Error(`A10 pad mismatch: ${board.id} ${pin.pad}`)
      }
    }
    for (const { path, sha256 } of board.assets) await checked(resolve(root, path), sha256)
  }
  return proposal
}

export function verifyA10Toolchain(firmware, cli, dataDirectory) {
  const packages = resolve(dataDirectory, 'packages/arduino')
  const core = resolve(packages, 'hardware/avr', firmware.arduinoCore.version)
  return Promise.all([
    checked(cli, firmware.arduinoCli.sha256),
    checked(resolve(core, 'boards.txt'), firmware.arduinoCore.boardsTxtSha256),
    checked(resolve(core, 'platform.txt'), firmware.arduinoCore.platformTxtSha256),
    checked(resolve(core, 'variants/eightanaloginputs/pins_arduino.h'), firmware.arduinoCore.nanoVariantSha256),
    checked(resolve(core, 'variants/mega/pins_arduino.h'), firmware.arduinoCore.megaVariantSha256),
    checked(resolve(packages, 'tools/avr-gcc', firmware.avrGccToolPackage, 'bin/avr-g++.exe'), firmware.avrGppSha256),
  ])
}

export const a10Approval = approval
