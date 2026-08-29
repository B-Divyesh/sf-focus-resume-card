# Focus Resume Card — independent verification 11

## Result: FAIL — do not release

Tested 2026-08-29 from clean commit
`bc0231fb04153b4d6c8da883df1d258660b6db19` against
<https://focus-resume-card.sociobot.in/>.

The deployed static product exactly matches this candidate and the core local
extension workflow passes. Release is blocked by the required live Sociobot
billing-gateway allowance test: the gateway does not return `429` after the
documented number of requests.

## Cold first read and demo: PASS

In a fresh desktop browser context, without scrolling, the landing page said:

- What it does: “Resume interrupted coding with one next action.”
- Who it is for: “For interrupted developers, it saves page context and shows
  one small action when you return.”
- What to do first: **Try it with sample data**.

The action opens `/demo` in one click. At 390 by 844 with dark mode and reduced
motion, it immediately displayed the realistic saved card “Write failing test
for empty response,” plus the persistent “Demo — sample data, nothing is
saved” banner, **Reset demo**, and **Start for real**. Resuming changed Waiting
to Resumed; reset restored Waiting. The demo used only
`demo:focus-resume-card:sample-card`, removed it on reset, made no
cross-origin requests, and had no horizontal overflow.

## Required claim gate: PASS

`.factory/claims.json` is present with 18 unique claims. After `npm ci` (178
packages, 0 vulnerabilities), every declared test command passed from this
checkout, including the installed-MV3 and demo sandbox flows:

```text
demo-sample-card          PASS    demo-isolation              PASS
demo-local-data           PASS    extension-local-data        PASS
card-fields               PASS    offline-card                PASS
redaction                 PASS    screenshot-card             PASS
exact-page-resume         PASS    clear-undo                  PASS
next-action-length        PASS    no-account                  PASS
quiet-reminder            PASS    daily-license-check         PASS
plus-treatments           PASS    license-rate-limit          PASS
plus-price                PASS    download-package            PASS
```

The precise retry of `@claim:exact-page-resume` passed in 3.8 seconds after a
previous overlapping local Playwright invocation had made its service-worker
startup timeout. It is not a reproduced product failure. Landing, demo,
privacy, terms, extension, and README product claims have corresponding
entries; no material unlisted claim was found.

## Local build and product exercise: PASS

```text
npm test                                      PASS — 27/27 Vitest
npm run typecheck                             PASS
npm run lint                                  PASS
npm run build                                 PASS — dist/site and MV3 ZIP
npm run test:artifact                         PASS — 37,549 B MV3 ZIP
npm run test:package                          PASS — 13 fixed-date entries
npm run test:extension                        PASS — installed extension flow
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
                                              PASS — built site, served locally
```

`npm run test:a11y` alone initially returned `ERR_CONNECTION_REFUSED` because
the documented script intentionally expects the preview server at port 4173;
with the README's documented Vite preview command running, it passed. This is
test setup, not a product failure.

The installed extension smoke test exercised the real built popup and options
pages at 390 px: saved-card rendering, exact resume URL, reopen, clear,
focus-clock feedback, settings, keyboard bypass, touch targets, offline reload,
axe, and console errors. It confirmed the repaired focus clock changes to
“Reset focus clock,” announces success, and stores `focusStartedAt`. Claim
coverage separately verifies 4/5/12/13-word boundaries, optional local
screenshot, redaction, local storage, quiet reminder opt-in, clear/undo, and
offline stored-card rendering.

## Accessibility, privacy, deployment, and performance: PASS except warning

- `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` passed on
  home, demo, privacy, terms, and 404 at desktop and 390 px, in light/dark and
  reduced-motion modes. It found zero serious or critical axe findings, no
  keyboard bypass or focus-contrast issue, no undersized mobile link, no
  overflow, and no error-level browser/page error.
- A fresh full demo request log contained only its HTML and same-origin JS/CSS.
  The cold home request log additionally contained only the self-hosted hero
  image and same-origin JS/CSS. No cookies, analytics, third-party scripts,
  fonts, or runtime CDN were observed. The extension claims record zero HTTP
  requests while writing and rendering its free local card.
- `npm run test:live` passed: all 19 deployable files byte-for-byte matched
  this candidate; normal and missing document/download routes behaved correctly;
  the live download is a 37,549 B MV3 ZIP; normal checkout returned 303.
- Response headers include a self-only CSP (with only `api.sociobot.in` in
  `connect-src`), HSTS, `nosniff`, and `strict-origin-when-cross-origin`. HTML
  and ZIP revalidate; hashed assets are `max-age=31536000, immutable`.
- All crawled HTTP(S) links returned 200 or the expected checkout 303. The
  `mailto:` footer link is intentionally non-HTTP.
- Fresh mobile Lighthouse reported Performance 100, Accessibility 100, Best
  Practices 100, and SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 0 ms, CLS 0. The
  underlying Chrome exited after collection while attempting its final
  screenshot, but the completed JSON report contains those scores and metrics.
  Independently, initial home JS is 2,920 B plus a 670 B preload helper, CSS is
  14,741 B, and the 124,548 B hero is within the stated budgets.

This is a static browser-extension product, not a PWA, backend, CLI, or
library. Service-worker update, backend concurrency/persistence, consumer-pack,
and Entra sign-in checks do not apply. Extension offline reload was tested.

## Release-blocking defect

### P0 — live Sociobot billing gateway ignores the documented allowance

At 2026-08-29T11:43:21Z, `npm run test:gateway` probed
`https://api.sociobot.in/api/v1` from one client IP. The checked-in contract
requires 13 license verification requests and 7 checkout requests per product
per 60 seconds. The next request must return `429`, a positive `Retry-After`,
and `Cache-Control: no-store`; a blocked checkout must not create a Dodo
redirect.

Observed instead:

```text
verify requests 1–14: 200; request 14 had no Retry-After
checkout requests 1–8: 303; request 8 created a Dodo Location and had no Retry-After
```

The observed allowance is therefore at least 14 verification and at least 8
checkout requests in 60 seconds, not the documented 13/7. This repeated the
prior deployment-only failure. Raw results are in the ignored local evidence
file `.factory/evidence/gateway-rate-limit.json`. The static product repository
cannot correct the shared gateway; its owner must enforce the contract and the
probe must pass before release.

## Non-blocking defect

### P2 — unsupported Permissions-Policy directive logs a Chrome warning

On cold home and demo loads Chrome logged:

```text
Error with Permissions-Policy header: Unrecognized feature: 'web-share'.
```

This is a browser warning, not a page error, and it did not affect the tested
flows or axe result. Remove the unsupported `web-share=()` directive from the
deployment header to leave the console clean and ensure the policy is not
silently ignored.

## Reproduce

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:artifact
npm run test:package
npm run test:extension
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
# in another shell
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
npm run test:live
npm run test:gateway  # currently fails: release blocker
```
