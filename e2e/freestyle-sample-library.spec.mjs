import {expect,test} from '@playwright/test'

for(const width of [375,1440]) {
  test(`sample library opens editable runnable and wiring-only examples at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:width===375?812:900})
    await page.addInitScript(()=>localStorage.setItem('mm-tour-seen',JSON.stringify({freestyle:1})))
    await page.goto('/app/lab/freestyle?board=esp32-devkit')
    const examples=page.getByRole('combobox',{name:'Mạch mẫu',exact:true})
    await expect(examples.locator('option')).toHaveCount(12)
    await examples.selectOption('keypad-five')
    await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
    await page.getByRole('button',{name:'▶ Chạy'}).click()
    await page.getByRole('combobox',{name:/Phím của keypad/}).selectOption('5')
    await expect(page.locator('[data-diagram-part="led1"]')).toHaveClass(/is-lit/)
    await page.getByRole('combobox',{name:/Phím của keypad/}).selectOption('6')
    await expect(page.locator('[data-diagram-part="led1"]')).not.toHaveClass(/is-lit/)
    await page.getByRole('button',{name:'■ Dừng'}).click()
    await examples.selectOption('ultrasonic')
    await page.getByRole('button',{name:'Dựng mạch mẫu',exact:true}).click()
    await expect(page.getByRole('button',{name:'▶ Chạy'})).toBeDisabled()
    await expect(page.getByText('Siêu âm đo khoảng cách · nối dây và đọc sketch',{exact:true})).toBeVisible()
    await page.getByText('Siêu âm đo khoảng cách · nối dây và đọc sketch',{exact:true}).click()
    await expect(page.getByText(/Thử đổi thời gian chờ ECHO/)).toBeVisible()
    await page.screenshot({path:`.tmp/l6f-samples-${width}.png`})
  })
}
