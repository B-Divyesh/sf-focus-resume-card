import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const requested = process.argv.join(' ');
const tags = ['@claim:demo-sample-card', '@claim:demo-isolation', '@claim:demo-exit-discard', '@claim:demo-local-data'];
const selected = tags.filter((tag) => !requested.includes('--grep') || requested.includes(tag));
const port = 4176;
const baseUrl = `http://127.0.0.1:${port}`;
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  for (let index = 0; index < 50; index += 1) {
    try {
      const response = await fetch(`${baseUrl}/demo/`);
      if (response.ok) return;
    } catch { /* Vite is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('demo server did not start');
}

const viteCli = resolve('node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteCli, '--config', 'vite.site.config.ts', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
try {
  await waitForServer();
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${baseUrl}/demo/`, { waitUntil: 'networkidle' });

  if (selected.includes('@claim:demo-sample-card')) {
    requireCondition(await page.getByRole('heading', { level: 1, name: 'Try one saved action.' }).isVisible(), '@claim:demo-sample-card: demo heading is missing');
    requireCondition(await page.getByRole('heading', { level: 2, name: 'Write failing test for empty response' }).isVisible(), '@claim:demo-sample-card: sample next action is missing');
    requireCondition(await page.getByRole('button', { name: 'Resume this page' }).isEnabled(), '@claim:demo-sample-card: sample cannot be resumed');
    console.log('@claim:demo-sample-card pass');
  }

  if (selected.includes('@claim:demo-isolation')) {
    await page.getByRole('button', { name: 'Resume this page' }).click();
    requireCondition(await page.getByText('Sample page resumed. In the extension, this opens the saved URL.').isVisible(), '@claim:demo-isolation: resume feedback is missing');
    const storageAfterResume = await page.evaluate(() => Object.keys(localStorage));
    requireCondition(storageAfterResume.length === 1 && storageAfterResume[0] === 'demo:focus-resume-card:sample-card', `@claim:demo-isolation: unexpected local storage keys ${storageAfterResume.join(', ')}`);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    requireCondition(await page.getByText('Demo reset. The sample card is waiting again.').isVisible(), '@claim:demo-isolation: reset feedback is missing');
    requireCondition((await page.evaluate(() => localStorage.getItem('demo:focus-resume-card:sample-card'))) === null, '@claim:demo-isolation: reset did not clear sample state');
    console.log('@claim:demo-isolation pass');
  }

  if (selected.includes('@claim:demo-exit-discard')) {
    await page.getByRole('button', { name: 'Resume this page' }).click();
    requireCondition((await page.evaluate(() => localStorage.getItem('demo:focus-resume-card:sample-card'))) !== null, '@claim:demo-exit-discard: resume did not create isolated sample state');
    await Promise.all([
      page.waitForURL(`${baseUrl}/`),
      page.getByRole('link', { name: 'Start for real' }).click(),
    ]);
    requireCondition((await page.evaluate(() => localStorage.getItem('demo:focus-resume-card:sample-card'))) === null, '@claim:demo-exit-discard: Start for real did not discard sample state');
    await page.goto(`${baseUrl}/demo/`, { waitUntil: 'networkidle' });
    requireCondition(await page.getByText('Waiting', { exact: true }).isVisible(), '@claim:demo-exit-discard: revisiting demo retained resumed state');
    requireCondition(await page.getByRole('button', { name: 'Resume this page' }).isEnabled(), '@claim:demo-exit-discard: revisiting demo did not restore an actionable sample');
    console.log('@claim:demo-exit-discard pass');
  }

  if (selected.includes('@claim:demo-local-data')) {
    await page.getByRole('button', { name: 'Resume this page' }).click();
    const foreign = requests.filter((url) => new URL(url).origin !== baseUrl);
    requireCondition(foreign.length === 0, `@claim:demo-local-data: external requests observed ${foreign.join(', ')}`);
    console.log('@claim:demo-local-data pass');
  }

  await context.close();
  await browser.close();
} finally {
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), new Promise((resolve) => setTimeout(resolve, 1000))]);
}
