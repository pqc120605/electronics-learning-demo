import { parseBoardGlb, type GpuBatch, type NodeBounds } from '../board/glbParser'
import { compileShader, cross, dot, makeCamera, multiply, normalize, perspective, rayTriangle, subtract, viewMatrix, type Vec3 } from '../board/sceneMath'
import { BENCH_MM, footprintBox, localToWorld, placementMatrix, type AssemblyPlacement, type AssemblyPlan, type Bounds } from '../../lib/assemblyLayout'

export type AssetStatus = { loading: number; failedUrls: string[] }
export type SceneWireStyle = { color: Vec3; stripes: boolean; direction: -1 | 0 | 1; selected?: boolean }
export type ScenePick = { partId: string; nodeName: string }
export type ScreenPoint = { x: number; y: number; visible: boolean }

type Asset = { batches: Array<GpuBatch & { buffers: WebGLBuffer[] }>; min: Vec3; max: Vec3; nodes: NodeBounds[] }
type Instance = { placement: AssemblyPlacement; asset: Asset; model: number[] }
type WireMesh = { id: string; buffers: WebGLBuffer[]; indexCount: number; middle: Vec3; lengthMm: number }

const FOV = Math.PI / 3.8
const DEFAULT_VIEW = { azimuth: 0.55, elevation: 0.82 }
// Slightly fuller than a physical wire so the jumper route remains legible at lesson scale.
const WIRE_RADIUS = 0.0009
const LOAD_TIMEOUT_MS = 30000
const FALLBACK_COLOR: [number, number, number] = [0.44, 0.47, 0.5]

const vertexShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in float aProgress;
uniform mat4 uViewProjection;
uniform mat4 uModel;
out vec3 vNormal;
out float vProgress;
void main() { gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0); vNormal = mat3(uModel) * aNormal; vProgress = aProgress; }
`
const fragmentShader = `#version 300 es
precision highp float;
in vec3 vNormal;
in float vProgress;
uniform vec3 uColor;
uniform float uEmphasis;
uniform float uGlow;
uniform float uStripes;
uniform float uPhase;
out vec4 outColor;
void main() {
  vec3 n = normalize(vNormal);
  float light = 0.56 + 0.44 * max(dot(n, normalize(vec3(-0.42, 0.72, 0.52))), 0.0);
  vec3 color = mix(uColor, vec3(0.18, 0.82, 0.76), uEmphasis * 0.6);
  if (uStripes > 0.0) color = mix(color, vec3(0.97, 0.98, 0.94), step(0.5, fract(vProgress * uStripes - uPhase)) * 0.82);
  outColor = vec4(color * light * (1.0 + uGlow) + uColor * uGlow * 0.5 + vec3(0.018, 0.026, 0.028), 1.0);
}
`

function identityMatrix() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] }

function transformPoint(m: number[], p: Vec3): Vec3 {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]
}

function boxData({ min, max }: Bounds) {
  const [x0, y0, z0] = min.map((value) => value / 1000), [x1, y1, z1] = max.map((value) => value / 1000)
  const faces: Array<[Vec3, Vec3, Vec3, Vec3, Vec3]> = [
    [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0]],
    [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]], [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]],
    [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
  ]
  const positions: number[] = [], normals: number[] = [], indices: number[] = []
  faces.forEach(([a, b, c, d, n], face) => { positions.push(...a, ...b, ...c, ...d); normals.push(...n, ...n, ...n, ...n); const base = face * 4; indices.push(base, base + 1, base + 2, base, base + 2, base + 3) })
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), indices: new Uint32Array(indices) }
}

/** A quadratic arc lifted off the bench, as a thin tube with a distance value for the stripes. */
function buildTube(a: Vec3, b: Vec3) {
  const rings = 22, sides = 6, gap = Math.hypot(b[0] - a[0], b[2] - a[2])
  const rise = Math.min(0.045, 0.002 + gap * 0.22)
  const control: Vec3 = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + rise * 2, (a[2] + b[2]) / 2]
  const at = (t: number): Vec3 => [0, 1, 2].map((axis) => (1 - t) ** 2 * a[axis] + 2 * (1 - t) * t * control[axis] + t ** 2 * b[axis]) as Vec3
  const positions: number[] = [], normals: number[] = [], progress: number[] = [], indices: number[] = []
  let length = 0, previous = at(0)
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings, center = at(t)
    length += Math.hypot(...subtract(center, previous))
    previous = center
    const tangent = normalize(subtract(at(Math.min(1, t + 0.01)), at(Math.max(0, t - 0.01))))
    const side = normalize(cross(tangent, Math.abs(tangent[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0])), lift = cross(side, tangent)
    for (let step = 0; step < sides; step += 1) {
      const angle = step / sides * Math.PI * 2, cos = Math.cos(angle), sin = Math.sin(angle)
      const normal: Vec3 = [side[0] * cos + lift[0] * sin, side[1] * cos + lift[1] * sin, side[2] * cos + lift[2] * sin]
      positions.push(center[0] + normal[0] * WIRE_RADIUS, center[1] + normal[1] * WIRE_RADIUS, center[2] + normal[2] * WIRE_RADIUS)
      normals.push(...normal)
      progress.push(t)
    }
  }
  for (let ring = 0; ring < rings; ring += 1) for (let step = 0; step < sides; step += 1) {
    const a0 = ring * sides + step, a1 = ring * sides + (step + 1) % sides, b0 = a0 + sides, b1 = a1 + sides
    indices.push(a0, b0, b1, a0, b1, a1)
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), progress: new Float32Array(progress), indices: new Uint16Array(indices), middle: at(0.5), lengthMm: length * 1000 }
}

/** Multi-model bench scene: one GLB per placed part, tube wires, picking and screen projection. */
export class AssemblyScene {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private canvas: HTMLCanvasElement
  private assets = new Map<string, Asset>()
  private loading = new Map<string, AbortController>()
  private failedUrls = new Set<string>()
  private plan: AssemblyPlan | null = null
  private boxes = new Map<string, Asset>()
  private ownedBuffers = new Set<WebGLBuffer>()
  private bench: Asset
  private instances: Instance[] = []
  private wireMeshes: WireMesh[] = []
  private wireStyles = new Map<string, SceneWireStyle>()
  private selectedPart = ''
  private selectedNodes = new Set<string>()
  private activeParts = new Set<string>()
  private litParts = new Set<string>()
  private azimuth = DEFAULT_VIEW.azimuth
  private elevation = DEFAULT_VIEW.elevation
  private distance = 0.3
  private fitDistance = 0.3
  private width = 1
  private height = 1
  private phase = 0
  private frame = 0
  private lastTime = 0
  private disposed = false
  private target: Vec3 = [0, 0.006, 0]
  private radius = 0.17
  private frameKey = ''
  onViewChange: () => void = () => {}
  onAssets: (status: AssetStatus) => void = () => {}

  static create(canvas: HTMLCanvasElement): AssemblyScene {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
    if (!gl) throw new Error('Trình duyệt này chưa hỗ trợ WebGL 2.')
    return new AssemblyScene(canvas, gl)
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl
    const program = gl.createProgram()
    if (!program) throw new Error('Không tạo được chương trình WebGL.')
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader), fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Không liên kết được shader.')
    this.program = program
    gl.enable(gl.DEPTH_TEST)
    this.bench = this.boxAsset({ min: [-BENCH_MM.width / 2, -2, -BENCH_MM.depth / 2], max: [BENCH_MM.width / 2, 0, BENCH_MM.depth / 2] }, [0.72, 0.66, 0.53])
  }

  private buffer(target: number, data: ArrayBufferView) {
    const gl = this.gl, buffer = gl.createBuffer()
    if (!buffer) throw new Error('Không cấp phát được bộ nhớ WebGL.')
    gl.bindBuffer(target, buffer)
    gl.bufferData(target, data, gl.STATIC_DRAW)
    this.ownedBuffers.add(buffer)
    return buffer
  }

  private fallbackBox(bounds: Bounds): Asset {
    const key = [...bounds.min, ...bounds.max].join('x')
    const cached = this.boxes.get(key)
    if (cached) return cached
    const box = this.boxAsset(bounds, FALLBACK_COLOR)
    this.boxes.set(key, box)
    return box
  }

  private boxAsset(bounds: Bounds, color: [number, number, number]): Asset {
    const { positions, normals, indices } = boxData(bounds), gl = this.gl
    const batch = { nodeName: 'fallback', materialIndex: -1, color, positions, normals, indices, buffers: [this.buffer(gl.ARRAY_BUFFER, positions), this.buffer(gl.ARRAY_BUFFER, normals), this.buffer(gl.ELEMENT_ARRAY_BUFFER, indices)] } as Asset['batches'][number]
    return { batches: [batch], min: bounds.min.map((value) => value / 1000) as Vec3, max: bounds.max.map((value) => value / 1000) as Vec3, nodes: [] }
  }

  private reportAssets() { this.onAssets({ loading: this.loading.size, failedUrls: [...this.failedUrls] }) }

  /** One slow or broken model never holds back the others: each settles on its own, within a time limit. */
  private async loadAsset(url: string) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), LOAD_TIMEOUT_MS)
    this.loading.set(url, controller)
    this.reportAssets()
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`Không tải được model (${response.status}).`)
      const parsed = parseBoardGlb(await response.arrayBuffer())
      if (this.disposed) return
      const gl = this.gl
      const batches = parsed.batches.map((batch) => ({ ...batch, buffers: [this.buffer(gl.ARRAY_BUFFER, batch.positions), this.buffer(gl.ARRAY_BUFFER, batch.normals), this.buffer(gl.ELEMENT_ARRAY_BUFFER, batch.indices)] }))
      const min: Vec3 = [Infinity, Infinity, Infinity], max: Vec3 = [-Infinity, -Infinity, -Infinity]
      for (const node of parsed.nodeBounds) for (let axis = 0; axis < 3; axis += 1) { min[axis] = Math.min(min[axis], node.min[axis]); max[axis] = Math.max(max[axis], node.max[axis]) }
      this.assets.set(url, { batches, min, max, nodes: parsed.nodeBounds })
    } catch {
      if (!this.disposed) this.failedUrls.add(url)
    } finally {
      clearTimeout(timer)
      this.loading.delete(url)
    }
    if (this.disposed) return
    this.rebuild()
    this.reportAssets()
  }

  retryFailed() {
    const urls = [...this.failedUrls]
    this.failedUrls.clear()
    this.reportAssets()
    for (const url of urls) void this.loadAsset(url)
  }

  update(plan: AssemblyPlan) {
    if (this.disposed) return
    this.plan = plan
    for (const { assetUrl } of plan.placements) if (assetUrl && !this.assets.has(assetUrl) && !this.loading.has(assetUrl) && !this.failedUrls.has(assetUrl)) void this.loadAsset(assetUrl)
    this.rebuild()
  }

  private rebuild() {
    const plan = this.plan
    if (!plan || this.disposed || this.gl.isContextLost()) return
    this.instances = plan.placements.flatMap((placement) => {
      const asset = placement.assetUrl ? this.assets.get(placement.assetUrl) : this.fallbackBox(placement.boundsMm)
      return asset ? [{ placement, asset, model: placementMatrix(placement) }] : []
    })
    this.rebuildWires(plan)
    const key = plan.placements.map((item) => item.partId).join('|') + (plan.grid ? 'grid' : '')
    if (key !== this.frameKey) { this.frameKey = key; this.frameParts(plan) }
    this.resize()
  }

  /** Frames the parts, not the whole bench. Moving a part keeps the current view. */
  private frameParts(plan: AssemblyPlan) {
    if (!plan.placements.length) return
    const boxes = plan.placements.map(footprintBox)
    const minX = Math.min(...boxes.map((box) => box.minX)), maxX = Math.max(...boxes.map((box) => box.maxX)), minZ = Math.min(...boxes.map((box) => box.minZ)), maxZ = Math.max(...boxes.map((box) => box.maxZ))
    this.target = [(minX + maxX) / 2000, 0.008, (minZ + maxZ) / 2000]
    this.radius = Math.max(0.05, Math.hypot(maxX - minX, maxZ - minZ) / 2000)
    this.distance = this.fitDistance
  }

  private rebuildWires(plan: AssemblyPlan) {
    const gl = this.gl
    for (const mesh of this.wireMeshes) for (const buffer of mesh.buffers) { gl.deleteBuffer(buffer); this.ownedBuffers.delete(buffer) }
    this.wireMeshes = Object.entries(plan.wireEnds).map(([id, [from, to]]) => {
      const tube = buildTube(from.map((value) => value / 1000) as Vec3, to.map((value) => value / 1000) as Vec3)
      return { id, indexCount: tube.indices.length, middle: tube.middle, lengthMm: tube.lengthMm, buffers: [this.buffer(gl.ARRAY_BUFFER, tube.positions), this.buffer(gl.ARRAY_BUFFER, tube.normals), this.buffer(gl.ARRAY_BUFFER, tube.progress), this.buffer(gl.ELEMENT_ARRAY_BUFFER, tube.indices)] }
    })
  }

  setSelection(partId: string, nodeNames: string[] = []) { this.selectedPart = partId; this.selectedNodes = new Set(nodeNames); this.render() }
  setHighlights(activeParts: string[], litParts: string[]) { this.activeParts = new Set(activeParts); this.litParts = new Set(litParts); this.render() }
  setWireStyles(styles: Map<string, SceneWireStyle>, animate: boolean) {
    this.wireStyles = styles
    if (animate && !this.frame) { this.lastTime = 0; this.frame = requestAnimationFrame(this.tick) }
    if (!animate && this.frame) { cancelAnimationFrame(this.frame); this.frame = 0 }
    this.render()
  }

  private tick = (time: number) => {
    if (this.disposed) return
    if (this.lastTime) this.phase = (this.phase + (time - this.lastTime) / 700) % 1000
    this.lastTime = time
    this.render()
    this.frame = requestAnimationFrame(this.tick)
  }

  rotate(horizontal: number, vertical: number) {
    this.azimuth += horizontal
    this.elevation = Math.max(0.16, Math.min(1.52, this.elevation + vertical))
    this.render()
    this.onViewChange()
  }
  zoom(direction: -1 | 1) {
    this.distance = Math.max(this.fitDistance * 0.3, Math.min(this.fitDistance * 1.6, this.distance * (direction === 1 ? 0.85 : 1.18)))
    this.render()
    this.onViewChange()
  }
  resetView() { this.azimuth = DEFAULT_VIEW.azimuth; this.elevation = DEFAULT_VIEW.elevation; this.distance = this.fitDistance; this.render(); this.onViewChange() }

  resize() {
    if (this.disposed || this.gl.isContextLost()) return
    const rect = this.canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    const atFit = Math.abs(this.distance - this.fitDistance) < 1e-5
    const horizontal = 2 * Math.atan(Math.tan(FOV / 2) * this.width / this.height)
    this.fitDistance = this.radius / Math.sin(Math.min(FOV, horizontal) / 2) * (this.width / this.height < 1.3 ? 1.1 : 0.84)
    if (atFit) this.distance = this.fitDistance
    const width = Math.round(this.width * ratio), height = Math.round(this.height * ratio)
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height }
    this.gl.viewport(0, 0, width, height)
    this.render()
    this.onViewChange()
  }

  private camera() { return makeCamera(this.azimuth, this.elevation, this.distance, this.target) }
  private viewProjection() { return multiply(perspective(FOV, this.width / this.height, 0.005, 3), viewMatrix(this.camera())) }

  project(point: Vec3): ScreenPoint {
    const m = this.viewProjection(), x = m[0] * point[0] + m[4] * point[1] + m[8] * point[2] + m[12], y = m[1] * point[0] + m[5] * point[1] + m[9] * point[2] + m[13], w = m[3] * point[0] + m[7] * point[1] + m[11] * point[2] + m[15]
    if (w <= 0) return { x: 0, y: 0, visible: false }
    const sx = (x / w + 1) * this.width / 2, sy = (1 - y / w) * this.height / 2
    return { x: sx, y: sy, visible: sx >= 0 && sy >= 0 && sx <= this.width && sy <= this.height }
  }

  partTop(partId: string): Vec3 | undefined {
    const placement = this.instances.find((item) => item.placement.partId === partId)?.placement
    if (!placement) return undefined
    const { min, max } = placement.boundsMm
    const top = localToWorld(placement, [(min[0] + max[0]) / 2, max[1], (min[2] + max[2]) / 2])
    return [top[0] / 1000, top[1] / 1000, top[2] / 1000]
  }
  nodeTop(partId: string, nodeName: string): Vec3 | undefined {
    const instance = this.instances.find((item) => item.placement.partId === partId), node = instance?.asset.nodes.find((item) => item.nodeName === nodeName)
    return instance && node ? transformPoint(instance.model, [node.center[0], node.max[1], node.center[2]]) : undefined
  }
  nodeNames(partId: string) { return new Set(this.instances.find((item) => item.placement.partId === partId)?.asset.nodes.map((node) => node.nodeName) ?? []) }
  wireMiddle(id: string) { return this.wireMeshes.find((mesh) => mesh.id === id)?.middle }

  private ray(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect(), camera = this.camera(), tan = Math.tan(FOV / 2)
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1, ny = 1 - ((clientY - rect.top) / rect.height) * 2, aspect = rect.width / rect.height
    return { origin: camera.eye, direction: normalize([0, 1, 2].map((axis) => camera.forward[axis] + camera.right[axis] * nx * tan * aspect + camera.up[axis] * ny * tan) as Vec3) }
  }

  pick(clientX: number, clientY: number): ScenePick | null {
    const { origin, direction } = this.ray(clientX, clientY)
    let best: ScenePick | null = null, bestDistance = Infinity
    for (const instance of this.instances) {
      const m = instance.model
      const relative = subtract(origin, [m[12], m[13], m[14]])
      const toLocal = (v: Vec3): Vec3 => [dot(v, [m[0], m[1], m[2]]), dot(v, [m[4], m[5], m[6]]), dot(v, [m[8], m[9], m[10]])]
      const localOrigin = toLocal(relative), localDirection = toLocal(direction)
      for (const batch of instance.asset.batches) {
        const p = batch.positions, indices = batch.indices
        for (let index = 0; index + 2 < indices.length; index += 3) {
          const ia = indices[index] * 3, ib = indices[index + 1] * 3, ic = indices[index + 2] * 3
          const hit = rayTriangle(localOrigin, localDirection, [p[ia], p[ia + 1], p[ia + 2]], [p[ib], p[ib + 1], p[ib + 2]], [p[ic], p[ic + 1], p[ic + 2]])
          if (hit !== null && hit < bestDistance) { bestDistance = hit; best = { partId: instance.placement.partId, nodeName: batch.nodeName } }
        }
      }
    }
    return best
  }

  /** Point under the pointer on the horizontal plane at `heightMm`, in millimetres. */
  planePoint(clientX: number, clientY: number, heightMm: number): [number, number] | null {
    const { origin, direction } = this.ray(clientX, clientY)
    if (direction[1] >= -1e-4) return null
    const t = (heightMm / 1000 - origin[1]) / direction[1]
    return t > 0 ? [(origin[0] + direction[0] * t) * 1000, (origin[2] + direction[2] * t) * 1000] : null
  }

  private bindMesh(position: WebGLBuffer, normal: WebGLBuffer) {
    const gl = this.gl
    const positionLocation = gl.getAttribLocation(this.program, 'aPosition'), normalLocation = gl.getAttribLocation(this.program, 'aNormal')
    gl.bindBuffer(gl.ARRAY_BUFFER, position)
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, normal)
    gl.enableVertexAttribArray(normalLocation)
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)
  }

  render() {
    if (this.disposed || this.gl.isContextLost()) return
    const gl = this.gl, program = this.program, uniform = (name: string) => gl.getUniformLocation(program, name)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)
    gl.uniformMatrix4fv(uniform('uViewProjection'), false, new Float32Array(this.viewProjection()))
    const progressLocation = gl.getAttribLocation(program, 'aProgress')
    if (progressLocation >= 0) { gl.disableVertexAttribArray(progressLocation); gl.vertexAttrib1f(progressLocation, 0) }
    gl.uniform1f(uniform('uStripes'), 0)
    gl.uniform1f(uniform('uPhase'), 0)
    const drawAsset = (asset: Asset, model: number[], emphasisFor: (node: string) => number, glow: number) => {
      gl.uniformMatrix4fv(uniform('uModel'), false, new Float32Array(model))
      gl.uniform1f(uniform('uGlow'), glow)
      for (const batch of asset.batches) {
        this.bindMesh(batch.buffers[0], batch.buffers[1])
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.buffers[2])
        gl.uniform3fv(uniform('uColor'), batch.color)
        gl.uniform1f(uniform('uEmphasis'), emphasisFor(batch.nodeName))
        gl.drawElements(gl.TRIANGLES, batch.indices.length, gl.UNSIGNED_INT, 0)
      }
    }
    drawAsset(this.bench, identityMatrix(), () => 0, 0)
    for (const instance of this.instances) {
      const id = instance.placement.partId, selected = id === this.selectedPart
      const nodeSelection = selected && this.selectedNodes.size > 0
      const partEmphasis = selected ? 0.5 : this.activeParts.has(id) ? 0.22 : 0
      drawAsset(instance.asset, instance.model, (node) => nodeSelection ? (this.selectedNodes.has(node) ? 1 : 0) : partEmphasis, this.litParts.has(id) ? 0.9 : 0)
    }
    gl.uniformMatrix4fv(uniform('uModel'), false, new Float32Array(identityMatrix()))
    gl.uniform1f(uniform('uGlow'), 0)
    gl.uniform1f(uniform('uEmphasis'), 0)
    if (progressLocation >= 0) gl.enableVertexAttribArray(progressLocation)
    for (const mesh of this.wireMeshes) {
      const style = this.wireStyles.get(mesh.id)
      this.bindMesh(mesh.buffers[0], mesh.buffers[1])
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffers[2])
      if (progressLocation >= 0) gl.vertexAttribPointer(progressLocation, 1, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.buffers[3])
      gl.uniform3fv(uniform('uColor'), style?.color ?? [0.4, 0.45, 0.5])
      gl.uniform1f(uniform('uStripes'), style?.stripes ? Math.max(3, Math.round(mesh.lengthMm / 9)) : 0)
      gl.uniform1f(uniform('uPhase'), (style?.direction ?? 0) * this.phase)
      gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0)
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.frame) cancelAnimationFrame(this.frame)
    for (const controller of this.loading.values()) controller.abort()
    for (const buffer of this.ownedBuffers) this.gl.deleteBuffer(buffer)
    this.gl.deleteProgram(this.program)
  }
}
