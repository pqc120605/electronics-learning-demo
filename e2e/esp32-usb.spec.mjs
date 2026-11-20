import { expect, test } from '@playwright/test'

for (const width of [375,1440]) {
  test(`USB has no flash action until approved content is available at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:width===375?812:900})
    await page.addInitScript(() => {
      localStorage.setItem('mm-tour-seen',JSON.stringify({freestyle:1}))
      window.requestedUsbPorts = 0
      Object.defineProperty(navigator,'serial',{value:{requestPort:async()=>{window.requestedUsbPorts++;throw new Error('Mock USB')}}})
    })
    await page.goto('/app/lab/freestyle?board=esp32-devkit')
    await page.getByRole('button',{name:'Dựng mạch mẫu'}).click()
    await page.getByRole('tab',{name:/Viết code/}).click()
    await page.getByRole('button',{name:'Nạp mẫu qua USB',exact:true}).click()
    const dialog=page.getByRole('dialog',{name:'Nạp mẫu qua USB'})
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Mẫu này chưa có firmware đã kiểm và duyệt.')
    await expect(dialog.getByRole('button',{name:'Kết nối board và nạp'})).toHaveCount(0)
    expect(await page.evaluate(()=>window.requestedUsbPorts)).toBe(0)
    await page.screenshot({path:`.tmp/l6e-usb-${width}.png`})
    const [sketch] = await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Tải sketch .ino'}).click()])
    expect(sketch.suggestedFilename()).toMatch(/\.ino$/)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })
}
