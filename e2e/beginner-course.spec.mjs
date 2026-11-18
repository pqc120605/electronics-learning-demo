import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
const key = 'machmo-beginner-course-v1';
let activities;
let sourceServer;
test.beforeAll(async () => {
    sourceServer = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } });
    activities = (await sourceServer.ssrLoadModule('/src/data/beginnerCourse.ts')).BEGINNER_ACTIVITIES;
});
test.afterAll(async () => { await sourceServer?.close(); });
async function start(page, path = '/learn/basics') {
    await page.addInitScript(() => localStorage.setItem('mm-tour-seen', JSON.stringify({ home: 1, freestyle: 1, lab: 1 })));
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Nền tảng điện tử', exact: true })).toBeVisible();
}
async function session(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)), key); }
function predict(id, controls) {
    if (id === 'closed-loop')
        return controls.returnConnected ? 'LED sáng' : 'LED tắt';
    if (id === 'breadboard')
        return controls.holePair === 'same-strip' ? 'Có nối điện' : 'Tách rời';
    if (id === 'led-polarity')
        return !controls.resistorPresent ? 'Cần thêm điện trở trước khi chạy' : controls.ledForward ? 'LED sáng' : 'LED tắt';
    if (id === 'button-logic')
        return controls.pressed !== controls.inverted ? 'LED sáng' : 'LED tắt';
    return controls.inputPercent > controls.threshold ? 'LED sáng' : 'LED tắt';
}
test('five activities require prediction, explicit observations and explanations; resume preserves old data', async ({ page }) => {
    const oldWorkspace = '{"keep":"old workspace bytes","revision":42}';
    await page.addInitScript(value => localStorage.setItem('machmo-builder-session', value), oldWorkspace);
    await start(page);
    const observe = page.getByRole('button', { name: 'Quan sát mô hình', exact: true });
    await expect(observe).toBeDisabled();
    for (const activity of activities) {
        await page.getByRole('navigation', { name: 'Năm hoạt động' }).getByRole('button').filter({ hasText: activity.title }).click();
        if (['button-logic', 'sensor-threshold'].includes(activity.id)) {
            if (!(await page.getByLabel('Board của thử nghiệm').inputValue()))
                await page.getByLabel('Board của thử nghiệm').selectOption({ index: 1 });
        }
        const cases = page.locator('.beginner-cases button');
        for (let index = 0; index < await cases.count(); index++) {
            await cases.nth(index).click();
            await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả');
            await expect(observe).toBeDisabled();
            const saved = await session(page);
            await page.getByRole('radio', { name: predict(activity.id, saved.controls), exact: true }).check();
            await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả');
            await observe.click();
            await expect(page.getByTestId('beginner-result')).not.toContainText('Chưa có kết quả');
        }
        const explanation = activity.explanationChoices.find(choice => choice.id === activity.correctExplanationId);
        await page.getByRole('radio', { name: explanation.label, exact: true }).check();
        await expect(page.getByRole('heading', { name: 'Đã đạt tiêu chí hoạt động', exact: true })).toBeVisible();
    }
    const completed = await session(page);
    expect(completed.observations.length).toBeGreaterThan(5);
    await page.reload();
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'sensor-threshold');
    await expect(page.getByTestId('beginner-result')).toContainText('Chưa có kết quả');
    await page.goto('/app');
    await expect(page.getByRole('region', { name: 'Khóa nền tảng điện tử' })).toContainText('5/5 hoạt động đạt tiêu chí');
    await page.getByRole('link', { name: `Tiếp tục: ${activities[4].title}`, exact: true }).click();
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'sensor-threshold');
    expect(await page.evaluate(() => localStorage.getItem('machmo-builder-session'))).toBe(oldWorkspace);
});
for (const [label, raw] of [['invalid', '{broken json'], ['future', JSON.stringify({ schema: 999, courseVersion: 999, privateDraft: 'preserve' })]]) {
    test(`${label} stored data stays recoverable and is never replaced`, async ({ page }) => {
        await page.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key, raw });
        await start(page);
        await expect(page.getByLabel('Lưu tiến độ')).toContainText('Đang bảo vệ dữ liệu cũ');
        await page.getByLabel('Nối đường về nguồn', { exact: true }).check();
        await page.getByLabel('Nối đường về nguồn', { exact: true }).uncheck();
        expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Tải dữ liệu gốc đang lưu' }).click();
        expect((await downloadPromise).suggestedFilename()).toBe('mach-mo-beginner-original.json');
    });
}
test('storage failure keeps the experiment in memory with a current backup', async ({ page }) => {
    await page.addInitScript(key => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === key)
        throw new DOMException('blocked', 'QuotaExceededError'); return original.call(this, k, v); }; }, key);
    await start(page);
    await page.getByLabel('Nối đường về nguồn', { exact: true }).check();
    await page.getByLabel('Nối đường về nguồn', { exact: true }).uncheck();
    await expect(page.getByLabel('Lưu tiến độ')).toContainText('Chỉ trong bộ nhớ của tab');
    await page.getByRole('radio', { name: 'LED tắt', exact: true }).check();
    await page.getByRole('button', { name: 'Quan sát mô hình', exact: true }).click();
    await expect(page.getByTestId('beginner-result')).toContainText('LED tắt');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Tải tiến độ hiện tại' }).click();
    expect((await downloadPromise).suggestedFilename()).toBe('mach-mo-beginner-backup.json');
});
test('a competing saved revision is preserved on the next edit', async ({ page }) => {
    await start(page);
    await page.getByLabel('Nối đường về nguồn', { exact: true }).check();
    const other = await page.context().newPage();
    await other.goto('/learn/basics');
    await other.getByRole('navigation', { name: 'Năm hoạt động' }).getByRole('button').filter({ hasText: activities[1].title }).click();
    const competitor = await other.evaluate(key => localStorage.getItem(key), key);
    await expect(page.getByLabel('Lưu tiến độ')).toContainText('Có bản lưu khác');
    await other.close();
    await page.getByRole('radio', { name: 'LED sáng', exact: true }).check();
    await expect(page.getByLabel('Lưu tiến độ')).toContainText('Có bản lưu khác');
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(competitor);
    await page.getByRole('button', { name: 'Nạp lại bản lưu', exact: true }).click();
    await expect(page.locator('[data-activity]')).toHaveAttribute('data-activity', 'breadboard');
});
for (const viewport of [{ width: 375, height: 812 }, { width: 1440, height: 900 }]) {
    test(`keyboard and layout ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await start(page, '/app/learn/basics');
        const radio = page.getByRole('radio', { name: 'LED sáng', exact: true });
        await radio.focus();
        await page.keyboard.press('Space');
        await expect(radio).toBeChecked();
        const observe = page.getByRole('button', { name: 'Quan sát mô hình', exact: true });
        await observe.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByTestId('beginner-result')).not.toContainText('Chưa có kết quả');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: `.tmp/agent-checks/MM-SW-LOCAL-LEARNING-UI-001/course-${viewport.width}.png`, fullPage: true });
    });
}
