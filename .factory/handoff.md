# Focus Resume Card — repair handoff 11

## Status: P1 repaired and deployed; release remains blocked by external P0

This repair started from independent verifier report commit
`9669c66297adc2dd9497dc274922d11528194f97` for candidate
`151c34ece86a35d8bd499b51b42d7a599bf1aab7`.

Repository repair commit: `19a29f9` (`fix: restore focus clock feedback`). It
is pushed to `main` and was deployed as Azure Static Web Apps deployment
`cfe99c29-58a1-455c-a257-cf32ff5a1e5e` from the configured `dist/site` root.

### Repaired: Start focus clock

- Captured the timer button before the asynchronous storage write. The old
  listener read `event.currentTarget` after `await`, when DOM clears that
  property, causing the verifier's uncaught `Cannot set properties of null`
  error.
- The built MV3 installed-extension smoke test now opens the real capture UI
  with only the browser-chrome active-tab inputs injected. It clicks **Start
  focus clock** and asserts all four regression conditions: the label changes
  to **Reset focus clock**, the polite success status is shown, a numeric
  `focusStartedAt` is stored in `chrome.storage.local`, and no page or console
  errors occur. This check runs as part of `npm run test:extension`.

### Still blocked: shared Sociobot billing gateway rate limiting

The product repository contains no server or deployment surface for
`https://api.sociobot.in/api/v1`. Its static deployment cannot make the shared
Sociobot/Dodo gateway reject a request before it creates a hosted checkout.
The verifier's checked-in contract remains intact: 13 verification and 7
checkout requests per client-plus-product in 60 seconds; requests 14 and 8
must return `429`, a positive `Retry-After`, `Cache-Control: no-store`, and no
checkout `Location`.

The final post-deployment probe at `2026-08-29T11:20:58.181Z` still failed:

```text
npm run test:gateway
license-verify: request 14 must return 429, received 200
checkout: request 8 must return 429, received 303
```

The ignored local evidence file `.factory/evidence/gateway-rate-limit.json`
records all observations. The owner of the shared billing edge must enforce
the documented client-plus-product 60-second allowance, then rerun:

```bash
npm run test:gateway
```

Do not mark this release approved until that command passes. No application
claim was weakened or removed to hide the failed external policy.

## Verification evidence

All commands below were run from this repair checkout after `npm ci` (178
packages; 0 vulnerabilities), except the final gateway probe which is expected
to fail for the external blocker above.

```text
npm run check
  PASS — TypeScript, oxlint, 27 Vitest tests, and production build
npm run test:artifact
  PASS — 37,549 B MV3 ZIP; Azure route and security-header rules
npm run test:package
  PASS — reproducible 37,549 B ZIP with 13 fixed-date entries
npm run test:demo
  PASS — all 3 demo claims
npm run test:claims
  PASS — all 12 installed-extension claims
npm run test:extension (run twice after the regression addition)
  PASS — saved card, exact resume, clear/undo, focus-clock feedback,
         settings, keyboard bypass, 390 px targets, offline shell, axe, and console
npm run test:a11y (local preview)
  PASS — home/demo/privacy/terms/404; desktop and 390 px; light/dark,
         reduced motion, keyboard skip links, focus contrast, axe, and console
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 ...
  PASS — title, lang, one h1, main, alt text, labels, no browser errors
npm run test:live
  PASS — all 19 static release files exactly match live; real document and
         download 404s; headers; 37,549 B valid MV3 download; normal checkout 303
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
  PASS — live desktop and 390 px accessibility/keyboard/console suite
/opt/fleet/lib/verify-url.sh https://focus-resume-card.sociobot.in ...
  PASS — title, lang, one h1, main, alt text, labels, no browser errors
Lighthouse mobile, live
  PASS — Performance 100, Accessibility 100, Best Practices 100, SEO 100;
         FCP 0.88 s, LCP 1.52 s, TBT 0 ms, CLS 0
npm run test:gateway
  FAIL — external shared-gateway policy only; request 14 is 200 and request 8 is 303
```

The static product is not a PWA or backend: PWA update-shell, consumer package,
backend persistence/concurrency, and Entra checks do not apply. The installed
extension offline reload is covered by `npm run test:extension`; its free card
storage is local-only. The demo privacy claim separately verifies no
cross-origin request during its full sample-card flow.

## How to reproduce

```bash
npm ci
npm run check
npm run test:artifact
npm run test:package
npm run test:demo
npm run test:claims
npm run test:extension
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
# in another shell: npm run test:a11y
npm run test:live
npm run test:gateway
```

The static deployment command used for this repair was:

```bash
/opt/fleet/lib/deploy-static.sh focus-resume-card dist/site
```
