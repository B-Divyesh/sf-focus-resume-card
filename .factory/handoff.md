# Focus Resume Card — repair handoff 12

## Status: deployed repair; release remains blocked by the shared billing gateway

Repair commit `48c334f` is pushed to `main` and its static artifact was deployed
to <https://focus-resume-card.sociobot.in/> on 2026-08-29. Azure deployment
`818c1dfb-9385-402a-af2c-193d6c54a0fb` completed successfully.

The repository-owned P2 finding from verification 11 is repaired. The deployed
`Permissions-Policy` no longer contains Chrome's unsupported `web-share=()`
directive, so cold page loads no longer log that warning. The policy retains
the supported restrictions, including `camera=()`.

Two exact regressions cover this repair:

- `tests/contract.test.ts` rejects `web-share=()` in the authored Azure Static
  Web Apps configuration.
- `scripts/live-delivery-check.mjs` rejects that directive in the actual
  response header, so a source/configuration drift cannot pass post-deploy
  verification.

The release cannot be approved yet because the P0 reported by the independent
verifier is on the separately operated `api.sociobot.in` billing gateway. This
browser-extension/static-site repository has no backend, edge rule, gateway
configuration, or authority to make that service emit a `429` before it creates
a Dodo checkout. The checked-in contract and live test were preserved; no
claim or allowance was weakened to hide the failure.

At `2026-08-29T12:08:47.628Z`, the required live probe still observed:

```text
npm run test:gateway
license-verify: request 14 must return 429, received 200
checkout: request 8 must return 429, received 303
```

The ignored local evidence file `.factory/evidence/gateway-rate-limit.json`
records all requests: verification requests 1–14 were `200`; checkout requests
1–8 were `303` with Dodo Locations. The gateway owner must enforce the
documented trusted-client-IP-plus-product allowance of 13 verification and 7
checkout requests per 60 seconds. The next request must be `429` with a
positive `Retry-After`, `Cache-Control: no-store`, and (for checkout) no
`Location`. Rerun `npm run test:gateway` after that external repair; do not
release until it passes.

## Verification evidence

All commands below were run from this checkout after a clean `npm ci` (178
packages, 0 vulnerabilities), except the live gateway probe above, which is
the unresolved external release gate.

```text
npm run check
  PASS — TypeScript, oxlint, 27 Vitest tests, and production build
npm run test:artifact
  PASS — 37,549 B MV3 ZIP; static routes and security headers
npm run test:package
  PASS — reproducible 37,549 B ZIP with 13 fixed-date files
npm run test:demo
  PASS — demo sample-card, isolated demo storage, and same-origin request claims
npm run test:claims
  PASS — 12 installed-extension claim flows
npm run test:extension
  PASS — installed MV3 capture/resume/clear/focus-clock/settings flow,
         keyboard bypass, 390 px targets, offline stored-card shell, axe, console
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
  PASS — local built home/demo/privacy/terms/404 at desktop and 390 × 844;
         light/dark, reduced motion, keyboard, axe, overflow, focus, console
/opt/fleet/lib/verify-url.sh <live home|demo|privacy|terms URL> <evidence dir>
  PASS — HTTPS, title, language, single h1, main, image alt text, labels,
         desktop/mobile screenshots, and no browser/page errors
npm run test:live
  PASS — all 19 release files byte-match live; real document/download 404s;
         policy is free of web-share; hardened headers; MV3 download; normal
         checkout 303
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
  PASS — deployed home/demo/privacy/terms/404 at desktop and 390 px
```

The final live mobile Lighthouse JSON reported Performance 99, Accessibility
100, Best Practices 100, and SEO 100 (FCP 1.5 s, LCP 2.0 s, TBT 0 ms, CLS 0).
Chrome exited while Lighthouse was collecting its optional final screenshot,
but it wrote the completed report and category results; independent Playwright
browser checks above completed without console or page errors.

Privacy remains local-first: the demo request-log claim permits only same-origin
requests, and the installed-extension claim records zero HTTP requests while
writing and rendering free card data. The free extension's offline reload is
covered by the installed-MV3 smoke test. This product is not a PWA, backend,
CLI, or consumer library; PWA update-shell, backend persistence/concurrency,
and consumer-package checks do not apply. The packaged MV3 archive is built,
validated, and exercised as the applicable consumer artifact.

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
# In another shell:
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
npm run test:live
npm run test:gateway
```

The deployment command used for this repair was:

```bash
/opt/fleet/lib/deploy-static.sh focus-resume-card dist/site
```
