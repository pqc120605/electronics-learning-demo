import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let validation
let pageSource

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  validation = await server.ssrLoadModule('/src/lib/calculatorValidation.ts')
  pageSource = await readFile('src/pages/ElectronicsCalculatorsPage.tsx', 'utf8')
})

after(async () => { await server?.close() })

test('calculator field validation returns a specific accessible error for the invalid input', () => {
  assert.deepEqual(validation.getLedFieldErrors({ supply: '1.5', vf: '2', current: '10' }), { vf: 'V nguồn phải lớn hơn Vf LED để có thể giới hạn dòng bằng điện trở.' })
  assert.deepEqual(validation.getAdcFieldErrors({ input: '3', maximum: '3.3', lower: '10' }), { maximum: 'V ADC phải nhỏ hơn Vin để tính bộ chia áp hạ áp.' })
  assert.deepEqual(validation.getI2cFieldErrors({ supply: '3.3', capacitance: '0', speed: 'fast' }), { capacitance: 'Điện dung bus phải là số dương.' })
  assert.deepEqual(validation.getRcFieldErrors({ resistance: '', capacitance: '-1' }), {
    resistance: 'R phải là số dương.',
    capacitance: 'C phải là số dương.',
  })
})

test('calculator fields connect validation errors and live results to assistive technology', () => {
  assert.match(pageSource, /aria-invalid=\{error \? true : undefined\}/)
  assert.match(pageSource, /aria-describedby=\{error \? `\$\{id\}-error` : undefined\}/)
  assert.match(pageSource, /id=\{`\$\{id\}-error`\}/)
  assert.match(pageSource, /className="electronics-result" aria-live="polite" aria-atomic="true"/)
})
