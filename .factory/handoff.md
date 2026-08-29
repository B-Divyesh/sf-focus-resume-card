# Focus Resume Card — repair 11 handoff

## Status

**Repository repair complete; release remains blocked by the shared Sociobot
billing-gateway P0.** The two repository-owned findings in independent
verification 12 are fixed at repair commit
`db2d3b5cc664af3a78eedf03cc24a838ffc5fd43`.

## Repairs

1. **P1 demo exit state:** **Start for real** now removes only
   `demo:focus-resume-card:sample-card` before its ordinary same-tab navigation
   home. A modifier-click does not destroy an active demo because it does not
   leave the current demo page. Returning to `/demo` therefore shows the
   waiting sample rather than a persisted **RESUMED** state. The demo document
   now describes this behavior truthfully.
2. **P2 desktop target size:** every visible primary-navigation link now has a
   44 by 44 CSS-pixel minimum. The desktop Plus link was previously 33.36 by
   44 px; it is included in the browser accessibility target-size check at
   both desktop and 390 px viewports.
3. **Claim coverage:** added `demo-exit-discard` to `.factory/claims.json`.
   Its exact Playwright assertion resumes the sample, activates **Start for
   real**, checks that the isolated key is gone, revisits `/demo`, and checks
   for the waiting, actionable sample.

No extension storage behavior, card capture/resume behavior, package format,
or visual direction was changed.

## Verification

Clean dependency install:

```text
npm ci                                      PASS — 178 packages, 0 vulnerabilities
npm run check                               PASS — typecheck, oxlint, 27 Vitest tests, production build
npm run test:artifact                       PASS — 37,549 B MV3 ZIP and deployment rules
npm run test:package                        PASS — 13 fixed-date archive files
npm run test:demo                           PASS — 4 demo claims, including demo-exit-discard
npm run test:claims                         PASS — 12 installed-extension claims
npm run test:extension                      PASS — installed MV3 smoke flow, offline, keyboard, 390 px, axe, console
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
                                             PASS — home/demo/privacy/terms/404, desktop + 390 px,
                                                    light/dark, reduced motion, keyboard, axe, no console errors
verify-url.sh http://127.0.0.1:4173/        PASS — title, lang, one h1, main, image alt text, console
```

The browser checks were run against the exact production `dist/site` output
served by Vite preview. Lighthouse 13.4.1 reported local mobile scores of 100
for Performance, Accessibility, Best Practices, and SEO; FCP was 1.0 s, LCP
1.7 s, TBT 0 ms, and CLS 0. The generated JSON is retained in ignored local
evidence at `.factory/evidence/repair-11/lighthouse-local.json`; Lighthouse
printed a post-collection Chromium-tab crash, but the completed report has all
four scores and metrics. The source site remains under the static budgets:
2,920 B initial home JS, 14,779 B CSS, 124,548 B hero image, and 37,549 B
extension ZIP.

## External release blocker

`npm run test:gateway` was rerun after the clean install at
2026-08-29T12:47:44.787Z and still **fails** against
`https://api.sociobot.in/api/v1`:

```text
license verification request 14: 200 (must be 429)
checkout request 8:            303 with Dodo Location (must be 429 with no Location)
```

The checked-in acceptance contract requires 13 verify and 7 checkout requests
per trusted client IP/product in 60 seconds, followed by `429`, a positive
`Retry-After`, and `Cache-Control: no-store`. This is enforced by the shared
Sociobot gateway, not the static site or MV3 package; this repository has no
gateway implementation or deployment authority. The source client still
handles a compliant 429 without blocking free card recovery. Do not relax the
contract or release until the gateway owner enforces the response policy and
`npm run test:gateway` passes.

## Deployment and follow-up

The verified `dist/site` artifact was deployed to the configured production
Azure Static Web App, `sf-focus-resume-card`, using its existing deployment
configuration. This did not change infrastructure, DNS, or billing settings.

```text
npm run test:live                          PASS — 19 files byte-match live; MV3 ZIP 37,549 B;
                                                   headers, 404s, and checkout redirect pass
A11Y_URL=https://focus-resume-card.sociobot.in
  npm run test:a11y                        PASS — desktop + 390 px live routes, axe, keyboard,
                                                   dark/reduced motion, focus, targets, console
verify-url.sh https://focus-resume-card.sociobot.in/
                                           PASS — title, lang, h1, main, alt text, console
live 390 px demo-exit probe                PASS — resumed demo key is cleared by Start for real;
                                                   revisited demo is Waiting/actionable; no foreign requests
```

The gateway check is the only known release blocker; P1 and P2 have exact
regression coverage plus local and production-browser evidence.
