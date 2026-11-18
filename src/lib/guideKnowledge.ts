import { normalizeGuideText, searchGuide } from './guideSearch'
import { getBeginnerGuideArticle, type BeginnerGuideContext, type BeginnerGuideAction } from './beginnerGuide'

export type GuideSnapshot = {
  owner: string
  priority?: number
  lesson?: string
  board?: { id: string; name: string; sourceUrl?: string; reference?: boolean }
  part?: { id: string; type: string; name: string; summary: string; pins: string[]; note: string }
  status?: string
  issues?: string[]
  next?: string
  beginner?: BeginnerGuideContext
  actions?: readonly BeginnerGuideAction[]
}
export type GuideSource = { label: string; href: string }
export type GuideArticle = { id: string; title: string; aliases: string[]; paragraphs: string[]; source: GuideSource; sources?: GuideSource[]; evidence: string[] }
export type GuideSearchResult = { kind: 'matches'; articles: GuideArticle[] } | { kind: 'unknown'; message: string }
const article = (id: string, title: string, aliases: string[], paragraphs: string[], href: string, label: string, evidence: string[]): GuideArticle => ({id,title,aliases,paragraphs,source:{label,href},evidence})

/** Curated, local explanations. This is retrieval, not a generative AI or an electrical checker. */
export const GUIDE_ARTICLES: readonly GuideArticle[] = [
  article('led','Vì sao LED cần điện trở?',['led','đèn không sáng','hạn dòng','diode phát sáng'],[
    'LED là diode phát sáng, có cực anode và cathode. Trong bài LED, dòng đi qua điện trở nối tiếp rồi qua LED về GND. Đổi cực LED có thể làm đường dẫn không hoạt động.',
    'Điện trở hạn dòng; giá trị phù hợp phụ thuộc nguồn, điện áp thuận của LED và dòng mục tiêu. Không dùng một giá trị của bài mẫu cho mọi LED hoặc mọi nguồn. Hãy mở bộ tính LED để xem các giả định.'
  ],'/tools/electronics-calculators','Bộ tính LED và các giả định',['src/data/componentRegistry.ts: led','src/pages/ElectronicsCalculatorsPage.tsx']),
  article('resistor','Điện trở và trị số trong từng mạch',['điện trở','resistor','220 ohm','10k','10 k ohm'],[
    'Điện trở hai chân thông thường không phân cực. Nó có thể hạn dòng hoặc tham gia cầu chia áp; hai vai trò này cần những trị số khác nhau.',
    'Ví dụ LED và cầu chia áp LDR trong Mạch Mở dùng các biến thể khác nhau. Trị số trong mạch đang mở mới là căn cứ; khi chưa xác nhận, giữ là chưa biết. Mạch thật còn phải kiểm tra dung sai và công suất.'
  ],'/components','Hồ sơ điện trở trong thư viện',['src/data/componentRegistry.ts: resistorVariants']),
  article('breadboard','Các lỗ breadboard nối với nhau thế nào?',['breadboard','bảng cắm','lỗ cắm','dải nối'],[
    'Trong mô hình breadboard hiện tại, năm lỗ a–e cùng một cột nối với nhau; năm lỗ f–j tạo một nhóm riêng. Rãnh giữa tách hai nửa. Hai cột cạnh nhau không tự nối.',
    'Các lỗ trên cùng một ray nguồn được mô hình hóa là nối chung theo cấu hình. Số lỗ và cách chia ray là giả định của mẫu giáo dục; breadboard thật có thể khác, cần kiểm tra thông mạch khi chưa cấp điện.',
    'Chọn một chân rồi chọn lỗ đích để nối dây. Chọn dây để xem, đổi hoặc xóa kết nối; rút dây trong mô hình không chứng minh rằng mạch thật đã mất điện.'
  ],'/build','Thực hành breadboard theo bài',['src/lib/breadboardGrid.ts','src/components/builder/BreadboardDiagram.tsx']),
  article('ground','Vì sao cần GND chung?',['gnd','ground','mass','đất chung','gnd chung'],[
    'Tín hiệu điện áp cần một mốc tham chiếu. Trong các bài thấp áp của ứng dụng, GND là mốc dùng chung cho board và phần mạch liên quan.',
    'Một đường tín hiệu đơn lẻ không thay thế đường hồi dòng. Hãy lần theo toàn bộ đường đi của bài mẫu. GND của mạch thấp áp không đồng nghĩa với dây đất bảo vệ của điện lưới.'
  ],'/learn/source-led','Bài nguồn, điện trở và LED',['src/data/builderLessons.ts: source-led']),
  article('pullup','INPUT_PULLUP và nút nhấn',['input_pullup','pull up','pullup','nút nhấn','button','active low'],[
    'Trong bài nút nhấn dùng INPUT_PULLUP, khi thả nút đầu vào thường là HIGH; nhấn nút nối đầu vào về GND nên đọc LOW.',
    'Vì vậy điều kiện digitalRead(buttonPin) == LOW có thể có nghĩa là đang nhấn. Đây là logic của bài này; một module khác có thể có cách nối hoặc cực tính khác. Tiếp điểm cơ thật còn có dội phím.'
  ],'/build?lesson=button-led&guided=1','Bài nút nhấn điều khiển LED',['src/data/builderLessons.ts: button-led']),
  article('gpio','GPIO, số chân và đúng phiên bản board',['gpio','pinout','chân board','sơ đồ chân','mức logic'],[
    'GPIO là chân vào/ra có thể cấu hình. Chức năng, giới hạn điện áp và cách đánh số phụ thuộc đúng board, MCU và revision; tên chân học tập có thể chỉ là alias.',
    'Mở hồ sơ board đang chọn để đối chiếu chân và nguồn. Không suy ra chân vật lý của một board clone từ một board khác. Mở không tự chọn chân hoặc xác nhận phần cứng cho bạn.'
  ],'/boards','Hồ sơ board và pinout',['src/data/simulationTargets.ts','src/data/componentRegistry.ts: board']),
  article('adc','analogRead và ADC',['adc','analogread','analog','biến trở','ldr','quang trở'],[
    'ADC biến mức đầu vào analog thành số. Miền điện áp, độ phân giải và cấu hình phụ thuộc board và phần mềm; không mặc định mọi board đều trả cùng dải số.',
    'Các bài analog hỗ trợ trong ứng dụng có bảng cấu hình theo target. Thanh trượt ảo là đầu vào của mô hình bài học, không phải số đo điện áp của một cảm biến thật.'
  ],'/build?lesson=analog-potentiometer&guided=1','Bài đọc biến trở',['src/data/simulationTargets.ts: adcFullScale','src/data/builderLessons.ts']),
  article('pwm','PWM có phải điện áp analog không?',['pwm','analogwrite','duty','độ rộng xung'],[
    'PWM thay đổi tỉ lệ thời gian HIGH/LOW của một chuỗi xung. Duty cycle lớn hơn không có nghĩa chân GPIO tạo ra một điện áp DC chính xác tương ứng.',
    'Độ sáng LED hay tốc độ motor còn phụ thuộc tải và mạch lái. Vết logic giúp quan sát HIGH/LOW; muốn tính dạng sóng analog cần mô hình và công cụ điện phù hợp.'
  ],'/tools/sketch','Quan sát code và vết logic',['src/lib/logicTrace.ts','src/lib/educationalProgram.ts']),
  article('simulation','Trace bài học, firmware và SPICE khác gì?',['mô phỏng','trace','firmware','spice','ngspice','kết quả đến từ đâu'],[
    'Trace bài học diễn giải một tập cú pháp và hành vi giáo dục đã hỗ trợ. Nó không phải thực thi đầy đủ firmware MCU và không tính toàn bộ dòng điện hay điện áp.',
    'Công cụ firmware chạy các target/artifact được công bố riêng. SPICE giải mạch analog với netlist và model tương thích. Một hình 3D đẹp hay đường đồng được tô sáng không phải kết quả solver hoặc phép đo trên kit.'
  ],'/tools/spice','Công cụ SPICE và phạm vi model',['src/simulation/contracts.ts','src/lib/simulationProviders.ts']),
  article('wires','Cách chọn và sửa dây nối',['dây nối','nối dây','xóa dây','chọn dây','wire'],[
    'Trong bề mặt lắp mạch có thể chỉnh sửa, chọn chân hoặc lỗ bắt đầu rồi chọn điểm kết thúc. Chọn dây để xem kết nối và các thao tác được phép trong ngữ cảnh đó.',
    'Mạch xem trước theo bài có thể chỉ đọc. Nếu chưa có nút sửa, hãy mở bản nháp hoặc bàn tự do thay vì coi đó là lỗi mất dây. Các view cùng mạch dùng chung định danh chân và net.'
  ],'/build/freestyle','Mở bàn lắp mạch tự do',['src/components/builder/BreadboardDiagram.tsx','src/components/freestyle/FreestyleBench.tsx']),
  article('serial','Đọc Serial Monitor thế nào?',['serial','serial monitor','serial print','uart'],[
    'Serial Monitor hiển thị thông điệp mà chương trình hoặc runtime hỗ trợ gửi ra. Nó hữu ích để theo dõi giá trị và biết chương trình đã đến bước nào.',
    'Nhật ký của runtime mô phỏng không đồng nghĩa đã giao tiếp với board thật. Hãy đọc nhãn provider và target cạnh kết quả trước khi suy luận.'
  ],'/tools/sketch','Chạy code và xem Serial',['src/pages/SketchRunnerPage.tsx']),
  article('code','Code báo lỗi hoặc không chạy',['code','lỗi code','biên dịch','compile','chương trình','delay'],[
    'Bắt đầu từ ví dụ đúng với board và runtime đang chọn. Khi có lỗi, đọc vị trí dòng, sửa từng vấn đề rồi chạy lại.',
    'Không phải mọi thư viện và cú pháp Arduino/ESP-IDF đều được hỗ trợ trong mọi công cụ. Thông báo giới hạn của runtime đang mở là căn cứ; việc chọn tên board không tự tạo ra khả năng thực thi firmware cho board đó.'
  ],'/tools/sketch','Ví dụ và thông báo lỗi code',['src/pages/SketchRunnerPage.tsx','src/lib/educationalProgram.ts']),
  article('hex','Tệp HEX và target MCU',['hex','intel hex','atmega','avr8js'],[
    'Tệp Intel HEX chứa dữ liệu và địa chỉ, không tự mô tả đầy đủ board MCU đích. Phải xác nhận target tương thích trước khi chạy trong emulator.',
    'Công cụ HEX công bố riêng các target đang hỗ trợ. Kiểm tra checksum thành công không chứng minh firmware đúng với mạch thật, và việc đọc tệp không đồng nghĩa đã nạp thiết bị.'
  ],'/tools/firmware-hex','Kiểm tra firmware HEX',['src/pages/FirmwareHexToolPage.tsx']),
  article('capacitor','Tụ điện dùng để làm gì?',['tụ điện','capacitor','tụ hóa','rc'],[
    'Tụ điện tích và phóng điện; cùng điện trở nó có thể tạo quá trình RC. Tụ hóa có phân cực, cần xem dấu cực và điện áp định mức của đúng linh kiện.',
    'Hình tụ trong cảnh lắp không có nghĩa mô hình bài học đã tính quá trình nạp/xả. Dùng ví dụ RC trong SPICE để xem dạng sóng theo model.'
  ],'/tools/spice','Thử mạch RC trong SPICE',['src/data/componentRegistry.ts: capacitor','src/pages/SpiceWorkbenchPage.tsx']),
  article('motor','Vì sao motor cần mạch lái?',['motor','động cơ','h bridge','driver','relay'],[
    'Motor là tải có dòng và năng lượng cảm ứng. Không nối một motor bất kỳ trực tiếp vào GPIO. Cần driver, nguồn và biện pháp bảo vệ được chọn cho đúng tải.',
    'Chuyển động trong mô hình là minh họa. Nó không xác nhận dòng khởi động, kẹt rotor, nhiệt hoặc độ an toàn của motor và driver thật.'
  ],'/components','Tra cứu motor và driver',['src/data/componentRegistry.ts: dc-motor, h-bridge']),
  article('save','Bản nháp và dữ liệu được lưu ở đâu?',['lưu','bản nháp','offline','mất dữ liệu','dự án'],[
    'Mạch Mở ưu tiên làm việc cục bộ. Tùy bề mặt, bản nháp có thể nằm trong bộ nhớ của trình duyệt hoặc phiên tab; hãy đọc trạng thái lưu cạnh công cụ.',
    'Xóa dữ liệu trang hoặc đổi trình duyệt có thể làm mất dữ liệu cục bộ. Xuất project để giữ một bản sao. Mở chỉ giữ câu hỏi trong phiên giao diện hiện tại và không gửi chúng lên dịch vụ AI.'
  ],'/projects','Quản lý và xuất dự án',['src/lib/workspaceStorage.ts','src/pages/PrivacyPage.tsx']),
  article('views','Breadboard, schematic, 3D và PCB',['schematic','sơ đồ nguyên lý','3d','pcb','đường đồng'],[
    'Breadboard thể hiện điểm cắm; schematic trình bày ký hiệu và kết nối; 3D giúp quan sát hình dạng. Hãy dùng view phù hợp với câu hỏi bạn đang tìm hiểu.',
    'PCB 2D là dữ liệu board tham chiếu với nguồn và revision riêng. Dây trong workspace không tự biến thành đường đồng sản xuất trên PCB.'
  ],'/boards','Xem nguồn và revision board',['src/components/builder/CircuitSchematicV2.tsx','src/components/pcb/Pcb2DViewer.tsx']),
  article('theme','Đổi giao diện hoặc mở lại hướng dẫn',['giao diện','chế độ tối','theme','hướng dẫn','tour'],[
    'Mở Trợ giúp để đổi Sáng, Tối hoặc Theo hệ thống, và mở lại tour của trang đang dùng. Mặc định hiện vẫn là Sáng.',
    'Bạn có thể thu gọn Mở, ẩn nút nổi và mở lại từ Trợ giúp. Khi bật giảm chuyển động trên thiết bị, mascot sẽ đứng yên; các nút và nội dung hướng dẫn vẫn dùng được.'
  ],'/app','Không gian học',['src/components/onboarding/Onboarding.tsx','src/lib/theme.ts']),
]

export function findGuideAnswers(question: string, snapshot?: GuideSnapshot): GuideSearchResult {
  const intent = normalizeGuideText(question)
  if (snapshot?.beginner && ['toi nen lam gi tiep', 'giai thich ket qua hien tai'].includes(intent)) {
    const current = getBeginnerGuideArticle(snapshot)
    if (current) return { kind: 'matches', articles: [current] }
  }
  return searchGuide(question, GUIDE_ARTICLES, snapshot)
}
export function getContextAdvice(snapshot?: GuideSnapshot): string[] {
  if (!snapshot) return ['Chưa có ngữ cảnh mạch được chia sẻ ở trang này. Bạn có thể hỏi về một khái niệm hoặc mở hướng dẫn trang.']
  const result: string[] = []
  if(snapshot.lesson)result.push(`Bài đang mở: ${snapshot.lesson}.`)
  if(snapshot.board)result.push(`${snapshot.board.reference?'Board tham chiếu đang hiển thị':'Board đang chọn'}: ${snapshot.board.name}. Đối chiếu đúng hồ sơ và revision trước khi dùng trên phần cứng thật.`)
  if(snapshot.part){result.push(`Đang chọn ${snapshot.part.name} (${snapshot.part.id}). ${snapshot.part.summary}`);if(snapshot.part.pins.length)result.push(`Chân trong mô hình: ${snapshot.part.pins.slice(0,14).join(', ')}.`);if(snapshot.part.note)result.push(snapshot.part.note)}
  if(snapshot.status)result.push(`Trạng thái ứng dụng: ${snapshot.status}`)
  for(const issue of snapshot.issues?.slice(0,3)??[])result.push(`Ứng dụng đang báo: ${issue}`)
  if(snapshot.next)result.push(`Gợi ý bước tiếp theo: ${snapshot.next}`)
  return result.length ? result : ['Chưa có đủ thông tin để giải thích mạch đang mở.']
}
export function guideRoute(pathname: string) {
  const aliases:Record<string,string>={'/app':'/','/app/learn':'/topics','/app/lab':'/build','/app/lab/freestyle':'/build/freestyle','/app/boards':'/boards','/app/components':'/components','/app/projects':'/projects','/app/tools/sketch':'/tools/sketch','/app/tools/spice':'/tools/spice','/app/tools/firmware':'/tools/firmware-hex','/app/tools/calculators':'/tools/electronics-calculators'}
  const p=aliases[pathname]??pathname.replace(/^\/app\/learn\//,'/learn/')
  if(p==='/build/freestyle')return {title:'Bàn lắp mạch tự do',steps:['Bàn tự do bắt đầu trống; chọn board đúng biến thể rồi tự thêm linh kiện.','Thêm linh kiện; nối chân hoặc lỗ theo topology mong muốn.','Đọc giới hạn runtime, sửa code rồi bấm Chạy.','Quan sát vết logic và Serial; đọc lỗi trước khi thay đổi tiếp.'],href:'/build/freestyle'}
  if(p==='/build')return {title:'Phòng lắp mạch theo bài',steps:['Chọn bài và đọc mục tiêu trước khi chạy.','Dùng breadboard, schematic hoặc 3D để lần theo cùng một kết nối.','Chọn linh kiện, chân hoặc dây để xem thông tin; bản xem trước có thể chỉ đọc.','Đọc panel bước tiếp theo và giới hạn provider rồi mới chạy hoặc chạy từng bước.'],href:'/build'}
  if(p==='/learn/basics')return {title:'Khóa nền tảng điện tử',steps:['Chọn một trong năm hoạt động: mạch kín, breadboard, LED, nút nhấn hoặc ngưỡng cảm biến.','Đặt thử nghiệm và chọn dự đoán trước khi bấm Quan sát mô hình.','So sánh kết quả với dự đoán, chọn cách giải thích rồi thử trường hợp còn thiếu.','Mở mục Đang làm để xem bước tiếp theo; Mở chỉ đưa bạn tới điều khiển, không chạy hoặc chọn đáp án hộ.'],href:'/learn/basics'}
  if(p.startsWith('/learn/'))return {title:'Bài học',steps:['Chọn đúng board/biến thể rồi đọc mục tiêu và mức mô phỏng của bài.','Chọn linh kiện để tìm hiểu chân, vai trò và lưu ý.','Đối chiếu lắp dây với sơ đồ và đoạn code.','Thay một điều mỗi lần, quan sát kết quả và xem lại phần chưa rõ.'],href:p}
  if(p==='/boards'||p==='/components')return {title:'Thư viện board và linh kiện',steps:['Tìm theo tên hoặc nhóm rồi chọn hồ sơ cần xem.','Đọc pinout, nguồn, revision và mức hỗ trợ; hình minh họa không thay datasheet.','Dùng liên kết lắp thử nếu hồ sơ có hỗ trợ.'],href:p}
  if(p==='/tools/spice')return {title:'Mô phỏng SPICE',steps:['Chọn ví dụ analog hoặc nhập netlist nằm trong phạm vi model hỗ trợ.','Chọn analysis và chạy SPICE để nhận kết quả solver.','Dùng probe và cursor để đọc waveform; đối chiếu đơn vị và trục thời gian.'],href:p}
  if(p==='/tools/firmware-hex')return {title:'Kiểm tra firmware HEX',steps:['Chọn tệp Intel HEX và xem checksum, vùng địa chỉ.','Xác nhận target MCU đích tương thích trước khi chạy emulator.','Đọc giới hạn quan sát của target; đây không phải thao tác flash board.'],href:p}
  if(p==='/tools/sketch')return {title:'Chạy code trên web',steps:['Chọn ví dụ đúng board và runtime đang hỗ trợ.','Sửa một đoạn nhỏ rồi Chạy; đọc lỗi theo dòng nếu có.','Quan sát Serial và GPIO; đây là runtime được ghi tên cạnh kết quả.'],href:p}
  if(p==='/tools/electronics-calculators')return {title:'Bộ tính điện tử',steps:['Chọn loại phép tính, nhập giá trị và đúng đơn vị.','Đọc kết quả cùng giả định và giới hạn.','Đối chiếu datasheet của linh kiện thật trước khi áp dụng.'],href:p}
  if(p==='/projects')return {title:'Dự án của bạn',steps:['Mở project đã lưu hoặc nhập một bản xuất trước đó.','Đọc cảnh báo phiên bản hoặc xung đột bản nháp trước khi chọn giữ dữ liệu.','Xuất một bản sao để bảo vệ dữ liệu cục bộ.'],href:p}
  if(p==='/community'||p.startsWith('/community/')||p==='/app/community'||p.startsWith('/app/community/'))return {title:'Cộng đồng và nguồn dữ liệu',steps:['Đọc nhãn nguồn: online chỉ hoạt động sau khi founder tạo/cấu hình Supabase và kiểm chứng backend.','Bản xem trước giữ bài và tệp trên thiết bị, không tự tải bài cũ lên máy chủ.','Khi đăng lỗi, giữ nội dung/tệp và đọc thông báo; chưa coi là đã gửi thành công.'],href:'/community'}
  if(p==='/feedback'||p==='/app/feedback')return {title:'Góp ý và báo lỗi',steps:['Soạn nội dung, xem trước và bỏ thông tin riêng tư không cần thiết.','Sao chép hoặc tải báo cáo rồi tự gửi bằng kênh liên hệ đã chọn.','Nháp trong phiên tab hoặc bộ nhớ không phải biên nhận gửi góp ý.'],href:'/feedback'}
  return {title:'Bắt đầu cùng Mở',steps:['Bắt đầu với bài LED nếu bạn mới học điện tử.','Dùng thư viện để đọc linh kiện và đúng phiên bản board.','Lắp theo bài trước, rồi thử mạch riêng ở bàn tự do.'],href:'/learn/blink'}
}

