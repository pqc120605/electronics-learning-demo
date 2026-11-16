import {test,expect} from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
async function start(page,width=1440){
 await page.setViewportSize({width,height:width===375?812:900})
 await page.addInitScript(()=>localStorage.setItem('mm-tour-seen',JSON.stringify({home:1,freestyle:1})))
 await page.goto('/build/freestyle')
 await page.getByRole('radio',{name:/Arduino Uno R3/}).check()
 await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
 await page.getByRole('button',{name:'Lắp mạch 2D',exact:true}).click()
}
test('board art is an actual orthographic top view and mapped connector targets are on its image',async({page})=>{
 await start(page)
 const art=page.locator('[data-board-art="arduino-uno-r3"]'),image=art.locator('image')
 await expect(image).toHaveAttribute('href','/board-reference/topview/arduino-uno-r3.png')
 await expect(art.locator('rect')).toHaveCount(0)
 await expect(art).not.toContainText('ĐIỂM NỐI LOGIC')
 const bounds=await image.evaluate(el=>({x:Number(el.getAttribute('x')),y:Number(el.getAttribute('y')),w:Number(el.getAttribute('width')),h:Number(el.getAttribute('height'))}))
 expect(bounds.w/bounds.h).toBeGreaterThan(1)
 for(const role of ['ledOut','input','gnd']){
  const pin=page.locator(`[data-diagram-endpoint="board:${role}"]`)
  await expect(pin).toBeVisible()
  const point=await pin.evaluate(el=>({x:Number(el.getAttribute('cx')),y:Number(el.getAttribute('cy'))}))
  expect(point.x).toBeGreaterThanOrEqual(bounds.x);expect(point.x).toBeLessThanOrEqual(bounds.x+bounds.w)
  expect(point.y).toBeGreaterThanOrEqual(bounds.y);expect(point.y).toBeLessThanOrEqual(bounds.y+bounds.h)
 }
 await page.screenshot({path:'docs/agents/runs/MM-SW-BOARD-2D-003/screenshots/uno-top-1440.png'})
})
test('connecting at the depicted input header keeps endpoint identity in the jumper route',async({page})=>{
 await start(page)
 const before=await page.locator('[data-diagram-wire]').count()
 await page.locator('[data-diagram-endpoint="board:input"]').click()
 await page.locator('[data-diagram-hole-target="bb1:20a"], [data-circuit-endpoint="bb1:20a"].diagram-hole-hit-target').click()
 await expect(page.locator('[data-diagram-wire]')).toHaveCount(before+1)
 await expect(page.locator('[data-diagram-wire]').last()).toHaveAttribute('aria-label',/board:input.*bb1:20a|bb1:20a.*board:input/)
})
test('reference-only STM32 geometry never displays estimated connector positions as mapped pads',async({page})=>{
 await start(page)
 await page.getByRole('button',{name:'Mở bảng thao tác',exact:true}).click()
 await page.getByRole('radio',{name:/STM32 Blue Pill/}).check()
 await expect(page.locator('[data-board-art] image')).toHaveAttribute('href','/board-reference/topview/stm32-blue-pill-f103.png')
 await expect(page.locator('.diagram-board-pin-hit-target')).toHaveCount(0)
 await expect(page.locator('.breadboard-diagram-diagnostic').first()).toContainText('chưa có tọa độ')
})
test('mobile top view can zoom without overflowing the page and keeps keyboard alternatives',async({page})=>{
 await start(page,375)
 await page.getByRole('button',{name:'Phóng to mạch 2D',exact:true}).click()
 await expect(page.getByRole('button',{name:'Vừa khung 2D',exact:true})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.locator('.freestyle-bench summary').filter({hasText:'Danh sách chân'}).click()
 await expect(page.getByRole('button',{name:/board.*D13/}).first()).toBeVisible()
 await page.screenshot({path:'docs/agents/runs/MM-SW-BOARD-2D-003/screenshots/uno-top-375.png'})
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()
 expect(audit.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id)).toEqual([])
})

test('unused function aliases do not intercept clicks on a connected physical header pad',async({page})=>{
 await page.goto('/app/learn/button-led?board=esp32-devkit')
 const lab=page.locator('.button-lab')
 await lab.locator('[data-circuit-endpoint="board-1:input"]').click()
 await expect(lab.getByTestId('button-lab-selection')).toHaveText('board-1:input')
 await lab.getByRole('group',{name:'Chọn hình chiếu mạch'}).getByRole('button',{name:'3D',exact:true}).click()
 await expect(lab.locator('.assembly-pin-marker')).toContainText('GPIO 18')
})
