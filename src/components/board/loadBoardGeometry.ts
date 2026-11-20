import optimizedBoardModels from '../../data/optimizedBoardModels.json'
import { parseBoardGlb, parseOptimizedBoardGlb } from './glbParser'

const optimizedByPath = new Map(optimizedBoardModels.map(model => [`/models/${model.original}`, model]))

async function getModel(url: string, signal?: AbortSignal) {
  const response = await fetch(url,{signal})
  if (!response.ok) throw new Error(`Không tải được mô hình PCB (${response.status}).`)
  return response.arrayBuffer()
}

/** Use the original documented GLB when network or the optional decoder fails. */
export async function loadBoardGeometry(source: string, signal?: AbortSignal) {
  const optimized = optimizedByPath.get(source.split(/[?#]/,1)[0])
  if (optimized) {
    try {
      const url = `/models/optimized/${optimized.optimized}?v=${optimized.optimizedSha256.slice(0,12)}`
      return await parseOptimizedBoardGlb(await getModel(url,signal))
    } catch { signal?.throwIfAborted() }
  }
  return parseBoardGlb(await getModel(source,signal))
}
