# Focus Resume Card — independent verification 12

## Result: FAIL — do not release

Tested on 2026-08-29 from clean candidate commit
`a48bb99bb84ed2e2a04a0fadf8aab49dc964beac` against
<https://focus-resume-card.sociobot.in/>.

The deployed static product exactly matches the candidate. The core browser
extension, first-read experience, accessibility suite, privacy checks, build,
and performance budgets pass. Release remains blocked because the live
Sociobot billing gateway does not enforce its documented request allowance.
An independent demo-flow check also found that **Start for real** preserves
demo state despite the page saying it discards that state.

## Defects

| Severity | Finding | Fresh evidence and impact |
| --- | --- | --- |
| **P0 — release blocker** | The live billing gateway does not enforce the documented per-client/product allowance. | At `2026-08-29T12:27:48.948Z`, `npm run test:gateway` sent requests from one client. License verification requests 1–14 all returned `200`; request 14 had no `Retry-After`. Checkout requests 1–8 all returned `303` with Dodo `Location` headers; request 8 had no `Retry-After`. The contract allows 13 verification and 7 checkout requests per 60 seconds, then requires `429`, a positive `Retry-After`, `Cache-Control: no-store`, and no checkout redirect. The observed allowance is therefore at least 14 and at least 8. This repeats the prior deployment-only failure. |
| **P1 — release blocker** | **Start for real** does not discard demo state, contradicting the demo contract and visible copy. | In a fresh mobile browser context, resume the sample, activate **Start for real**, then revisit `/demo`. `localStorage["demo:focus-resume-card:sample-card"]` remains `{"resumed":true}` and the card still says **RESUMED**. The page promises “Starting for real discards it,” and the supplied demo-sandbox contract requires leaving demo mode to discard demo data. `site/demo.ts` only removes the key from the separate **Reset demo** handler; the **Start for real** link has no discard behavior. This claim is also absent from `.factory/claims.json`, so the declared claim suite cannot catch it. |
| **P2** | The desktop **Plus** navigation link misses the 44×44 px target baseline. | At both 720 px and 1440 px viewport widths its measured box is `33.36×44` CSS px. Other tested visible controls met the target size and all controls met it at 390 px. |

## Mandatory first-read and demo gate

**PASS.** A cold 1440×900 page, without scrolling, answered all three required
questions in plain words:

- What: “Resume interrupted coding with one next action.”
- Who: “For interrupted developers, it saves page context and shows one small
  action when you return.”
- First click: **Try it with sample data**.

Keyboard Tab reached that action and Enter opened `/demo` in one click. The
first demo view immediately showed the realistic “Write failing test for empty
response” card and the persistent “Demo — sample data, nothing is saved”
banner with **Reset demo** and **Start for real**. The later demo-exit failure is
reported separately above.

## Required claims

`.factory/claims.json` exists and declares 18 unique claims. The initial
pre-install invocation from the clean clone could not load the repository's
uninstalled Playwright/WXT/Vitest packages. After the required `npm ci` (178
packages, zero vulnerabilities), every exact claim command was rerun
individually and passed:

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

The pre-install result was a missing dependency tree, not an executed product
assertion. The clean-install executions above are the claim results. The
visible “Starting for real discards it” statement is an unlisted, false claim.

## Repository, build, and artifact gates

```text
npm ci                    PASS — 178 packages, 0 vulnerabilities
npm run check             PASS — TypeScript, oxlint, 27/27 Vitest, build
npm run build             PASS — exact production WXT/Vite/package pipeline
npm run test:artifact     PASS — valid 37,549 B Manifest V3 ZIP
npm run test:package      PASS — 13 fixed-date files; reproducible ZIP
npm run test:demo         PASS — all 3 declared demo claims
npm run test:claims       PASS — all 12 installed-extension claims
npm run test:extension    PASS — installed MV3 smoke flow
```

The production build created `.output/chrome-mv3`, `dist/site`, and
`dist/site/downloads/focus-resume-card.zip`. The manifest is MV3 and requests
only `storage`, `activeTab`, and `scripting`.

## Independent product exercise

### Installed extension

A separate fresh extension profile exercised the built package at 390×844
with an exact representative URL including query and fragment, a realistic
title/selection, a screenshot, and focus-clock state:

- Four words were rejected with “Add 1 more word.”, `aria-invalid="true"`,
  and focus returned to the textarea.
- Five words saved successfully. The title and selection were stored, and the
  captured image was converted to a local `data:image/jpeg;base64,...` value.
- **Start focus clock** changed to **Reset focus clock**, announced success,
  and its timestamp reset after saving.
- The saved-card screen had zero axe serious/critical findings.
- Replacement opened a named modal focused on **Keep card**; Escape cancelled
  without changing the stored card.
- Thirteen words were rejected with “Remove 1 word.”; exactly twelve saved.
- Unchecking title and selection stored both as `null` and omitted them.
- Resume opened the exact URL, query, and fragment and stored `resumedAt`.
- Confirmed clear followed by **Undo** restored the card.
- No console or page errors occurred.

The native toolbar itself cannot be clicked by headless Playwright, so the
independent capture run supplied active-tab/selection/screenshot browser API
inputs while exercising the unmodified built popup UI and real extension
storage. The repository smoke and claim suites independently exercised the
installed MV3 package.

### Live demo and recovery paths

At 390×844 in dark mode with reduced motion, the demo resume and reset actions
worked by keyboard. Resume used only
`demo:focus-resume-card:sample-card`; reset removed it and restored Waiting.
Malformed license input (`short`) produced “Paste the complete token from your
receipt,” returned focus to the field, and made no network request. All 14
visible home controls, 10 demo controls, and every visible control on privacy,
terms, and 404 were reachable in the keyboard Tab order without a trap.

The **Start for real** persistence defect is the only failure found in this
flow.

## Accessibility, responsive behavior, and motion

Both local production preview and live deployment passed `npm run test:a11y`
on home, demo, privacy, terms, and 404 at desktop and 390 px, in light/dark and
reduced-motion modes. The suite found zero serious/critical axe violations,
no skip-link/focus-contrast failure, no horizontal overflow, and no console or
page errors. The factory `verify-url.sh` also passed all four public routes:
descriptive title, `lang="en"`, one h1, main landmark, image alt text, labeled
buttons, and desktop/mobile screenshots.

At 390 px every visible link, button, input, and textarea measured at least
44×44 CSS px and all routes fit without horizontal overflow. A 720 px reflow
proxy for desktop 200% zoom also had no horizontal overflow. The only target
size miss was the desktop **Plus** link noted above. Reduced-motion styles
reported `scroll-behavior: auto` and a `0.00001 s` transition.

## Privacy, network, headers, and delivery

A fresh complete landing/demo/recovery flow made 23 requests, all to
`https://focus-resume-card.sociobot.in`; there were no cookies, third-party
scripts, remote fonts, analytics, console warnings, or page errors. The
installed-extension local-data claim separately recorded zero HTTP requests
while storing and rendering the free card. No sign-in is required, so the
Entra tenant requirement does not apply.

The live root response includes:

- CSP with `default-src 'self'`, `frame-ancestors 'none'`, and only
  `https://api.sociobot.in` added to `connect-src`;
- HSTS, `X-Content-Type-Options: nosniff`, and
  `Referrer-Policy: strict-origin-when-cross-origin`;
- a restrictive supported-feature `Permissions-Policy` with no prior
  `web-share` warning;
- `Cache-Control: public, max-age=0, must-revalidate` for HTML and ZIP;
- `Cache-Control: public, max-age=31536000, immutable` for hashed assets.

`npm run test:live` passed: all 19 deployable files byte-for-byte match this
candidate, the downloadable ZIP is the same valid 37,549 B package, missing
document/download routes return real 404s, and an ordinary checkout returns a
Dodo `303`. Every crawled HTTP(S) link returned 200 or the expected checkout
redirect. `robots.txt` and `sitemap.xml` are present.

## Performance

Fresh mobile Lighthouse completed with Performance 100, Accessibility 100,
Best Practices 100, and SEO 100. FCP was 1.0 s, LCP 1.5 s, TBT 0 ms, CLS 0,
Speed Index 1.1 s, and total transfer 132 KiB.

The built budgets are also comfortably within contract:

```text
initial home JS       2,920 B raw / 1,442 B gzip
preload helper          670 B raw /   427 B gzip
shared CSS           14,741 B raw / 4,235 B gzip
hero image          124,548 B
extension package    37,549 B
unpacked extension   59.64 kB
```

This is a static site plus browser extension, not a PWA, backend product, CLI,
or library. PWA update/offline-shell, backend concurrency/persistence, and
consumer-package checks do not apply. The extension's offline stored-card
reload passed.

## Evidence and reproduction

Machine-readable accessibility and gateway observations were written to the
ignored `.factory/evidence/accessibility.json` and
`.factory/evidence/gateway-rate-limit.json`. Cold/live screenshots and command
logs for this disposable run are under `/tmp/tmp.fHQBG1s7HS/`.

```bash
npm ci
npm run check
npm run test:artifact
npm run test:package
npm run test:demo
npm run test:claims
npm run test:extension
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
npm run test:live
npm run test:gateway  # FAILS: required request 14/8 responses are not 429
```

No product source code was modified during verification.
