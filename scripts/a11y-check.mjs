import { mkdir, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from '@playwright/test';

const url = process.env.A11Y_URL ?? 'http://127.0.0.1:4173';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
const skipLink = page.locator('.skip-link').first();
await skipLink.focus();
await page.keyboard.press('Enter');
const skipTarget = await page.evaluate(() => document.activeElement?.id);
await browser.close();

await mkdir('.factory/evidence', { recursive: true });
await writeFile('.factory/evidence/axe.json', JSON.stringify(results, null, 2));
const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
console.log(`axe: ${results.violations.length} total violation groups, ${serious.length} serious/critical`);
for (const violation of serious) console.error(`${violation.impact}: ${violation.id} — ${violation.help}`);
if (skipTarget !== 'main') {
  console.error(`skip link did not move focus to main (focused: ${skipTarget ?? 'none'})`);
  process.exitCode = 1;
}
