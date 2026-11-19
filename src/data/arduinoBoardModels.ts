import type { BoardFeature, BoardModelManifest, BoardPin } from '../components/board/boardSceneTypes'
import { arduinoBoardCadComponents } from './arduinoBoardCadComponents'
import { getBoardAssetVersion } from './boardAssetVersions'
import headerPins from './arduino-header-pins.json'

type ArduinoHeaderPad = {
  id: string
  label: string
  headerReference: string
  padNumber: string
  position: number
  netName?: string
  anchor: number[]
}

const padsByBoard: Record<string, ArduinoHeaderPad[]> = headerPins

type Definition = {
  id: string; name: string; asset: string; version: string; mcu: string; mcuRef: string
  usb: string; usbBridge: string; usbRef: string; size: [number, number]
  pinNames: string[]; logic: string; headers: string; power: string; componentRefs: string[]
}

const definitions: Definition[] = [
  { id:'arduino-uno-r3',name:'Arduino Uno R3',asset:'arduino-uno-r3',version:'3.5.0',mcu:'ATmega328P · DIP-28',mcuRef:'ZU4',usb:'USB-B',usbBridge:'ATmega16U2',usbRef:'U3',size:[68.6,53.4],pinNames:['D0/RX','D1/TX','D2','D3/PWM','D4','D5/PWM','D6/PWM','D7','D8','D9/PWM','D10/PWM','D11/PWM','D12','D13','A0','A1','A2','A3','A4/SDA','A5/SCL','5V','3V3','GND','VIN','RESET'],logic:'5 V',headers:'CAD thể hiện các footprint pad header dọc mép; trạng thái đã lắp đầu nối có thể khác theo phiên bản sản phẩm.',power:'U1 tạo rail 5 V; U2 tạo rail 3,3 V; bảo vệ đầu vào và tụ lọc nằm gần các nhánh nguồn.',componentRefs:['RX0','ICSP0','ON0','TX0','PC1','U3','L0','RN4','U1','ZU4','AD0','U2','RN1','R2','C11','C3','C9','C7','C1','U5','C4','D3','ICSP1','RN3','IOH0','C8','D2','PC2','RN2','C10','IOL0','C6','C5','POWER0','R1','C2'] },
  { id:'arduino-nano-classic',name:'Arduino Nano classic',asset:'arduino-nano-classic',version:'3.5.0',mcu:'ATmega328P-32MUR · VQFN-32',mcuRef:'IC3',usb:'Mini-B',usbBridge:'FT232RL',usbRef:'IC1',size:[45,18],pinNames:['D0/RX','D1/TX','D2','D3/PWM','D4','D5/PWM','D6/PWM','D7','D8','D9/PWM','D10/PWM','D11/PWM','D12','D13','A0','A1','A2','A3','A4/SDA','A5/SCL','A6','A7','5V','3V3','GND','VIN','RESET'],logic:'5 V',headers:'CAD thể hiện hàng lỗ pad ở hai cạnh và footprint ICSP; header chỉ là phụ kiện được hàn tùy cách lắp board.',power:'IC2 tạo rail 5 V; diode chọn nguồn và tụ lọc theo sơ đồ Nano classic.',componentRefs:['TX0','J3','L0','RX0','IC3','PWR0','C8','C9','IC1','C6','RP1','RP2','IC2','C3','C7','C1','C4','J1','J2','J4'] },
  { id:'arduino-mega-2560-r3',name:'Arduino Mega 2560 R3',asset:'arduino-mega-2560-r3',version:'3.5.0',mcu:'ATmega2560 · TQFP-100',mcuRef:'IC3',usb:'USB-B',usbBridge:'ATmega16U2',usbRef:'IC4',size:[101.52,53.3],pinNames:['D0/RX0','D1/TX0',...Array.from({length:18},(_,i)=> { const n=i+2; const uart: Record<number,string>={14:'TX3',15:'RX3',16:'TX2',17:'RX2',18:'TX1',19:'RX1'}; return `D${n}${n<=13?'/PWM':uart[n]?`/${uart[n]}`:''}` }),'D20/SDA','D21/SCL',...Array.from({length:32},(_,i)=>`D${i+22}`).map((p)=>[2,3,4,5,6,7,8,9,10,11,12,13,44,45,46].includes(Number(p.match(/\d+/)?.[0]))?`${p}/PWM`:p),...Array.from({length:16},(_,i)=>`A${i}`),'5V','3V3','GND','VIN','RESET'],logic:'5 V',headers:'CAD thể hiện các footprint pad cho dãy I/O, nguồn và ICSP; trạng thái lắp header có thể khác theo phiên bản board.',power:'IC1 tạo rail 5 V; IC6 tạo rail 3,3 V; bảo vệ và tụ lọc đặt quanh các nhánh nguồn.',componentRefs:['C1','R2','C3','C11','RX0','D3','RN5','R1','PC2','D2','C15','C7','RN4','C6','RN1','IC7','C16','POWER0','ICSP1','ON0','RN3','ADCL0','C14','IC6','C9','IC3','RN2','TX0','XIO0','ADCH0','ICSP0','C12','C10','IC4','C5','COMMUNICATION0','L0','C8','C2','IC1','PWML0','PC1','C4','C13'] },
]

function curatedDetail(d: Definition, ref: string): BoardFeature {
  const isNanoIcspPads = d.id === 'arduino-nano-classic' && ref === 'J4'
  const isHeader = !isNanoIcspPads && /^(IOH0|IOL0|POWER0|AD0|ADCL0|ADCH0|COMMUNICATION0|PWML0|XIO0|ICSP\d|J1|J2|J4)$/.test(ref)
  const isLed = /^(RX0|TX0|ON0|L0|PWR0)$/.test(ref)
  const isCap = /^(C|PC)\d/.test(ref)
  const isResistor = /^(R|RN|RP)\d/.test(ref)
  const isUsb = ref === 'J3'
  const isMcu = ref === d.mcuRef
  const isBridge = ref === d.usbRef
  const isRegulator = ['U1','U2','IC2','IC6'].includes(ref) && !isMcu
  const kind = isMcu ? 'Vi điều khiển' : isBridge ? 'Cầu nối USB–serial' : isUsb ? 'Đầu nối USB' : isNanoIcspPads ? 'Pad nạp ICSP (chưa lắp header)' : isHeader ? 'Header 2,54 mm' : isLed ? 'LED chỉ báo' : isCap ? 'Tụ điện SMD' : isResistor ? 'Điện trở / mạng điện trở SMD' : isRegulator ? 'Bộ ổn áp / nguồn' : ref.startsWith('Y') ? 'Linh kiện tạo xung nhịp' : ref.startsWith('SW') ? 'Nút nhấn' : ref.startsWith('D') ? 'Diode' : 'Linh kiện PCB'
  const name = isMcu ? `${d.mcu} (${ref})` : isBridge ? `${d.usbBridge} (${ref})` : isUsb ? `Cổng USB ${d.usb} (${ref})` : isNanoIcspPads ? `Pad ICSP 2×3 (${ref}; chưa lắp header)` : isHeader ? `Header 2,54 mm (${ref}; thân 3D theo package KiCad tiêu chuẩn)` : isLed ? `LED trạng thái (${ref})` : `${kind} (${ref})`
  const plainDescription = isMcu ? `Đây là bộ xử lý chính của ${d.name}; firmware chạy ở đây và giao tiếp với các chân I/O.` : isBridge ? `IC ${d.usbBridge} chuyển tiếp dữ liệu giữa cổng USB và UART của vi điều khiển.` : isUsb ? 'Đầu nối này đưa nguồn và dữ liệu từ cáp USB vào mạch.' : isNanoIcspPads ? 'J4 là footprint pad ICSP 2×3 trên revision Nano tham chiếu, nhưng header chưa được lắp. Đây là các lỗ/pad hàn, không phải chân cắm dựng đứng.' : isHeader ? 'Header 2,54 mm để cắm dây hoặc shield. CAD chỉ ghi pad; thân header trong 3D lấy theo board chính hãng (có lắp sẵn header) và dùng package KiCad tiêu chuẩn, không phải bản quét.' : isLed ? 'LED báo một trạng thái nguồn hoặc hoạt động của board.' : isCap ? 'Tụ điện giúp lọc nhiễu hoặc ổn định điện áp tại một nhánh mạch.' : isResistor ? 'Điện trở hoặc mạng điện trở đặt mức tín hiệu, phân cực hoặc giới hạn dòng theo sơ đồ.' : isRegulator ? 'Khối này tham gia tạo hoặc ổn định rail nguồn cho board.' : `${kind} được đặt theo footprint ${ref} trong CAD của board tham chiếu.`
  const connection = isMcu ? 'Các chân MCU kết nối với header và các khối ngoại vi theo mạch đồng trên PCB.' : isBridge ? `USB ↔ ${d.usbBridge} ↔ UART MCU (${d.mcuRef}); USB-serial dùng khi nạp/chẩn đoán.` : isUsb ? `Máy tính ↔ USB ↔ ${d.usbBridge} (${d.usbRef}); đường nguồn đi tới khối nguồn của board.` : isNanoIcspPads ? 'Các pad này đưa SPI, RESET, nguồn và GND ra footprint ICSP để nạp/debug khi gắn thêm header tương thích. Board tham chiếu không có header được lắp tại J4.' : isHeader ? 'Các lỗ/pad trên PCB nối với net I/O, nguồn hoặc GND theo pinout và schematic; khi lắp header, chân cắm mới tiếp cận được các tín hiệu này.' : isLed ? 'LED được điều khiển bởi rail nguồn hoặc một tín hiệu trạng thái qua điện trở hạn dòng.' : isCap ? 'Tụ nối giữa rail nguồn/tín hiệu và GND theo schematic; mã trị số cần xem BOM.' : isResistor ? 'Hai đầu/mạng điện trở nối các net theo schematic; trị số cần xem BOM của đúng revision.' : isRegulator ? d.power : 'Vai trò cụ thể phụ thuộc net trong schematic; đối chiếu designator với sơ đồ và BOM.'
  const placementReason = isMcu ? 'MCU ở vùng trung tâm có thể giúp các đường tín hiệu tỏa tới nhiều cụm I/O. Đây là suy luận từ layout, không phải xác nhận của nhà thiết kế.' : isUsb || isBridge ? 'Cổng USB nằm sát mép để cắm cáp; IC USB–serial ở gần giúp đường USB ngắn. Đây là suy luận từ layout.' : isNanoIcspPads ? 'J4 nằm gần đầu board, thuận tiện tiếp cận đầu nạp ngoài. Vì header không được lắp trên revision tham chiếu, mô hình chỉ thể hiện footprint pad theo CAD.' : isHeader ? 'Header nằm dọc mép board để dây hoặc shield tiếp cận dễ dàng. Đây là suy luận từ bố cục.' : isRegulator ? 'Khối nguồn gần nhánh cấp nguồn giúp phân phối rail đã ổn áp. Đây là suy luận từ vị trí linh kiện và sơ đồ khối.' : isLed ? 'LED đặt ở vị trí dễ quan sát từ ngoài board. Đây là suy luận từ bố cục.' : 'CAD cho biết vị trí của linh kiện; lý do thiết kế riêng cho designator này chưa được xác minh. Phần giải thích này chỉ nêu nguyên tắc bố trí chung.'
  return { id:`component-${ref}`,designator:ref,name,plainDescription,technicalRole:`${kind}; tham chiếu ${ref} trên board ${d.name}.`,connection,placementReason,placementEvidence:'principle',roleEvidence:'unverified',safetyNote:`Board mẫu tham chiếu ${d.name}; clone/revision khác có thể đổi linh kiện. Mức logic tham chiếu ${d.logic}.`,relatedLessonPartIds:[] }
}

function cadDetail(d: Definition, component: typeof arduinoBoardCadComponents[string]['components'][number]): BoardFeature {
  const footprintOnly = !component.has3dBody
  const value = component.value && component.value !== 'DNP' ? component.value : ''
  const label = value ? `${value} (${component.reference})` : `${component.reference} · ${component.footprint}`
  return {
    id: `component-${component.reference}`, designator: component.reference,
    name: `${label}${footprintOnly ? ' · footprint' : ''}`,
    plainDescription: `${component.reference} có footprint${value ? ` với giá trị CAD “${value}”` : ''}. Mô hình tham chiếu ghi nhận vị trí, góc xoay và mặt PCB; chức năng cụ thể chưa xác minh từ BOM/schematic.`,
    technicalRole: `Designator ${component.reference}; footprint ${component.footprint || 'không ghi'}. Chức năng chưa xác minh.`,
    connection: `CAD đặt ${component.reference} tại (${component.x.toFixed(2)}, ${component.y.toFixed(2)}) mm, xoay ${component.rotation}° ở mặt ${component.side === 'front' ? 'trên' : 'dưới'}.`,
    placementReason: 'Tọa độ, góc xoay và mặt lấy trực tiếp từ CAD. Lý do thiết kế riêng cho vị trí này chưa được xác minh.',
    placementEvidence: 'cad', roleEvidence: 'unverified',
    cadFootprint: { ...component },
    safetyNote: `Đây là CAD tham chiếu ${d.name}, không đảm bảo mọi clone/revision có cùng BOM. ${footprintOnly ? 'Không có mesh 3D được đặt tên tương ứng trong GLB; danh sách chỉ cho xem dấu chân CAD.' : 'Mesh 3D là package tham chiếu, không phải bản quét sản phẩm.'}`,
    relatedLessonPartIds: [],
  }
}

export const arduinoBoardModels: BoardModelManifest[] = definitions.map((d) => {
  const cad = arduinoBoardCadComponents[d.id]
  const curated = new Map(d.componentRefs.map((ref) => [ref, curatedDetail(d,ref)]))
  const features: BoardFeature[] = cad.components.map((component) => {
    const base = curated.get(component.reference) ?? cadDetail(d, component)
    return { ...base, cadFootprint: { ...component }, placementEvidence: 'cad' as const, placementReason: 'Tọa độ, góc xoay và mặt lấy trực tiếp từ CAD. Lý do thiết kế riêng cho vị trí này chưa được xác minh.', roleEvidence: 'unverified' as const }
  })
  const hotspots = features.map((item) => ({id:`hotspot-${item.id}`,featureId:item.id,label:item.name,nodeNames:item.cadFootprint?.has3dBody ? [item.designator ?? ''] : []}))
  const labelsById = new Map(d.pinNames.map((label, index) => [`pin-${index + 1}`, label]))
  const pads = padsByBoard[d.id]
  const pins: BoardPin[] = pads.map(pad => {
    const label = labelsById.get(pad.id) ?? pad.label
    const isExtraContact = !labelsById.has(pad.id)
    const isPower = ['5V','3V3','GND','VIN','RESET'].includes(label), analog = label.startsWith('A'), uart = label.includes('RX') || label.includes('TX') || label === 'D0' || label === 'D1'
    const isMega = d.id === 'arduino-mega-2560-r3'
    const functions = label.includes('PWM') ? ['Digital I/O','PWM'] : analog ? ['ADC analog input',...(!isMega && label.includes('A4')?['I²C SDA']:[]),...(!isMega && label.includes('A5')?['I²C SCL']:[])] : label.includes('SDA') ? ['Digital I/O','I²C SDA'] : label.includes('SCL') ? ['Digital I/O','I²C SCL'] : uart ? ['Digital I/O','UART',...(label.includes('/') ? [label.split('/')[1]] : [])] : !isPower ? ['Digital I/O'] : label === 'GND' ? ['Ground'] : ['Nguồn / điều khiển']
    const padRoles = isExtraContact && !isPower
      ? label === 'NC' ? ['Không nối'] : label === 'IOREF' || label === 'AREF' ? ['Điện áp tham chiếu'] : ['Tiếp điểm theo CAD']
      : functions
    return {
      ...pad, label, side: 'reference',
      anchor: [pad.anchor[0], pad.anchor[1], pad.anchor[2]],
      plainDescription: `Chân ${label}, pad ${pad.padNumber} của ${pad.headerReference} trên ${d.name}.`,
      technicalRole: padRoles.join(' · '),
      connection: pad.netName ? `Net ${pad.netName} trên PCB tham chiếu.` : 'Pad chưa nối net trong CAD.',
      safetyNote: `Mức logic GPIO tham chiếu ${d.logic}. Đối chiếu pinout và revision trước khi đấu.`,
      functions: padRoles,
    }
  })
  for (const feature of features) {
    const headerPads = pads.filter(pad => pad.headerReference === feature.designator)
    if (feature.cadFootprint && headerPads.length) feature.cadFootprint = {
      ...feature.cadFootprint, pads: headerPads.map(pad => ({ number: pad.padNumber, net: pad.netName ?? null })),
    }
  }
  const assetVersion=getBoardAssetVersion(`/models/${d.asset}.glb`)
  const url=`/models/${d.asset}.glb?v=${assetVersion}`
  const signalFlows=[{id:'program',title:'Nạp chương trình',summary:'Dữ liệu từ máy tính đi qua USB và cầu nối nối tiếp tới MCU.',steps:['IDE biên dịch sketch','USB truyền dữ liệu qua IC giao tiếp','Bootloader nhận firmware','MCU chạy chương trình'],relatedPinIds:[],note:`Board này dùng ${d.usbBridge}; bootloader phụ thuộc phiên bản.`},{id:'power',title:'Đường cấp nguồn',summary:'Nguồn vào được bảo vệ/ổn áp rồi phân phối tới các khối.',steps:['Nguồn vào qua USB hoặc cổng được hỗ trợ','Mạch bảo vệ và ổn áp xử lý nguồn','Rail nguồn cấp MCU và ngoại vi'],relatedPinIds:[],note:'Đây là sơ đồ khối tham khảo, không mô phỏng điện.'}]
  return {id:d.id,assetUrl:url,assetVersion,features,hotspots,pins,signalFlows,pinPicking:true,pinoutEvidence:{summary:`Tọa độ chân ${d.name} lấy từ pad CAD Arduino. Đối chiếu tên và revision trước khi nối board thật.`,sourceLabel:`Pinout chính thức ${d.name}`,sourceUrl:`https://docs.arduino.cc/resources/pinouts/${d.id === 'arduino-mega-2560-r3' ? 'A000067' : d.id === 'arduino-nano-classic' ? 'A000005' : 'A000066'}-full-pinout.pdf`},audit:{status:'cad-reference',revision:cad.revision,sourceRefs:cad.sourceRefs,unverifiedReferences:cad.unverifiedReferences,auditNotes:cad.auditNotes},scenes:[{id:'pcb',label:'PCB theo CAD',assetUrl:url,assetVersion,hotspots,note:`${d.name} · CAD ${cad.revision}. Danh sách gồm đủ ${cad.components.length} footprint CAD; ${cad.components.filter((component)=>component.has3dBody).length} có mesh 3D trong GLB. Footprint còn lại không được dựng thành vật thể giả. Vị trí theo CAD; chức năng và BOM của clone cần xác minh riêng.`}]}
})
