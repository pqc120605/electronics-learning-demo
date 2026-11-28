import { firmwareAssetBase } from './firmwareDelivery'
import { a5ApprovalSha256, a5FlashLayout, a5Target, type A5Board, type A5SdkBoard } from './a5PicoProfiles'

const flashBase = Number(a5FlashLayout.xipBase)
const vectorOffset = Number(a5FlashLayout.vectorBase) - flashBase

export type A5WorkerMessage = { type: 'input'; pressed: boolean } | {
  type: 'boot'; flash: ArrayBuffer; bootrom: ArrayBuffer; pressed: boolean; sdkBoard: A5SdkBoard
}

export function assertA5Flash(flash: Uint8Array) {
  if (flash.length !== a5FlashLayout.bytes) throw new Error('Dung lượng ảnh flash A5 phải đúng 2 MiB.')
  const boot2 = flash.subarray(0, a5FlashLayout.boot2Bytes)
  if (boot2.every(byte => byte === 0xff) || boot2.every(byte => byte === 0)) throw new Error('Ảnh A5 thiếu boot2.')
  const view = new DataView(flash.buffer, flash.byteOffset, flash.byteLength)
  const stack = view.getUint32(vectorOffset, true)
  const reset = view.getUint32(vectorOffset + 4, true)
  if (stack <= 0x20000000 || stack > 0x20042000 || stack % 8) throw new Error('Stack của ảnh A5 nằm ngoài SRAM RP2040.')
  if (!(reset & 1) || reset < flashBase + vectorOffset + 9 || reset >= flashBase + flash.length) {
    throw new Error('Ảnh A5 thiếu vector khởi động Thumb hợp lệ.')
  }
}

async function sha256(buffer: ArrayBuffer) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function loadA5Firmware(board: A5Board, signal: AbortSignal) {
  const base = firmwareAssetBase('A5', `/api/local-tools/a5-pico/${board.sdkBoard}/`, board.sdkBoard + '/')
  const response = await fetch(base + 'manifest.json', { signal })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Firmware A5 chưa được chuẩn bị trên máy này.')
  }
  const manifest = await response.json()
  if (manifest?.approvalSha256 !== a5ApprovalSha256 || manifest.boardId !== board.id || manifest.revision !== board.revision
    || manifest.sdkBoard !== board.sdkBoard || manifest.target !== a5Target.platform || manifest.flash?.bytes !== board.flashBytes
    || !/^[a-f0-9]{64}$/.test(manifest.flash?.sha256 ?? '')) {
    throw new Error('Manifest firmware không khớp cấu hình A5.')
  }
  const [flashResponse, romResponse] = await Promise.all([
    fetch(base + 'flash.bin', { signal }),
    fetch(base + 'bootrom.bin', { signal }),
  ])
  if (!flashResponse.ok) throw new Error('Chưa tải được ảnh flash A5.')
  if (!romResponse.ok) throw new Error('Chưa tải được boot ROM RP2040 B2.')
  const [flash, bootrom] = await Promise.all([flashResponse.arrayBuffer(), romResponse.arrayBuffer()])
  assertA5Flash(new Uint8Array(flash))
  if (await sha256(flash) !== manifest.flash.sha256) throw new Error('SHA-256 firmware A5 không khớp.')
  if (bootrom.byteLength !== a5Target.bootrom.bytes || await sha256(bootrom) !== a5Target.bootrom.sha256) {
    throw new Error('Boot ROM RP2040 B2 không khớp cấu hình A5.')
  }
  return { flash, bootrom }
}
