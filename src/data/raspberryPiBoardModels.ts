import type { BoardFeature, BoardModelManifest } from '../components/board/boardSceneTypes'
import pico from './raspberry-pi-pico.mesh-inventory.json'
import picoW from './raspberry-pi-pico-w.mesh-inventory.json'
import pico2 from './raspberry-pi-pico-2.mesh-inventory.json'
import pico2H from './raspberry-pi-pico-2-h.mesh-inventory.json'
import { getBoardAssetVersion } from './boardAssetVersions'
import { getRaspberryPiPicoPinout } from './raspberryPiPicoPinout'

type MeshInventory = { boardId: string; sourceFile: string; sourceSha256: string; meshCount: number; componentCount: number; nodes: Array<{ nodeName: string; sourceMeshes: number; sourceName: string }> }
type ModelSource = { id: string; name: string; revision: string; mcu: string; inventory: MeshInventory; sourceUrl: string }

const sources: ModelSource[] = [
  { id: 'raspberry-pi-pico', name: 'Raspberry Pi Pico', revision: 'Pico R3 · CAD tham chiếu chính hãng', mcu: 'RP2040', inventory: pico, sourceUrl: 'https://pip.raspberrypi.com/categories/610-raspberry-pi-pico' },
  { id: 'raspberry-pi-pico-w', name: 'Raspberry Pi Pico W', revision: 'Pico W · CAD tham chiếu chính hãng', mcu: 'RP2040', inventory: picoW, sourceUrl: 'https://pip.raspberrypi.com/categories/686-raspberry-pi-pico-w' },
  { id: 'raspberry-pi-pico-2', name: 'Raspberry Pi Pico 2', revision: 'Pico 2 · CAD tham chiếu chính hãng', mcu: 'RP2350', inventory: pico2, sourceUrl: 'https://pip.raspberrypi.com/categories/1005-raspberry-pi-pico-2' },
  { id: 'raspberry-pi-pico-2-h', name: 'Raspberry Pi Pico 2 H', revision: 'Pico 2 H · SC1632 · with headers', mcu: 'RP2350', inventory: pico2H, sourceUrl: 'https://pip.raspberrypi.com/categories/1264-raspberry-pi-pico-2-h' },
]

function labelFor(boardId: string, nodeName: string, sourceName: string, mcu: string): { name: string; role: string; evidence: 'source-backed' | 'unverified' } {
  const key = `${nodeName} ${sourceName}`.toLowerCase()
  const backed = (name: string, role: string) => ({ name, role, evidence: 'source-backed' as const })
  const unknown = (name: string, role: string) => ({ name, role, evidence: 'unverified' as const })
  if (key.includes('rp2040') || key.includes('microcontroller')) return backed(`Vi điều khiển ${mcu}`, 'MCU chính của board; chạy chương trình và điều khiển các ngoại vi qua GPIO.')
  if (key.includes('rp2350')) return backed('Vi điều khiển RP2350', 'MCU chính của Pico 2; chạy chương trình và điều khiển các ngoại vi qua GPIO.')
  if (key.includes('pico_ref_switch')) return backed('Nút BOOTSEL', 'Dùng để vào chế độ nạp chương trình khi kết hợp thao tác kết nối USB theo hướng dẫn của hãng.')
  if (key.includes('pico_ref_led')) return boardId === 'raspberry-pi-pico-w'
    ? backed('LED trạng thái không dây', 'Trên Pico W, LED do chip vô tuyến CYW43439 điều khiển qua WL_GPIO0; không phải GPIO25 của RP2040.')
    : backed('LED trạng thái trên board', 'Trên Pico và Pico 2, LED do RP2040/RP2350 điều khiển qua GPIO25.')
  if (key.includes('pico_ref_onsemi')) return unknown('Linh kiện thuộc nhóm ON Semiconductor', 'Tên nhóm nhà sản xuất được ghi trong CAD. Chưa xác định được mã linh kiện, designator hoặc nhiệm vụ nếu thiếu BOM/schematic đã đối chiếu.')
  if (key.includes('pico_bourns')) return unknown('Linh kiện thuộc nhóm Bourns', 'CAD ghi tên nhóm nhà sản xuất; không đủ dữ liệu để kết luận đây là cuộn cảm hay chức năng cụ thể trên Pico R3.')
  if (key.includes('pico_murata')) return unknown('Linh kiện thuộc nhóm Murata', 'CAD ghi tên nhóm nhà sản xuất; mã linh kiện và vai trò cần đối chiếu BOM/schematic.')
  if (key.includes('pico_richtek')) return unknown('IC thuộc nhóm Richtek', 'Tên CAD gợi ý nhà sản xuất nhưng chưa xác nhận part number hoặc chức năng của linh kiện trên Pico R3.')
  if (key.includes('pico_diodes')) return unknown('Linh kiện thuộc nhóm Diodes Incorporated', 'Tên CAD gợi ý nhà sản xuất; loại linh kiện và cực tính cần xác minh theo BOM/schematic.')
  if (key.includes('pico_ael')) return unknown('Linh kiện CAD · AEL', 'Tên thư viện trong CAD được giữ nguyên; không đủ căn cứ xác định mã hoặc chức năng.')
  if (key.includes('pico_winbond')) return unknown('IC thuộc nhóm Winbond', 'Tên nhà sản xuất trong CAD chưa đủ để xác nhận mã chip hoặc vai trò trong board; cần đối chiếu BOM.')
  if (key.includes('soldermask')) return backed(nodeName.includes('BOTTOM') ? 'Lớp soldermask mặt dưới' : 'Lớp soldermask mặt trên', 'Lớp phủ cách điện của PCB trong dữ liệu CAD.')
  if (key.includes('ref_board')) return backed('PCB · nền bo mạch', 'Hình học bo mạch trong mô hình CAD.')
  if (key.includes('dielectric')) return backed('Lõi điện môi PCB', 'Lớp nền vật liệu của bo mạch trong mô hình CAD.')
  if (key.includes('rf_shield')) return backed('Vỏ chắn RF của module vô tuyến', 'Vỏ kim loại che cụm vô tuyến; không đại diện cho chip bên trong hoặc anten.')
  if (key.includes('usb_c')) return backed('Đầu nối USB-C', 'Đầu nối cấp nguồn và giao tiếp USB của board.')
  if (key.includes('usb_micro') || key.includes('690-005-298-486')) return backed('Đầu nối USB', 'Đầu nối cấp nguồn và nạp chương trình; kiểu chân/định danh lấy theo CAD.')
  if (key.includes('generic_res')) return unknown(`Điện trở SMD · ${nodeName.match(/c(\d{4})/i)?.[1] ? `package ${nodeName.match(/c(\d{4})/i)?.[1]}` : 'package CAD'}`, 'CAD chỉ cho biết hình học/package. Chưa xác minh designator, trị số hoặc chức năng trên mạch.')
  if (key.includes('generic_cap')) return unknown(`Tụ gốm SMD · ${nodeName.match(/c(\d{4})/i)?.[1] ? `package ${nodeName.match(/c(\d{4})/i)?.[1]}` : 'package CAD'}`, 'CAD chỉ cho biết hình học/package. Chưa xác minh designator, điện dung hoặc vị trí trong nhánh mạch.')
  if (key.includes('generic_sod') || key.includes('diodes')) return unknown(`Diode SMD · ${nodeName}`, 'Tên/package CAD chưa cho biết loại diode, cực tính hay chức năng; cần đối chiếu schematic và BOM.')
  if (key.includes('generic_sot')) return unknown(`Linh kiện bán dẫn SMD · ${nodeName}`, 'Package nhỏ trong CAD; chưa xác định được mã linh kiện hoặc chức năng.')
  if (key.includes('generic_xtal') || key.includes('xtal')) return unknown(`Thạch anh · ${nodeName}`, 'CAD nhận diện dạng linh kiện tạo xung; tần số và mạch sử dụng cần đối chiếu schematic/BOM.')
  if (key.includes('generic_ind') || key.includes('bourns_srn')) return unknown(`Cuộn cảm SMD · ${nodeName}`, 'Tên CAD cho biết linh kiện/cuộn cảm và package; chức năng cụ thể cần đối chiếu sơ đồ nguồn.')
  if (key.includes('winbond')) return unknown(`Linh kiện Winbond · ${nodeName}`, 'Tên nhà cung cấp trong CAD chưa đủ để khẳng định mã chip hoặc chức năng; đối chiếu BOM để xác nhận.')
  if (key.includes('richtek') || key.includes('rt-wdfn')) return unknown(`IC/package ${nodeName}`, 'CAD cho biết nhà cung cấp hoặc package; chức năng chưa được gán khi thiếu đối chiếu schematic/BOM.')
  if (key.includes('toneparts')) return unknown(`Linh kiện CAD · ${nodeName}`, 'Tên thư viện nhà cung cấp được giữ nguyên; chức năng trên board chưa xác minh.')
  if (key.includes('pad')) return unknown(`Cụm pad PCB · ${nodeName}`, 'Pad/kết nối được lấy từ mô hình CAD; tên net và chức năng chưa được xác minh.')
  if (key.includes('silkscreen')) return backed('Lớp chữ in silkscreen', 'Lớp ký hiệu in trên PCB trong dữ liệu CAD.')
  if (key.includes('pcb')) return backed('PCB · nền bo mạch', 'Hình học bo mạch trong mô hình CAD.')
  if (key.includes('geometry')) return unknown(`Hình học CAD chưa định danh · ${nodeName.replace('CAD_GEOMETRY_', 'mesh ')}`, 'Mesh có trong file CAD nhưng không có mã/designator đủ rõ để gọi tên hoặc khẳng định chức năng.')
  return unknown(`Linh kiện CAD · ${nodeName}`, `Tên lấy nguyên trạng từ CAD tham chiếu ${mcu}; chức năng và kết nối chưa xác minh từ schematic/BOM.`)
}

function makeManifest(source: ModelSource): BoardModelManifest {
  const assetVersion = getBoardAssetVersion(`/models/${source.id}.glb`)
  const assetUrl = `/models/${source.id}.glb?v=${assetVersion}`
  const pinout = getRaspberryPiPicoPinout(source.id)
  const features: BoardFeature[] = source.inventory.nodes.map((node) => {
    const label = labelFor(source.id, node.nodeName, node.sourceName, source.mcu)
    const id = `component-${node.nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
    return {
      id,
      name: label.name,
      plainDescription: `${label.role} Vị trí và hình học được lấy từ file CAD tham chiếu; đây không phải ảnh quét board thương mại.`,
      technicalRole: label.role,
      connection: `CAD ghi nhận mesh “${node.nodeName}” gồm ${node.sourceMeshes} mesh con. Không có netlist ở nguồn này để khẳng định kết nối điện.`,
      placementReason: 'Vị trí được lấy từ mô hình CAD của nhà sản xuất. Lý do bố trí riêng của linh kiện chưa được xác minh.',
      placementEvidence: 'cad',
      roleEvidence: label.evidence,
      safetyNote: `Board tham chiếu ${source.revision}; kiểm tra đúng biến thể trước khi đấu mạch thật. Viewer chỉ trình bày hình học, không mô phỏng điện hoặc firmware.`,
      relatedLessonPartIds: [],
    }
  })
  const hotspots = features.map((feature, index) => ({ id: `hotspot-${index}`, featureId: feature.id, label: feature.name, nodeNames: [source.inventory.nodes[index].nodeName] }))
  return {
    id: source.id,
    assetUrl,
    assetVersion,
    features,
    hotspots,
    pins: pinout?.pins ?? [],
    signalFlows: [],
    pinPicking: Boolean(pinout?.pins.length),
    pinoutEvidence: pinout?.evidence,
    audit: {
      status: 'cad-reference', revision: source.revision,
      sourceRefs: [
        { path: source.inventory.sourceFile, sha256: source.inventory.sourceSha256, license: source.id === 'raspberry-pi-pico-2-h' ? 'MIT; original license and accuracy disclaimer bundled with STEP source and board notice' : 'Raspberry Pi model-file terms; see bundled notice and board-specific restrictions', role: 'Official mechanical STEP; converted locally to GLB' },
        ...(pinout ? [{ url: `https://datasheets.raspberrypi.com/${source.id === 'raspberry-pi-pico-w' ? 'picow/PicoW-A4-Pinout.pdf' : 'pico/Pico-2-Pinout.pdf'}`, role: 'Official pinout; physical labels, alternate functions and electrical notes' }] : []),
        ...(source.id === 'raspberry-pi-pico' ? [{ path: 'assets/boards/vendor/raspberry-pi/official-allegro/RPI-PICO-R3a-PUBLIC.brd', sha256: 'C9C6D1E95409B68B77501093EF42EA266D7F30025F907E4A962167E088BEDEBD', role: 'Official Allegro board source; J0 through-hole pad centers and net names imported with KiCad CLI 10.0.7' }] : []),
        ...(source.id === 'raspberry-pi-pico-w' ? [{ path: 'assets/boards/vendor/raspberry-pi/official-allegro/rpi-picow-r3-2.brd', sha256: '574C6112A3418DFF77717F87E62839F5205CF9FD1899350F4CE16610DEE731A5', role: 'Official Allegro board source; J0 through-hole pad centers and net names imported with KiCad CLI 10.0.7' }] : []),
        ...(source.id === 'raspberry-pi-pico-2' || source.id === 'raspberry-pi-pico-2-h' ? [{ url: 'https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html', role: 'Manufacturer states Pico 2 and Pico 2 with headers share physical layout and pinout with non-wireless Pico; used to transfer the 40-pin layout, not as a board-specific Allegro source' }] : []),
      ],
      unverifiedReferences: source.inventory.nodes.filter((node) => node.sourceName === 'Hình học không có tên trong CAD').map((node) => node.nodeName),
      auditNotes: [`${source.inventory.meshCount} source meshes grouped into ${source.inventory.componentCount} selectable CAD nodes.`, 'Color in the viewer is an educational contrast aid for the originally monochrome Pico CAD; it does not claim the physical package color. Verified labels are limited to roles documented by Raspberry Pi; vendor-only and generic package geometry stays explicitly unverified. No netlist-based electrical mapping is included.', ...(pinout ? [pinout.evidence.summary, 'Selectable pin anchors correspond to the J0 through-hole pad centers. Pin function labels are sourced separately from Raspberry Pi pinout diagrams. Selection is informational only; it does not imply a live net, copper trace, firmware signal, or electrical simulation.'] : []), ...(source.id === 'raspberry-pi-pico-w' ? ['Pico W documentation lists an antenna licensing exception; the viewer is not an antenna model or RF simulation.'] : []), ...(source.id === 'raspberry-pi-pico-2-h' ? ['Raspberry Pi distributes this Pico 2 H STEP with an MIT license and warns that CAD models are guidance only, may not reflect current revisions, and require physical measurements for fitment.'] : [])],
    },
    scenes: [{
      id: 'pcb', label: 'PCB · mô hình CAD', assetUrl, assetVersion, hotspots,
      note: `Mô hình CAD tham chiếu ${source.revision}. Có thể xoay, zoom và chọn ${features.length} nhóm hình học. Màu được tăng tương phản để dễ phân biệt chi tiết, không khẳng định màu linh kiện thật. Mesh chưa có tên trong nguồn được đánh dấu chưa định danh. Không mô phỏng firmware, tín hiệu hay điện áp.`,
    }],
  }
}

export const raspberryPiBoardModels = sources.map(makeManifest)
