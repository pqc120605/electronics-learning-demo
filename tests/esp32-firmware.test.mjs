import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server, firmware, serial
before(async () => {
  server = await createServer({ logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  ;[firmware, serial] = await Promise.all(['/src/lib/esp32Firmware.ts','/src/lib/esp32WebSerial.ts'].map(path => server.ssrLoadModule(path)))
})
after(async () => { await server?.close() })

const code = 'void setup() {}\nvoid loop() {}\n'
const target = {board:'esp32-devkit',lesson:'blink'}
const bytes = new TextEncoder().encode('mock only')

async function fixture() {
  const fileSha = await firmware.firmwareSha256(bytes)
  const images = Object.entries({bootloader:0x1000,partitions:0x8000,boot_app0:0xe000,app:0x10000})
    .map(([kind, offset]) => ({kind,offset,bytes:bytes.length,sha256:fileSha}))
  const manifest = {...target,version:1,fqbn:'esp32:esp32:esp32',coreVersion:'4.0.0',sketchSha256:await firmware.firmwareSha256(new TextEncoder().encode(code)),serialBaud:115200,flashBytes:4*1024*1024,images}
  const raw = new TextEncoder().encode(JSON.stringify(manifest))
  return { manifest, raw, pin:{...target,manifestSha256:await firmware.firmwareSha256(raw)} }
}

test('only a pinned manifest, exact sketch, fixed offsets and exact images pass preflight', async () => {
  const {manifest,raw,pin} = await fixture()
  const source = (url) => Promise.resolve(new Response(url.endsWith('manifest.json') ? raw : bytes))
  const loaded = await firmware.loadPinnedFirmware(pin,code,{fetcher:source})
  assert.equal(loaded.files.length,4)
  assert.equal(loaded.files.at(-1).address,0x10000)
  await assert.rejects(firmware.loadPinnedFirmware(pin,`${code} `,{fetcher:source}),/Code đang mở/)
  await assert.rejects(firmware.loadPinnedFirmware({...pin,manifestSha256:'0'.repeat(64)},code,{fetcher:source}),/SHA-256 của manifest/)
  await assert.rejects(firmware.loadPinnedFirmware(pin,code,{fetcher:async url=>new Response(url.endsWith('manifest.json')?raw:new Uint8Array(bytes.length))}),/SHA-256/)
  for (const invalid of [{...manifest,board:'esp32-s3-devkitc-1'}, {...manifest,images:manifest.images.map(image=>({...image,offset:1}))}]) {
    assert.throws(()=>firmware.parseFirmwareManifest(invalid,pin),/không hợp lệ|không khớp/)
  }
})

test('a mocked device never writes on a chip mismatch, a bad image or aborted handshake', async () => {
  const {manifest,raw,pin} = await fixture()
  const loaded = await firmware.loadPinnedFirmware(pin,code,{fetcher:async url=>new Response(url.endsWith('manifest.json')?raw:bytes)})
  const calls = []
  const driver = { connect: async()=>{calls.push('connect');return {chip:'ESP32',flashBytes:manifest.flashBytes}},
    write:async (images,progress)=>{assert.equal(images.length,4);calls.push('write');progress(90)},
    reset:async()=>{calls.push('reset')},disconnect:async()=>{calls.push('disconnect')} }
  await assert.rejects(serial.flashVerifiedEsp32(loaded,{...driver,connect:async()=>({chip:'ESP32-C3',flashBytes:manifest.flashBytes})},()=>{}),/Chip đang cắm/)
  assert.deepEqual(calls.splice(0),['disconnect'])
  const abort = new AbortController()
  await assert.rejects(serial.flashVerifiedEsp32(loaded,{...driver,connect:async()=>{abort.abort();return driver.connect()}},()=>{},abort.signal),/abort/i)
  assert.deepEqual(calls.splice(0),['connect','disconnect'])
  const progress = []
  await serial.flashVerifiedEsp32(loaded,driver,value=>progress.push(value))
  assert.deepEqual(calls.splice(0),['connect','write','reset','disconnect'])
  assert.deepEqual(progress,[90,100])
  loaded.files[0].data[0] ^= 1
  await assert.rejects(serial.flashVerifiedEsp32(loaded,driver,()=>{}),/thay đổi/)
  assert.deepEqual(calls,[])
})
