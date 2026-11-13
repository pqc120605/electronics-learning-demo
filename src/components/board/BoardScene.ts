import { parseBoardGlb, type GpuBatch, type NodeBounds } from './glbParser'
import type { BoardModelManifest, BoardSceneDefinition } from './boardSceneTypes'
import { getFeatureFocusBounds } from '../../lib/boardFeatureFocus'
import { compileShader as shader, dot, makeCamera, multiply, normalize, perspective, rayTriangle, subtract, viewMatrix, type Vec3 } from './sceneMath'

type PreparedBatch = GpuBatch & { buffers: WebGLBuffer[] }

const vertexShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
uniform mat4 uViewProjection;
uniform mat4 uModel;
out vec3 vNormal;
void main() { gl_Position = uViewProjection * uModel * vec4(aPosition, 1.0); vNormal = mat3(uModel) * aNormal; }
`
const fragmentShader = `#version 300 es
precision highp float;
in vec3 vNormal;
uniform vec3 uColor;
uniform float uEmphasis;
out vec4 outColor;
void main() { vec3 n = normalize(vNormal); float light = 0.54 + 0.46 * max(dot(n, normalize(vec3(-0.42, 0.62, 0.68))), 0.0); vec3 color = mix(uColor, vec3(0.18, 0.78, 0.72), uEmphasis * 0.58); outColor = vec4(color * light + vec3(0.018, 0.026, 0.028), 1.0); }
`

const identity: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

export class BoardScene {
  private gl: WebGL2RenderingContext
  private program: WebGLProgram
  private batches: PreparedBatch[] = []
  private bounds: NodeBounds[] = []
  private featureNodes = new Map<string, string[]>()
  private pins: BoardModelManifest['pins'] = []
  private manifestPinPicking = true
  private modelId = ''
  private sceneId: BoardSceneDefinition['id'] = 'pcb'
  private selectedFeatureId = ''
  private hoveredFeatureId = ''
  private highlightedFeatureIds: string[] = []
  private azimuth = 0.48
  private elevation = 1.02
  private distance = 0.09
  private target: Vec3 = [0, 0, 0]
  private homeTarget: Vec3 = [0, 0, 0]
  private fitDistance = 0.09
  private minDistance = 0.012
  private modelRadius = 0.03
  private width = 1
  private height = 1
  private disposed = false
  private canvas: HTMLCanvasElement

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl
    const program = gl.createProgram()
    if (!program) throw new Error('Không tạo được chương trình WebGL.')
    const vertex = shader(gl, gl.VERTEX_SHADER, vertexShader)
    const fragment = shader(gl, gl.FRAGMENT_SHADER, fragmentShader)
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Không liên kết được shader.')
    this.program = program
    gl.enable(gl.DEPTH_TEST)
  }

  static create(canvas: HTMLCanvasElement): BoardScene {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' })
    if (!gl) throw new Error('Trình duyệt này chưa hỗ trợ WebGL 2 để hiển thị mô hình PCB.')
    return new BoardScene(canvas, gl)
  }

  async load(manifest: BoardModelManifest, scene: BoardSceneDefinition, signal?: AbortSignal): Promise<void> {
    const response = await fetch(scene.assetUrl, { signal })
    if (!response.ok) throw new Error(`Không tải được mô hình PCB (${response.status}).`)
    const parsed = parseBoardGlb(await response.arrayBuffer())
    const gl = this.gl
    this.clearBuffers()
    this.featureNodes.clear()
    this.modelId = manifest.id
    this.sceneId = scene.id
    this.manifestPinPicking = manifest.pinPicking !== false
    this.pins = scene.id === 'assembly' ? manifest.pins.map((pin) => pin.anchor ? ({ ...pin, anchor: [0.0510577 - pin.anchor[2], pin.anchor[1], pin.anchor[0] - 0.1501492] as Vec3 }) : pin) : manifest.pins
    for (const hotspot of scene.hotspots) this.featureNodes.set(hotspot.featureId, [...(this.featureNodes.get(hotspot.featureId) ?? []), ...hotspot.nodeNames])
    this.batches = parsed.batches.map((batch) => {
      const buffers: WebGLBuffer[] = []
      for (const [target, data] of [[gl.ARRAY_BUFFER, batch.positions], [gl.ARRAY_BUFFER, batch.normals], [gl.ELEMENT_ARRAY_BUFFER, batch.indices]] as const) {
        const buffer = gl.createBuffer()
        if (!buffer) throw new Error('Không cấp phát được bộ nhớ cho mô hình PCB.')
        buffers.push(buffer)
        gl.bindBuffer(target, buffer)
        gl.bufferData(target, data, gl.STATIC_DRAW)
      }
      return { ...batch, buffers }
    })
    this.bounds = parsed.nodeBounds
    if (parsed.nodeBounds.length) {
      const min: Vec3 = [Infinity, Infinity, Infinity]; const max: Vec3 = [-Infinity, -Infinity, -Infinity]
      for (const bound of parsed.nodeBounds) for (let axis = 0; axis < 3; axis += 1) { min[axis] = Math.min(min[axis], bound.min[axis]); max[axis] = Math.max(max[axis], bound.max[axis]) }
      this.target = [(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2]
      this.homeTarget = [...this.target]
      this.modelRadius = Math.hypot(max[0]-this.target[0],max[1]-this.target[1],max[2]-this.target[2])
      this.updateFitDistance()
      this.distance = this.fitDistance
      this.minDistance = this.fitDistance * 0.45
    }
    this.resize()
  }

  resize(): void {
    if (this.disposed) return
    const rect = this.canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    const previousFitDistance = this.fitDistance
    this.updateFitDistance()
    if (Math.abs(this.distance - previousFitDistance) < 0.00001) this.distance = this.fitDistance
    const width = Math.round(this.width * ratio)
    const height = Math.round(this.height * ratio)
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height }
    this.gl.viewport(0, 0, width, height)
    this.render()
  }

  setSelection(featureId: string): void { this.selectedFeatureId = featureId; this.render() }
  setHover(featureId: string): void { if (this.hoveredFeatureId === featureId) return; this.hoveredFeatureId = featureId; this.render() }
  setHighlights(featureIds: string[]): void { this.highlightedFeatureIds = featureIds; this.render() }
  resetView(): void { this.azimuth = 0.48; this.elevation = 1.02; this.target = [...this.homeTarget]; this.distance = this.fitDistance; this.minDistance = this.fitDistance * 0.45; this.render() }
  focusFeature(featureId: string): boolean {
    const focus = getFeatureFocusBounds(this.bounds, this.featureNodes.get(featureId) ?? [])
    if (!focus) return false
    this.target = focus.center
    const verticalFov = Math.PI / 3.5
    const aspect = this.width / Math.max(1, this.height)
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
    const limitingHalfFov = Math.min(verticalFov, horizontalFov) / 2
    this.distance = Math.max(0.003, focus.radius / Math.sin(limitingHalfFov) * 1.45)
    this.minDistance = Math.min(this.fitDistance * 0.45, this.distance * 0.42)
    this.render()
    return true
  }
  rotate(horizontal: number, vertical: number): void {
    this.azimuth = ((this.azimuth + horizontal) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
    this.elevation = Math.max(-1.52, Math.min(1.52, this.elevation + vertical))
    this.render()
  }
  flipView(): void { this.azimuth = (this.azimuth + Math.PI) % (Math.PI * 2); this.elevation = -this.elevation; this.render() }
  zoom(direction: -1 | 1): void { this.distance = Math.max(this.minDistance, Math.min(Math.max(this.fitDistance * 3, this.distance), this.distance * (direction === 1 ? 0.85 : 1.18))); this.render() }

  pick(clientX: number, clientY: number): string | null {
    const rect = this.canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1
    const ny = 1 - ((clientY - rect.top) / rect.height) * 2
    const camera = makeCamera(this.azimuth, this.elevation, this.distance, this.target)
    const tan = Math.tan(Math.PI / 7)
    const ray = normalize([
      camera.forward[0] + camera.right[0] * nx * tan * (rect.width / rect.height) + camera.up[0] * ny * tan,
      camera.forward[1] + camera.right[1] * nx * tan * (rect.width / rect.height) + camera.up[1] * ny * tan,
      camera.forward[2] + camera.right[2] * nx * tan * (rect.width / rect.height) + camera.up[2] * ny * tan,
    ])
    const candidateNodes = new Set<string>()
    const selectableNodes = new Set([...this.featureNodes.values()].flat())
    for (const bound of this.bounds) {
      if (!selectableNodes.has(bound.nodeName)) continue
      const offset = subtract(camera.eye, bound.center)
      const b = dot(offset, ray)
      const c = dot(offset, offset) - bound.radius * bound.radius
      const discriminant = b * b - c
      if (discriminant < 0) continue
      const hit = -b - Math.sqrt(discriminant)
      if (hit >= 0) candidateNodes.add(bound.nodeName)
    }
    let bestDistance = Infinity
    let pickedNode: string | null = null
    for (const batch of this.batches) {
      if (!candidateNodes.has(batch.nodeName)) continue
      for (let index = 0; index + 2 < batch.indices.length; index += 3) {
        const ia = batch.indices[index] * 3, ib = batch.indices[index + 1] * 3, ic = batch.indices[index + 2] * 3
        const distance = rayTriangle(camera.eye,ray,
          [batch.positions[ia],batch.positions[ia+1],batch.positions[ia+2]],
          [batch.positions[ib],batch.positions[ib+1],batch.positions[ib+2]],
          [batch.positions[ic],batch.positions[ic+1],batch.positions[ic+2]])
        if (distance !== null && distance < bestDistance) { bestDistance = distance; pickedNode = batch.nodeName }
      }
    }
    if (pickedNode && !/(?:board|pcb|soldermask|silkscreen|dielectric|_pad)$/i.test(pickedNode)) {
      for (const [featureId, nodes] of this.featureNodes) if (nodes.includes(pickedNode)) return featureId
    }

    // STEP-derived CAD often contains very small, thin, or disconnected bodies.
    // Keep the exact triangle hit as the primary path, then use the projected
    // mesh bounds as a forgiving screen-space target when a ray misses a seam.
    const viewProjection = multiply(perspective(Math.PI / 3.5, rect.width / Math.max(1, rect.height), 0.001, 2), viewMatrix(camera))
    const pointerX = clientX - rect.left
    const pointerY = clientY - rect.top
    let nearestFeature: { id: string; score: number; depth: number } | null = null
    const featureByNode = new Map<string, string>()
    for (const [featureId, nodes] of this.featureNodes) for (const nodeName of nodes) featureByNode.set(nodeName, featureId)
    for (const bound of this.bounds) {
      const featureId = featureByNode.get(bound.nodeName)
      if (!featureId || /(?:board|pcb|soldermask|silkscreen|dielectric|_pad)$/i.test(bound.nodeName)) continue
      const [x, y, z] = bound.center
      const clipX = viewProjection[0] * x + viewProjection[4] * y + viewProjection[8] * z + viewProjection[12]
      const clipY = viewProjection[1] * x + viewProjection[5] * y + viewProjection[9] * z + viewProjection[13]
      const clipW = viewProjection[3] * x + viewProjection[7] * y + viewProjection[11] * z + viewProjection[15]
      if (clipW <= 0) continue
      const screenX = (clipX / clipW + 1) * rect.width / 2
      const screenY = (1 - clipY / clipW) * rect.height / 2
      const screenRadius = Math.min(30, Math.max(9, bound.radius * (rect.height / (2 * Math.tan(Math.PI / 7))) / clipW + 7))
      const distance = Math.hypot(pointerX - screenX, pointerY - screenY)
      if (distance > screenRadius) continue
      const score = distance / screenRadius
      if (!nearestFeature || score < nearestFeature.score || (score === nearestFeature.score && clipW < nearestFeature.depth)) nearestFeature = { id: featureId, score, depth: clipW }
    }
    return nearestFeature?.id ?? null
  }

  pickPin(clientX: number, clientY: number): string | null {
    if (this.manifestPinPicking === false) return null
    let nearest: { id: string; distance: number } | null = null
    for (const pin of this.pins) {
      const projected = this.projectPin(pin.id)
      if (!projected?.visible) continue
      const distance = Math.hypot(clientX - projected.x, clientY - projected.y)
      if (distance < 16 && (!nearest || distance < nearest.distance)) nearest = { id: pin.id, distance }
    }
    return nearest?.id ?? null
  }

  projectPin(pinId: string): { x: number; y: number; visible: boolean } | null {
    const pin = this.pins.find((candidate) => candidate.id === pinId)
    if (!pin?.anchor) return null
    const rect = this.canvas.getBoundingClientRect()
    const camera = makeCamera(this.azimuth, this.elevation, this.distance, this.target)
    const vp = multiply(perspective(Math.PI / 3.5, rect.width / Math.max(1, rect.height), 0.001, 2), viewMatrix(camera))
    const [x, y, z] = pin.anchor
    const clipX = vp[0] * x + vp[4] * y + vp[8] * z + vp[12]
    const clipY = vp[1] * x + vp[5] * y + vp[9] * z + vp[13]
    const clipW = vp[3] * x + vp[7] * y + vp[11] * z + vp[15]
    if (clipW <= 0) return { x: 0, y: 0, visible: false }
    const screenX = rect.left + (clipX / clipW + 1) * rect.width / 2
    const screenY = rect.top + (1 - clipY / clipW) * rect.height / 2
    return {
      x: screenX,
      y: screenY,
      visible: screenX >= rect.left && screenX <= rect.right && screenY >= rect.top && screenY <= rect.bottom,
    }
  }

  render(): void {
    if (this.disposed) return
    const gl = this.gl
    // Let the stage's paper/grid treatment show through, as in the lesson reference UI.
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    if (!this.batches.length) return
    const camera = makeCamera(this.azimuth, this.elevation, this.distance, this.target)
    const viewProjection = multiply(perspective(Math.PI / 3.5, this.width / Math.max(1, this.height), 0.001, 2), viewMatrix(camera))
    gl.useProgram(this.program)
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'uViewProjection'), false, new Float32Array(viewProjection))
    gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'uModel'), false, new Float32Array(identity))
    const positionLocation = gl.getAttribLocation(this.program, 'aPosition')
    const normalLocation = gl.getAttribLocation(this.program, 'aNormal')
    for (const batch of this.batches) {
      gl.bindBuffer(gl.ARRAY_BUFFER, batch.buffers[0])
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ARRAY_BUFFER, batch.buffers[1])
      gl.enableVertexAttribArray(normalLocation)
      gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, batch.buffers[2])
      const isSelected = (this.featureNodes.get(this.selectedFeatureId) ?? []).includes(batch.nodeName)
      const isHovered = (this.featureNodes.get(this.hoveredFeatureId) ?? []).includes(batch.nodeName)
      const isHighlighted = this.highlightedFeatureIds.some((id) => (this.featureNodes.get(id) ?? []).includes(batch.nodeName))
      gl.uniform3fv(gl.getUniformLocation(this.program, 'uColor'), this.displayColor(batch.nodeName, batch.color))
      gl.uniform1f(gl.getUniformLocation(this.program, 'uEmphasis'), isSelected ? 1 : isHovered ? 0.82 : isHighlighted ? 0.52 : 0)
      gl.drawElements(gl.TRIANGLES, batch.indices.length, gl.UNSIGNED_INT, 0)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const gl = this.gl
    this.clearBuffers()
    gl.deleteProgram(this.program)
  }

  private clearBuffers(): void {
    for (const batch of this.batches) for (const buffer of batch.buffers) this.gl.deleteBuffer(buffer)
    this.batches = []
  }

  private updateFitDistance(): void {
    const verticalFov = Math.PI / 3.5
    const aspect = this.width / Math.max(1, this.height)
    const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
    const limitingHalfFov = Math.min(verticalFov, horizontalFov) / 2
    this.fitDistance = Math.max(0.012, this.modelRadius / Math.sin(limitingHalfFov) * 1.12)
  }

  private displayColor(nodeName: string, sourceColor: [number, number, number]): [number, number, number] {
    const node = nodeName.toLowerCase()
    if (this.modelId === 'esp32-devkit-v1-30pin' && this.sceneId === 'assembly') {
      if (node === 'wire_gpio23') return [0.91, 0.25, 0.16]
      if (node === 'wire_gnd') return [0.11, 0.16, 0.23]
      if (node === 'breadboard_rail_red') return [0.88, 0.27, 0.2]
      if (node === 'breadboard_rail_blue') return [0.12, 0.42, 0.68]
    }
    if (this.modelId === 'raspberry-pi-pico') {
      if (node === 'pico_ref_board') return [0.035, 0.22, 0.145]
      if (node === 'pico_ref_led') return [0.9, 0.16, 0.12]
      if (node === 'pico_ref_switch') return [0.12, 0.13, 0.13]
      if (node.includes('microcontroller') || node.includes('winbond') || node.includes('richtek')) return [0.13, 0.16, 0.17]
      if (node.includes('bourns') || node.includes('murata')) return [0.55, 0.43, 0.25]
      if (node.includes('onsemi') || node.includes('diodes') || node.includes('ael')) return [0.68, 0.69, 0.63]
    }
    if (this.modelId === 'raspberry-pi-pico-2' || this.modelId === 'raspberry-pi-pico-2-h') {
      if (node === 'rpi_pico2_soldermask' || node === 'rpi_pico2h_soldermask') return [0.035, 0.22, 0.145]
      if (node === 'rpi_pico2_silkscreen' || node === 'rpi_pico2h_silkscreen') return [0.82, 0.84, 0.79]
      if (node === 'rpi_pico2_pad' || node === 'rpi_pico2h_pad') return [0.64, 0.43, 0.15]
    }
    return sourceColor
  }
}
