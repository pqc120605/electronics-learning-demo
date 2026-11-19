import { GUIDE_CATALOG, type GuideCatalogEntry } from './guideCatalog'
import type { GuideArticle, GuideSearchResult, GuideSnapshot } from './guideKnowledge'
export const normalizeGuideText = (s:string) => s.slice(0,400).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().replace(/i²c/g,'i2c').replace(/[^a-z0-9]+/g,' ').trim()
export function guideSourceKind(href:string): 'external'|'document'|'route'|'invalid' {
  if(/^https:\/\//.test(href)){try{return new URL(href).protocol==='https:'?'external':'invalid'}catch{return 'invalid'}}
  if(!/^\/[^/]/.test(href)||/[\\\x00-\x1f]/.test(href))return href==='/'?'route':'invalid'
  return /\.[a-z0-9]{2,5}(?:[?#]|$)/i.test(href)?'document':'route'
}
const verifiedEsp32InputPins = { min: 34, max: 39 }
const esp32InputSource = { label: 'Espressif · Bảng GPIO của ESP32', href: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/gpio.html#gpio-summary' }
const contains = (q:string, term:string) => (` ${q} `).includes(` ${normalizeGuideText(term)} `)
const troubleshootingIntents: readonly [RegExp, string][] = [
  [/\b(?:led|den)\b.*\b(?:khong sang|khong nhap nhay)\b|\bkhong thay\b.*\b(?:led|den) sang\b/, 'debug-led'],
  [/\b(?:con lan|cuon chuot|phong to|thu nho|zoom)\b/, 'wheel-zoom'],
  [/\b(?:doi|sua|thay|chinh|nhap)\b.*\b(?:tri so|gia tri)\b.*\b(?:dien tro|tu dien|tu hoa)\b/, 'edit-value'],
  [/\b(?:doi|sua|keo|chinh)\b.*\b(?:duong di|dau day|vi tri day)\b.*\bday\b|\b(?:doi|sua|keo|chinh)\b.*\b(?:dau day|vi tri day)\b/, 'wires'],
  [/\b(?:xem|mo|hien)\b.*\b(?:dang song|waveform)\b.*\b(?:chay|popup|cua so)\b/, 'live-waveform'],
  [/\bpwm\b.*\b(?:la gi|khac|dien ap|duty|hoat dong)\b/, 'pwm-meaning'],
]
const unknown = (message='Mở chưa có nội dung khớp với câu hỏi này. Hãy nêu cụ thể tên linh kiện, đúng board/revision, bài hoặc thông báo lỗi; không cần gửi thông tin cá nhân.'): GuideSearchResult => ({kind:'unknown',message})
const priority:Record<GuideCatalogEntry['family'],number>={board:6,component:5,workspace:4,lesson:3,calculator:7,feature:2}
type Hit={entry:GuideCatalogEntry;term:string;start:number;end:number}
function entities(q:string): Hit[] {
  const all:Hit[]=[]
  for(const entry of GUIDE_CATALOG) for(const text of entry.aliases){
    const term=normalizeGuideText(text)
    if(!term || !contains(q,term))continue
    const start=(` ${q} `).indexOf(` ${term} `)
    all.push({entry,term,start,end:start+term.length})
  }
  // The longer named variant wins over the base name at the same location. Never
  // collapse separate mentions (Uno R3 AND Uno R4) into whichever scores higher.
  const specific=all.filter(a=>!all.some(b=>a!==b&&b.start<=a.start&&b.end>=a.end&&(b.term.length>a.term.length||(b.term===a.term&&priority[b.entry.family]>priority[a.entry.family]))))
  return specific.filter((a,i)=>specific.findIndex(b=>b.entry.id===a.entry.id)===i)
}
function curatedMatches(q:string,curated:readonly GuideArticle[]): GuideArticle[]{
  return curated.map((a,index)=>({a,index,score:a.aliases.reduce((n,term)=>n+(contains(q,term)?Math.min(8,3+normalizeGuideText(term).split(' ').length):0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.index-b.index).map(x=>x.a)
}
export function searchGuide(question:string,curated:readonly GuideArticle[],snapshot?:GuideSnapshot):GuideSearchResult{
  const q=normalizeGuideText(question)
  if(!q)return unknown()
  const modelNames=question.match(/\b[a-z][a-z0-9]*[-_][a-z0-9-]*\d[a-z0-9-]*\b|\b[a-z]{2,}\d+[a-z0-9-]*\b/gi)??[]
  const unknownModel=modelNames.some(name=>!/^gpio\d+$/i.test(name)&&!GUIDE_CATALOG.some(entry=>entry.aliases.some(a=>contains(normalizeGuideText(a),name))))
  if(/\bclone\b/.test(q) || unknownModel)return unknown('Mở chưa có nội dung khớp để xác minh đúng mã/revision này. Hãy cung cấp tên board/module đầy đủ và nguồn hãng; không suy ra pinout hoặc định mức từ clone cùng tên.')
  let hits=entities(q)
  let explicitBoards=hits.filter(h=>h.entry.family==='board')
  if(explicitBoards.length>1)return unknown(`Câu hỏi nhắc nhiều board (${explicitBoards.map(h=>h.entry.title).join('; ')}). Hãy chọn một board và chức năng cần đối chiếu; Mở chưa có đối chiếu chân/phần cứng giữa các board.`)
  // Tool scope is independent of board variant. Exact pin/rating questions still
  // go through the board guard; mentioning ESP32 must not hide SPICE's limits.
  const tool = hits.filter(hit => hit.entry.family === 'feature' && ['spice', 'firmware', 'sketch'].includes(hit.entry.entityId)).sort((a, b) => a.start - b.start)[0]
  const asksHardwareDetails = /\b(?:gpio|gp\d+|p[abc]\d+|pinout|chan|chiu|dinh muc|dien ap|volt|adc|pwm)\b/.test(q) || /\b\d+\s*v\b/.test(q)
  const hasExactPin = /\b(?:gpio|gp|pa|pb|pc|d|a)\s*\d+\b/.test(q)
  const isBareBoardFamily = !explicitBoards.length && /\b(?:esp32|stm32|arduino|pico|nucleo|xiao|feather)\b/.test(q)
  if (!hasExactPin && !isBareBoardFamily) {
    const symptom = troubleshootingIntents.find(([pattern]) => pattern.test(q))
    const answer = symptom && curated.find(article => article.id === symptom[1])
    if (answer) return { kind: 'matches', articles: [answer] }
  }
  if (tool && !asksHardwareDetails) return { kind: 'matches', articles: [tool.entry] }
  if(!explicitBoards.length&&/\b(?:esp32|stm32|arduino|pico|nucleo|xiao|feather)\b/.test(q)&&!hits.some(h=>h.entry.family==='component'&&h.entry.evidence.some(s=>s.includes('components.ts'))))return unknown('Tên họ board chưa đủ để chọn đúng profile. Hãy nêu đầy đủ biến thể như Arduino Uno R3, Pico W hoặc ESP32-C3-DevKitM-1; Mở không tự lấy profile của board khác.')
  // Snapshot context is opt-in via a reference in the question, never private post/code ingestion.
  if(!explicitBoards.length&&/\b(?:board dang chon|board nay|board hien tai)\b/.test(q)){
    const context=GUIDE_CATALOG.find(e=>e.family==='board'&&e.entityId===snapshot?.board?.id)
    if(!context)return unknown('Ngữ cảnh chưa có board đã xác minh. Hãy chọn đúng board/revision hoặc ghi tên đầy đủ; Mở chưa biết pinout hay ADC của board này.')
    hits=[{entry:context,term:q,start:0,end:q.length},...hits.filter(h=>h.entry.family!=='board')]
    explicitBoards=hits.filter(h=>h.entry.family==='board')
  }
  if(!explicitBoards.length&&/\b(?:linh kien dang chon|linh kien nay)\b/.test(q)){
    const context=GUIDE_CATALOG.find(e=>e.family==='workspace'&&e.entityId===snapshot?.part?.type)
    if(!context)return unknown('Chưa có loại linh kiện được xác minh trong ngữ cảnh. Trị số và package thật vẫn chưa biết.')
    hits=[{entry:context,term:q,start:0,end:q.length}]
  }
  if(explicitBoards.length){
    if (hasExactPin && explicitBoards[0].entry.entityId === 'esp32-devkit') {
      const pins = [...q.matchAll(/\b(gpio|gp|pa|pb|pc|d|a)\s*(\d+)\b/g)]
      if (pins.length === 1 && pins[0][1] === 'gpio') {
        const pin = Number(pins[0][2])
        if (pin >= verifiedEsp32InputPins.min && pin <= verifiedEsp32InputPins.max) {
          const profile = explicitBoards[0].entry
          return { kind: 'matches', articles: [{
            ...profile,
            id: 'esp32-devkit-input-only',
            title: 'GPIO ' + pin + ' trên ESP32 DevKit V1',
            paragraphs: [
              profile.paragraphs[1],
              'Trên họ vi điều khiển ESP32 gốc, GPIO 34–39 chỉ nhận tín hiệu và không có pull-up/pull-down nội điều khiển bằng phần mềm. GPIO ' + pin + ' không thể bật LED bằng digitalWrite.',
              'Số chân có trên header tùy board và module. Mở hồ sơ để đối chiếu đúng revision và bảng chân trước khi lắp thật. Với bài LED ngoài, phần mạch mẫu và giới hạn mô phỏng nằm trong hồ sơ bài.',
            ],
            sources: [esp32InputSource, ...(profile.sources ?? [])],
            evidence: [...profile.evidence, esp32InputSource.href],
          }] }
        }
      }
    }
    if(hasExactPin)return unknown('Kho này chưa xác minh yêu cầu chân cụ thể đó trong cấu hình của bạn. Hãy mở pinout nguồn hãng đúng revision; mapping LED của bài học không chứng minh khả năng mọi chân và không phải phê duyệt nối phần cứng.')
    return {kind:'matches',articles:[explicitBoards[0].entry]}
  }
  const curatedHits=curatedMatches(q,curated)
  const exactFAQ=curatedHits.find(a=>a.aliases.some(term=>normalizeGuideText(term)===q))
  if(exactFAQ)return {kind:'matches',articles:[exactFAQ]}
  const conceptual=/\b(?:vi sao|tai sao|la gi|nhu the nao|khac gi|can dien tro|input pullup|gnd|ground|analogread|analogwrite)\b/.test(q)
  const substantive=hits.filter(h=>h.entry.family==='calculator'||h.entry.family==='lesson'||h.entry.family==='feature')
  if(substantive.length){
    substantive.sort((a,b)=>b.term.length-a.term.length||priority[b.entry.family]-priority[a.entry.family])
    return {kind:'matches',articles:substantive.slice(0,2).map(h=>h.entry)}
  }
  if(curatedHits.length&&conceptual&&!hits.some(h=>h.entry.family==='component'&&h.term.length>14))return {kind:'matches',articles:curatedHits.slice(0,2)}
  const parts=hits.filter(h=>h.entry.family==='component'||h.entry.family==='workspace').sort((a,b)=>b.term.length-a.term.length||priority[b.entry.family]-priority[a.entry.family])
  if(parts.length)return {kind:'matches',articles:parts.slice(0,2).map(h=>h.entry)}
  if(curatedHits.length)return {kind:'matches',articles:curatedHits.slice(0,2)}
  return unknown()
}
