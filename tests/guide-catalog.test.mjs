import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'vite'
let server, guide, catalog, boards, components, registry, lessons, features
before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  guide = await server.ssrLoadModule('/src/lib/guideKnowledge.ts')
  catalog = await server.ssrLoadModule('/src/lib/guideCatalog.ts')
  boards = (await server.ssrLoadModule('/src/data/boards.ts')).boards
  components = (await server.ssrLoadModule('/src/data/components.ts')).components
  registry = (await server.ssrLoadModule('/src/data/componentRegistry.ts')).componentRegistry
  lessons = (await server.ssrLoadModule('/src/data/curriculumSchema.ts')).curriculumLessons
  features = (await server.ssrLoadModule('/src/data/productFeatureRegistry.ts')).productFeatureRegistry
})
after(async () => { await server?.close() })
test('every current board, public component, workspace type, lesson and feature has a traceable entry', () => {
  for (const [family, records] of [['board',boards],['component',components],['workspace',registry],['lesson',lessons],['feature',Object.values(features)]]) {
    for (const record of records) {
      const entry = catalog.GUIDE_CATALOG.find(a => a.family === family && a.entityId === record.id)
      assert.ok(entry, `${family}/${record.id}`)
      assert.ok(entry.paragraphs.length >= 2)
      assert.ok(entry.evidence.length)
      assert.match(entry.source.href, /^\//)
    }
  }
})
test('exact accented/unaccented entity retrieval keeps UNO and Pico variants separate', () => {
  for (const [question,id] of [['Arduino UNO R4 Minima mức logic và giới hạn','board:arduino-uno-r4-minima'],['raspberry pi pico w co gi','board:raspberry-pi-pico-w'],['cam bien BMP280 dung de lam gi','component:bmp280'],['cong tac hanh trinh la gi','component:limit-switch']]) {
    const result = guide.findGuideAnswers(question)
    assert.equal(result.kind,'matches',question)
    assert.equal(result.articles[0].id,id,question)
  }
})
test('board specific facts come only from that target; missing ADC is explicitly unknown', () => {
  const uno = guide.findGuideAnswers('Arduino Uno R3 ADC').articles[0]
  assert.match(uno.paragraphs.join(' '), /1023/)
  assert.doesNotMatch(uno.paragraphs.join(' '), /4095/)
  const pico = guide.findGuideAnswers('Raspberry Pi Pico 2 ADC').articles[0]
  assert.match(pico.paragraphs.join(' '), /chưa.*ADC|ADC.*chưa/i)
  assert.doesNotMatch(pico.paragraphs.join(' '), /4095|1023/)
})
test('unknown clones, multiple exact boards, unsupported pins and unrelated generic substrings ask clarification', () => {
  for (const q of ['board clone XZQ-987 pinout GPIO', 'ESP32-C9 có GPIO nào', 'Arduino Uno R3 và Arduino UNO R4 Minima dùng chung chân nào', 'Arduino Uno R3 GPIO 999 chạy được không', 'servo của hãng XZQ-987 chịu 100V không', 'breadboarding xyz qwerty', 'STM32 loại nào']) assert.equal(guide.findGuideAnswers(q).kind,'unknown',q)
})
test('context resolves a reference without overriding an explicit board or inventing values', () => {
  const context={owner:'fixture',board:{id:'arduino-uno-r3',name:'Arduino Uno R3'}}
  const result=guide.findGuideAnswers('board đang chọn có ADC thế nào',context)
  assert.equal(result.kind,'matches')
  assert.equal(result.articles[0].id,'board:arduino-uno-r3')
  assert.equal(guide.findGuideAnswers('Raspberry Pi Pico 2 ADC',context).articles[0].id,'board:raspberry-pi-pico-2')
  assert.equal(guide.findGuideAnswers('board đang chọn có chân nào',{owner:'fixture',board:{id:'clone-unknown',name:'Clone'}}).kind,'unknown')
})
test('official board links retain provenance while generic unproven parts say evidence is missing', () => {
  const board=catalog.GUIDE_CATALOG.find(a=>a.id==='board:arduino-uno-r3')
  assert.ok(board.sources.some(s=>s.href.includes('docs.arduino.cc/')))
  const resistor=catalog.GUIDE_CATALOG.find(a=>a.id==='component:resistor')
  assert.match(resistor.paragraphs.join(' '), /chưa.*(datasheet|mã linh kiện)|chưa.*MPN/i)
  assert.doesNotMatch(resistor.paragraphs.join(' '), /công suất.*0[.,]25/)
  assert.ok(catalog.GUIDE_COVERAGE.missingManufacturerSources.includes('component:resistor'))
})
test('tool/calculator questions give substantive assumptions and community/feedback distinguish actual delivery',()=>{
  for(const q of ['tính RC hằng số thời gian','I2C pull-up chọn điện trở','SPICE giải mạch','góp ý gửi cho ai','cộng đồng online hoạt động chưa']) {
    const result=guide.findGuideAnswers(q);assert.equal(result.kind,'matches',q)
    assert.ok(result.articles[0].paragraphs.join(' ').length>100)
  }
  assert.match(guide.findGuideAnswers('cộng đồng online hoạt động chưa').articles[0].paragraphs.join(' '),/Supabase|cấu hình/)
  assert.match(guide.findGuideAnswers('góp ý gửi cho ai').articles[0].paragraphs.join(' '),/chưa.*gửi|không tự.*gửi/)
})

test('all exact board names retrieve their own profile rather than a base variant or default target',()=>{
  for(const board of boards){
    const result=guide.findGuideAnswers(board.name)
    assert.equal(result.kind,'matches',board.id)
    assert.equal(result.articles[0].id,`board:${board.id}`,board.id)
  }
})
test('chip questions carry real chip/module source limits, not a fabricated universal breakout pinout',()=>{
  for(const [q,id,host] of [['TB6612FNG dùng như thế nào','component:motor-driver','toshiba.semicon-storage.com'],['MPU-6050 dùng để làm gì','component:mpu6050','invensense.tdk.com'],['BMP280 cần lưu ý gì','component:bmp280','www.bosch-sensortec.com']]){
    const result=guide.findGuideAnswers(q)
    assert.equal(result.kind,'matches',q)
    assert.equal(result.articles[0].id,id,q)
    assert.ok(result.articles[0].sources.some(s=>new URL(s.href).hostname===host),q)
    assert.match(result.articles[0].paragraphs.join(' '),/chip|module|breakout/)
  }
})
test('winning TB6612 answer includes mapped standby pin and its active-state safety requirement',()=>{
  const result=guide.findGuideAnswers('Toshiba TB6612FNG dùng như thế nào')
  assert.equal(result.kind,'matches')
  assert.equal(result.articles[0].id,'component:motor-driver')
  const answer=result.articles[0].paragraphs.join(' ')
  assert.match(answer,/Chân.*mô hình.*STBY/)
  assert.match(answer,/STBY phải ở trạng thái hoạt động/)
  assert.match(answer,/VM\/VCC và dòng tải phải đúng datasheet/)
  assert.match(answer,/không đại diện mọi board TB6612/i)
})
test('catalog source links distinguish documents from routes and exact internal routes remain valid',async()=>{
  const {guideSourceKind}=await server.ssrLoadModule('/src/lib/guideSearch.ts')
  for(const entry of catalog.GUIDE_CATALOG){
    assert.match(entry.source.href,/^\/(?:boards|components|learn|app|topics|projects|build|tools|community|feedback)?(?:[/?]|$)/,entry.id)
    for(const src of entry.sources??[]){assert.ok(['external','document'].includes(guideSourceKind(src.href)),`${entry.id}: ${src.href}`);assert.ok(src.label)}
  }
  assert.equal(guideSourceKind('/models/seeed-xiao-esp32-s3.NOTICE.txt'),'document')
  assert.equal(guideSourceKind('/boards?board=arduino-uno-r3'),'route')
  for(const href of ['javascript:alert(1)','//evil.test','/\\evil.test','https://'])assert.equal(guideSourceKind(href),'invalid')
  assert.equal(guide.guideRoute('/app/learn/analog-ldr').href,'/learn/analog-ldr')
  assert.match(guide.guideRoute('/build/freestyle').steps[0],/trống/)
  assert.equal(guide.guideRoute('/unknown').href,'/learn/blink')
  assert.match(guide.guideRoute('/app/community').steps.join(' '),/Supabase/)
  assert.match(guide.guideRoute('/feedback').steps.join(' '),/tự gửi/)
})
