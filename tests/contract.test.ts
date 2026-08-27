import { readFile, stat } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const pages = ['site/index.html', 'site/privacy/index.html', 'site/terms/index.html', 'src/entrypoints/popup/index.html', 'src/entrypoints/options/index.html'];

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
      navigationFallback?: { exclude?: string[] };
      globalHeaders?: Record<string, string>;
      routes?: Array<{ route?: string; headers?: Record<string, string> }>;
    };
    expect(config.navigationFallback?.exclude).toContain('/downloads/*');
    expect(config.globalHeaders?.['Content-Security-Policy']).toContain("default-src 'self'");
    expect(config.globalHeaders?.['Permissions-Policy']).toContain('camera=()');
    expect(config.routes).toContainEqual(expect.objectContaining({
      route: '/assets/*',
      headers: expect.objectContaining({ 'Cache-Control': expect.stringContaining('immutable') }),
    }));
    expect(config.routes).toContainEqual(expect.objectContaining({
      route: '/downloads/focus-resume-card.zip',
      headers: expect.objectContaining({ 'Content-Type': 'application/zip' }),
    }));
  });
});
