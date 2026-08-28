import { readFile, stat } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const pages = ['site/index.html', 'site/demo/index.html', 'site/privacy/index.html', 'site/terms/index.html', 'site/404.html', 'src/entrypoints/popup/index.html', 'src/entrypoints/options/index.html'];

describe('document accessibility contract', () => {
  for (const page of pages) {
    it(`${page} has the required document landmarks`, async () => {
      const html = await readFile(page, 'utf8');
      expect(html).toMatch(/<html lang="en">/u);
      expect(html).toMatch(/<title>[^<]+<\/title>/u);
      expect(html.match(/<h1(?:\s|>)/gu)).toHaveLength(1);
      expect(html).toMatch(/<main(?:\s|>)/u);
      expect(html).toMatch(/class="skip-link"/u);
    });
  }

  it('labels every authored raster image', async () => {
    const html = await readFile('site/index.html', 'utf8');
    const images = html.match(/<img\b[^>]*>/gu) ?? [];
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((image) => /\balt="[^"]*"/u.test(image))).toBe(true);
  });

  it('makes every skip-link target programmatically focusable', async () => {
    for (const page of pages) {
      const html = await readFile(page, 'utf8');
      expect(html, page).toMatch(/<main\b[^>]*\bid="main"[^>]*\btabindex="-1"|<main\b[^>]*\btabindex="-1"[^>]*\bid="main"/u);
    }
  });
});

describe('privacy and performance contract', () => {
  it('uses no third-party runtime scripts or font CDNs', async () => {
    const html = await readFile('site/index.html', 'utf8');
    expect(html).not.toMatch(/<script[^>]+src="https?:/u);
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)/u);
  });

  it('ships a compressed hero below 300 KB', async () => {
    expect((await stat('public/illustrations/topographic-route.webp')).size).toBeLessThanOrEqual(300 * 1024);
  });

  it('keeps reminders opt-in and local', async () => {
    const model = await readFile('src/shared/model.ts', 'utf8');
    expect(model).toContain('quietBadge: false');
    expect(model).toContain("focusStartedAt: null");
  });

  it('ships Azure delivery rules for real downloads and hardened static responses', async () => {
    const config = JSON.parse(await readFile('public/staticwebapp.config.json', 'utf8')) as {
      navigationFallback?: unknown;
      globalHeaders?: Record<string, string>;
      routes?: Array<{ route?: string; headers?: Record<string, string> }>;
      responseOverrides?: Record<string, { rewrite?: string }>;
    };
    expect(config.navigationFallback).toBeUndefined();
    expect(config.globalHeaders?.['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders?.['Permissions-Policy']).toContain('camera=()');
    expect(config.routes).toContainEqual(expect.objectContaining({
      route: '/assets/*',
      headers: expect.objectContaining({ 'Cache-Control': expect.stringContaining('immutable') }),
    }));
    expect(config.routes).toContainEqual(expect.objectContaining({
      route: '/downloads/focus-resume-card.zip',
      headers: expect.objectContaining({
        'Content-Type': 'application/zip',
        'Content-Disposition': expect.stringContaining('attachment'),
      }),
    }));
    expect(config.responseOverrides).toEqual({ 404: { rewrite: '/404.html' } });
  });

  it('includes a one-click isolated demo and complete social metadata', async () => {
    const home = await readFile('site/index.html', 'utf8');
    const demo = await readFile('site/demo/index.html', 'utf8');
    const demoScript = await readFile('site/demo.ts', 'utf8');
    expect(home).toContain('href="/demo"');
    expect(home).toContain('Try it with sample data');
    expect(home).toMatch(/<link rel="canonical"/u);
    expect(home).toMatch(/property="og:title"/u);
    expect(home).toMatch(/name="twitter:card"/u);
    expect(home).toMatch(/rel="apple-touch-icon"/u);
    expect(demo).toContain('Demo — sample data, nothing is saved');
    expect(demoScript).toContain("demo:focus-resume-card:sample-card");
  });
});

describe('billing response policy', () => {
  it('keeps 429 handling in the local client rather than claiming control of the shared gateway', async () => {
    const siteClient = await readFile('site/main.ts', 'utf8');
    const extensionClient = await readFile('src/entrypoints/options/main.ts', 'utf8');
    expect(siteClient).toContain("response.status === 429");
    expect(extensionClient).toContain("response.status === 429");
    await expect(readFile('.factory/gateway-rate-limit-contract.json', 'utf8')).rejects.toThrow();
  });
});
