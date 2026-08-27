import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const extensionPath = resolve('.output/chrome-mv3');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const profilePath = await mkdtemp(join(tmpdir(), 'focus-resume-card-'));
const context = await chromium.launchPersistentContext(profilePath, {
  executablePath,
  headless: true,
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

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const action = 'write failing test for empty response handling';
  await worker.evaluate(async ({ action }) => {
    await chrome.storage.local.clear();
    await chrome.storage.local.set({
      focusResumeCard: {
        id: 'smoke-card', url: 'http://127.0.0.1:4173', title: 'Focus Resume Card', selection: 'Come back to the next step',
        screenshot: null, elapsedSeconds: 2040, nextAction: action, createdAt: Date.now(), resumedAt: null,
      },
    });
  }, { action });
  const popup = await context.newPage();
  watchPage(popup);
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole('heading', { name: action }).waitFor();
  await assertAccessible(popup, 'saved-card popup');

  const resumedPagePromise = context.waitForEvent('page');
  await popup.locator('#resume-button').click();
  const resumedPage = await resumedPagePromise;
  await resumedPage.waitForLoadState('domcontentloaded');
  if (!resumedPage.url().startsWith('http://127.0.0.1:4173')) throw new Error(`Resume opened the wrong page: ${resumedPage.url()}`);

  const reopen = await context.newPage();
  watchPage(reopen);
  await reopen.goto(`chrome-extension://${extensionId}/popup.html`);
  await reopen.getByRole('heading', { name: action }).waitFor();
  await reopen.locator('#clear-button').click();
  await reopen.locator('#confirm-action').click();
  await reopen.waitForTimeout(100);
  const remaining = await worker.evaluate(() => chrome.storage.local.get('focusResumeCard'));
  if (remaining.focusResumeCard) throw new Error('Clear did not remove the saved card.');
  const options = await context.newPage();
  watchPage(options);
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.getByRole('heading', { name: 'Settings that stay out of the way.' }).waitFor();
  await assertAccessible(options, 'settings');
  if (browserErrors.length) throw new Error(`Extension console errors: ${browserErrors.join('; ')}`);
  console.log('extension smoke: render, resume, reopen, clear, settings, axe, and console passed');
} finally {
  await context.close();
  await rm(profilePath, { recursive: true, force: true });
}
