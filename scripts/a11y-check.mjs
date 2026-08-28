import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const baseUrl = (process.env.A11Y_URL ?? 'http://127.0.0.1:4173').replace(/\/$/u, '');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const routes = ['/', '/privacy/', '/terms/'];
const viewports = [
  { name: 'mobile-dark-reduced', width: 390, height: 844, colorScheme: 'dark', reducedMotion: 'reduce' },
  { name: 'desktop-light', width: 1440, height: 900, colorScheme: 'light', reducedMotion: 'no-preference' },
];
const evidence = {};
const failures = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: viewport.colorScheme,
    reducedMotion: viewport.reducedMotion,
  });
  for (const route of routes) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

    await page.keyboard.press('Tab');
    await page.waitForFunction(() => document.activeElement?.getBoundingClientRect().top >= 0);
    const firstFocus = await page.evaluate(() => ({
      isSkipLink: document.activeElement?.classList.contains('skip-link') ?? false,
      top: document.activeElement?.getBoundingClientRect().top ?? -1,
    }));
    if (!firstFocus.isSkipLink || firstFocus.top < 0) failures.push(`${viewport.name} ${route}: first Tab did not reveal and focus the skip link`);
    await page.keyboard.press('Enter');
    const skipTarget = await page.evaluate(() => document.activeElement?.id);
    if (skipTarget !== 'main') failures.push(`${viewport.name} ${route}: skip link focused ${skipTarget ?? 'nothing'}, not main`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (overflow) failures.push(`${viewport.name} ${route}: horizontal overflow`);

    const undersizedLinks = viewport.width === 390 ? await page.locator('a:visible').evaluateAll((links) => links.flatMap((link) => {
      const box = link.getBoundingClientRect();
      return box.width + 0.01 < 44 || box.height + 0.01 < 44
        ? [`${link.textContent?.trim() || link.getAttribute('aria-label') || link.getAttribute('href')}: ${box.width.toFixed(1)}×${box.height.toFixed(1)}`]
        : [];
    })) : [];
    if (undersizedLinks.length) failures.push(`${viewport.name} ${route}: undersized links: ${undersizedLinks.join(', ')}`);

    const renderedPolicy = await page.evaluate(() => ({
      background: getComputedStyle(document.documentElement).backgroundColor,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDuration: getComputedStyle(document.querySelector('.button') ?? document.body).transitionDuration,
    }));
    if (viewport.colorScheme === 'dark' && renderedPolicy.background !== 'rgb(23, 32, 29)') failures.push(`${viewport.name} ${route}: dark palette did not apply (${renderedPolicy.background})`);
    if (viewport.reducedMotion === 'reduce' && (renderedPolicy.scrollBehavior !== 'auto' || Number.parseFloat(renderedPolicy.transitionDuration) > 0.001)) failures.push(`${viewport.name} ${route}: reduced-motion policy did not apply (${JSON.stringify(renderedPolicy)})`);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    if (serious.length) failures.push(`${viewport.name} ${route}: axe ${serious.map((violation) => violation.id).join(', ')}`);
    if (errors.length) failures.push(`${viewport.name} ${route}: console/page errors: ${errors.join('; ')}`);
    evidence[`${viewport.name}:${route}`] = { results, firstFocus, skipTarget, overflow, undersizedLinks, renderedPolicy, errors };
    await page.close();
  }
  await context.close();
}

await browser.close();

await mkdir('.factory/evidence', { recursive: true });
await writeFile('.factory/evidence/accessibility.json', JSON.stringify(evidence, null, 2));
if (failures.length) throw new Error(failures.join('\n'));
console.log('accessibility: home/privacy/terms pass axe, keyboard bypass, light/dark, reduced motion, overflow, console, and 390px link-target checks');
