import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test.use({launchOptions:{args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}})

const boards = [
  {pid:239, columns:63, points:830, from:'T+:25', to:'B+:26', joined:'T+:26', missing:'T+:51'},
  {pid:65, columns:17, points:170, from:'1e', to:'1f', joined:'1a', missing:'T+:1'},
]
const pathFor = board => '/components?component=breadboard-adafruit-'+board.pid
const specFor = board => 'adafruit-'+board.pid+'-r2c-1'
const saved = page => page.evaluate(()=>JSON.parse(localStorage.getItem('machmo-freestyle-v1')??'{}'))
const hit = (page,id) => page.locator('.diagram-hole-hit-target[data-circuit-endpoint="bb1:'+id+'"]')

for (const board of boards) {
  for (const width of [1440,390]) {
    test('Adafruit '+board.pid+' on '+width+'px keeps exact hole identity, downloads and simulates the passive bridge', async ({page}) => {
      test.setTimeout(120_000)
      await page.setViewportSize({width,height:900})
      await page.goto(pathFor(board))
      const panel = page.getByRole('region',{name:'Biến thể Adafruit '+board.pid})
      const select = panel.getByLabel('Chọn lỗ')
      const selected = panel.getByLabel('Lỗ đang chọn')
      await expect(panel.locator('circle[data-r2c-hole]')).toHaveCount(board.points)
      await expect(panel.locator('circle[data-r2c-hole^="bb1:T"]')).toHaveCount(board.pid===239?100:0)
      await panel.getByRole('button',{name:'Lỗ 1a',exact:true}).focus()
      await page.keyboard.press('ArrowRight')
      await expect(selected).toHaveText(/^2a ·/)
      await page.keyboard.press('ArrowUp')
      await expect(selected).toHaveText(/^2b ·/)
      await select.selectOption('bb1:'+board.columns+'j')
      await expect(selected).toHaveText(new RegExp('^'+board.columns+'j ·'))
      await panel.getByRole('button',{name:'Footprint',exact:true}).click()
      const footprint = panel.getByRole('link',{name:/Tải footprint cơ khí KiCad/})
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      const [download] = await Promise.all([page.waitForEvent('download'),footprint.click()])
      expect(download.suggestedFilename()).toBe('Adafruit_'+board.pid+'_R2C.kicad_mod')
      expect((await readFile(await download.path(),'utf8')).match(/\(fp_rect/g)).toHaveLength(board.points+1)

      await panel.getByRole('button',{name:'Mô hình 3D',exact:true}).click()
      await expect(panel.getByRole('img',{name:'Mô hình 3D Adafruit '+board.pid})).toBeVisible()
      const marker=panel.locator('.component-model-marker')
      await expect(marker).toBeVisible()
      const before = await marker.getAttribute('style')
      await panel.getByRole('button',{name:'Xoay sang phải'}).click()
      await expect(marker).not.toHaveAttribute('style',before)
      await expect(selected).toHaveText(new RegExp('^'+board.columns+'j ·'))
      if (width===1440) {
        const raster=panel.locator('canvas')
        await raster.scrollIntoViewIfNeeded()
        const [point, frame] = await Promise.all([marker.boundingBox(),raster.boundingBox()])
        expect(point).not.toBeNull()
        expect(frame).not.toBeNull()
        const x=point.x+point.width/2-frame.x, y=point.y+point.height/2-frame.y
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(frame.width)
        expect(y).toBeGreaterThan(0)
        expect(y).toBeLessThan(frame.height)
        await select.selectOption('bb1:1a')
        await raster.click({position:{x,y}})
        await expect(selected).toHaveText(new RegExp('^'+board.columns+'j ·'))
      }

      await panel.getByText('Đo thông mạch ảo',{exact:true}).click()
      const check = async (first,second,message) => {
        await panel.getByLabel('Đầu dò 1').fill(first)
        await panel.getByLabel('Đầu dò 2').fill(second)
        await panel.getByRole('button',{name:'Đo thông mạch',exact:true}).click()
        await expect(panel.getByLabel('Kết quả thông mạch')).toHaveText(message)
      }
      await check(board.from,board.joined,/^Thông mạch/)
      await check(board.from,board.to,/^Hở/)
      await check(board.from,board.missing,/Lỗ không có/)
      await panel.getByRole('checkbox',{name:/Nối jumper/}).check()
      await check(board.from,board.to,/^Thông mạch/)
      await panel.getByRole('checkbox',{name:/Nối jumper/}).uncheck()
      await check(board.from,board.to,/^Hở/)
    })
  }

  test('Adafruit '+board.pid+' bench preserves the wire through 3D, reload, export and archive-on-switch', async ({page}) => {
    test.setTimeout(120_000)
    await page.setViewportSize({width:1440,height:900})
    await page.goto(pathFor(board))
    await page.getByRole('link',{name:/Lắp thử trên bàn tự do/}).click()
    await expect(page.locator('.diagram-hole-hit-target')).toHaveCount(board.points)
    const ends = [board.from,board.to]
    await hit(page,ends[0]).click()
    await hit(page,ends[1]).click()
    await expect.poll(async()=> (await saved(page)).doc?.wires.length).toBe(1)
    const wired = (await saved(page)).doc
    expect(wired.breadboards[0].spec).toBe(specFor(board))
    expect(wired.wires[0].from.holeId).toBe('bb1:'+ends[0])
    expect(wired.wires[0].to.holeId).toBe('bb1:'+ends[1])
    await expect(hit(page,board.joined)).toHaveClass(/is-same-net/)
    const glb = page.waitForResponse(response=>response.url().includes('/catalog-r2c/adafruit-'+board.pid+'.glb'))
    await page.getByRole('button',{name:'Lắp mạch 3D',exact:true}).click()
    expect((await glb).status()).toBe(200)
    const scene = page.getByRole('region',{name:'Lắp mạch 3D'})
    await expect(scene.locator('.freestyle-assembly-pin')).toHaveAttribute('data-pin-key','bb1:'+ends[1])
    await expect(scene.getByRole('status')).toHaveText(/lỗ trên cùng net/)
    await scene.getByRole('button',{name:'Nhìn từ trên'}).click()
    await page.reload()
    await expect(page.locator('.diagram-hole-hit-target')).toHaveCount(board.points)
    expect((await saved(page)).doc.wires).toEqual(wired.wires)
    await page.getByRole('button',{name:'Bản nháp',exact:true}).click()
    const [out] = await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:/Xuất dự án .machmo.json/}).click()])
    const file = await out.path()
    await page.getByRole('button',{name:'Đóng bản nháp'}).click()
    const parts = page.getByRole('tab',{name:/Thêm linh kiện/})
    if (!await parts.isVisible()) await page.getByRole('button',{name:'Mở bảng thao tác'}).click()
    await parts.click()
    const other = boards.find(item=>item!==board)
    await page.getByLabel('Mẫu breadboard').selectOption(specFor(other))
    await expect.poll(async()=> (await saved(page)).doc?.breadboards[0]?.spec).toBe(specFor(other))
    expect((await saved(page)).doc.wires).toHaveLength(0)
    await page.getByRole('button',{name:'Bản nháp',exact:true}).click()
    await expect(page.locator('li[data-draft-key*=":previous:"]').first()).toContainText('1 dây')
    await page.getByRole('button',{name:'Đóng bản nháp'}).click()
    await page.getByLabel('Nhập bản nháp từ file').setInputFiles(file)
    await expect.poll(async()=> (await saved(page)).doc?.breadboards[0]?.spec).toBe(specFor(board))
    expect((await saved(page)).doc.wires).toEqual(wired.wires)
  })
}
