import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { places } from '../src/data/places.ts';
import { freshProgress, STORAGE_KEY } from '../src/state/progress.ts';

const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const artifacts = new URL('../artifacts/', import.meta.url);
await mkdir(artifacts, { recursive: true });
const report = { checks: [], errors: [] };
const pass = (name) => { report.checks.push(name); console.log('PASS: ' + name); };
const url = process.env.DEMO_URL || 'http://127.0.0.1:5173';
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const read = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
const ready = () => page.locator('[data-ready="true"]').waitFor();
const back = () => page.getByRole('button', { name: 'Back to the neighborhood', exact: true }).click();
page.on('pageerror', (error) => report.errors.push(error.message));
try {
  await page.goto(url);
  await ready();
  await page.keyboard.press('e');
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  await page.getByRole('button', { name: 'Let’s take a walk', exact: true }).click();
  await page.locator('body').evaluate((body) => { body.tabIndex = -1; body.focus(); });
  for (const key of ['e', 'Enter']) await page.keyboard.press(key);
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  pass('Interaction does nothing before starting or away from landmarks');

  // Seed real, walkable arrival points in this isolated test browser. The separate
  // interaction suite reaches Scène through the actual movement and route controls.
  for (const place of places) {
    await page.evaluate(({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)), {
      key: STORAGE_KEY, progress: { ...freshProgress(), started: true, position: place.entrance },
    });
    await page.reload();
    await ready();
    await page.locator('.arrival-key-hint').waitFor();
    assert.equal(await page.locator('.arrival-button').getAttribute('aria-keyshortcuts'), 'E Enter');
    await page.keyboard.press('e');
    await page.locator('[data-view="detail"]').waitFor();
    assert.ok(await page.getByRole('heading', { name: place.name, exact: true }).isVisible());
    assert.ok(await page.getByRole('button', { name: 'Stamp my passport', exact: true }).isVisible());
    assert.deepEqual((await read()).visited, []);
    await back();
  }
  pass('E opens the correct nearby landmark at all five stops without granting a stamp');

  await page.getByRole('button', { name: 'Full screen', exact: true }).click();
  await page.waitForFunction(() => !!document.fullscreenElement);
  // Enter must not also activate the fullscreen button left focused by the click.
  await page.keyboard.press('Enter');
  await page.locator('[data-view="detail"]').waitFor();
  await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector('.is-fullscreen'));
  await back();
  pass('Enter opens a nearby stop from fullscreen even with a map button focused');

  await page.keyboard.down('e');
  await page.locator('[data-view="detail"]').waitFor();
  await page.keyboard.down('e');
  await back();
  await page.keyboard.down('e');
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  await page.keyboard.up('e');
  await page.keyboard.press('e');
  await page.locator('[data-view="detail"]').waitFor();
  await back();
  pass('A held interaction key cannot reopen a landmark on return; a new press can');

  const help = page.getByRole('button', { name: 'How to explore', exact: true });
  await help.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  assert.ok(await help.evaluate((button) => button === document.activeElement));
  await page.keyboard.press('Enter');
  await page.locator('[data-view="about"]').waitFor();
  await page.keyboard.press('e');
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  await back();
  pass('Tab + Enter still activates the focused UI button; E is inactive in overlays');

  await page.evaluate(() => { const input = document.createElement('input'); input.id = 'test-typing'; document.body.append(input); input.focus(); });
  await page.keyboard.press('e');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  assert.equal(await page.locator('#test-typing').inputValue(), 'e');
  await page.locator('#test-typing').evaluate((input) => input.remove());
  await page.keyboard.press('Shift+E');
  assert.equal(await page.locator('[data-view="detail"]').count(), 0);
  pass('Typing and modified shortcuts are not consumed as game interactions');

  await page.waitForFunction(() => document.querySelector('.arrival-button').getAnimations().every((animation) => animation.playState === 'finished'));
  await page.locator('.map-frame').screenshot({ path: new URL('keyboard-arrival-desktop.png', artifacts).pathname });
  const phone = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  phone.on('pageerror', (error) => report.errors.push(error.message));
  await phone.addInitScript(({ key, progress }) => localStorage.setItem(key, JSON.stringify(progress)), {
    key: STORAGE_KEY, progress: { ...freshProgress(), started: true, locale: 'ja', position: places[0].entrance },
  });
  await phone.goto(url);
  await phone.locator('[data-ready="true"]').waitFor();
  await phone.locator('.arrival-button').waitFor();
  assert.equal(await phone.locator('.arrival-key-hint').isVisible(), false);
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await phone.locator('.map-frame').screenshot({ path: new URL('keyboard-arrival-mobile.png', artifacts).pathname });
  await phone.locator('.arrival-button').tap();
  await phone.locator('[data-view="detail"]').waitFor();
  pass('Mobile keeps the compact arrival card, Japanese layout and touch entry');
  await phone.close();
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(new URL('keyboard-entry-report.json', artifacts), JSON.stringify(report, null, 2) + '\n');
  await browser.close();
}
