import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server
let presentCircuitGateReport
let CircuitGatePanel

before(async () => {
  server = await createServer({
    configFile: 'vite.config.ts',
    logLevel: 'silent',
    server: { middlewareMode: true },
  })
  ;({ presentCircuitGateReport } = await server.ssrLoadModule('/src/lib/circuitGatePresentation.ts'))
  ;({ CircuitGatePanel } = await server.ssrLoadModule('/src/components/lesson/CircuitGatePanel.tsx'))
})

after(async () => { await server?.close() })

const ids = ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10']

test('presents all ten gates in beginner language and counts non-applicable separately', () => {
  const statuses = ['pass','pass','pass','pass','pass','pass','pass','warning','not_applicable','fail']
  const report = presentCircuitGateReport({
    lessonId: 'button-led',
    gates: ids.map((id, index) => ({
      id,
      status: statuses[index],
      diagnostics: index === 7 ? ['Hình học tham chiếu chưa được đo.'] : index === 9 ? ['Lệch chân tại led-1:anode.'] : [],
    })),
  })

  assert.equal(report.gates.length, 10)
  assert.deepEqual(report.summary, {
    applicable: 9,
    passed: 7,
    failed: 1,
    warnings: 1,
    notApplicable: 1,
    overall: 'fail',
  })
  assert.equal(report.gates[0].title, 'Cấu trúc mạch')
  assert.equal(report.gates[9].title, 'Khớp vị trí chân giữa 2D và 3D')
  assert.equal(report.gates[7].statusLabel, 'Cần lưu ý')
  assert.equal(report.gates[8].statusLabel, 'Không áp dụng')
  assert.deepEqual(report.gates[7].diagnostics, ['Hình học tham chiếu chưa được đo.'])
  assert.equal(report.gates[9].diagnostics[0], 'Lệch chân tại led-1:anode.')
})

test('does not describe warnings or educational checks as electrical measurements', () => {
  const report = presentCircuitGateReport({
    lessonId: 'blink',
    gates: ids.map(id => ({ id, status: id === 'G2' ? 'warning' : id === 'G9' ? 'not_applicable' : 'pass', diagnostics: [] })),
  })

  assert.match(report.scopeNote, /không phải phép đo điện/i)
  assert.match(report.gates.find(gate => gate.id === 'G2').emptyNote, /chưa được xác thực/i)
  assert.match(report.gates.find(gate => gate.id === 'G9').emptyNote, /không có phân tích analog/i)
})

test('renders an accessible, honest circuit-check panel with actionable open findings', () => {
  const report = {
    lessonId: 'button-led',
    gates: ids.map(id => ({
      id,
      status: id === 'G2' ? 'warning' : id === 'G9' ? 'not_applicable' : 'pass',
      diagnostics: id === 'G2' ? ['Hình học board chưa được xác thực.'] : [],
    })),
  }
  const markup = renderToStaticMarkup(React.createElement(CircuitGatePanel, { report }))

  assert.match(markup, /aria-labelledby="circuit-gate-title"/)
  assert.match(markup, /aria-live="polite"/)
  assert.match(markup, /8 nhóm đạt · 0 lỗi · 1 lưu ý · 1 không áp dụng/)
  assert.match(markup, /Hình học board chưa được xác thực/)
  assert.match(markup, /<details open="">.*Linh kiện và hình học tham chiếu/s)
  assert.match(markup, /không phải phép đo điện/i)
})
