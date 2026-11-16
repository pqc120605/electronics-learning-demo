import assert from 'node:assert/strict'
import {before,after,test} from 'node:test'
import {createServer} from 'vite'
let server,findGuideAnswers,getContextAdvice,guideRoute,GUIDE_ARTICLES
before(async()=>{server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}});({findGuideAnswers,getContextAdvice,guideRoute,GUIDE_ARTICLES}=await server.ssrLoadModule('/src/lib/guideKnowledge.ts'))})
after(async()=>{await server?.close()})

test('Vietnamese questions with or without accents find local concepts and readable sources', () => {
  for (const question of ['Vì sao LED cần điện trở?', 'vi sao led can dien tro', 'breadboard noi cac lo nhu the nao', 'INPUT_PULLUP la gi']) {
    const result=findGuideAnswers(question)
    assert.equal(result.kind,'matches',question)
    assert.ok(result.articles.length>0 && result.articles.length<=3)
    for(const a of result.articles){assert.ok(a.paragraphs.length);assert.match(a.source.href,/^\//);assert.ok(a.source.label);assert.ok(a.evidence.length)}
  }
})
test('unknown or empty questions do not fabricate an expert answer',()=>{
  for(const q of ['', ' ', 'xyz qwerty asdf', 'Thông số chính xác của board clone XZQ-987 là gì?']){
    const result=findGuideAnswers(q);assert.equal(result.kind,'unknown',q);assert.match(result.message,/chưa|thêm|cụ thể/i)
  }
})
test('context advice reproduces actual diagnostics and does not invent pin mappings or component values',()=>{
  const context={owner:'fixture',lesson:'LDR',board:{id:'unknown-clone',name:'Clone chưa xác minh'},part:{id:'r1',type:'resistor',name:'Điện trở',summary:'Trị số chưa xác nhận',pins:['a','b'],note:'Kiểm tra công suất'},issues:['G4: bb1:10c đang có chân linh kiện'],status:'Chưa chạy'}
  const result=getContextAdvice(context).join('\n')
  assert.match(result,/G4: bb1:10c/);assert.match(result,/Clone chưa xác minh/);assert.match(result,/Trị số chưa xác nhận/);assert.doesNotMatch(result,/220|GPIO23|đã an toàn/i)
  assert.doesNotMatch(getContextAdvice({...context,issues:[]}).join('\n'),/G4:/)
  const reference=getContextAdvice({...context,board:{...context.board,reference:true}}).join('\n')
  assert.match(reference,/Board tham chiếu/)
  assert.doesNotMatch(reference,/Board đang chọn:/)
})
test('guidance covers public/app aliases and separates SPICE from firmware and lesson traces',()=>{
  assert.deepEqual(guideRoute('/build/freestyle'),guideRoute('/app/lab/freestyle'))
  assert.ok(guideRoute('/app/boards').steps.length>=2)
  assert.match(guideRoute('/tools/spice').steps.join(' '),/SPICE|analog/)
  assert.match(guideRoute('/tools/firmware-hex').steps.join(' '),/HEX|target|đích/)
  assert.match(GUIDE_ARTICLES.find(a=>a.id==='adc').source.href,/lesson=analog-potentiometer&guided=1/)
})
