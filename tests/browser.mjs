// Uses the existing Playwright runtime; no browser-test dependency is installed by this script.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const url = process.env.DEMO_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const artifactDir = new URL('../artifacts/', import.meta.url);
await mkdir(artifactDir, { recursive: true });
const report = { browser: browser.version(), desktop: [], mobile: [], failures: [], consoleErrors: [] };
const storageKey = 'seongsu-passport:v1';
const progress = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey);
const ready = async (page) => {
  await page.locator('[data-ready="true"]').waitFor({ timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
};
const animationDone = (locator) => locator.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished.catch(() => {}))));
const screenshot = (page, name) => page.screenshot({ path: new URL(name + '.png', artifactDir).pathname, fullPage: true });
const check = (section, name) => { report[section].push(name); console.log('PASS: ' + name); };
const observeErrors = (page) => {
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  observeErrors(page);
  await page.goto(url);
  await ready(page);
  assert.equal(await page.locator('canvas').count(), 1);
  await animationDone(page.locator('.welcome-card'));
  await screenshot(page, 'desktop');
  check('desktop', 'Initial rendering: one canvas, fonts and welcome ready');

  await page.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  await page.getByRole('button', { name: 'Read the story', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Stamp my passport', exact: true }).count(), 0);
  assert.ok(await page.getByRole('button', { name: 'Walk here to collect a stamp', exact: true }).isVisible());
  assert.equal(await page.locator('.map-frame').isVisible(), false);
  await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
  check('desktop', 'Remote reading cannot grant stamps; detail fully replaces the map');

  await page.getByRole('button', { name: 'Night', exact: true }).click();
  assert.equal((await progress(page)).time, 'night');
  await screenshot(page, 'night');
  await page.getByRole('button', { name: 'Morning', exact: true }).click();
  assert.equal((await progress(page)).time, 'morning');
  await page.getByRole('button', { name: 'Afternoon', exact: true }).click();
  check('desktop', 'All three time settings update and persist');

  const stops = ['Brick & Bean', 'Butter Notes', 'Objects & Days', 'Courtyard 05', 'Little Grove'];
  for (const [index, name] of stops.entries()) {
    await page.getByRole('button', { name: 'Walk here · ' + name, exact: true }).click();
    const arrival = page.locator('.arrival-button').filter({ hasText: name });
    await arrival.waitFor({ state: 'visible', timeout: 15000 });
    await arrival.click();
    await page.locator('[data-view="detail"]').waitFor();
    await page.getByRole('button', { name: 'Stamp my passport', exact: true }).click();
    assert.equal((await progress(page)).visited.length, index + 1);
    if (index === 0) {
      await page.getByRole('button', { name: 'Save this place', exact: true }).click();
      assert.deepEqual((await progress(page)).saved, ['brick']);
      assert.equal(await page.getByRole('button', { name: 'Stamp my passport', exact: true }).count(), 0);
      await page.getByRole('button', { name: '02 The interior', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: '02 The interior', exact: true }).getAttribute('aria-pressed'), 'true');
      await screenshot(page, 'place');
      const position = (await progress(page)).position;
      // Elapsed time is intentional here: verify the paused simulation does not drift.
      await page.waitForTimeout(350);
      assert.deepEqual((await progress(page)).position, position);
      await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
      await page.waitForTimeout(350);
      assert.deepEqual((await progress(page)).position, position);
      check('desktop', 'Pause/return preserves position; stamp is unique; bookmark and media tabs work');
    } else if (index < 4) {
      await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
    }
    check('desktop', 'Walked to and collected stop ' + (index + 1) + ': ' + name);
  }
  await page.locator('[data-view="complete"]').waitFor();
  await screenshot(page, 'complete');
  await page.getByRole('button', { name: 'Open your passport', exact: true }).click();
  assert.equal(await page.locator('.stamp-grid .is-collected').count(), 5);
  await screenshot(page, 'passport');
  check('desktop', 'Five unique stops unlock completion and the full passport');

  await page.getByRole('button', { name: '日本語', exact: true }).click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
  assert.ok(await page.getByRole('heading', { name: 'あなたの聖水の物語。', exact: true }).isVisible());
  await page.reload();
  await ready(page);
  const restored = await progress(page);
  assert.equal(restored.visited.length, 5);
  assert.deepEqual(restored.saved, ['brick']);
  assert.equal(restored.locale, 'ja');
  await page.locator('.main-nav').getByRole('button', { name: /パスポート/ }).click();
  await screenshot(page, 'passport-ja');
  check('desktop', 'Japanese, stamps, favorites and progress survive a full reload');

  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Start a fresh passport', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my memories', exact: true }).click();
  assert.equal((await progress(page)).visited.length, 5);
  await page.getByRole('button', { name: 'Start a fresh passport', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  assert.equal((await progress(page)).visited.length, 0);
  assert.equal((await progress(page)).started, false);
  assert.deepEqual((await progress(page)).saved, []);
  check('desktop', 'Reset cancellation preserves data; confirmed reset clears only this passport');
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  observeErrors(phone);
  await phone.goto(url); await ready(phone);
  await animationDone(phone.locator('.welcome-card'));
  await screenshot(phone, 'mobile');
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await phone.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  const pad = phone.getByRole('button', { name: 'Walk up', exact: true });
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  assert.ok(box);
  const cdp = await mobile.newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }] });
  await phone.waitForTimeout(420);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await phone.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).position.y < 575, storageKey);
  const afterTouch = (await progress(phone)).position;
  await phone.waitForTimeout(1100);
  assert.deepEqual((await progress(phone)).position, afterTouch);
  check('mobile', '390px layout fits; real browser touch contact moves avatar and touchcancel stops it');

  await phone.getByRole('button', { name: 'Walk here · Brick & Bean', exact: true }).click();
  await phone.locator('.arrival-button').filter({ hasText: 'Brick & Bean' }).waitFor({ timeout: 15000 });
  await screenshot(phone, 'mobile-playing');
  await phone.locator('.arrival-button').click();
  await phone.getByRole('button', { name: 'Stamp my passport', exact: true }).click();
  await screenshot(phone, 'mobile-place');
  await phone.locator('.main-nav').getByRole('button', { name: /My passport/ }).click();
  await screenshot(phone, 'mobile-passport');
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  check('mobile', 'Touch navigation, place detail, collection and passport layout work');
  await mobile.close();

  const blocked = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException('Storage disabled for test', 'QuotaExceededError'); };
  });
  const privatePage = await blocked.newPage();
  observeErrors(privatePage);
  await privatePage.goto(url); await ready(privatePage);
  await privatePage.locator('.storage-notice').waitFor();
  await privatePage.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  assert.equal(await privatePage.getByRole('button', { name: 'Let’s take a walk', exact: true }).count(), 0);
  check('desktop', 'Storage failure is disclosed and does not prevent playing');
  await blocked.close();

  assert.deepEqual(report.consoleErrors, []);
  check('desktop', 'No page exceptions or console errors across tested contexts');
} catch (error) {
  report.failures.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(new URL('browser-report.json', artifactDir), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
