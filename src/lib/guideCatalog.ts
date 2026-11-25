import { boards } from '../data/boards'
import { components } from '../data/components'
import { getComponentReferences, getComponentSourceLevel, componentSourceLevels } from '../data/componentReferences'
import { componentRegistry } from '../data/componentRegistry'
import { curriculumLessons, simulationModeLabels } from '../data/curriculumSchema'
import { builderLessons } from '../data/builderLessons'
import { simulationTargets } from '../data/simulationTargets'
import { productFeatureRegistry } from '../data/productFeatureRegistry'
import { getLessonEntryRoute } from '../data/learningPath'
import type { GuideArticle, GuideSource } from './guideKnowledge'

export type GuideCatalogEntry = GuideArticle & { family: 'board' | 'component' | 'workspace' | 'lesson' | 'feature' | 'calculator'; entityId: string }
const source = (label: string, href: string): GuideSource => ({ label, href })
const uniqueSources = (items: GuideSource[]) => items.filter((s, i) => /^(https:\/\/|\/[^/])/.test(s.href) && items.findIndex(x => x.href === s.href) === i)
const alias = (...items: (string | undefined)[]) => [...new Set(items.filter((x): x is string => Boolean(x)))]
const boardAliases: Record<string, string[]> = {
  'arduino-uno-r3': ['Uno R3','Uno Rev3','ATmega328P Uno'], 'arduino-nano-classic':['Nano classic'],
  'arduino-mega-2560-r3':['Mega 2560','Mega R3'], 'stm32-nucleo':['NUCLEO-F401RE','F401RE'],
  'stm32-blue-pill-f103':['Blue Pill','STM32F103C8T6'], 'raspberry-pi-pico':['Pico RP2040','Pico thường'],
  'raspberry-pi-pico-w':['Pico W'], 'raspberry-pi-pico-2':['Pico 2'], 'raspberry-pi-pico-2-h':['Pico 2 H','SC1632'],
  'arduino-uno-r4-minima':['Uno R4 Minima'], 'arduino-uno-r4-wifi':['Uno R4 WiFi'],
  'adafruit-qtpy-esp32-c3-5405':['QT Py ESP32-C3','QT Py 5405'],
  'adafruit-feather-esp32-s3-tft-5483':['Feather 5483'], 'adafruit-feather-esp32-s3-5323':['Feather 5323'],
}
const boardEntries: GuideCatalogEntry[] = boards.map(board => {
  const target = simulationTargets.find(t => t.boardId === board.id) // never use fallback-to-ESP32 target lookup
  const sources = uniqueSources([...(board.referenceDocs ?? []).map(d => source(d.label,d.url)), ...[board.sourceEvidenceUrl,board.sourceUrl].filter((s):s is string=>Boolean(s)).map(href=>source('Nguồn hồ sơ / revision board',href))])
  return {
    id:`board:${board.id}`,family:'board',entityId:board.id,title:board.name,aliases:alias(board.id,board.name,...boardAliases[board.id]??[]),
    paragraphs:[
      board.description,
      `MCU: ${board.mcu ?? 'chưa xác nhận'}. Revision: ${board.revision ?? 'chưa xác nhận trong hồ sơ'}. Mức logic: ${board.logicLevel ?? 'chưa xác nhận; đối chiếu datasheet đúng board'}. ${board.interfaceSummary ?? ''}`,
      [board.bestFor && `Phù hợp: ${board.bestFor}`,board.tradeoffs && `Cân nhắc: ${board.tradeoffs}`].filter(Boolean).join(' ') || 'Chọn board theo ngoại vi, nguồn và công cụ cần dùng; cùng hình dáng header không chứng minh tương thích điện hoặc firmware.',
      target ? `Trong target giáo dục của ứng dụng, LED ngoài dùng ${target.pinLabel}, số code ${target.codePin}. Đây là mapping của bài hỗ trợ, không phải gợi ý nối dây mới hoặc xác nhận mọi GPIO. ${target.adcFullScale !== undefined ? `ADC full-scale mặc định được ghi trong target: ${target.adcFullScale}; không phải số đo ADC vật lý của mạch đang mở.` : 'Kho target chưa xác nhận ADC full-scale cho board này; không tự lấy giá trị từ board khác.'}` : 'Board này chưa có target trong simulationTargets; hồ sơ hoặc hình 3D không có nghĩa hỗ trợ chạy firmware, trace hay circuit solver.',
      `${board.modelNote ?? 'Hình học là tham chiếu; cần đối chiếu đúng phiên bản board thật.'} Không suy ra pinout/giới hạn của clone hay module khác từ hồ sơ này.`,
    ],source:source('Mở hồ sơ board',`/boards?board=${board.id}`),sources,evidence:[`src/data/boards.ts: ${board.id}`,...(target?[`src/data/simulationTargets.ts: ${board.id}`]:[])],
  }
})
const componentEntries: GuideCatalogEntry[] = components.map(part => {
  const model = componentRegistry.find(m=>m.catalogId===part.id)
  const boardId = new URLSearchParams((part.boardProfileRoute??part.boardViewerRoute??'').split('?')[1]??'').get('board')
  const board = boardEntries.find(b=>b.entityId===boardId)
  const references = getComponentReferences(part.id)
  const level = getComponentSourceLevel(part.id)
  const sources = uniqueSources([...references.map(r=>source(`${r.label} · ${r.kind}`,r.url)),...(part.source?[source('Tài liệu được ghi trong catalog',part.source)]:[]),...(board?.sources??[])])
  const modelAliases = part.category==='MCU' ? [] : part.name.match(/\b(?:[a-z]{2,}-?\d|\d[a-z])[a-z0-9-]*\b/gi)??[]
  return {id:`component:${part.id}`,family:'component',entityId:part.id,title:part.name,aliases:alias(part.id,part.name,part.name.replace(/\s*\([^)]*\)/g,''),...modelAliases),
    paragraphs:[part.summary,`Cách dùng: ${part.use} Chân/chức năng tham khảo: ${part.pins}`,`Lỗi cần tránh: ${part.caution}`,
      model ? `Trong workspace: ${model.explanation} ${model.simulation==='visual-only'?'Mức của loại linh kiện này là minh họa; không có kết quả giải mạch/firmware hay phép đo thật chỉ từ hình.':'Có hành vi trong ngữ cảnh bài hỗ trợ; không đồng nghĩa mọi cấu hình mạch hoặc thư viện đều được mô phỏng.'}` : 'Catalog có hồ sơ tham khảo; chưa có loại workspace ánh xạ trực tiếp qua catalogId. Xem được hình/hồ sơ không chứng minh mô phỏng điện hoặc firmware.',
      ...(model ? [`Chân trong mô hình workspace: ${model.pins.map(pin=>pin.label).join('; ')}. Đây là nhãn chức năng của mô hình đã ánh xạ, không tự xác nhận pinout package hoặc mọi breakout.`,`Lưu ý của mô hình: ${model.safetyNotes}`] : []),
      `${componentSourceLevels[level].label}: ${componentSourceLevels[level].note} ${level !== 'exact' ? 'Hồ sơ chưa xác nhận datasheet/MPN của đúng module/linh kiện thật; tài liệu chip hoặc hướng dẫn chung không thay xác minh package, công suất và pinout.' : 'Vẫn cần xác minh đúng revision của sản phẩm thật.'}`,
      ...references.map(r=>`Phạm vi nguồn ${r.label}: ${r.note}`),
    ],source:source('Mở linh kiện trong thư viện',`/components?component=${part.id}`),sources,evidence:[`src/data/components.ts: ${part.id}`,`src/data/componentReferences.ts: ${part.id}`,...(model?[`src/data/componentRegistry.ts: ${model.id}`]:[])],}
})
const workspaceEntries: GuideCatalogEntry[] = componentRegistry.map(part=>{
  const catalog = componentEntries.find(c=>c.entityId===part.catalogId)
  return {id:`workspace:${part.id}`,family:'workspace',entityId:part.id,title:`${part.label} · loại workspace`,aliases:alias(part.id,part.label),paragraphs:[part.explanation,`Chân mô hình: ${part.pins.map(p=>`${p.id}: ${p.label}`).join('; ')}. Đây là định danh mô hình, không phải chân package của mọi sản phẩm thật.`,`Lưu ý: ${part.safetyNotes}`,`Mức hỗ trợ của loại: ${part.simulation==='supported'?'hành vi trong bài/target tương thích, phải kiểm tra ngữ cảnh riêng':'minh họa hình học, không có solver hay firmware execution chỉ từ hình'}. Giá trị trong tên model là ví dụ, không phải trị số tự gán cho linh kiện đang chọn.`],source:catalog?.source??source('Thư viện linh kiện','/components'),sources:catalog?.sources??[],evidence:[`src/data/componentRegistry.ts: ${part.id}`]}
})
const lessonEntries: GuideCatalogEntry[] = curriculumLessons.map(lesson=>{
  const builder = builderLessons.find(b=>b.id===lesson.id)
  return {id:`lesson:${lesson.id}`,family:'lesson',entityId:lesson.id,title:`Bài ${lesson.title}`,aliases:alias(lesson.id,lesson.title,`bài ${lesson.title}`),paragraphs:[`Mục tiêu: ${lesson.objectives.join('; ')}. ${builder?.summary??''}`,`Cách thực hành: ${lesson.guidedSteps.join(' → ')}.`,`Khi kết quả khác dự đoán: ${lesson.debugChallenge}`,`Nguồn kết quả: ${simulationModeLabels[lesson.simulationMode]}. ${lesson.supportedBehavior}`,`Chuyển sang phần cứng: ${lesson.hardwareTransition} ${lesson.safetyNotes.join(' ')}`],source:source('Mở bài và chọn board',getLessonEntryRoute(lesson)),sources:[],evidence:[`src/data/curriculumSchema.ts: ${lesson.id}`,`src/data/builderLessons.ts: ${lesson.id}`]}
})
const featureDetails: Record<string,string[]> = {
  freestyle:['Bàn tự do bắt đầu trống, không tự thêm mạch mẫu. Chọn board đúng biến thể, thêm linh kiện rồi nối dây; Chạy chỉ có ý nghĩa với target/runtime đang công bố.','Kiểm tra topology và đọc lỗi trước khi suy luận. Trace subset, chạy firmware hỗ trợ, solver analog và phép đo thật là bốn loại bằng chứng khác nhau.'],
  community:['Xem bài công khai ở chế độ khách. Đăng nhập để đăng bài và bình luận khi cộng đồng online hoạt động. Chọn nguồn “Trên thiết bị” nếu bạn muốn tiếp tục với bản lưu trong trình duyệt.','Bài và tệp trên thiết bị được lưu trong trình duyệt này. Mỗi bài hỗ trợ tối đa 5 tệp, 10 MiB mỗi tệp và tổng 25 MiB. Bản online hiện hỗ trợ nội dung văn bản.'],
  classroom:['Gói kit và số trạm là kế hoạch cục bộ; không có tài khoản lớp, chấm điểm giáo viên hoặc triển khai thiết bị tự động.','BOM/pin/model tham chiếu không xác nhận cấu hình vật lý đã được phê duyệt hoặc đã lắp đúng.'],
  calculators:['Chọn đúng đơn vị và giả định. Kết quả công thức/model lý tưởng không xác nhận an toàn, dung sai hoặc định mức của linh kiện thật.','Có thể chuyển các bài toán tương thích sang SPICE để xem solver analog; netlist tương đương vẫn là mô hình được khai báo.'],
  firmware:['Intel HEX chứa dữ liệu/địa chỉ, không tự mô tả đúng board MCU. Xác nhận target tương thích trước chạy emulator.','Checksum đúng không chứng minh firmware đúng mạch. Tool không tự flash thiết bị hoặc biên dịch mọi board.'],
  spice:['Netlist và model phải thuộc tập analog được hỗ trợ. Kiểm tra node, giá trị, analysis và đơn vị trên waveform trước khi kết luận.','SPICE trả kết quả solver cho model đó; không chạy firmware MCU, không xác nhận kit thật và không biến toàn bộ PCB thành mạch mô phỏng.'],
  sketch:['Ví dụ chỉ chạy trên runtime/target ghi rõ bên cạnh kết quả. Đọc lỗi dòng, sửa từng thay đổi rồi chạy lại và xem Serial/GPIO.','Thông dịch subset khác firmware compile/execution đầy đủ. Không giả định mọi cú pháp Arduino, MicroPython hay thư viện phần cứng đều chạy.'],
}
const featureEntries: GuideCatalogEntry[] = Object.values(productFeatureRegistry).map(f=>({id:`feature:${f.id}`,family:'feature',entityId:f.id,title:f.title,aliases:alias(f.id,f.title,f.publicLabel,f.appLabel,...(f.id==='community'?['cộng đồng','online','đăng bài']:f.id==='spice'?['SPICE','ngspice']:f.id==='firmware'?['Intel HEX']:[])),paragraphs:[f.id==='community'?'Hỏi đáp điện tử, nhúng và IoT theo nhóm chủ đề. Nguồn online và local được ghi nhãn riêng.':f.summary,...featureDetails[f.id]??['Mở khu vực này để đọc thao tác và phạm vi dữ liệu hiện có. Các trạng thái tham khảo/giới hạn không phải xác nhận kết quả điện hay khả năng trên phần cứng thật.','Bắt đầu từ hồ sơ hoặc bài phù hợp, thay một điều mỗi lần và giữ bản xuất dữ liệu cục bộ trước khi chuyển trình duyệt.']],source:source('Mở khu vực trong ứng dụng',f.id==='lesson'?'/learn/blink':f.publicRoute),sources:[],evidence:[`src/data/productFeatureRegistry.ts: ${f.id}`]}))
// The four page calculators plus the LDR handoff used by its lesson. Descriptions explain
// the actual local functions; no per-user values or calculated results are guessed here.
const calculators = [
  ['led','Tính điện trở LED',['tính điện trở led','điện trở hạn dòng led'],['R ≈ (Vnguồn − Vf)/I với I tính bằng A. Kiểm tra Vf và dòng mục tiêu của LED trước khi chọn E24 và công suất điện trở.','Không biết nguồn, Vf và dòng thì chưa có đáp án số. Model LED lý tưởng không thay datasheet hoặc số đo.'],'calculateLedResistor'],
  ['adc-divider','Bộ chia áp ADC',['chia áp adc','phân áp adc'],['Vout = Vin × R2/(R1+R2), giả định ADC không tải mạch. Chọn tỉ lệ theo Vin lớn nhất và dải ADC đúng target.','Sai đơn vị hoặc bỏ qua dung sai/trở kháng có thể khiến kết quả lý tưởng khác mạch thật. Đừng suy ra chân ADC hoặc giới hạn tuyệt đối từ bộ tính.'],'calculateAdcDivider'],
  ['i2c-pullup','Điện trở pull-up I²C',['i2c pull up','i2c pullup','pull up i2c','sườn lên i2c'],['Pull-up nhỏ giúp nạp điện dung bus nhanh hơn nhưng tăng dòng khi thiết bị kéo LOW. Bộ tính cân bằng giới hạn sườn lên và dòng sink theo giả định tốc độ/điện dung.','Cần nhập VCC, điện dung bus và chế độ tốc độ. Kết quả RC tương đương không xác minh địa chỉ, giao thức I²C hay mọi thiết bị nối bus.'],'calculateI2cPullup'],
  ['rc','Hằng số thời gian RC',['hằng số thời gian','tính rc','mạch rc'],['τ = R × C; với R tính bằng kΩ và C bằng µF, kết quả τ có đơn vị ms. RC bậc một mô tả quá trình nạp/xả lý tưởng theo hàm mũ.','Khoảng 5τ là mốc xấp xỉ thường dùng để gần mức cuối, không có nghĩa tụ thật đã xả hết hay an toàn chạm vào. Dung sai và tải làm thay đổi đáp ứng.'],'calculateRc'],
  ['ldr-divider','Bộ chia áp LDR',['chia áp ldr','vout ldr','đường cong ldr'],['Bài LDR dùng đường cong điện trở giả định và VCC mô hình; Vout được tính từ chia áp, sau đó chuẩn hóa làm đầu vào giáo dục.','Không suy ra lux hay số đếm ADC vật lý từ thanh trượt. Vị trí LDR phía VCC hay GND quyết định chiều biến thiên tín hiệu.'],'calculateLdrDivider'],
] as const
const calculatorEntries: GuideCatalogEntry[] = calculators.map(([id,title,aliases,paragraphs,fn])=>({id:`calculator:${id}`,family:'calculator',entityId:id,title,aliases:[...aliases],paragraphs:[...paragraphs],source:source('Mở bộ tính và đọc giả định',id==='ldr-divider'?'/learn/analog-ldr':'/tools/electronics-calculators'),sources:[],evidence:[`src/lib/${id==='ldr-divider'?'analogDivider':'electronicsCalculators'}.ts: ${fn}`,'src/lib/calculatorSpice.ts']}))
const feedback: GuideCatalogEntry = {id:'feature:feedback',family:'feature',entityId:'feedback',title:'Góp ý và báo lỗi',aliases:['góp ý','báo lỗi','feedback','người phát triển'],paragraphs:['Trang góp ý giúp soạn báo lỗi/tính năng, xem trước, sao chép hoặc tải nội dung. Nháp nằm trong phiên tab nếu được lưu; trình duyệt từ chối thì chỉ ở bộ nhớ và có thông báo.','Sao chép hoặc tải file tạo một bản góp ý chưa gửi. Khi có nút Gửi góp ý, nội dung và đánh giá tự chọn chỉ chuyển đến quản trị viên khi bạn bấm nút đó.'],source:source('Mở góp ý và liên hệ','/feedback'),sources:[],evidence:['src/pages/FeedbackPage.tsx','src/lib/feedbackDraft.ts']}
const beginnerCourseEntry: GuideCatalogEntry = {id:'feature:beginner-course',family:'feature',entityId:'beginner-course',title:'Nền tảng điện tử qua 5 thử nghiệm',aliases:['nền tảng điện tử','khóa cơ bản','học nhanh','beginner course'],paragraphs:['Năm hoạt động local: đường về mạch kín, dải breadboard, cực LED và điện trở, INPUT_PULLUP, ngưỡng cảm biến. Mỗi hoạt động yêu cầu dự đoán, quan sát mô hình rồi chọn giải thích; gợi ý được mở từng bước.','Tiêu chí được tính từ các dự đoán đúng khớp quan sát và giải thích đúng, tách khỏi checklist tự đánh dấu. Hai bài code cần chọn board được hỗ trợ; trace subset giáo dục không phải chạy firmware hoặc đo phần cứng.','Tiến độ chỉ lưu trong trình duyệt khi được phép, ở khóa riêng với workspace cũ. Có tải bản sao, bảo vệ dữ liệu lỗi/phiên bản mới và báo xung đột khi tab khác đã đổi bản lưu.'],source:source('Mở khóa nền tảng','/learn/basics'),sources:[],evidence:['src/data/beginnerCourse.ts','src/lib/beginnerCourse.ts','src/lib/beginnerCourseStorage.ts']}
export const GUIDE_CATALOG: readonly GuideCatalogEntry[] = [...boardEntries,...componentEntries,...workspaceEntries,...lessonEntries,...featureEntries,...calculatorEntries,feedback,beginnerCourseEntry]
export const GUIDE_COVERAGE = {
  boards:boardEntries.length,components:componentEntries.length,workspaceTypes:workspaceEntries.length,lessons:lessonEntries.length,features:featureEntries.length,calculators:calculatorEntries.length,
  missingManufacturerSources: componentEntries.filter(a=>getComponentSourceLevel(a.entityId)!=='exact').map(a=>a.id),
  missingSourceLinks: [...boardEntries,...componentEntries,...workspaceEntries].filter(a=>!a.sources?.length).map(a=>a.id),
  missingWorkspaceMappings:components.filter(c=>!componentRegistry.some(m=>m.catalogId===c.id)).map(c=>c.id),
  missingSimulationTargets:boards.filter(b=>!simulationTargets.some(t=>t.boardId===b.id)).map(b=>b.id),
}

