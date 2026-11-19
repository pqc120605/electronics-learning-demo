import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function download(page, name) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name, exact: true }).click()])
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) }
}

for (const width of [375, 1440]) {
  test(`export and restore freestyle assets and drafts at ${width}px`, async ({page}) => {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 900 })
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ freestyle: 1 })))
    await page.goto('/app/lab/freestyle?board=arduino-uno-r3')
    await page.getByRole('button', { name: 'Dựng mạch mẫu' }).click()
    await page.getByRole('button', { name: 'Bản nháp', exact: true }).click()
    const design = await download(page, 'Xuất dự án .machmo.json')
    const workspace = JSON.parse(design.bytes.toString()).workspace
    expect(design.name).toMatch(/\.machmo\.json$/)
    expect(workspace.doc.wires).toHaveLength(4)
    expect((await download(page, 'Xuất BOM CSV')).bytes.toString()).toContain('220 Ω')
    expect((await download(page, 'Tải sketch .ino')).bytes.toString()).toContain('digitalWrite')
    const vector = await download(page, 'Tải bản vẽ SVG')
    expect(vector.bytes.toString()).toMatch(/<image[^>]+href="data:image\//)
    expect(vector.name).toBe('mach-mo-breadboard.svg')
    const raster = await download(page, 'Tải bản vẽ PNG')
    expect(raster.bytes.toString('hex', 0, 8)).toBe('89504e470d0a1a0a')
    expect(raster.bytes.length).toBeGreaterThan(9000)
    const backup = await download(page, 'Sao lưu tất cả nháp')
    const capture = () => page.evaluate(() => localStorage.getItem('machmo-freestyle-v1'))
    const before = await capture()
    await page.getByLabel('Khôi phục tất cả nháp từ tệp').setInputFiles({ name: backup.name, mimeType: 'application/json', buffer: backup.bytes })
    await expect(page.getByText(/Đã thêm \d+ bản nháp/)).toBeVisible()
    expect(await capture()).toBe(before)
    await page.screenshot({ path: `.tmp/l6b-transfer-${width}.png` })
    await page.getByRole('button', { name: 'Đóng bản nháp' }).click()
    await page.getByRole('button', { name: 'Schematic', exact: true }).click()
    await page.getByRole('button', { name: 'Bản nháp', exact: true }).click()
    expect((await download(page, 'Tải bản vẽ SVG')).name).toBe('mach-mo-schematic.svg')
    const schematic = await download(page, 'Tải bản vẽ PNG')
    expect(schematic.bytes.toString('hex', 0, 8)).toBe('89504e470d0a1a0a')
    await page.getByRole('button', { name: 'Đóng bản nháp' }).click()
    await page.getByRole('button', { name: 'Bàn trống', exact: true }).click()
    await page.getByLabel('Nhập bản nháp từ file').setInputFiles({ name: design.name, mimeType: 'application/json', buffer: design.bytes })
    await expect(page.locator('[data-diagram-wire="w1"]')).toBeVisible()
    const after = JSON.parse(await capture())
    expect(after.doc).toEqual(workspace.doc)
    expect(after.code).toBe(workspace.code)
  })
}
