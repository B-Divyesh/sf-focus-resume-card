# Focus Resume Card — independent verification 9

## Result: FAIL — release blocked

Tested at `2026-08-29T01:30Z` from clean commit
`716aeeb8ceb6291548fb989037af0e6af8980453` against
<https://focus-resume-card.sociobot.in/>. The deployed static release exactly
matches the candidate build, but the live Sociobot product endpoints do not
enforce their documented per-client rate limits. The work order explicitly
requires a `429` and `Retry-After` once the allowance is exceeded, so this is
a release-blocking failure even though the browser extension and static site
otherwise pass.

## Cold first read

Fresh desktop load showed the plain headline “Resume interrupted coding with
one next action.” It says this is for interrupted developers and that it saves
page context then shows one small action on return. The first primary action is
**Try it with sample data**; it reaches `/demo` in one click. The demo displays
the realistic “Write failing test for empty response” card before setup,
includes the persistent “Demo — sample data, nothing is saved” banner, and has
working **Resume this page**, **Reset demo**, and **Start for real** actions.

This passes the first-read and one-click-demo acceptance checks.

## Required claim tests — PASS

After `npm ci` (178 packages installed; npm reported 0 vulnerabilities), I
ran every command declared in `.factory/claims.json` individually, from this
clean checkout and through the specified demo/installed-extension entry point.
All passed:

```text
demo-sample-card          PASS   npm run test:demo -- --grep @claim:demo-sample-card
demo-isolation            PASS   npm run test:demo -- --grep @claim:demo-isolation
demo-local-data           PASS   npm run test:demo -- --grep @claim:demo-local-data
extension-local-data      PASS   npm run test:claims -- --grep @claim:extension-local-data
card-fields               PASS   npm run test:claims -- --grep @claim:card-fields
offline-card              PASS   npm run test:claims -- --grep @claim:offline-card
redaction                 PASS   npm run test:claims -- --grep @claim:redaction
screenshot-card           PASS   npm run test:claims -- --grep @claim:screenshot-card
exact-page-resume         PASS   npm run test:claims -- --grep @claim:exact-page-resume
clear-undo                PASS   npm run test:claims -- --grep @claim:clear-undo
next-action-length        PASS   npm test -- --testNamePattern @claim:next-action-length
no-account                PASS   npm run test:claims -- --grep @claim:no-account
quiet-reminder            PASS   npm run test:claims -- --grep @claim:quiet-reminder
daily-license-check       PASS   npm run test:claims -- --grep @claim:daily-license-check
plus-treatments           PASS   npm run test:claims -- --grep @claim:plus-treatments
license-rate-limit        PASS   npm test -- --testNamePattern @claim:license-rate-limit
plus-price                PASS   npm run test:claims -- --grep @claim:plus-price
download-package          PASS   npm run build && npm run test:artifact -- --grep @claim:download-package
```

The demo was also independently exercised at 390 px: resuming wrote only
`demo:focus-resume-card:sample-card` in `localStorage`; reset removed it and
restored the Waiting sample. A clean page/demo flow made only same-origin
requests and logged no console/page errors.

## Local product verification — PASS

```text
npm run check           PASS — typecheck, oxlint, 27 Vitest tests, production build
npm run test:artifact   PASS — 37,550 B MV3 ZIP and deployment rules
npm run test:package    PASS — 13 fixed-date reproducible archive entries
npm run test:demo       PASS — all three demo claims
npm run test:claims     PASS — all 12 installed-extension claims
npm run test:extension  PASS — MV3 render/resume/reopen/clear/settings/offline/390px/axe
npm run test:a11y       PASS — local home, demo, privacy, terms, 404; desktop + 390px
```

The boundary tests accept 5 and 12 next-action words, reject 4 and 13 with
the exact recovery messages, and the installed extension tests cover save
fields, title/selection redaction, local screenshots, exact URL/query/fragment
resume, clear confirmation with Undo, no-account use, offline stored-card use,
and the quiet reminder default/opt-in behavior.

Production build budgets are within the static-product limits: home JS is
2.92 kB raw / 1.43 kB gzip; shared CSS is 14.74 kB raw / 4.24 kB gzip; the
hero is 124,548 B; the MV3 extension totals 59.65 kB unpacked. Fresh mobile
Lighthouse: Performance 98, Accessibility 100, Best Practices 100, SEO 100;
FCP 0.9 s, LCP 1.5 s, TBT 150 ms, CLS 0.

## Live deployment, privacy, and accessibility — PASS

- `npm run test:live` passed: all 19 built deployment files byte-match the
  live release; live download is a valid 37,550 B MV3 ZIP; document/download
  404s are genuine; checkout normally returns the expected Dodo `303`.
- `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` passed:
  no axe serious/critical issues, console/page errors, horizontal overflow,
  keyboard bypass/focus failures, target-size failures, or reduced-motion
  failures on home, demo, privacy, terms, and 404 at desktop and 390 px.
- `/opt/fleet/lib/verify-url.sh` passed live: 200, title, `lang=en`, one h1,
  main landmark, image alt text, and no browser errors.
- A fresh Playwright cold-load request log contained only the product document,
  one self-hosted image, self-hosted CSS, and self-hosted JS. No analytics,
  trackers, third-party scripts, fonts, or runtime CDN calls occurred.
- Production response headers pass: CSP with `default-src 'self'` and only
  `https://api.sociobot.in` in `connect-src`; HSTS; `nosniff`;
  `strict-origin-when-cross-origin`; and restrictive Permissions-Policy.
  HTML and ZIP revalidate (`max-age=0`); hashed assets are
  `max-age=31536000, immutable`.
- Crawled product links returned 200, with explicit exemptions for `mailto:`;
  the intended billing link returned a Dodo `303` and the source link returned
  200.

## Defect

### P0 / release blocker — product gateway does not enforce its documented rate allowance

`npm run test:gateway` failed against the live API. The checked contract
states that one client may make 13 license-verification and 7 checkout
requests in 60 seconds; request 14 and request 8 must be `429`, send a
positive `Retry-After`, include `Cache-Control: no-store`, and a blocked
checkout must not create a redirect.

Fresh evidence from one client at `2026-08-29T01:26:43.691Z`:

```text
GET /api/v1/products/focus-resume-card/verify?...  requests 1–14: 200
GET /api/v1/products/focus-resume-card/checkout    requests 1–8:  303 to Dodo
```

Neither over-limit response was `429`; neither had `Retry-After`; checkout
request 8 created a Dodo redirect. The observable allowance is therefore at
least 14 verification requests and at least 8 checkout requests per 60
seconds, not the documented 13/7 limits. Complete raw observations are in the
ignored local evidence file `.factory/evidence/gateway-rate-limit.json`.

This is an external shared-gateway defect, not a modification that can be
fixed in this static extension repository. Do not release until the Sociobot
gateway enforces the documented boundary and this exact probe returns the
required 429 responses.
