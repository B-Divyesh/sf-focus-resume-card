# Focus Resume Card — repair 6 handoff

## Status

The repository-owned findings from independent verification commit
`19348dbba96c1869657f8ac03a3732c1221d8916` are repaired and covered by
regressions. Repair commit `df1842e` was pushed and deployed to the production
custom domain.

Release acceptance remains blocked by one external factory-service condition:
the shared Sociobot billing gateway does not enforce its documented request
allowances. This static repository cannot configure that service, and
`AGENTS.md` forbids changing billing or infrastructure from the product repo.
The repair restores an exact live probe so this condition cannot be hidden.

## Repairs

- Expanded `.factory/claims.json` from 3 demo-only entries to 18 public
  claims. Exact tests now cover real installed-extension storage and requests,
  card fields, offline use, redaction, local screenshots, exact URL resume,
  confirmed clear and Undo, 5–12-word boundaries, no-account use, opt-in
  reminders, daily license caching, Plus treatments, price, response handling,
  demo isolation, runtime requests, and the installable package.
- Added `scripts/extension-claims-check.mjs`, which loads the production MV3
  build in a clean Chromium profile and observes real `chrome.storage.local`,
  extension pages, tabs, requests, badge state, and recorded billing responses.
- Changed the dark focus token from `#1676a3` to `#39a8dc`. The extension
  resume-card surface now measures 5.44:1 instead of 2.89:1. Browser checks
  independently fail below 3:1 on site, popup, and settings controls.
- Replaced extension map-lore labels with the consistent terms `card`,
  `next action`, and `page context`. A source regression rejects every
  retired phrase. `.factory/copy-audit.md` records the changed copy.
- Added a reviewed 1200×630 social image derived from the original generated
  artwork, a 180×180 touch icon, and complete canonical/Open Graph/Twitter/touch
  metadata on home, demo, privacy, terms, and 404.
- Fixed the demo claim harness so it terminates the Vite process it starts.
- Restored `.factory/gateway-rate-limit-contract.json` and
  `npm run test:gateway`. It probes 12+1 verify and 6+1 checkout calls and
  requires a real 429, positive `Retry-After`, `Cache-Control: no-store`,
  and no checkout redirect on the blocked call.

## Clean verification

Run on 2026-08-28 UTC with Playwright 1.58.2 Chromium from
`/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`.

```text
npm ci                         PASS — 178 packages, 0 vulnerabilities
npm run check                  PASS — typecheck, lint, 27 tests, production build
npm run test:artifact          PASS — 37,550-byte MV3 ZIP and delivery rules
npm run test:package           PASS — 13 reproducible fixed-date entries
unzip -t ...zip                PASS — no archive errors
npm run test:demo              PASS — all 3 website/demo claim tests
npm run test:claims            PASS — all 12 installed-extension claim tests
all 18 claims.json commands    PASS individually from their exact command
npm run test:a11y              PASS — desktop + 390×844, light/dark/reduced motion
npm run test:extension         PASS — installed MV3 flow, offline, keyboard, axe
verify-url.sh local            PASS — title/lang/h1/main/alt/labels, no errors
```

Accessibility checks cover every site route plus popup and settings. They
include keyboard skip links, Enter/Space operation, 44 px targets, overflow,
focus visibility and contrast, reduced motion, and axe WCAG A/AA/2.1 AA. Axe
reported no serious or critical findings. Browser console and page errors were
empty.

Local Lighthouse mobile:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.8 s |
| TBT | 0 ms |
| CLS | 0 |

Static budgets pass: home JavaScript is 2.92 KB raw / 1.43 KB gzip, shared CSS
is 14.74 KB raw / 4.24 KB gzip, there are no downloaded fonts, the hero is
124,548 bytes, the social image is 98,724 bytes, and the extension is 59.65 KB
uncompressed.

## External response-policy blocker

`npm run test:gateway` failed on 2026-08-28 UTC with exact observations:

```text
license-verify: request 13 must return 429, received 200
checkout: request 7 must return 429, received 303
```

Neither response had `Retry-After`. Product clients correctly handle a real
429 and keep the free workflow available, but direct requests to
`api.sociobot.in` never execute this repository's code. The factory operator
must apply the contract at the trusted billing edge and rerun
`npm run test:gateway` after a quiet 60-second window.

## Production deployment evidence

Azure Static Web Apps deployment
`c1ceb0fc-0e55-4e57-b9c9-a9f3e0d5f36c` completed successfully on 2026-08-28
UTC. The custom domain returned HTTPS 200.

```text
npm run test:live                  PASS — all 19 release files byte-match
live extension ZIP                PASS — 37,550 B, application/zip, attachment
live missing document/download    PASS — genuine 404 responses
live checkout identity            PASS — 303 to checkout.dodopayments.com
live npm run test:a11y            PASS — all routes, desktop and 390 px
live verify-url.sh                PASS — no console/page errors
live CSP/Permissions/HSTS         PASS
live hashed-asset cache           PASS — max-age=31536000, immutable
live npm run test:gateway         FAIL — external edge did not return 429
```

Live Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best
Practices, and 100 SEO; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, and CLS 0.

## Deploy and verify

The complete `dist/site` directory is deployed. Re-run production verification
with:

```bash
npm run test:live
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
/opt/fleet/lib/verify-url.sh https://focus-resume-card.sociobot.in .factory/evidence/verify-live
npm run test:gateway
```

The deployment must include `downloads/focus-resume-card.zip`,
`staticwebapp.config.json`, the new social/touch assets, all legal/demo/404
routes, and hashed assets. No infrastructure, DNS, billing configuration, or
secret is committed in this repository.
