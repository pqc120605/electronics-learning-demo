import assert from 'node:assert/strict'
import {after,before,test} from 'node:test'
import {createServer} from 'vite'
let server,feedback,profile
before(async()=>{server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}});feedback=await server.ssrLoadModule('/src/lib/feedbackDraft.ts');profile=(await server.ssrLoadModule('/src/data/developerProfile.ts')).developerProfile})
after(async()=>server?.close())
const valid=()=>({...feedback.emptyFeedbackDraft('/build/freestyle'),title:'Không chọn được dây',details:'Tôi chọn dây nhưng chưa thấy đầu nối được đánh dấu.',steps:'Mở bàn rồi chọn dây.'})
test('public developer profile contains exactly the founder-approved contacts and no repository',()=>{
 assert.equal(profile.name,'Chiến Phan');assert.equal(profile.email,'chienpq12.work@gmail.com')
 assert.equal(profile.facebook,'https://www.facebook.com/phan.chien.789760/?locale=vi_VN')
 assert.equal(profile.portfolio,'https://phanquocchien.vercel.app/')
 assert.doesNotMatch(JSON.stringify(profile),/github|pqc120605|repository/i)
})
test('feedback draft round-trips incomplete local input without touching project schemas',()=>{
 const draft=feedback.emptyFeedbackDraft();draft.title='Đang viết'
 assert.deepEqual(feedback.parseFeedbackDraft(JSON.stringify(draft)),draft)
 assert.equal(feedback.parseFeedbackDraft(JSON.stringify({...draft,version:2})),null)
 assert.equal(feedback.parseFeedbackDraft('{broken'),null)
 assert.equal(feedback.parseFeedbackDraft(JSON.stringify({...draft,details:'a'.repeat(5001)})),null)
})
test('feedback validation rejects missing and oversized content and accepts a useful report',()=>{
 assert.equal(Object.keys(feedback.validateFeedback(feedback.emptyFeedbackDraft())).length,2)
 assert.deepEqual(feedback.validateFeedback(valid()),{})
 assert.ok(feedback.validateFeedback({...valid(),title:'a'.repeat(161)}).title)
 assert.ok(feedback.validateFeedback({...valid(),kind:'other'}).kind)
})
test('route context drops query/hash data and rejects external or scheme-relative URLs',()=>{
 assert.equal(feedback.safeFeedbackPage('/build/freestyle?token=private#code'),'/build/freestyle')
 for(const url of ['https://evil.test/','//evil.test/a','javascript:alert(1)'])assert.equal(feedback.safeFeedbackPage(url),'')
})
test('export is a bounded local unsent report with safe filename and no identity or hidden draft data',()=>{
 const draft=valid();draft.details='<script>alert(1)</script>\n```\nNội dung người dùng.'
 const output=feedback.formatFeedback(draft,'2026-11-16T00:00:00Z')
 assert.match(output,/Chưa gửi/);assert.match(output,/Không chọn được dây/)
 assert.doesNotMatch(output,/token=|github\.com|localStorage|chienpq12/)
 assert.match(feedback.feedbackFilename('2026-11-16T00:00:00Z'),/^[A-Za-z0-9._-]+\.md$/)
 assert.match(feedback.feedbackFilename('bad/name'),/^[A-Za-z0-9._-]+\.md$/)
})
