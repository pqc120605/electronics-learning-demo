import {test,expect} from '@playwright/test'
import {readFileSync} from 'node:fs'
import AxeBuilder from '@axe-core/playwright'

const draftKey='machmo-feedback-draft-v1'
const proof='docs/agents/runs/MM-SW-FEEDBACK-001/screenshots'
async function start(page,path='/feedback'){
 await page.addInitScript(()=>localStorage.setItem('mm-tour-seen',JSON.stringify({home:1,freestyle:1,lab:1})))
 await page.goto(path)
 await expect(page.getByRole('heading',{name:'Góp ý & báo lỗi',exact:true})).toBeVisible()
}
async function fill(page){
 await page.getByLabel('Tiêu đề *',{exact:true}).fill('Dây bị mất khi đổi góc nhìn')
 await page.getByLabel('Mô tả của bạn *',{exact:true}).fill('Tôi chọn dây trên breadboard rồi đổi sang sơ đồ; cần giữ cùng lựa chọn.')
}

test('public and app routes show only the approved developer contacts and no delivery claim',async({page})=>{
 for(const route of ['/feedback','/app/feedback']){
  await start(page,route)
  const profile=page.locator('#nguoi-phat-trien')
  await expect(profile.getByRole('heading',{name:'Chiến Phan',exact:true})).toBeVisible()
  expect(await profile.locator('a').evaluateAll(links=>links.map(a=>a.getAttribute('href')))).toEqual([
   'mailto:chienpq12.work@gmail.com','https://www.facebook.com/phan.chien.789760/?locale=vi_VN','https://phanquocchien.vercel.app/'
  ])
  await expect(page.locator('.feedback-page a[href*="github"]')).toHaveCount(0)
  await expect(page.locator('.feedback-local-badge')).toContainText('chưa tự gửi')
  await expect(page.getByRole('button',{name:/^Gửi/})).toHaveCount(0)
 }
})

test('help carries only the current route and developer footer opens the profile',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('mm-tour-seen',JSON.stringify({freestyle:1,home:1})))
 await page.goto('/build/freestyle?resume=1#private-fragment')
 await page.getByRole('button',{name:'Trợ giúp',exact:true}).click()
 await page.getByRole('link',{name:/Góp ý & báo lỗi/}).click()
 await expect(page.getByLabel('Trang liên quan (không bắt buộc)',{exact:true})).toHaveValue('/build/freestyle')
 await page.getByRole('link',{name:'Người phát triển',exact:true}).click()
 await expect(page).toHaveURL(/\/feedback#nguoi-phat-trien$/)
 await expect(page.locator('#feedback-developer-title')).toBeFocused()
})

test('review validates fields and downloads the exact unsent report without making a form request',async({page})=>{
 await start(page)
 const sent=[]
 page.on('request',request=>{if(['POST','PUT','PATCH'].includes(request.method()))sent.push(request.url())})
 await page.getByRole('button',{name:'Xem lại nội dung',exact:true}).click()
 await expect(page.getByLabel('Tiêu đề *',{exact:true})).toBeFocused()
 await expect(page.getByLabel('Tiêu đề *',{exact:true})).toHaveAttribute('aria-invalid','true')
 await fill(page)
 await page.getByText('Thêm chi tiết để dễ tái hiện lỗi',{exact:true}).click()
 await page.getByLabel('Bạn đã làm những bước nào?',{exact:true}).fill('1. Chọn dây\n2. Chuyển góc nhìn')
 await page.getByRole('button',{name:'Xem lại nội dung',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Bản góp ý của bạn',exact:true})).toBeFocused()
 const content=await page.getByLabel('Bản góp ý xem trước',{exact:true}).inputValue()
 const pending=page.waitForEvent('download')
 await page.getByRole('button',{name:'Tải file góp ý (.md)',exact:true}).click()
 const download=await pending
 expect(download.suggestedFilename()).toMatch(/^mach-mo-gop-y-[A-Za-z0-9._-]+\.md$/)
 expect(readFileSync(await download.path(),'utf8')).toBe(content)
 expect(content).toContain('Trạng thái: Chưa gửi')
 expect(content).toContain('1. Chọn dây\n2. Chuyển góc nhìn')
 expect(content).not.toContain('chienpq12.work@gmail.com')
 await expect(page.locator('.feedback-result')).toContainText('chưa được gửi')
 expect(sent).toEqual([])
})

test('clipboard denial offers a selected report instead of claiming copied or sent',async({page})=>{
 await start(page);await fill(page)
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('denied'))}}))
 await page.getByRole('button',{name:'Sao chép',exact:true}).click()
 const preview=page.getByLabel('Bản góp ý xem trước',{exact:true})
 await expect(preview).toBeFocused()
 expect(await preview.evaluate(el=>el.selectionEnd-el.selectionStart)).toBe((await preview.inputValue()).length)
 await expect(page.locator('.feedback-result')).toContainText('Dùng lệnh Sao chép')
 await expect(page.locator('.feedback-result')).not.toContainText('Đã sao chép')
})

test('tab draft survives reload while unknown original bytes are preserved and recoverable',async({page})=>{
 await start(page);await fill(page);await page.reload()
 await expect(page.getByLabel('Tiêu đề *',{exact:true})).toHaveValue('Dây bị mất khi đổi góc nhìn')
 const raw='{ "version": 99, "data": "preserve exact bytes" }'
 await page.evaluate(({key,raw})=>sessionStorage.setItem(key,raw),{key:draftKey,raw})
 await page.reload();await fill(page)
 expect(await page.evaluate(key=>sessionStorage.getItem(key),draftKey)).toBe(raw)
 await expect(page.locator('.feedback-storage')).toContainText('Bản gốc được giữ nguyên')
 const pending=page.waitForEvent('download')
 await page.getByRole('button',{name:'Tải nguyên bản nháp cũ',exact:true}).click()
 const download=await pending
 expect(readFileSync(await download.path(),'utf8')).toBe(raw)
})

test('blocked session storage still allows review and a file from the current input',async({page})=>{
 await page.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='machmo-feedback-draft-v1')throw new DOMException('full','QuotaExceededError');return original.call(this,key,value)}})
 await start(page);await fill(page)
 await expect(page.locator('.feedback-storage')).toContainText('chưa lưu được nháp')
 const pending=page.waitForEvent('download')
 await page.getByRole('button',{name:'Tải file góp ý (.md)',exact:true}).click()
 expect(readFileSync(await (await pending).path(),'utf8')).toContain('Dây bị mất khi đổi góc nhìn')
})

test('a denied storage getter never claims tab durability and still exports the in-memory report',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{configurable:true,get(){throw new DOMException('denied','SecurityError')}}))
 await start(page)
 await expect(page.locator('.feedback-storage')).toContainText('chưa lưu được nháp')
 await fill(page)
 await expect(page.locator('.feedback-storage')).not.toContainText('Nháp được giữ trong tab này')
 const pending=page.waitForEvent('download')
 await page.getByRole('button',{name:'Tải file góp ý (.md)',exact:true}).click()
 expect(readFileSync(await (await pending).path(),'utf8')).toContain('Dây bị mất khi đổi góc nhìn')
 await page.reload()
 await expect(page.getByLabel('Tiêu đề *',{exact:true})).toHaveValue('')
 await expect(page.locator('.feedback-storage')).toContainText('chưa lưu được nháp')
})

for(const width of [375,1440])for(const theme of ['light','dark'])test(`feedback is usable with keyboard and has no serious accessibility violations at ${width}px ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:width===375?812:900})
 await page.addInitScript(theme=>localStorage.setItem('mm-theme',theme),theme)
 await start(page);await fill(page)
 if(width===375){
  await page.getByRole('button',{name:'Xem bản góp ý',exact:true}).click()
  await expect(page.getByLabel('Bản góp ý xem trước',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Viết góp ý',exact:true}).click()
  await expect(page.getByLabel('Tiêu đề *',{exact:true})).toHaveValue('Dây bị mất khi đổi góc nhìn')
 }
 await page.getByLabel('Tiêu đề *',{exact:true}).focus();await page.keyboard.press('Tab')
 await expect(page.getByLabel('Mô tả của bạn *',{exact:true})).toBeFocused()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()
 expect(result.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([])
 await page.screenshot({path:`${proof}/feedback-${width}-${theme}.png`,fullPage:true})
})
