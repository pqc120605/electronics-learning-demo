import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const routes=['/','/app','/learn/button-led','/boards?board=seeed-xiao-esp32-s3','/components?component=resistor','/build?lesson=blink&guided=1','/tools/electronics-calculators','/app/classroom-kits']
for(const width of [375,1440]) for(const route of routes) test(`a11y ${width}px ${route}`, async ({page},testInfo)=>{
  await page.setViewportSize({width,height:900})
  await page.goto(route)
  await expect(page.locator('main h1')).toBeVisible()
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze()
  await testInfo.attach('axe-results',{body:JSON.stringify(result.violations,null,2),contentType:'application/json'})
  expect(result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([])
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
