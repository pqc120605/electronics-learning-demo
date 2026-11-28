import { firmwareAssetBase } from './firmwareDelivery'
import { fetchA2C3Image } from './a2C3Image'

export const a2Assets = firmwareAssetBase('A2', '/api/local-tools/a2-c3/', 'default/')
const approvalSha256 = '452a965fe0028db65003a721abd6a9f253660501876949d2c1d8ede05c46b8a3'
export type A2Sample = { timeUs: number; inputHigh: boolean; outputHigh: boolean }
export type A2WorkerEvent = { type: 'uart'; text: string } | { type: 'sample'; sample: A2Sample } | { type: 'error'; message: string }
export type EspGpioTarget = { chip: 'esp32c3' | 'esp32c6' | 'esp32h2' | 'esp32s3'; inputPin: number; inputRegister: number; ledPin?: number; readyLine?: string }
export type A2WorkerMessage = { type: 'boot'; image: ArrayBuffer; pressed: boolean; target?: EspGpioTarget } | { type: 'input'; pressed: boolean }

export function isA2LocalHost(host: string) {
  return ['localhost', '127.0.0.1', '[::1]'].includes(host)
}

export async function loadA2Firmware(signal: AbortSignal) {
  const response = await fetch(a2Assets + 'manifest.json', { signal })
  if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
    throw new Error('Firmware và bộ mô phỏng A2 chưa được chuẩn bị trên máy này.')
  }
  const manifest = await response.json()
  if (manifest?.approvalSha256 !== approvalSha256 || manifest.target !== 'esp32c3' || !/^[a-f0-9]{64}$/.test(manifest.flash?.sha256 ?? '')) {
    throw new Error('Manifest ESP32-C3 không khớp cấu hình A2.')
  }
  return fetchA2C3Image(a2Assets + 'flash.bin', manifest.flash.sha256, signal)
}
