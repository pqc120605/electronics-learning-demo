import { expect, test } from '@playwright/test'
import { createServer } from 'vite'

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

const cases = [
  ['cd4051b','CD4051BE',16,'DIP-16','COM = 0,25 V'],
  ['cd74hc4067','CD74HC4067PWR',24,'TSSOP-24','COM = 0,2 V'],
  ['pcf8574','PCF8574N',16,'DIP-16','GPIO 0xFC'],
  ['mcp23017','MCP23017-E/SP',28,'DIP-28','GPIOA/B 0x81 0x54'],
  ['24lc256','24LC256-I/P',8,'DIP-8','0xA5 0xFF'],
  ['mcp4921','MCP4921-E/P',8,'DIP-8','1,25 V'],
  ['ads1115','ADS1115IDGSR',10,'TSSOP-10','0x40 0x00'],
  ['tca9548a','TCA9548APWR',24,'TSSOP-24','Mặt nạ 0x01'],
  ['lm358','LM358P',8,'DIP-8',[[0.5,0.495,0.505],[2,1.98,2.02],[3.3,3.299,3.301]]],
  ['lm393','LM393P',8,'DIP-8',[[0,0,0.4],[5,4.95,5.01]]],
  ['sn65hvd230','SN65HVD230DR',8,'SOIC-8','Vi sai 2 V'],
  ['max3232','MAX3232EIDR',16,'SOIC-16','TOUT = 5 V'],
]

for (const [id, mpn, pads, footprintPrefix, exercise] of cases) {
  test(mpn + ' keeps exact 2D, KiCad, WebGL, model result and bench placement in Chrome', async ({ page }) => {
    test.setTimeout(60_000)
    if (id === 'ads1115') await page.setViewportSize({width:390,height:844})
    await page.goto('/components?component=' + id)
    const panel = page.getByRole('region', {name: 'Biến thể ' + mpn})
    await expect(panel.getByRole('link', {name:/^Pinout /})).toBeVisible()
    await expect(panel.locator('.part-r1-symbol button')).toHaveCount(pads)
    await panel.getByRole('button',{name:/· pad 1$/}).click()
    const selection = panel.locator('.part-r1-selection strong')
    const pinOne = await selection.textContent()
    expect(pinOne).toMatch(/pad 1$/)
    await panel.getByRole('button',{name:'Footprint',exact:true}).click()
    await expect(panel.locator('.part-r1-pad')).toHaveCount(pads)
    await expect(panel.getByRole('button',{name:/^Pad 1 ·/})).toHaveAttribute('aria-pressed','true')
    const link = panel.getByRole('link',{name:'Tải footprint KiCad ↧'})
    await expect(link).toHaveAttribute('href', new RegExp('/' + footprintPrefix + '_.*\\.kicad_mod$'))
    const response = await page.request.get(await link.getAttribute('href'))
    expect(response.status()).toBe(200)
    expect(await response.text()).toMatch(/^\(footprint /)
    if (id === 'ads1115') {
      const [download] = await Promise.all([page.waitForEvent('download'),link.click()])
      expect(download.suggestedFilename()).toBe('TSSOP-10_3x3mm_P0.5mm.kicad_mod')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    }
    await panel.getByRole('button',{name:'Mô hình 3D',exact:true}).click()
    await expect(panel.getByRole('img',{name:'Mô hình 3D '+mpn})).toBeVisible()
    const marker = panel.locator('.component-model-marker')
    await expect(marker).toBeVisible()
    const previous = await marker.getAttribute('style')
    await panel.getByRole('button',{name:'Xoay sang phải'}).click()
    await expect(marker).not.toHaveAttribute('style',previous)
    await expect(selection).toHaveText(pinOne)
    if (typeof exercise === 'string') {
      await panel.getByRole('button',{name:'Chạy bài thử'}).click()
      await expect(panel.getByLabel('Kết quả tín hiệu')).toContainText(exercise)
    } else {
      await panel.getByRole('link',{name:/ngspice/}).click()
      const lab = page.locator('.spice-guided-practice')
      for (const [index,[guess,min,max]] of exercise.entries()) {
        await lab.getByRole('combobox',{name:'Điều kiện thử'}).selectOption(String(index))
        await lab.getByRole('textbox',{name:/Dự đoán/}).fill(String(guess))
        await lab.getByRole('button',{name:'Ghi dự đoán và chạy'}).click()
        const result = lab.getByText(/^Ngspice · /)
        await expect(result).toBeVisible({timeout:15000})
        const value = Number((await result.textContent()).match(/= (-?[\d,.]+)/)?.[1].replace(',','.'))
        expect(value).toBeGreaterThanOrEqual(min)
        expect(value).toBeLessThanOrEqual(max)
      }
      await page.goto('/components?component=' + id)
    }
    await page.getByRole('link',{name:/Lắp thử trên bàn tự do/}).click()
    await expect(page.getByRole('button',{name:new RegExp('^' + mpn + ' ·')})).toBeVisible()
    const draft = () => page.evaluate(() => JSON.parse(localStorage.getItem('machmo-freestyle-v1') ?? '{}').doc)
    const type = id + '-r2b'
    await expect.poll(async () => (await draft())?.parts.some(part => part.type === type)).toBe(true)
    const placed = (await draft()).parts.find(part => part.type === type)
    expect(placed.mount.kind).toBe(footprintPrefix.startsWith('DIP') ? 'breadboard' : 'bench')
    if (id === 'ads1115' || id === 'mcp23017') {
      await page.getByText('Danh sách chân để nối bằng bàn phím',{exact:true}).click()
      await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':sda"]').click()
      await page.locator('[data-breadboard-control-endpoint="' + placed.id + ':scl"]').click()
      await expect.poll(async () => (await draft())?.wires.length).toBe(1)
      const original = (await draft()).wires[0]
      await page.reload()
      await page.getByRole('button',{name:'Mở bản nháp đã lưu',exact:true}).click()
      await page.getByRole('button',{name:'Schematic',exact:true}).click()
      await expect(page.locator('[data-pin-key="' + placed.id + ':sda"]')).toBeVisible()
      await expect(page.locator('[data-pin-key="' + placed.id + ':scl"]')).toBeVisible()
      expect((await draft()).wires[0]).toEqual(original)
    }
  })
}

test('virtual I²C on the bench sends data to the physically wired PCF8574', async ({ page }) => {
  const server = await createServer({ logLevel:'silent', server:{ middlewareMode:true } })
  let workspace
  try {
    const { addFreestyleWire, blankFreestyleWorkspace, workspaceWithFreestyleBoard } =
      await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
    const base = workspaceWithFreestyleBoard(blankFreestyleWorkspace(),'arduino-uno-r3')
    const doc = { ...base.doc, parts: [...base.doc.parts,
      ...[['ic','pcf8574-r2b'],['r1','resistor'],['r2','resistor']].map(([id,type],order) =>
        ({ id,type,mount:{kind:'bench',lane:'right',order}, ...(type === 'resistor' ? { value:{ohm:4700} } : {}) })),
    ] }
    const connections = [
      ['board','vcc','ic','vcc'], ...['gnd','a0','a1','a2'].map(pin => ['board','gnd','ic',pin]),
      ['board','ledOut','ic','sda'], ['board','input','ic','scl'],
      ['ic','sda','r1','a'], ['ic','scl','r2','a'], ['board','vcc','r1','b'], ['board','vcc','r2','b'],
    ]
    const endpoint = (partId,pinId) => ({kind:'pin',partId,pinId})
    workspace = { ...base, pinMap:{...base.pinMap,ledOut:18,input:19}, doc:connections.reduce((current,[a,b,c,d]) =>
      addFreestyleWire(current,endpoint(a,b),endpoint(c,d)),doc) }
  } finally { await server.close() }
  await page.addInitScript(draft => {
    if (!localStorage.getItem('machmo-freestyle-v1')) localStorage.setItem('machmo-freestyle-v1',JSON.stringify(draft))
  },workspace)
  await page.goto('/build/freestyle?resume=1')
  await page.getByRole('tab',{name:/Viết code & Chạy/}).click()
  await page.getByText('Bộ điều khiển ảo I²C / SPI',{exact:true}).click()
  await page.getByLabel('Byte ghi hex').fill('FE')
  await page.getByRole('button',{name:'Gửi I²C',exact:true}).click()
  await expect(page.getByLabel('Kết quả giao dịch ảo')).toHaveText('ACK')
  await page.getByLabel('Byte ghi hex').fill('')
  await page.getByLabel('Số byte đọc').fill('1')
  await page.getByRole('button',{name:'Gửi I²C',exact:true}).click()
  await expect(page.getByLabel('Kết quả giao dịch ảo')).toHaveText('0xFE')
  await expect(page.getByLabel('Nhật ký giao tiếp')).toContainText('RX 0xFE')
})
