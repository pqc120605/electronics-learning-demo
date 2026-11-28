import { createReadStream, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { isLocalRequest } from './arduino-compile-service.mjs'

const prefix = '/api/local-tools/a2-c3/'
const profiles = [
  { prefix: '/api/local-tools/a6-pico/', directory: 'a6-local-assets',
    path: /^(raspberry-pi-pico-2(?:-h)?|engine)\/(manifest\.json|firmware\.elf|picoemu\.wasm\.(?:js|wasm)|LICENSE)$/,
    allowed: ([, profile, file]) => profile === 'engine' ? !['manifest.json', 'firmware.elf'].includes(file) : ['manifest.json', 'firmware.elf'].includes(file) },
  { prefix: '/api/local-tools/a3-esp/', directory: 'a3-local-assets', path: /^(esp32c3|esp32c6|esp32h2)\/(manifest\.json|flash\.bin)$/ },
  { prefix: '/api/local-tools/a4-esp/', directory: 'a4-local-assets', path: /^(4m|8m|16m)\/(manifest\.json|flash\.bin)$/ },
  { prefix: '/api/local-tools/a5-pico/', directory: 'a5-local-assets', path: /^(pico|pico_w)\/(manifest\.json|flash\.bin|bootrom\.bin)$/ },
  { prefix: '/api/local-tools/a10-avr/', directory: 'a10-local-assets', path: /^(arduino-nano-classic|arduino-mega-2560-r3)\/(manifest\.json|firmware\.hex)$/ },
  { prefix: '/api/local-tools/a11-esp/', directory: 'a11-local-assets',
    path: /^(image|engine)\/(manifest\.json|flash\.bin|esp_emu\.js|esp_emu_bg\.wasm|cosim\.js|LICENSE)$/,
    allowed: ([, group, file]) => (group === 'image') === (file === 'manifest.json' || file === 'flash.bin') },
]
const profileTypes = { 'firmware.elf': 'application/octet-stream', 'picoemu.wasm.js': 'text/javascript', 'picoemu.wasm.wasm': 'application/wasm',
  LICENSE: 'text/plain; charset=utf-8', 'firmware.hex': 'text/plain; charset=utf-8' }
const types = Object.freeze({
  'manifest.json': 'application/json', 'flash.bin': 'application/octet-stream', 'bootrom.bin': 'application/octet-stream',
  'esp_emu.js': 'text/javascript', 'esp_emu_bg.wasm': 'application/wasm', 'cosim.js': 'text/javascript',
})

export function createA2LocalAssets(root) {
  return (req, res, next) => {
    const pathname = String(req.url).split('?')[0]
    const legacy = pathname.startsWith(prefix)
    const route = profiles.find(item => pathname.startsWith(item.prefix))
    if (!legacy && !route) return next()
    const profile = route?.path.exec(pathname.slice(route.prefix.length))
    const file = legacy ? pathname.slice(prefix.length) : profile?.[2]
    const contentType = file && (legacy ? types[file] : types[file] ?? profileTypes[file])
    const asset = contentType && (legacy
      ? Object.hasOwn(types, file) && file !== 'bootrom.bin' && join(root, '.tmp', 'a2-local-assets', file)
      : (!route.allowed || route.allowed(profile)) && join(root, '.tmp', route.directory, profile[1], file))
    if (req.method !== 'GET' || !isLocalRequest(req) || !asset || !existsSync(asset)) {
      res.statusCode = 404
      return res.end()
    }
    let transfer = asset
    if (profile && file === 'flash.bin' && existsSync(asset + '.gz')) {
      res.setHeader('Vary', 'Accept-Encoding')
      const gzip = String(req.headers['accept-encoding'] ?? '').split(',').some(value => {
        const [encoding, ...parameters] = value.toLowerCase().split(';').map(item => item.trim())
        return encoding === 'gzip' && !parameters.some(item => /^q\s*=\s*0(?:\.0*)?$/.test(item))
      })
      if (gzip) {
        transfer += '.gz'
        res.setHeader('Content-Encoding', 'gzip')
      }
    }
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', statSync(transfer).size)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'no-store')
    createReadStream(transfer).on('error', () => res.destroy()).pipe(res)
  }
}
