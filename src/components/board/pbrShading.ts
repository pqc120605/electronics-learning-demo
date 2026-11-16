/**
 * Shared shading for the WebGL2 scenes (bench assembly and board viewer), 2026-11-14.
 * Metal/roughness lighting with one key light, an equirectangular environment map
 * (Poly Haven "Studio Small 09", CC0, public/env/NOTICE.txt), soft PCF shadows and ACES
 * tone mapping. GLB base colours are linear (glTF); colours chosen in app code are sRGB and
 * go through toLinear() first. Quality "low" skips shadows and the environment texture.
 */
import type { Vec3 } from './sceneMath'

export const ENV_MAP_URL = '/env/studio_small_09_512.png'
export const SHADOW_SIZE = 2048
export const LIGHT_DIR: Vec3 = [-0.42, 0.82, 0.38]

export const pbrVertexShader = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in float aProgress;
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform mat4 uLightVP;
out vec3 vNormal;
out vec3 vWorld;
out vec4 vShadowCoord;
out float vProgress;
void main() {
  vec4 world = uModel * vec4(aPosition, 1.0);
  vWorld = world.xyz;
  vNormal = mat3(uModel) * aNormal;
  vShadowCoord = uLightVP * world;
  vProgress = aProgress;
  gl_Position = uViewProjection * world;
}
`

export const pbrFragmentShader = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vNormal;
in vec3 vWorld;
in vec4 vShadowCoord;
in float vProgress;
uniform vec3 uColor;
uniform float uEmphasis;
uniform float uGlow;
uniform float uStripes;
uniform float uPhase;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3 uCameraPos;
uniform vec3 uLightDir;
uniform sampler2D uEnv;
uniform float uEnvReady;
uniform sampler2DShadow uShadowMap;
uniform float uShadowOn;
out vec4 outColor;
const float PI = 3.14159265;
vec3 env(vec3 d, float lod) {
  if (uEnvReady < 0.5) return mix(vec3(0.20, 0.19, 0.17), vec3(0.85, 0.87, 0.9), clamp(d.y * 0.5 + 0.5, 0.0, 1.0));
  vec2 uv = vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, acos(clamp(d.y, -1.0, 1.0)) / PI);
  return pow(textureLod(uEnv, uv, lod).rgb, vec3(2.2)) * 1.1;
}
float shadowFactor(vec3 n) {
  if (uShadowOn < 0.5) return 1.0;
  vec3 p = vShadowCoord.xyz / vShadowCoord.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  float bias = 0.0008 + 0.0018 * (1.0 - max(dot(n, uLightDir), 0.0));
  vec2 texel = 1.0 / vec2(textureSize(uShadowMap, 0));
  float sum = 0.0;
  for (int x = -2; x <= 2; x++) for (int y = -2; y <= 2; y++) sum += texture(uShadowMap, vec3(p.xy + vec2(x, y) * texel * 1.4, p.z - bias));
  return mix(0.22, 1.0, sum / 25.0);
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(uCameraPos - vWorld);
  if (dot(n, v) < 0.0) n = -n;
  vec3 albedo = mix(uColor, vec3(0.03, 0.62, 0.55), uEmphasis * 0.6);
  if (uStripes > 0.0) albedo = mix(albedo, vec3(0.93, 0.95, 0.88), step(0.5, fract(vProgress * uStripes - uPhase)) * 0.82);
  float metal = clamp(uMetallic, 0.0, 1.0), rough = clamp(uRoughness, 0.08, 1.0);
  vec3 f0 = mix(vec3(0.04), albedo, metal);
  vec3 l = normalize(uLightDir), h = normalize(l + v);
  float nl = max(dot(n, l), 0.0), nv = max(dot(n, v), 0.001), nh = max(dot(n, h), 0.0), vh = max(dot(v, h), 0.0);
  float a2 = pow(rough, 4.0);
  float d = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
  float k = pow(rough + 1.0, 2.0) / 8.0;
  float g = (nl / (nl * (1.0 - k) + k)) * (nv / (nv * (1.0 - k) + k));
  vec3 f = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
  vec3 spec = d * g * f / max(4.0 * nl * nv, 0.001);
  vec3 kd = (1.0 - f) * (1.0 - metal);
  float shadow = shadowFactor(n);
  vec3 keyLight = vec3(2.9, 2.8, 2.6);
  vec3 direct = (kd * albedo / PI + spec) * keyLight * nl * shadow;
  vec3 fr = f0 + (max(vec3(1.0 - rough), f0) - f0) * pow(1.0 - nv, 5.0);
  vec3 ambient = kd * albedo * env(n, 7.0) * 0.75 * mix(0.45, 1.0, shadow) + env(reflect(-v, n), rough * 7.0) * fr * mix(0.5, 1.0, shadow);
  vec3 color = direct * PI * 0.32 + ambient + uColor * uGlow * 1.4;
  outColor = vec4(pow(aces(color * 0.92), vec3(1.0 / 2.2)), 1.0);
}
`

export const depthVertexShader = `#version 300 es
in vec3 aPosition;
uniform mat4 uLightVP;
uniform mat4 uModel;
void main() { gl_Position = uLightVP * uModel * vec4(aPosition, 1.0); }
`
export const depthFragmentShader = `#version 300 es
precision mediump float;
void main() {}
`

export const toLinear = (color: readonly number[]): [number, number, number] => [color[0] ** 2.2, color[1] ** 2.2, color[2] ** 2.2]

/** Shadows and the environment texture are skipped on small/low-memory devices or with ?quality=low. */
export function sceneQuality(): 'high' | 'low' {
  const query = typeof location === 'undefined' ? '' : new URLSearchParams(location.search).get('quality')
  if (query === 'low' || query === 'high') return query
  const nav = typeof navigator === 'undefined' ? undefined : navigator as Navigator & { deviceMemory?: number }
  const memory = nav?.deviceMemory ?? 8, cores = nav?.hardwareConcurrency ?? 8
  return memory <= 2 || cores <= 2 ? 'low' : 'high'
}

/** Orthographic light camera covering a sphere of `radius` around `target` (column-major, metres). */
export function lightViewProjection(target: Vec3, radius: number, dir: Vec3 = LIGHT_DIR): number[] {
  const len = Math.hypot(...dir), l = dir.map((value) => value / len) as Vec3
  const eye: Vec3 = [target[0] + l[0] * radius * 3, target[1] + l[1] * radius * 3, target[2] + l[2] * radius * 3]
  const f = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]], fl = Math.hypot(...f), fwd = f.map((value) => value / fl)
  const up = Math.abs(fwd[1]) > 0.95 ? [0, 0, 1] : [0, 1, 0]
  const s = [fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2], fwd[0] * up[1] - fwd[1] * up[0]], sl = Math.hypot(...s), side = s.map((value) => value / sl)
  const u = [side[1] * fwd[2] - side[2] * fwd[1], side[2] * fwd[0] - side[0] * fwd[2], side[0] * fwd[1] - side[1] * fwd[0]]
  const dotE = (a: number[]) => a[0] * eye[0] + a[1] * eye[1] + a[2] * eye[2]
  const view = [side[0], u[0], -fwd[0], 0, side[1], u[1], -fwd[1], 0, side[2], u[2], -fwd[2], 0, -dotE(side), -dotE(u), dotE(fwd), 1]
  const r = radius * 1.15, near = radius * 0.5, far = radius * 6
  const ortho = [1 / r, 0, 0, 0, 0, 1 / r, 0, 0, 0, 0, -2 / (far - near), 0, 0, 0, -(far + near) / (far - near), 1]
  const out = new Array(16).fill(0)
  for (let c = 0; c < 4; c += 1) for (let rIndex = 0; rIndex < 4; rIndex += 1) for (let k = 0; k < 4; k += 1) out[c * 4 + rIndex] += ortho[k * 4 + rIndex] * view[c * 4 + k]
  return out
}

export type ShadowTarget = { framebuffer: WebGLFramebuffer; texture: WebGLTexture; size: number }

export function createShadowTarget(gl: WebGL2RenderingContext, size = SHADOW_SIZE): ShadowTarget | undefined {
  const texture = gl.createTexture(), framebuffer = gl.createFramebuffer()
  if (!texture || !framebuffer) return undefined
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL)
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, texture, 0)
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if (!complete) { gl.deleteTexture(texture); gl.deleteFramebuffer(framebuffer); return undefined }
  return { framebuffer, texture, size }
}

/** Loads the environment map with mipmaps; `onReady` lets the scene redraw once it arrives. */
export function loadEnvTexture(gl: WebGL2RenderingContext, onReady: (texture: WebGLTexture) => void) {
  if (typeof Image === 'undefined') return
  const image = new Image()
  image.decoding = 'async'
  image.onload = () => {
    if (gl.isContextLost()) return
    const texture = gl.createTexture()
    if (!texture) return
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    onReady(texture)
  }
  image.src = ENV_MAP_URL
}
