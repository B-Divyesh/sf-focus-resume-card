import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const extensionPath = resolve('.output/chrome-mv3');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const profilePath = await mkdtemp(join(tmpdir(), 'focus-resume-card-'));
const targetServer = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html lang="en"><title>Resume target</title><body>Resume target</body></html>');
});
await new Promise((resolve, reject) => {
  targetServer.once('error', reject);
  targetServer.listen(0, '127.0.0.1', resolve);
});
const targetAddress = targetServer.address();
if (!targetAddress || typeof targetAddress === 'string') throw new Error('Could not start the resume-target server.');
const targetUrl = `http://127.0.0.1:${targetAddress.port}/work`;
const context = await chromium.launchPersistentContext(profilePath, {
  ...(executablePath ? { executablePath } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 390, height: 844 },
  colorScheme: 'light',
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
const browserErrors = [];
const watchPage = (page) => {
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
};
const assertAccessible = async (page, label) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
  if (serious.length) throw new Error(`${label} axe violations: ${serious.map((violation) => violation.id).join(', ')}`);
};
const assertSkipLink = async (page, label) => {
  await page.keyboard.press('Tab');
  await page.waitForFunction(() => document.activeElement?.getBoundingClientRect().top >= 0);
  const firstFocus = await page.evaluate(() => ({
    isSkipLink: document.activeElement?.classList.contains('skip-link') ?? false,
    top: document.activeElement?.getBoundingClientRect().top ?? -1,
  }));
  if (!firstFocus.isSkipLink || firstFocus.top < 0) throw new Error(`${label} first Tab did not reveal and focus the skip link`);
  await page.keyboard.press('Enter');
  const focused = await page.evaluate(() => document.activeElement?.id);
  if (focused !== 'main') throw new Error(`${label} skip link focused ${focused ?? 'nothing'}, not main`);
};
const assertTargets = async (page, label) => {
  const undersized = await page.locator('a:visible, button:visible').evaluateAll((targets) => targets.flatMap((target) => {
    const box = target.getBoundingClientRect();
    return box.width + 0.01 < 44 || box.height + 0.01 < 44
      ? [`${target.textContent?.trim() || target.getAttribute('aria-label')}: ${box.width.toFixed(1)}×${box.height.toFixed(1)}`]
      : [];
  }));
  if (undersized.length) throw new Error(`${label} undersized targets: ${undersized.join(', ')}`);
};
const luminance = (cssColor) => {
  const values = cssColor.match(/[\d.]+/gu)?.slice(0, 3).map((value) => Number(value) / 255) ?? [];
  const [red, green, blue] = values.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};
const assertFocusContrast = async (page, selector, label) => {
  const target = page.locator(selector);
  await target.focus();
  const colors = await target.evaluate((element) => {
    let background = 'rgba(0, 0, 0, 0)';
    for (let node = element.parentElement; node; node = node.parentElement) {
      const value = getComputedStyle(node).backgroundColor;
      if (value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') { background = value; break; }
    }
    return { outline: getComputedStyle(element).outlineColor, background };
  });
  const levels = [luminance(colors.outline), luminance(colors.background)].sort((left, right) => right - left);
  const contrast = (levels[0] + 0.05) / (levels[1] + 0.05);
  if (contrast < 3) throw new Error(`${label} focus indicator contrast is ${contrast.toFixed(2)}:1 (${colors.outline} on ${colors.background})`);
};

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const action = 'write failing test for empty response handling';
  await worker.evaluate(async ({ action, targetUrl }) => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      focusResumeCard: {
        id: 'smoke-card', url: targetUrl, title: 'Focus Resume Card', selection: 'Come back to the next step',
        screenshot: null, elapsedSeconds: 2040, nextAction: action, createdAt: Date.now(), resumedAt: null,
      },
    });
  }, { action, targetUrl });
  const popup = await context.newPage();
  watchPage(popup);
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('heading', { name: action }).waitFor();
  await assertAccessible(popup, 'saved-card popup');
  await assertSkipLink(popup, 'saved-card popup');
  await assertTargets(popup, 'saved-card popup');
  await popup.emulateMedia({ colorScheme: 'dark' });
  await assertFocusContrast(popup, '#resume-button', 'saved-card popup');

  const resumedPagePromise = context.waitForEvent('page');
  await popup.locator('#resume-button').click();
  const resumedPage = await resumedPagePromise;
  await resumedPage.waitForLoadState('domcontentloaded');
  if (resumedPage.url() !== targetUrl) throw new Error(`Resume opened the wrong page: ${resumedPage.url()}`);

  const reopen = await context.newPage();
  watchPage(reopen);
  await reopen.goto(`chrome-extension://${extensionId}/popup.html`);
  await reopen.getByRole('heading', { name: action }).waitFor();
  await reopen.locator('#clear-button').click();
  await reopen.locator('#confirm-action').click();
  await reopen.waitForTimeout(100);
  const remaining = await worker.evaluate(() => chrome.storage.local.get('focusResumeCard'));
  if (remaining.focusResumeCard) throw new Error('Clear did not remove the saved card.');

  const capture = await context.newPage();
  watchPage(capture);
  // Browser chrome cannot be clicked in headless Chromium, so provide the
  // active-tab and selection inputs while exercising the built popup UI.
  await capture.addInitScript(() => {
    chrome.tabs.query = async () => [{ id: 1, url: 'https://example.test/focus-clock', title: 'Focus clock regression' }];
    chrome.scripting.executeScript = async () => [{ result: '' }];
  });
  await capture.goto(`chrome-extension://${extensionId}/popup.html`);
  const timerButton = capture.getByRole('button', { name: 'Start focus clock' });
  await timerButton.waitFor();
  await timerButton.click();
  await capture.getByRole('button', { name: 'Reset focus clock' }).waitFor();
  await capture.getByText('Focus clock started. It stays only on this device.').waitFor();
  const clockPreferences = await worker.evaluate(() => chrome.storage.local.get('focusResumePreferences'));
  if (typeof clockPreferences.focusResumePreferences?.focusStartedAt !== 'number') throw new Error('Focus clock did not store its start timestamp.');

  const options = await context.newPage();
  watchPage(options);
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByRole('heading', { name: 'Settings that stay out of the way.' }).waitFor();
  await assertAccessible(options, 'settings');
  await assertSkipLink(options, 'settings');
  await assertTargets(options, 'settings');
  await options.emulateMedia({ colorScheme: 'dark' });
  await assertFocusContrast(options, '#buy-link', 'settings');
  await worker.evaluate(async ({ action, targetUrl }) => {
    await chrome.storage.local.set({
      focusResumeCard: {
        id: 'offline-smoke-card', url: targetUrl, title: 'Focus Resume Card', selection: null,
        screenshot: null, elapsedSeconds: 2040, nextAction: action, createdAt: Date.now(), resumedAt: null,
      },
    });
  }, { action, targetUrl });
  await context.setOffline(true);
  const offlinePopup = await context.newPage();
  watchPage(offlinePopup);
  await offlinePopup.goto(`chrome-extension://${extensionId}/popup.html`);
  await offlinePopup.getByRole('heading', { name: action }).waitFor();
  await context.setOffline(false);
  if (browserErrors.length) throw new Error(`Extension console errors: ${browserErrors.join('; ')}`);
  console.log('extension smoke: render, resume, reopen, clear, focus clock feedback, settings, keyboard bypass, 390px targets, offline shell, axe, and console passed');
} finally {
  await context.close();
  await new Promise((resolve, reject) => targetServer.close((error) => error ? reject(error) : resolve()));
  await rm(profilePath, { recursive: true, force: true });
}
