import config from '../../../docs/research/2026-11-27-avr-classic-electrical-firmware-a10-proposal.json'
import { inspectIntelHex } from '../intelHex'

const approval = 'ad4e9498355e8284f1e3d3beb4cb22970312a0d98424102f8d11702e30f4c1cd'
export const a10Revision = config.revision
export const a10Profiles = config.boards.map(board => ({
  ...board,
  runnerId: board.runnerId as 'arduino-nano' | 'arduino-mega-2560',
  revision: board.boardRevision,
  button: { ...board.pins.input, gpio: board.pins.input.arduino, pinId: board.pins.input.id },
  led: { ...board.pins.output, gpio: board.pins.output.arduino, pinId: board.pins.output.id },
  power: { ...board.pins.power, pinId: board.pins.power.id },
  ground: { ...board.pins.ground, pinId: board.pins.ground.id },
  readyLine: config.firmware.uart.bootMessagePrefix + ' ' + board.uartTargetMarker,
}))

export type A10Board = typeof a10Profiles[number]
export const getA10Board = (id: string) => a10Profiles.find(board => board.id === id || board.runnerId === id)
export const getA10Fixture = (id: string) => a10Profiles.find(board => board.fixtureId === id)

type Manifest = Partial<Record<'approval' | 'boardId' | 'revision' | 'fixtureId' | 'fixtureSha256' | 'runnerId' | 'mcu' | 'fqbn' | 'sourceSha256' | 'hexSha256', string>>
const sha256Pattern = /^[a-f0-9]{64}$/

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyA10Hex(board: A10Board, manifest: Manifest | null, hex: string, fixtureSha256: string) {
  if (manifest?.approval !== approval || manifest.boardId !== board.id || manifest.revision !== board.revision
      || manifest.fixtureId !== board.fixtureId || manifest.runnerId !== board.runnerId || manifest.mcu !== board.mcu
      || manifest.fqbn !== board.fqbn || !sha256Pattern.test(manifest.sourceSha256 ?? '') || !sha256Pattern.test(manifest.hexSha256 ?? '')) {
    throw new Error('Manifest HEX không khớp target A10 đã duyệt.')
  }
  if (!sha256Pattern.test(fixtureSha256) || manifest.fixtureSha256 !== fixtureSha256) {
    throw new Error('SHA-256 của mạch mẫu A10 không khớp manifest.')
  }
  if (hex.length > 2 * 1024 * 1024) throw new Error('HEX A10 vượt 2 MiB.')
  if (await sha256(hex) !== manifest.hexSha256) throw new Error('SHA-256 của HEX A10 không khớp manifest.')
  inspectIntelHex(hex, { maxBytes: board.flashBytes })
  return hex
}

export async function loadA10Hex(board: A10Board, fixtureJson: string, signal: AbortSignal) {
  const base = `/api/local-tools/a10-avr/${board.id}/`
  const response = await fetch(base + 'manifest.json', { signal })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Firmware A10 chưa được chuẩn bị trên máy này.')
  }
  const manifest = await response.json()
  const hexResponse = await fetch(base + 'firmware.hex', { signal })
  if (!hexResponse.ok || !hexResponse.headers.get('content-type')?.includes('text/plain')) {
    throw new Error('Chưa tải được tệp HEX A10.')
  }
  return verifyA10Hex(board, manifest, await hexResponse.text(), await sha256(fixtureJson))
}
