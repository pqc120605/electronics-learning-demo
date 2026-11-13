import { assertSpiceResultPointBudget, inspectSpiceNetlist, normalizeSpiceNetlistForEngine } from './spiceNetlist'

type SpiceWorkerRequest = { type: 'run'; runId: string; netlist: string }
type SpiceSeries = { name: string; type: string; values: number[] }
type SpiceResultColumn = {
  name: string
  type: string
  values: Array<number | { real: number; img: number }>
}
type SpiceEngineResult = {
  data: SpiceResultColumn[]
  numPoints: number
  dataType: 'real' | 'complex'
}
type SpiceWorkerResponse =
  | { type: 'progress'; runId: string; stage: 'loading' | 'initializing' | 'solving'; message: string }
  | { type: 'result'; runId: string; analysis: string; dataType: 'real' | 'complex'; numPoints: number; displayedPoints: number; series: SpiceSeries[]; warnings: string[] }
  | { type: 'error'; runId: string; message: string }

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<SpiceWorkerRequest>) => void) | null
  postMessage: (message: SpiceWorkerResponse) => void
}

const MAX_DISPLAY_POINTS = 2_000

function asMagnitude(value: number | { real: number; img: number }): number {
  return typeof value === 'number' ? value : Math.hypot(value.real, value.img)
}

scope.onmessage = async (event) => {
  if (event.data.type !== 'run') return
  const { runId } = event.data
  try {
    const inspection = inspectSpiceNetlist(event.data.netlist)
    if (inspection.errors.length) throw new Error(inspection.errors.join(' '))

    const engineUrl = new URL('/vendor/eecircuit-engine/eecircuit-engine.mjs', globalThis.location.origin).href
    scope.postMessage({ type: 'progress', runId, stage: 'loading', message: 'Đang tải engine SPICE vào worker…' })
    const { Simulation } = await import(/* @vite-ignore */ engineUrl)
    const simulation = new Simulation()
    scope.postMessage({ type: 'progress', runId, stage: 'initializing', message: 'Đang khởi tạo ngspice WASM…' })
    await simulation.start()
    simulation.setNetList(normalizeSpiceNetlistForEngine(event.data.netlist))
    scope.postMessage({ type: 'progress', runId, stage: 'solving', message: 'Đang giải mạch và thu kết quả…' })
    const result = await simulation.runSim() as SpiceEngineResult
    assertSpiceResultPointBudget(result.numPoints)
    if (!result.data.length || !result.numPoints) {
      const detail = simulation.getError().filter(Boolean).slice(-3).join(' ')
      throw new Error(detail || 'Ngspice không tạo được kết quả. Kiểm tra điểm nối, model và phép phân tích.')
    }

    const stride = Math.max(1, Math.ceil(result.numPoints / MAX_DISPLAY_POINTS))
    const series = result.data.map((column) => ({
      name: column.name,
      type: column.type,
      values: column.values.filter((_, index) => index % stride === 0).map(asMagnitude),
    }))
    const warnings = simulation.getError().filter(Boolean).slice(-5)
    scope.postMessage({
      type: 'result',
      runId,
      analysis: inspection.analysis ?? 'unknown',
      dataType: result.dataType,
      numPoints: result.numPoints,
      displayedPoints: series[0]?.values.length ?? 0,
      series,
      warnings,
    })
  } catch (error) {
    scope.postMessage({ type: 'error', runId, message: error instanceof Error ? error.message : 'Không chạy được mô phỏng SPICE.' })
  }
}
