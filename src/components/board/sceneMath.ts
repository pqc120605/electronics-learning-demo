export type Vec3 = [number, number, number]
export type Camera = { eye: Vec3; right: Vec3; up: Vec3; forward: Vec3 }

export function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const result = gl.createShader(type)
  if (!result) throw new Error('Không tạo được shader WebGL.')
  gl.shaderSource(result, source)
  gl.compileShader(result)
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(result) ?? 'Lỗi biên dịch shader.'
    gl.deleteShader(result)
    throw new Error(message)
  }
  return result
}

export function subtract(a: Vec3, b: Vec3): Vec3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]] }
export function dot(a: Vec3, b: Vec3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] }
export function cross(a: Vec3, b: Vec3): Vec3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]] }
export function normalize(a: Vec3): Vec3 { const length = Math.hypot(...a) || 1; return [a[0] / length, a[1] / length, a[2] / length] }

export function rayTriangle(origin: Vec3, direction: Vec3, a: Vec3, b: Vec3, c: Vec3): number | null {
  const edge1 = subtract(b,a), edge2 = subtract(c,a), p = cross(direction,edge2)
  const determinant = dot(edge1,p)
  if (Math.abs(determinant) < 1e-9) return null
  const inverse = 1 / determinant, fromA = subtract(origin,a), u = dot(fromA,p) * inverse
  if (u < 0 || u > 1) return null
  const q = cross(fromA,edge1), v = dot(direction,q) * inverse
  if (v < 0 || u + v > 1) return null
  const distance = dot(edge2,q) * inverse
  return distance > 1e-6 ? distance : null
}

export function perspective(fov: number, aspect: number, near: number, far: number): number[] {
  const f = 1 / Math.tan(fov / 2)
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]
}

export function viewMatrix(camera: Camera): number[] {
  const { eye, right, up, forward } = camera
  return [right[0], up[0], -forward[0], 0, right[1], up[1], -forward[1], 0, right[2], up[2], -forward[2], 0, -dot(right, eye), -dot(up, eye), dot(forward, eye), 1]
}

export function multiply(a: number[], b: number[]): number[] {
  const output = new Array<number>(16).fill(0)
  for (let column = 0; column < 4; column += 1) for (let row = 0; row < 4; row += 1) for (let k = 0; k < 4; k += 1) output[column * 4 + row] += a[k * 4 + row] * b[column * 4 + k]
  return output
}

export function makeCamera(azimuth: number, elevation: number, distance: number, target: Vec3): Camera {
  const eye: Vec3 = [target[0] + distance * Math.cos(elevation) * Math.sin(azimuth), target[1] + distance * Math.sin(elevation), target[2] + distance * Math.cos(elevation) * Math.cos(azimuth)]
  const forward = normalize(subtract(target, eye))
  const right = normalize(cross(forward, [0, 1, 0]))
  const up = normalize(cross(right, forward))
  return { eye, right, up, forward }
}
