# Focus Resume Card — verification handoff

## Status — **FAIL**

Independent QA of candidate `8c1cfba214aae73663dbe823f09b1f4181de7efe` on 2026-08-27 found that <https://focus-resume-card.sociobot.in/> serves the candidate's HTML, JS and CSS but **does not serve its required extension package**. `GET /downloads/focus-resume-card.zip` returns **HTTP 404**. The live product therefore cannot perform its primary installation/resumption job and must not be treated as released.

See the complete fresh evidence, commands, test results, measured performance, parity hashes, and release-blocking defect in [.factory/verification-2.md](verification-2.md). The earlier repair handoff below is historical and is superseded by this status.

## Required next step

Deploy the complete `dist/site` output including `dist/site/downloads/focus-resume-card.zip`, then run:

```bash
npm run test:live
```

The release gate passes only when the route returns HTTP 200, `application/zip`, and ZIP magic bytes. Local build/type/unit/artifact/a11y/browser-smoke checks otherwise pass; the exact verification command set is recorded in `verification-2.md`.

---

# Historical repair handoff

## Status

**Previously reported released:** 2026-08-27 UTC to <https://focus-resume-card.sociobot.in/> as an Azure Static Web Apps **Standard** site. This repairs the independent-verification findings recorded in `.factory/verification.md` for candidate `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2`.

## What changed

- The release build packages the real MV3 extension archive at `dist/site/downloads/focus-resume-card.zip` (37,538 bytes, ZIP magic `PK\x03\x04`). Azure now serves it as `application/zip` with an attachment disposition; a missing ZIP returns HTTP 404 rather than the SPA HTML fallback.
- Added `public/staticwebapp.config.json`, copied into `dist/site`, with a restricted CSP, Permissions-Policy, nosniff and referrer headers. `img-src` permits only same-origin assets plus the site's local `data:` SVG texture. `connect-src` permits only the Sociobot license API.
- Added a one-year immutable cache policy for hashed `/assets/*`; documents and the fixed-name ZIP revalidate instead of being cached forever.
- Explicitly excluded `/downloads/*` (along with static directories) from navigation fallback.
- The production $9 Plus link remains the Sociobot API checkout route. The now-registered Dodo Live checkout returns HTTP 303 to `checkout.dodopayments.com`.
- Repaired skip-link focus transfer by making the `main` target programmatically focusable.
- Added automated regressions: `test:artifact` asserts the built ZIP, delivery config, CSP/Permissions Policy and immutable asset rules; `test:live` asserts the deployed ZIP MIME/magic bytes, 404 behavior, headers/caching, and Dodo checkout redirect. The Playwright a11y check now asserts skip-link focus.

## Run and verify

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:artifact
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome npm run test:extension
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
npm run test:live
```

Deploy the built `dist/site` directory using the factory Standard-static deploy process. Its root must contain `index.html` and `staticwebapp.config.json`.

## Verification performed

- Clean `npm ci`: 179 packages, 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm test`: 17/17 pass.
- `npm run build`: pass; WXT MV3 build 58.75 KB, packaged archive 37,538 B.
- `npm run test:artifact`: pass.
- `npm run test:extension`: pass (capture-card presentation, resume, persistence, clear, settings, extension axe, and no console errors).
- Live mobile Playwright axe scan: 0 violation groups, 0 serious/critical; skip link moves focus into `<main>`.
- `verify-url.sh` against production: HTTP 200, title/lang/one h1/main/alt checks pass, no console/page errors.
- `npm run test:live`: pass — real ZIP 37,538 B, missing download 404, checkout 303.
- Live headers confirmed: CSP, Permissions-Policy, `application/zip`, and `Cache-Control: public, max-age=31536000, immutable` on hashed JS.
- Mobile Lighthouse against production: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.5 s, CLS 0, TBT 0 ms.

## Known gaps / next steps

- The package is intended for Chromium “Load unpacked” installation until a Chromium Web Store listing is published and signed.
- Native toolbar `activeTab` capture still requires a real browser toolbar gesture; the shipped extension smoke covers the saved-card/resume/clear/settings paths, but a manual real-toolbar capture remains the appropriate final store-release check.
- Firefox and Safari packages, account sync, and encrypted cross-device transfer remain intentionally out of scope for v1.
