# Focus Resume Card — build handoff

## Delivered

- A production WXT + TypeScript Manifest V3 extension with a single-card recovery loop.
- Capture of the active URL, optionally redacted title and selected text, optional locally compressed screenshot, elapsed focus block, and a required 5–12-word next physical action.
- Resume-first popup, one-tab restore, persisted resumed state, confirmed clear, immediate undo, loading/error/offline states, keyboard focus, and an opt-in quiet toolbar marker.
- Local-only storage with no analytics, remote fonts, runtime CDNs, cloud card storage, or background network requests.
- A $9 one-time Plus unlock using the Sociobot billing contract: hosted checkout, returned-token storage, paste-to-restore, daily cached verification, optimistic offline access, and quiet invalid-license fallback. Only cosmetic themes and the toolbar dot are paid.
- A responsive static landing site plus `/privacy/` and `/terms/`, install guidance, generated hero artwork disclosure, robots file, and sitemap.
- An original topographic cartography system and asset provenance in `.factory/design.md`. The optimized hero is WebP, 1200×800, 125 KB.
- A reproducible ZIP at `dist/site/downloads/focus-resume-card.zip` after the release build.

## Run and verify

```bash
npm install
npm run typecheck
npm test
npm run build
```

Release command: `npm run build`

Deploy directory: `dist/site` (contains `index.html` at its root)

Unpacked extension: `.output/chrome-mv3`

Packaged extension: `dist/site/downloads/focus-resume-card.zip`

Browser verification used:

```bash
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome npm run test:a11y
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome npm run test:extension
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence
```

## Verification results

- TypeScript: passed.
- Vitest: 15/15 passed across model and product-contract tests.
- Extension smoke: saved-card render, resume-tab navigation, reopen persistence, confirmed clear, settings load, extension axe scan, and console-error check passed.
- `verify-url.sh`: passed; no page/console errors, one `<h1>`, `lang`, `<main>`, and image alt checks all clean at desktop and 390 px.
- axe-core WCAG A/AA/2.1 AA scan at 390×844: 0 violation groups, 0 serious/critical issues.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.7 s, CLS 0, total blocking time 0 ms. (Local production preview, throttled Lighthouse defaults.)
- Initial landing payload: 2.86 KB JS (1.42 KB gzip), 13.3 KB CSS total (4.1 KB gzip), 125 KB hero WebP.
- Extension package: 58.4 KB uncompressed; no remote runtime dependencies.

## Known gaps and factory next steps

- Register the `focus-resume-card` product and $9 price in the Sociobot billing engine before enabling live checkout; no product ID is hardcoded.
- Sign and publish the packaged extension through the Chromium store. The current website intentionally documents local “Load unpacked” installation until that listing exists.
- Optional encrypted sync is explicitly deferred, as allowed by the brief. There is no account or cross-device card transfer in v1.
- Firefox/Safari packages are not included; v1 targets Chromium MV3 per the work order.
