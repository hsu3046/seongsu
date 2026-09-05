import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const report = { checks: [], errors: [], frameTiming: null };
const key = 'seongsu-passport:v1';
const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
page.on('pageerror', (error) => report.errors.push(error.message));
const pass = (name) => { report.checks.push(name); console.log('PASS: ' + name); };
try {
  await page.goto(process.env.DEMO_URL || 'http://127.0.0.1:5173');
  await page.locator('[data-ready="true"]').waitFor();
  await page.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowUp');
  await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).position.y < 555, key);
  pass('Arrow-key movement updates actual world position');
  await page.getByRole('button', { name: 'Walk here · Brick & Bean', exact: true }).click();
  await page.locator('.arrival-button').waitFor({ timeout: 15000 });
  await page.keyboard.press('Enter');
  await page.locator('[data-view="detail"]').waitFor();
  assert.ok(await page.getByRole('button', { name: 'Stamp my passport', exact: true }).isVisible());
  pass('Enter opens a nearby place after selecting a route');
  await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
  // Walk into the café wall; the player's foot position must remain below the facade.
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowUp');
  await page.getByRole('button', { name: 'How to explore', exact: true }).click();
  assert.ok((await read()).position.y >= 405);
  await page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
  const stopped = (await read()).position;
  await page.waitForTimeout(1100);
  assert.deepEqual((await read()).position, stopped);
  pass('Building collision holds; overlay return clears held movement keys');

  for (const label of ['Zoom in', 'Zoom out', 'Back to you']) await page.getByRole('button', { name: label, exact: true }).click();
  assert.equal(await page.locator('canvas').count(), 1);
  pass('Zoom and recenter preserve one live canvas');

  report.frameTiming = await page.evaluate(async () => {
    const intervals = [];
    await new Promise((resolve) => {
      let last = 0;
      const sample = (now) => {
        if (last) intervals.push(now - last);
        last = now;
        if (intervals.length >= 120) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    intervals.sort((a, b) => a - b);
    return { source: 'Browser RAF while game is visible; not an on-device GPU measurement', samples: intervals.length, medianMs: intervals[60], p95Ms: intervals[114] };
  });
  pass('Recorded 120 visible-page frame intervals');

  await page.locator('canvas').evaluate((canvas) => canvas.dispatchEvent(new Event('webglcontextlost', { bubbles: true, cancelable: true })));
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await page.locator('[data-ready="true"]').waitFor();
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 1 && !document.querySelector('.world-loading'));
  pass('Context-loss retry disposes the sleeping engine and creates exactly one replacement');

  await page.getByRole('button', { name: '日本語', exact: true }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= window.innerWidth);
  }
  pass('Japanese layout fits 320px, 390px, 768px and 1440px viewports');
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(new URL('../artifacts/interaction-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
