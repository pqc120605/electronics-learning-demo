import { componentRegistry } from './componentRegistry'
import { getKitPartProfile } from './kitPartProfiles'
import manifest from './component-models.manifest.json'
import r1PackageAssets from './catalog-r1-packages.json'
import r2aPackageAssets from './catalog-r2a-packages.json'
import r2bPackageAssets from './catalog-r2b-packages.json'
import r2cAssets from './catalog-r2c-assets.json'
import r3PackageAssets from './catalog-r3-packages.json'
import r4PackageAssets from './catalog-r4-packages.json'
import r5PackageAssets from './catalog-r5-packages.json'
import approvedIcAssets from './approved-catalog-ic-assets.json'
import { approvedCatalogIcs } from './approvedCatalogIcs'
import remainingAssets from './remaining-catalog-parts-assets.json'
import { approvedRemainingParts, getApprovedRemainingPart } from './approvedRemainingParts'
import { allBreadboardHoles, formatHole, holeToMm } from '../lib/breadboardGrid'
import { catalogParts } from './catalogParts'
import { getR2cBreadboard, type BreadboardSpec } from './catalogR2cBoards'

export type ComponentMeshKind = 'source-cad-mesh' | 'kicad-assembly' | 'parametric-mesh'
export type ComponentLeg = { pinId: string; x: number; z: number }
export type BreadboardGrid = { spec?: BreadboardSpec; pitch: number; columns: number; topY: number; firstColumnX: number; rows: number[]; rails: number[] }
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
  'kicad-assembly': 'Module dựng từ package KiCad',
  'parametric-mesh': 'Minh họa tham số',
}

export const componentMeshNotes: Record<ComponentMeshKind, string> = {
  'source-cad-mesh': 'Vỏ linh kiện tiêu chuẩn, không phải model của một hãng hay mã sản phẩm cụ thể.',
  'kicad-assembly': 'PCB, chữ lụa và linh kiện là package chuẩn của thư viện KiCad, đặt theo module phổ biến; không phải CAD của nhà sản xuất module.',
  'parametric-mesh': 'Mạch Mở dựng theo kích thước thường gặp để dễ nhận biết. Module thật khác nhau về bố trí, kích thước và thứ tự chân.',
}

export const kicadModelSource = { label: 'KiCad Packages3D', url: 'https://gitlab.com/kicad/libraries/kicad-packages3D', license: 'CC BY-SA 4.0', licenseUrl: 'https://www.kicad.org/libraries/license/' }

export const catalogPackageAssets = { ...r1PackageAssets, ...r2aPackageAssets, ...r2bPackageAssets, ...r3PackageAssets, ...r4PackageAssets, ...r5PackageAssets, ...approvedIcAssets, ...remainingAssets }

const catalogMeshes: ComponentMesh[] = [...catalogParts, ...approvedCatalogIcs, ...approvedRemainingParts].map(part => {
  const { pads, maxOffsetMm, ...geometry } = catalogPackageAssets[part.packageKey]
  const legsMm = part.pins.map(pin => {
    const pad = pads.find(pad => pad.pad === pin.pad)!
    return { pinId: pin.id, x: pad.x, z: pad.z }
  })
  return {
    ...geometry,
    id: part.id,
    kind: part.revision === 'KIT-1' || part.revision === 'R5' && maxOffsetMm === null || part.revision === 'R4' && (part.catalogId === 'opt3001' || part.catalogId === 'vl53l0x') ? 'parametric-mesh' : 'source-cad-mesh',
    sourceFile: geometry.sourceFile ?? undefined,
    sourceSha256: geometry.sourceSha256 ?? undefined,
    mount: geometry.mount as ComponentMesh["mount"],
    packageName: part.packageName,
    modelNote: part.revision === 'KIT-1' ? 'Hình học tham chiếu theo đúng mã linh kiện. Điểm chọn chân chiếu xuống tâm pad.' : part.revision === 'R5' ? 'Hình học tham chiếu theo package R5. Điểm chọn chân chiếu xuống tâm pad.' : part.revision === 'R4' ? 'Hình học package R4 theo datasheet và footprint đã khóa. Điểm chọn chân chiếu xuống tâm pad.' : maxOffsetMm === null ? 'Vỏ STEP KiCad 10.0.7. Chân SMD khớp vùng pad.' : `Vỏ lắp từ STEP KiCad 10.0.7. Sai lệch tâm tiết diện chân–pad tối đa ${maxOffsetMm} mm. Hình thể hiện dạng lắp, chiều dài chân nguyên bản tùy linh kiện.`,
    pinsMm: Object.fromEntries(legsMm.map(leg => [leg.pinId, [leg.x, 0, leg.z]])),
    legsMm,
  }
})

const breadboardMeshes: ComponentMesh[] = r2cAssets.map(asset => {
  const board = getR2cBreadboard(asset.id)!
  return {
    ...asset, kind: 'parametric-mesh', mount: 'bench', gridMm: board.grid, legsMm: [],
    modelNote: 'Thân tham chiếu dựng theo bản vẽ được Adafruit liên kết.',
    pinsMm: Object.fromEntries(allBreadboardHoles(board.spec).map(hole => [
      formatHole(hole, board.spec)!, holeToMm(hole, board.grid)!,
    ])),
  }
})
const meshes = new Map([...(manifest as unknown as ComponentMesh[]), ...catalogMeshes, ...breadboardMeshes].map((item) => [item.id, item]))
const specificSymbols = new Set(['board', 'breadboard', 'button', 'capacitor', 'diode', 'led', 'resistor'])

export function getComponentMesh(id: string | undefined): ComponentMesh | undefined {
  return id ? meshes.get(id) : undefined
}

/** Resolves a library catalog id to its builder model when one exists, otherwise to a dedicated catalog illustration mesh. */
export function getComponentMeshForCatalog(catalogId: string): ComponentMesh | undefined {
  const approvedPart = getApprovedRemainingPart(catalogId)
  if (approvedPart) return getComponentMesh(approvedPart.id)
  // Catalog "capacitor" là tụ gốm; part builder "capacitor" là tụ hóa (catalog "electrolytic").
  if (catalogId === 'capacitor') return getComponentMesh('capacitor-ceramic')
  const builderPart = componentRegistry.find((part) => part.catalogId === catalogId)
  if (builderPart) return getComponentMesh(builderPart.id)
  return componentRegistry.some((part) => part.id === catalogId) ? undefined : getComponentMesh(catalogId)
}

export function getBreadboardMesh(spec?: BreadboardSpec): ComponentMesh | undefined {
  return getComponentMesh(getR2cBreadboard(spec)?.catalogId ?? 'breadboard')
}

export function getBreadboardGrid(spec?: BreadboardSpec): BreadboardGrid | undefined {
  return getR2cBreadboard(spec)?.grid ?? getBreadboardMesh(spec)?.gridMm
}

export function getComponentRepresentations(id: string): ComponentRepresentations {
  const kit = getKitPartProfile(id)
  const mesh = meshes.get(id)
  return { schematicSymbol: specificSymbols.has(id) || kit || catalogMeshes.some(item => item.id === id) ? 'specific' : 'generic', illustration2d: true,
    cssBlock3d: componentRegistry.some((part) => part.id === id) && (!kit || Boolean(mesh)), mesh }
}
