import { componentRegistry } from './componentRegistry'
import manifest from './component-models.manifest.json'

export type ComponentMeshKind = 'source-cad-mesh' | 'parametric-mesh'
export type ComponentLeg = { pinId: string; x: number; z: number }
export type BreadboardGrid = { pitch: number; columns: number; topY: number; firstColumnX: number; rows: number[]; rails: number[] }
export type ComponentMesh = { id: string; file: string; bytes: number; sha256: string; sizeMm: number[]; boundsMm: { min: number[]; max: number[] }; triangles: number; kind: ComponentMeshKind; packageName?: string; modelNote?: string; sourceFile?: string; sourceSha256?: string; footprint?: string; mount: 'breadboard' | 'bench'; pinsMm: Record<string, number[]>; legsMm: ComponentLeg[]; gridMm?: BreadboardGrid }

/** Each level is a separate fact: a symbol or a drawing never implies a mesh exists. */
export type ComponentRepresentations = {
  schematicSymbol: 'specific' | 'generic'
  illustration2d: true
  cssBlock3d: boolean
  mesh?: ComponentMesh
}

export const componentMeshKindLabels: Record<ComponentMeshKind, string> = {
  'source-cad-mesh': 'Mesh CAD · thư viện KiCad',
  'parametric-mesh': 'Minh họa tham số',
}

export const componentMeshNotes: Record<ComponentMeshKind, string> = {
  'source-cad-mesh': 'Vỏ linh kiện tiêu chuẩn, không phải model của một hãng hay mã sản phẩm cụ thể.',
  'parametric-mesh': 'Mạch Mở dựng theo kích thước thường gặp để dễ nhận biết. Module thật khác nhau về bố trí, kích thước và thứ tự chân.',
}

export const kicadModelSource = { label: 'KiCad Packages3D', url: 'https://gitlab.com/kicad/libraries/kicad-packages3D', license: 'CC BY-SA 4.0', licenseUrl: 'https://www.kicad.org/libraries/license/' }

const meshes = new Map((manifest as unknown as ComponentMesh[]).map((item) => [item.id, item]))
const specificSymbols = new Set(['board', 'breadboard', 'button', 'capacitor', 'diode', 'led', 'resistor'])

export function getComponentMesh(id: string | undefined): ComponentMesh | undefined {
  return id ? meshes.get(id) : undefined
}

/** Resolves a library catalog id to its builder model when one exists, otherwise to a dedicated catalog illustration mesh. */
export function getComponentMeshForCatalog(catalogId: string): ComponentMesh | undefined {
  const builderPart = componentRegistry.find((part) => part.catalogId === catalogId)
  if (builderPart) return getComponentMesh(builderPart.id)
  return componentRegistry.some((part) => part.id === catalogId) ? undefined : getComponentMesh(catalogId)
}

export function getComponentRepresentations(id: string): ComponentRepresentations {
  return { schematicSymbol: specificSymbols.has(id) ? 'specific' : 'generic', illustration2d: true, cssBlock3d: componentRegistry.some((part) => part.id === id), mesh: meshes.get(id) }
}
