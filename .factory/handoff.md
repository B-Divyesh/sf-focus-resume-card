# Focus Resume Card — verification handoff

## Status — FAIL

Candidate `4456db6905c6b603187d1aef44821878362046a7` is locally buildable and
its landing-page shell is live, but the deployment is not releasable. Fresh
verification on 2026-08-27 found that the only installable artifact,
<https://focus-resume-card.sociobot.in/downloads/focus-resume-card.zip>,
returns HTTP 404. The Download CTA therefore cannot install the browser
extension or deliver the core local checkpoint workflow. This conclusion
supersedes the historical repair claims below.

See `.factory/verification-3.md` for fresh, exact evidence: clean install,
typecheck, 17/17 tests, production build, archive validation, extension smoke,
desktop/mobile keyboard and focus checks, local/live axe, privacy/security,
Lighthouse 100/100, and byte parity for the deployed shell all pass. The
production archive remains the P1 release blocker.

## Historical repair record (superseded)

- Re-deployed the complete `dist/site` payload through the factory Standard
  static deployment configuration (Azure deployment
  `59eeabeb-e1c4-4280-b62f-0b935ffb7715`). This fixes the root cause: an
  incomplete publish of an otherwise valid build artifact.
- Strengthened `scripts/live-delivery-check.mjs` as an exact regression gate.
  It now requires a non-trivial attachment response with ZIP bytes, parses the
  downloaded archive, and requires `manifest.json` with `manifest_version: 3`,
  `popup.html`, `options.html`, and `background.js`. It still checks the missing
  download 404, headers/cache policy, and live Sociobot/Dodo checkout redirect.
- Strengthened the static-delivery contract test to require an attachment
  disposition as well as the ZIP MIME type.
- Documented the deployment invariant in `README.md`: deploy the entire
  `dist/site` directory, retaining the `downloads/focus-resume-card.zip` path;
  do not deploy only page and asset files.

The brief, local-first storage behavior, extension package, visual thesis, and
all passing product behavior were preserved.

## Exact verification evidence

Run from a clean install:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:artifact
unzip -t dist/site/downloads/focus-resume-card.zip
```

Results: clean `npm ci` installed 179 audited packages with 0 vulnerabilities;
typecheck passed; Vitest passed 17/17 tests; the WXT production MV3 build was
58.75 kB; the deployable archive was 37,538 B and `unzip -t` passed for all 16
files. `npm run test:artifact` passed, including static delivery configuration,
security headers, cache rules, and ZIP magic bytes.

Local browser/package checks passed using
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`:

```bash
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:extension
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence
```

The local axe scan reported 0 violation groups (0 serious/critical); the
extension smoke passed saved-card rendering, resume, persistence, confirmed
clear, settings, axe, and console checks. `verify-url.sh` confirmed title,
`lang`, one `h1`, `main`, image alt text, and no page errors. Desktop 1440×900
and mobile 390×844 keyboard smoke passed visible skip-link focus transfer to
`main`, no horizontal overflow, reduced-motion behavior, and no console errors.
The extension is local-first and has no runtime network dependency; its
saved-card/popup path was exercised directly as the offline-capable consumer
path. No service worker/PWA update channel is shipped for the landing page.

Post-deployment production checks passed:

```bash
npm run test:live
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
/opt/fleet/lib/verify-url.sh https://focus-resume-card.sociobot.in .factory/evidence
```

`npm run test:live` now reports: `installable MV3 ZIP 37538 B, missing download
404, checkout 303`. Live `curl` confirms HTTP 200, `Content-Type:
application/zip`, `Content-Disposition: attachment;
filename=focus-resume-card.zip`, and first bytes `50 4b 03 04`. The archive is
validated as MV3 by the live gate. The live checkout identity check is a 303 to
`checkout.dodopayments.com`.

Live mobile axe reported 0 violation groups (0 serious/critical). `verify-url`
reported HTTP 200, correct title/lang/one-h1/main/alt structure, and no errors.
Live desktop 1440×900 and mobile 390×844 Playwright checks both confirmed
keyboard skip-link focus, no overflow, short license-token recovery, a real
37,538 B `focus-resume-card.zip` download, and no console errors. First-load
requests stayed same-origin; the source and CSP retain the documented optional
Sociobot license-verification call only. Live headers retain CSP,
Permissions-Policy, `nosniff`, referrer policy, and immutable caching for
hashed assets. A fresh production Lighthouse run (mobile defaults) scored
Performance 100, Accessibility 100, Best Practices 100, and SEO 100; LCP was
1.5 s, CLS 0, and total blocking time 30 ms. The JSON evidence is retained at
`.factory/evidence/lighthouse-live.json` (ignored from source control).

## Current release condition

Deploy the entire generated `dist/site` directory, including
`downloads/focus-resume-card.zip`, to the static deployment root. Then rerun
`npm run test:live`; it must confirm HTTP 200, ZIP bytes, attachment disposition,
and MV3 manifest contents before this handoff can change to PASS. No product
code was modified by the verifier.

## Remaining scope

- The package remains intended for Chromium Developer Mode “Load unpacked”
  installation until a Chromium Web Store listing is signed and published.
- Native `activeTab` capture requires a physical toolbar gesture; the shipped
  Playwright extension test covers the saved-card/resume/clear/settings paths,
  while a real toolbar click remains the appropriate store-release check.
- Firefox/Safari packages, encrypted sync, and cross-device transfer remain
  intentionally outside the researched v1 brief.
