import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {mkdirSync} from 'node:fs'
const proof='docs/agents/runs/MM-SW-BRAND-GUIDE-001/images'
mkdirSync(proof,{recursive:true})
const seed=async page=>page.addInitScript(()=>localStorage.setItem('mm-tour-seen',JSON.stringify(Object.fromEntries(['home','app-home','library','tools','lesson','lab','freestyle'].map(id=>[id,1])))))
// Scope to the intended menu entry: the page can also have a visible Hỏi Mở launcher.
async function openGuide(page){await page.getByRole('button',{name:'Trợ giúp',exact:true}).click();await page.locator('.help-menu-panel').getByRole('button',{name:/Hỏi Mở/}).click();const panel=page.getByRole('dialog',{name:'Mở — bạn đồng hành học điện tử'});await expect(panel).toBeVisible();return panel}

for(const width of [375,1440])test(`guide opens, answers locally and preserves workspace at ${width}px`,async({page})=>{
  await seed(page);await page.setViewportSize({width,height:width===375?812:900});await page.goto('/app/lab/freestyle')
  await expect(page.locator('.freestyle-bench')).toBeVisible()
  const before=await page.evaluate(()=>localStorage.getItem('machmo-freestyle-v1'))
  const panel=await openGuide(page)
  await expect(panel.locator('canvas')).toHaveAttribute('data-status','ready')
  await panel.getByRole('button',{name:'Hỏi đáp',exact:true}).click()
  await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).fill('vi sao led can dien tro')
  await panel.getByRole('button',{name:'Tìm câu trả lời',exact:true}).click()
  await expect(panel.getByRole('heading',{name:'Vì sao LED cần điện trở?',exact:true})).toBeVisible()
  await expect(panel.getByRole('link',{name:'Bộ tính LED và các giả định'})).toBeVisible()
  await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).fill('Thông số chính xác của clone XZQ-987')
  await panel.getByRole('button',{name:'Tìm câu trả lời',exact:true}).click()
  await expect(panel.locator('.guide-results')).toContainText('chưa có nội dung khớp')
  expect(await page.evaluate(()=>localStorage.getItem('machmo-freestyle-v1'))).toEqual(before)
  const bounds=await panel.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false)
  await page.screenshot({path:`${proof}/guide-${width}.png`})
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()
  expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([])
  await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).focus();await page.keyboard.press('Escape');await expect(panel).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Trợ giúp',exact:true})).toBeFocused()
})
test('mascot uses the approved logo, can be hidden and reopened, and respects reduced motion',async({page})=>{
  await seed(page);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/')
  await expect(page.locator('.brand-logo img').first()).toHaveAttribute('src',/mach-mo-logo-concept-v1/)
  const panel=await openGuide(page)
  await expect(panel.getByRole('checkbox',{name:'Chuyển động mascot'})).not.toBeChecked()
  await expect(panel.locator('canvas')).toHaveAttribute('data-motion','off')
  await panel.getByRole('button',{name:'Ẩn nút Mở',exact:true}).click()
  await expect(page.locator('.guide-launcher')).toHaveCount(0)
  await page.reload();await expect(page.locator('.guide-launcher')).toHaveCount(0)
  await openGuide(page);await page.keyboard.press('Escape');await expect(page.locator('.guide-launcher')).toBeVisible()
})
test('visible launcher has the same accessible name as its text',async({page})=>{
  await seed(page);await page.setViewportSize({width:375,height:812});await page.goto('/app/classroom-kits')
  await expect(page.getByRole('button',{name:'Hỏi Mở',exact:true})).toBeVisible()
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()
  expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id)).toEqual([])
})
test('3D failure leaves the original mascot image and local help usable',async({page})=>{
  await seed(page);await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...rest){return kind==='webgl2'?null:original.call(this,kind,...rest)}})
  await page.goto('/projects');const panel=await openGuide(page)
  await expect(panel.getByRole('img',{name:'Mở, robot hướng dẫn học điện tử'})).toBeVisible()
  await expect(panel.locator('.guide-avatar')).toContainText('Ảnh thay thế')
  await panel.getByRole('button',{name:'Hỏi đáp',exact:true}).click();await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).fill('breadboard')
  await panel.getByRole('button',{name:'Tìm câu trả lời',exact:true}).click();await expect(panel.getByRole('heading',{name:'Các lỗ breadboard nối với nhau thế nào?'})).toBeVisible()
})
test('guide reads actual workspace context and hands off to the existing tour',async({page})=>{
  await seed(page);await page.goto('/app/lab?lesson=button-led&guided=1&board=esp32-devkit');let panel=await openGuide(page)
  await panel.getByRole('button',{name:'Đang làm',exact:true}).click();await expect(panel.locator('.guide-context')).toContainText('Board đang chọn:')
  await expect(panel.locator('.guide-context')).toContainText('Nút nhấn điều khiển LED')
  await panel.getByRole('button',{name:'Hướng dẫn',exact:true}).click();await panel.getByRole('button',{name:'Xem từng bước trên trang',exact:true}).click()
  // Existing tours use .mm-tour-card, not a separate mm-tour-dialog class.
  await expect(panel).toHaveCount(0);await expect(page.getByRole('dialog',{name:'Phòng lắp mạch theo bài',exact:true})).toBeVisible();await expect(page.locator('.mm-tour-spot')).toBeVisible()
})
test('dark guide is readable and loads no AI/network service',async({page})=>{
  await seed(page);await page.addInitScript(()=>localStorage.setItem('mm-theme','dark'));await page.goto('/components');const requests=[]
  page.on('request',request=>requests.push(request.url()))
  const panel=await openGuide(page);await expect(panel.locator('canvas')).toHaveAttribute('data-status','ready')
  await panel.getByRole('button',{name:'Hỏi đáp',exact:true}).click();await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).fill('INPUT_PULLUP')
  await panel.getByRole('button',{name:'Tìm câu trả lời',exact:true}).click();await expect(panel.locator('.guide-results')).toContainText('HIGH')
  expect(requests.filter(url=>/^https?:/.test(url)&&new URL(url).origin!==new URL(page.url()).origin)).toEqual([])
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id)).toEqual([])
  await page.screenshot({path:`${proof}/guide-dark.png`})
})
test('ADC answer opens the real guided potentiometer lesson',async({page})=>{
  await seed(page);await page.goto('/app/components');const panel=await openGuide(page)
  await panel.getByRole('button',{name:'Hỏi đáp',exact:true}).click();await panel.getByRole('textbox',{name:'Câu hỏi của bạn'}).fill('ADC')
  await panel.getByRole('button',{name:'Tìm câu trả lời',exact:true}).click();await panel.getByRole('link',{name:'Bài đọc biến trở'}).click()
  await expect(page).toHaveURL(/\/app\/lab\?lesson=analog-potentiometer&guided=1/)
  await expect(page.getByRole('heading',{level:1,name:'Biến trở bật/tắt LED theo ngưỡng'})).toBeVisible()
})
test('unknown board context reports the missing choice without inventing an active board',async({page})=>{
  await seed(page);await page.goto('/learn/button-led?board=unknown-clone');const panel=await openGuide(page)
  await panel.getByRole('button',{name:'Đang làm',exact:true}).click();await expect(panel.locator('.guide-context')).toContainText('Không tìm thấy board unknown-clone')
  await expect(panel.locator('.guide-context')).not.toContainText('Board đang chọn:')
  await expect(panel.locator('.guide-context')).toContainText('Ứng dụng đang báo:')
  await page.screenshot({path:`${proof}/reference-context.png`})
})
test('tour text stays opaque throughout its entrance on mobile',async({page})=>{
  await seed(page);await page.setViewportSize({width:375,height:812});await page.goto('/app/tools/sketch')
  await page.getByRole('button',{name:'Trợ giúp',exact:true}).click();await page.getByRole('button',{name:/Hướng dẫn trang này/}).click()
  const card=page.getByRole('dialog',{name:'Chọn đúng board và mô hình',exact:true});await expect(card).toBeVisible()
  const opacities=await card.evaluate(async root=>{
    const values=[];for(let i=0;i<4;i++){await new Promise(requestAnimationFrame);for(const el of [root,...root.querySelectorAll('h2,h2+p')])values.push(Number(getComputedStyle(el).opacity))}return values
  })
  expect(opacities.every(v=>v===1)).toBe(true)
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(axe.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id)).toEqual([])
})
