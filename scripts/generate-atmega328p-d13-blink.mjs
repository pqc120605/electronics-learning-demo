import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { assemble } = require('avr8js/dist/cjs/utils/assembler.js')
const assemblyPath = resolve(projectRoot, 'firmware/atmega328p-d13-blink.asm')
const outputPath = resolve(projectRoot, 'public/firmware/atmega328p-d13-blink.hex')
const source = readFileSync(assemblyPath, 'utf8')
const assembled = assemble(source)

if (assembled.errors.length) throw new Error(assembled.errors.join('\n'))
if (!assembled.bytes.length) throw new Error('Assembler returned an empty firmware image.')
if (assembled.bytes.length > 32 * 1024) throw new Error('Firmware exceeds ATmega328P 32 KB flash.')

function record(address, type, data) {
  const bytes = [data.length, (address >> 8) & 0xff, address & 0xff, type, ...data]
  const checksum = (-bytes.reduce((sum, byte) => sum + byte, 0)) & 0xff
  return `:${[...bytes, checksum].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

const records = []
for (let offset = 0; offset < assembled.bytes.length; offset += 16) {
  records.push(record(offset, 0x00, [...assembled.bytes.slice(offset, offset + 16)]))
}
records.push(record(0, 0x01, []))
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${records.join('\n')}\n`, 'utf8')
process.stdout.write(`Generated ${outputPath} (${assembled.bytes.length} bytes, ${assembled.lines.length} assembled lines).\n`)
