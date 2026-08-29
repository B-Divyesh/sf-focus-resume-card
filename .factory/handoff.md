# Focus Resume Card — repair 13 handoff

## Status: static/MV3 repair complete; release remains blocked by the shared billing gateway

This repair starts from verifier report commit
`2b42545d6fb981c0d0398bd9e86f517bae5be375` for candidate
`9856ff209cf7576323c8e26ee5794644ae730b07`.

## Reproduced first

At the start of the repair, `npm run test:gateway` reproduced the exact P0
boundary failure against `https://api.sociobot.in/api/v1`:

```text
license-verify: request 14 must return 429, received 200
checkout: request 8 must return 429, received 303
```

The checked-in contract remains authoritative: one trusted IP/product may
receive 13 verification responses and 7 checkout redirects in 60 seconds;
request 14/8 must return `429`, a positive integer `Retry-After`, and
`Cache-Control: no-store`; a limited checkout must not have `Location`.

Read-only Azure identity inspection establishes that `api.sociobot.in` is
bound to the separately deployed `sociobot-v2` Linux container App Service,
whose source and deployment configuration are not present in this static/MV3
repository. The repair intentionally does not weaken or rewrite the policy to
match the broken live behavior. The API owner must deploy the per-IP/product
13/7/60s rule before release. A local response-policy fixture continues to
prove that the exact boundary accepts compliant responses and rejects unlimited,
zero-`Retry-After`, cacheable, and redirecting-limit gateways.

## Fixed repository findings

- Screenshot capture failures now say: “Could not capture the screenshot.
  Clear ‘Visible screenshot’ and save again.” Save is re-enabled; clearing the
  checkbox and saving works. The built-MV3 smoke suite injects a capture error,
  asserts that exact recovery copy and enabled button, then saves successfully
  without the screenshot.
- The claims inventory now has 23 entries. Added observable installed-MV3
  claims and exact tagged tests for:
  - no notifications, sounds, or schedules;
  - revoked-license handling that disables Plus settings but leaves the free
    card available;
  - clearing the card, preferences, license, and cached verdict from local
    storage;
  - local JPEG screenshot compression during capture.
- The clear-data action now removes the stored preference record rather than
  writing a replacement default record. Reads still safely fall back to the
  default preferences.
- Terms/settings copy now describes the observable boundary: a license check
  that reports revocation disables Plus settings on the device. It no longer
  makes an untestable assertion about an upstream refund/dispute event.
- `tests/contract.test.ts` locks the four repaired public promises to their
  claim records and installed-extension regression runner.

## Verification evidence

Clean install:

```text
npm ci                                      PASS — 178 packages, 0 vulnerabilities
npm run check                               PASS — typecheck, oxlint, 33 Vitest tests, production build
npm run test:artifact                       PASS — MV3 ZIP and static deployment policy
npm run test:package                        PASS — reproducible 37,561-byte ZIP, 13 fixed-date files
npm run test:demo                           PASS — 4/4 isolated demo claims
npm run test:claims                         PASS — 16/16 installed-MV3 claims
npm run test:extension                      PASS — desktop/390 px, keyboard, offline, axe, console, screenshot recovery
npm run test:a11y                           PASS — home/demo/privacy/terms/404, desktop + 390 px, light/dark/reduced motion
verify-url.sh local home/demo/privacy/terms PASS — title/lang/h1/main/alts/console; screenshots and JSON under ignored .factory/evidence/
```

Every one of the 23 commands listed in `.factory/claims.json` was also run
independently from the clean install. The new screenshot claim used a 1920 by
1080 capture fixture and observed the stored `data:image/jpeg` at exactly 960
by 540 pixels. The revoked-license claim used a recorded `valid:false,
reason:"revoked"` response and asserted disabled Plus controls, Field/no-dot
preferences, and the still-rendered free card. The no-alerts claim inspected
the installed manifest (no `notifications` or `alarms`) and settings UI.

Local mobile Lighthouse on the built production site: Performance 100,
Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.8 s,
TBT 0 ms, CLS 0, and 133 KiB transfer. The report is ignored local evidence
at `.factory/evidence/lighthouse-mobile.json`.

The extension has no service worker/PWA update path, backend persistence,
sign-in, or consumer library package. Relevant offline/update coverage is the
installed MV3 offline-card check and package reproducibility/archive check.

## Deploy and final live checks

The deployment command is `/opt/fleet/lib/deploy-static.sh focus-resume-card
dist/site`. After deploy, run:

```bash
npm run test:live
npm run test:gateway
```

`test:live` must byte-match the exact built `dist/site` artifact, including
the MV3 download. `test:gateway` remains the release blocker until the shared
API returns the contractual 429 response at the exact 14th verification and
8th checkout requests.

## Known gap / next step

There is no repository-owned source path to change the `api.sociobot.in`
gateway. Do not release this product until the gateway owner deploys its
13-verify/7-checkout, 60-second per-IP/product limiter and a fresh
`npm run test:gateway` prints the enforced-policy success line. No product
scope, researched brief, artifact class, or existing passing behavior was
changed by this repair.
