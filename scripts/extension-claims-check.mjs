import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const requested = process.argv.join(' ');
const tags = [
  '@claim:extension-local-data',
  '@claim:card-fields',
  '@claim:offline-card',
  '@claim:redaction',
  '@claim:screenshot-card',
  '@claim:exact-page-resume',
  '@claim:no-account',
  '@claim:quiet-reminder',
  '@claim:daily-license-check',
  '@claim:plus-treatments',
  '@claim:plus-price',
  '@claim:clear-undo',
];
const selected = tags.filter((tag) => !requested.includes('--grep') || requested.includes(tag));
if (!selected.length) throw new Error(`No matching claim. Choose one of: ${tags.join(', ')}`);

const extensionPath = resolve('.output/chrome-mv3');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const profilePath = await mkdtemp(join(tmpdir(), 'focus-resume-claims-'));
const targetServer = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end('<!doctype html><html lang="en"><title>Claim target</title><main>Exact saved page</main></html>');
});
await new Promise((resolvePromise, reject) => {
  targetServer.once('error', reject);
  targetServer.listen(0, '127.0.0.1', resolvePromise);
});
const address = targetServer.address();
if (!address || typeof address === 'string') throw new Error('Could not start claim target.');
const targetUrl = `http://127.0.0.1:${address.port}/work?case=resume#next`;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const context = await chromium.launchPersistentContext(profilePath, {
  ...(executablePath ? { executablePath } : { channel: 'chromium' }),
  headless: true,
  viewport: { width: 390, height: 844 },
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
const requests = [];
context.on('request', (request) => requests.push(request.url()));

try {
  let worker = context.serviceWorkers()[0];
  if (!worker) worker = await context.waitForEvent('serviceworker');
  const extensionId = new URL(worker.url()).host;
  const extensionOrigin = `chrome-extension://${extensionId}`;
  const card = {
    id: 'claim-card',
    url: targetUrl,
    title: 'Retry middleware · api.ts',
    selection: 'Return a typed error when attempts is zero.',
    screenshot: null,
    elapsedSeconds: 2040,
    nextAction: 'Write failing test for empty response',
    createdAt: Date.now(),
    resumedAt: null,
  };
  const resetStorage = () => worker.evaluate(() => chrome.storage.local.clear());
  const seedCard = (value = card, preferences = { focusStartedAt: null, quietBadge: false, theme: 'field' }) => worker.evaluate(
    ({ value, preferences }) => chrome.storage.local.set({ focusResumeCard: value, focusResumePreferences: preferences }),
    { value, preferences },
  );
  const openPopup = async () => {
    const page = await context.newPage();
    await page.goto(`${extensionOrigin}/popup.html`);
    return page;
  };
  const pass = (tag) => console.log(`${tag} pass`);

  if (selected.includes('@claim:extension-local-data')) {
    await resetStorage();
    const requestStart = requests.length;
    await seedCard();
    const popup = await openPopup();
    await popup.getByRole('heading', { name: card.nextAction }).waitFor();
    const stored = await worker.evaluate(() => chrome.storage.local.get());
    requireCondition(stored.focusResumeCard?.url === targetUrl, '@claim:extension-local-data: real card was not stored in chrome.storage.local');
    const outbound = requests.slice(requestStart).filter((url) => /^https?:/u.test(url));
    requireCondition(outbound.length === 0, `@claim:extension-local-data: card display sent network requests: ${outbound.join(', ')}`);
    await popup.close();
    pass('@claim:extension-local-data');
  }

  if (selected.includes('@claim:card-fields')) {
    await resetStorage();
    await seedCard();
    const popup = await openPopup();
    await popup.getByRole('heading', { name: card.nextAction }).waitFor();
    for (const value of [card.title, card.selection, '34 minutes']) {
      requireCondition(await popup.getByText(value, { exact: false }).isVisible(), `@claim:card-fields: missing ${value}`);
    }
    await popup.close();
    pass('@claim:card-fields');
  }

  if (selected.includes('@claim:offline-card')) {
    await resetStorage();
    await seedCard();
    await context.setOffline(true);
    const popup = await openPopup();
    await popup.getByRole('heading', { name: card.nextAction }).waitFor();
    requireCondition(await popup.getByText('Offline.').isVisible(), '@claim:offline-card: offline state was not shown');
    await popup.close();
    await context.setOffline(false);
    pass('@claim:offline-card');
  }

  if (selected.includes('@claim:redaction')) {
    await resetStorage();
    await seedCard({ ...card, title: null, selection: null });
    const popup = await openPopup();
    await popup.getByText('Title hidden').waitFor();
    requireCondition(await popup.getByText(card.selection).count() === 0, '@claim:redaction: redacted selection appeared in the saved card');
    const stored = await worker.evaluate(() => chrome.storage.local.get('focusResumeCard'));
    requireCondition(stored.focusResumeCard.title === null && stored.focusResumeCard.selection === null, '@claim:redaction: redacted fields were retained');
    await popup.close();
    pass('@claim:redaction');
  }

  if (selected.includes('@claim:screenshot-card')) {
    const screenshot = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    await resetStorage();
    await seedCard({ ...card, screenshot });
    const popup = await openPopup();
    const image = popup.getByRole('img', { name: `Saved view of ${card.title}` });
    await image.waitFor();
    requireCondition(await image.getAttribute('src') === screenshot, '@claim:screenshot-card: stored screenshot was not rendered from local card data');
    await popup.close();
    pass('@claim:screenshot-card');
  }

  if (selected.includes('@claim:exact-page-resume')) {
    await resetStorage();
    await seedCard();
    const popup = await openPopup();
    const opened = context.waitForEvent('page');
    await popup.getByRole('button', { name: 'Resume this page' }).click();
    const resumed = await opened;
    await resumed.waitForLoadState('domcontentloaded');
    requireCondition(resumed.url() === targetUrl, `@claim:exact-page-resume: opened ${resumed.url()} instead of ${targetUrl}`);
    await resumed.close();
    pass('@claim:exact-page-resume');
  }

  if (selected.includes('@claim:no-account')) {
    await resetStorage();
    await seedCard();
    const popup = await openPopup();
    await popup.getByRole('heading', { name: card.nextAction }).waitFor();
    requireCondition(await popup.locator('input[type="email"], input[type="password"]').count() === 0, '@claim:no-account: account credentials were requested');
    await popup.close();
    pass('@claim:no-account');
  }

  if (selected.includes('@claim:quiet-reminder')) {
    await resetStorage();
    await seedCard();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    const off = await worker.evaluate(() => chrome.action.getBadgeText({}));
    requireCondition(off === '', `@claim:quiet-reminder: reminder was on by default (${off})`);
    await seedCard(card, { focusStartedAt: null, quietBadge: true, theme: 'field' });
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    const on = await worker.evaluate(() => chrome.action.getBadgeText({}));
    requireCondition(on === '•', `@claim:quiet-reminder: opt-in reminder did not appear (${on})`);
    pass('@claim:quiet-reminder');
  }

  if (selected.includes('@claim:daily-license-check')) {
    let verificationRequests = 0;
    await context.route('https://api.sociobot.in/api/v1/products/focus-resume-card/verify?*', async (route) => {
      verificationRequests += 1;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok"}' });
    });
    const options = await context.newPage();
    await options.goto(`${extensionOrigin}/options.html`);
    await options.evaluate(() => {
      localStorage.setItem('sb_license:focus-resume-card', 'claim-license-token');
      localStorage.setItem('sb_license_cache:focus-resume-card', JSON.stringify({ token: 'claim-license-token', valid: true, checkedAt: Date.now() }));
    });
    await options.reload();
    await options.getByText('Plus is active on this device.').waitFor();
    requireCondition(verificationRequests === 0, `@claim:daily-license-check: fresh daily cache made ${verificationRequests} request(s)`);
    await options.evaluate(() => localStorage.setItem('sb_license_cache:focus-resume-card', JSON.stringify({ token: 'claim-license-token', valid: true, checkedAt: Date.now() - 86_400_001 })));
    await options.reload();
    await options.getByText('Plus is active on this device.').waitFor();
    requireCondition(verificationRequests === 1, `@claim:daily-license-check: stale cache made ${verificationRequests} requests instead of one`);
    await options.evaluate(() => localStorage.clear());
    await options.close();
    pass('@claim:daily-license-check');
  }

  if (selected.includes('@claim:plus-treatments')) {
    await resetStorage();
    await context.route('https://api.sociobot.in/api/v1/products/focus-resume-card/verify?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"valid":true,"reason":"ok"}' }));
    const options = await context.newPage();
    await options.goto(`${extensionOrigin}/options.html`);
    await options.evaluate(() => localStorage.clear());
    await options.reload();
    const night = options.locator('input[value="night"]');
    requireCondition(await night.isDisabled(), '@claim:plus-treatments: Night was available before verification');
    await options.getByLabel('Have a license? Paste it here').fill('claim-license-token');
    await options.getByRole('button', { name: 'Verify license' }).click();
    await options.getByText('Plus is active on this device.').waitFor();
    requireCondition(await night.isEnabled(), '@claim:plus-treatments: Night stayed locked after a valid license');
    await night.check();
    const preferences = await worker.evaluate(() => chrome.storage.local.get('focusResumePreferences'));
    requireCondition(preferences.focusResumePreferences.theme === 'night', '@claim:plus-treatments: selected Night treatment was not stored');
    await options.close();
    pass('@claim:plus-treatments');
  }

  if (selected.includes('@claim:plus-price')) {
    const options = await context.newPage();
    await options.goto(`${extensionOrigin}/options.html`);
    requireCondition(await options.getByText('$9 once.', { exact: false }).isVisible(), '@claim:plus-price: one-time price is missing');
    requireCondition(await options.getByRole('link', { name: 'Buy Plus — $9 once' }).getAttribute('href') === 'https://api.sociobot.in/api/v1/products/focus-resume-card/checkout', '@claim:plus-price: checkout does not use the product billing endpoint');
    await options.close();
    pass('@claim:plus-price');
  }


  if (selected.includes('@claim:clear-undo')) {
    await resetStorage();
    await seedCard();
    const popup = await openPopup();
    await popup.getByRole('button', { name: 'Clear card' }).click();
    await popup.getByRole('button', { name: 'Clear card' }).last().click();
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
    requireCondition(!(await worker.evaluate(() => chrome.storage.local.get('focusResumeCard'))).focusResumeCard, '@claim:clear-undo: clear left the card in storage');
    await popup.getByRole('button', { name: 'Undo' }).click();
    await popup.getByRole('heading', { name: card.nextAction }).waitFor();
    requireCondition((await worker.evaluate(() => chrome.storage.local.get('focusResumeCard'))).focusResumeCard?.id === card.id, '@claim:clear-undo: undo did not restore the card');
    await popup.close();
    pass('@claim:clear-undo');
  }
} finally {
  await context.close();
  await new Promise((resolvePromise, reject) => targetServer.close((error) => error ? reject(error) : resolvePromise()));
  await rm(profilePath, { recursive: true, force: true });
}
