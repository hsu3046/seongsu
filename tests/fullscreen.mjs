import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const artifacts = new URL('../artifacts/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const report = { checks: [], errors: [] };
const key = 'seongsu-passport:v1';
const pass = (name) => { report.checks.push(name); console.log('PASS: ' + name); };
const read = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const ready = async (page) => {
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:5173/');
  await page.locator('[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const fits = (page) => page.waitForFunction(() => {
  const frame = document.querySelector('.map-frame').getBoundingClientRect();
  const canvas = document.querySelector('canvas').getBoundingClientRect();
  return frame.x === 0 && frame.y === 0 && Math.abs(frame.width - innerWidth) < 1 && Math.abs(frame.height - innerHeight) < 1
    && Math.abs(canvas.width - frame.width) < 1 && Math.abs(canvas.height - frame.height) < 1;
});
const closed = (page) => page.waitForFunction(() => !document.fullscreenElement && !document.querySelector('.is-fullscreen') && document.body.style.position !== 'fixed');

try {
  const mobile = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  const page = await mobile.newPage();
  await ready(page);
  await page.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Zoom in', exact: true }).isVisible(), false);
  assert.equal(await page.locator('.map-address').isVisible(), false);
  assert.equal(await page.locator('.main-nav').isVisible(), false);
  const map = await page.locator('.map-frame').boundingBox();
  const navigation = await page.locator('.map-navigation').boundingBox();
  assert.ok(navigation.y >= map.y + map.height);
  for (const label of ['Full screen', 'Map tools', 'Walk up']) {
    const box = await page.getByRole('button', { name: label, exact: true }).boundingBox();
    assert.ok(box.width >= 44 && box.height >= 44);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: new URL('mobile-controls.png', artifacts).pathname });
  pass('393px: tools collapsed, address hidden, navigation below map, 44px touch targets');

  const canvas = await page.locator('canvas').elementHandle();
  const previous = (await read(page)).position;
  await page.evaluate(() => scrollTo(0, 150));
  await page.getByRole('button', { name: 'Full screen', exact: true }).scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await fits(page);
  assert.equal(await page.evaluate(() => document.fullscreenElement === document.querySelector('.map-frame')), true);
  assert.equal(await page.getByRole('button', { name: 'Seongsu Passport', exact: true }).count(), 0);
  assert.deepEqual((await read(page)).position, previous);
  await page.screenshot({ path: new URL('mobile-fullscreen.png', artifacts).pathname });
  pass('Native fullscreen fills the display and preserves the current position');

  await page.getByRole('button', { name: 'Map tools', exact: true }).tap();
  await page.getByRole('button', { name: 'Night', exact: true }).tap();
  assert.equal((await read(page)).time, 'night');
  for (const label of ['Zoom in', 'Zoom out', 'Back to you']) await page.getByRole('button', { name: label, exact: true }).tap();
  await page.screenshot({ path: new URL('mobile-map-tools.png', artifacts).pathname });
  await page.touchscreen.tap(170, 450);
  assert.equal(await page.getByRole('button', { name: 'Map tools', exact: true }).getAttribute('aria-expanded'), 'false');
  // The first outside tap dismisses tools instead of starting a map walk.
  await page.waitForTimeout(350);
  assert.deepEqual((await read(page)).position, previous);
  pass('Tools change time/zoom; outside touch closes without click-through movement');

  const pad = await page.getByRole('button', { name: 'Walk up', exact: true }).boundingBox();
  const cdp = await mobile.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 }] });
  await page.waitForTimeout(450);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  // Position persistence is throttled to one second; sample only after release is saved.
  await page.waitForTimeout(1100);
  await page.waitForFunction(({ key, y }) => JSON.parse(localStorage.getItem(key)).position.y < y - 10, { key, y: previous.y });
  const moved = (await read(page)).position;
  await page.waitForTimeout(1100);
  assert.deepEqual((await read(page)).position, moved);
  await page.setViewportSize({ width: 852, height: 393 });
  await fits(page);
  assert.ok(await page.getByRole('button', { name: 'Walk up', exact: true }).isVisible());
  await page.screenshot({ path: new URL('mobile-fullscreen-landscape.png', artifacts).pathname });
  await page.setViewportSize({ width: 393, height: 852 });
  await fits(page);
  await page.getByRole('button', { name: 'Exit full screen', exact: true }).tap();
  await closed(page);
  assert.ok(Math.abs(await page.evaluate(() => scrollY) - scroll) <= 1);
  assert.deepEqual((await read(page)).position, moved);
  assert.ok(await canvas.evaluate((element) => element === document.querySelector('canvas')));
  pass('Touch/cancel, rotation and exit keep the same canvas, progress and page scroll');

  await page.getByRole('button', { name: 'Walk here · Brick & Bean', exact: true }).click();
  await page.locator('.arrival-button').waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await fits(page);
  await page.locator('.arrival-button').tap();
  await closed(page);
  await page.locator('[data-view="detail"]').waitFor();
  assert.equal(await page.evaluate(() => scrollY), 0);
  await page.getByRole('button', { name: 'Stamp my passport', exact: true }).click();
  await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
  assert.deepEqual((await read(page)).visited, ['brick']);
  pass('Entering a place exits fullscreen cleanly and still grants its stamp');
  await mobile.close();

  for (const mode of ['unsupported', 'rejected']) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
    const phone = await context.newPage();
    await phone.addInitScript((mode) => {
      if (mode === 'unsupported') Object.defineProperty(document, 'fullscreenEnabled', { get: () => false });
      else Element.prototype.requestFullscreen = () => Promise.reject(new TypeError('Fullscreen unavailable'));
    }, mode);
    await ready(phone);
    await phone.getByRole('button', { name: 'Full screen', exact: true }).tap();
    await fits(phone);
    assert.equal(await phone.evaluate(() => document.fullscreenElement), null);
    await phone.getByRole('button', { name: 'Let’s take a walk', exact: true }).tap();
    await phone.getByRole('button', { name: 'Exit full screen', exact: true }).tap();
    await closed(phone);
    await phone.getByRole('button', { name: '日本語', exact: true }).click();
    await phone.getByRole('button', { name: '全画面表示', exact: true }).tap();
    await fits(phone);
    await phone.getByRole('button', { name: 'マップの設定', exact: true }).tap();
    await phone.keyboard.press('Escape');
    assert.ok(await phone.getByRole('button', { name: '全画面を閉じる', exact: true }).isVisible());
    await phone.keyboard.press('Escape');
    await closed(phone);
    pass(mode + ': window fallback, start, close and Japanese controls work');
    await context.close();
  }

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await ready(desktop);
  assert.ok(await desktop.getByRole('button', { name: 'Night', exact: true }).isVisible());
  assert.equal(await desktop.getByRole('button', { name: 'Map tools', exact: true }).isVisible(), false);
  await desktop.getByRole('button', { name: 'Full screen', exact: true }).click();
  await fits(desktop);
  await desktop.keyboard.press('Escape');
  await closed(desktop);
  await desktop.getByRole('button', { name: 'Full screen', exact: true }).click();
  await fits(desktop);
  await desktop.evaluate(() => document.exitFullscreen());
  await closed(desktop);
  assert.equal(await desktop.getByRole('button', { name: 'Full screen', exact: true }).getAttribute('aria-pressed'), 'false');
  assert.equal(await desktop.locator('canvas').count(), 1);
  pass('Desktop controls, Escape and external native exit remain synchronized');
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(new URL('fullscreen-report.json', artifacts), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
