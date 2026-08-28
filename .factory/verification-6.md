# Independent product verification 6 — FAIL

**Work order:** `focus-resume-card-verify-6`  
**Candidate:** `952f3f8f94767aba7890a775efe18e15a68852a7`  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-28 UTC from a clean candidate checkout  
**Verdict:** **FAIL**

The earlier deployment-only failure is fixed: production now byte-matches this
candidate and serves the installable extension. The candidate still fails the
current acceptance contract because it has no claims manifest, no one-click
sample-data demo, and the documented Sociobot endpoint allowances are not
enforced.

## Release-blocking findings

| Severity | Finding | Fresh evidence and impact |
| --- | --- | --- |
| **P1 — release blocker** | Required `.factory/claims.json` is missing. | The first command in this verification checked for and ran every declared claim test. It exited 42 with `RELEASE_BLOCKER: .factory/claims.json missing`. Therefore no claim has the required `@claim:<id>` demo-sandbox proof. This also makes every claim-like sentence unlisted, including local storage/no analytics/offline behavior and capture, redaction, resume, and screenshot capabilities in the site and README. The claims contract says a missing manifest fails release regardless of later results. |
| **P1 — release blocker** | The first screen does not state who the product is for and has no one-click sample-data demo. | Cold read: **what** — save one action with page context and show it when returning; **for whom** — not stated in plain words (the visible screen never says interrupted developers or developers with ADHD); **click first** — “Download for Chrome.” There is no “Try it with sample data” action. `/demo` returns HTTP 404, `.factory/demo.md` is missing, and the card shown lower on the page is a static illustration rather than a sandbox. The work order explicitly makes either failure dispositive. |
| **P1 — release blocker** | Neither documented server-side request allowance is enforced. | At `2026-08-28T22:25:30Z`, requests 1–13 to license verification all returned 200; request 13 should have returned 429 after the documented 12 requests/60 seconds. Requests 1–7 to checkout all returned 303 and created Dodo redirects; request 7 should have returned 429 after 6 requests/60 seconds. No blocked response or `Retry-After` header was observed. `npm run test:gateway` fails on both routes. |

## Additional acceptance findings

| Severity | Finding | Evidence |
| --- | --- | --- |
| **P2** | Required plain-words audit is absent and visible copy violates the supplied rules. | `.factory/copy-audit.md` is missing. The 10-word headline exceeds the nine-word limit and does not name the audience. The title and interface repeatedly use metaphor/lore such as “trail marker,” “route,” “waypoint,” “map pack,” and “bearing,” despite the explicit no-metaphor rule. The single trust line combines the three required facts instead of presenting three short lines. |
| **P2** | Required site metadata and designed 404 are incomplete. | The landing document has no canonical link, Open Graph fields, Twitter card, or apple-touch icon. There is no product-styled `404.html`; `/demo` and an arbitrary missing page return the generic 2,400-byte platform 404. The footer does not expose a version/build id. |

## Mandatory gates and clean-build evidence

| Check | Result |
| --- | --- |
| Claims first | **Fail:** `.factory/claims.json` absent before dependency installation or other inspection |
| Clean identity | Pass: clean `main` checkout at exact SHA `952f3f8f94767aba7890a775efe18e15a68852a7` |
| Install | Pass: `npm ci`, 178 packages added, 179 audited, 0 vulnerabilities |
| TypeScript | Pass: `npm run typecheck` |
| Unit/contract tests | Pass: `npm test`, 3 files and 21 tests |
| Lint | No lint script/config is declared; independent `npx oxlint` scan passed with 0 warnings/errors |
| Exact production build | Pass: `npm run build`; WXT MV3 59.60 kB; Vite site and `dist/` produced |
| Artifact checks | Pass: `npm run test:artifact`, `npm run test:package`, and `unzip -t`; ZIP 37,582 B, 13 fixed-date files |
| Installed extension smoke | Pass: render, exact resume, reopen persistence, confirmed clear, settings, keyboard bypass, 390 px targets, offline saved-card shell, axe, and console |
| Local/live accessibility | Pass: `npm run test:a11y` on both origins; six route/viewport combinations, no axe violations, no serious/critical findings, no overflow/errors, correct skip focus, dark theme, reduced motion, and 44 px links |
| URL baseline | Pass locally and live: HTTP 200, title, `lang=en`, one `h1`, `main`, image alts, and no console/page errors |
| Live delivery/parity | Pass: `npm run test:live`; all 12 release files match exactly, genuine 404s work, MV3 ZIP is valid, checkout is live |
| Server allowance | **Fail:** `npm run test:gateway`; expected 429 responses never occurred |

There is no PWA web service worker, backend owned by this repository, sign-in,
library, or CLI, so those conditional checks do not apply. The extension's MV3
background worker and offline packaged shell were exercised.

## End-to-end product exercise

The real built extension was loaded into a clean Chromium profile. A stored
card displayed, opened exactly its saved URL, recorded the resume, persisted on
reopen, required specific confirmation before clearing, opened settings, and
rendered its saved-card shell offline.

The compiled production popup was also exercised with a representative Chrome
API boundary (`Retry middleware · api.ts`, selected error-handling note):

- four words produced `Add 1 more word.`, set `aria-invalid=true`, and returned
  focus to the textarea;
- thirteen words produced `Remove 1 word.`;
- a valid six-word action saved title, selection, a compressed screenshot, and
  elapsed context locally;
- clearing required a named confirmation and Undo restored the card;
- a second save with title/selection unchecked stored both values as `null`.

A real toolbar invocation grants Chromium's transient `activeTab` permission;
headless Playwright cannot synthesize that browser-chrome gesture. The installed
package covered storage/resume/offline behavior, while the compiled-popup run
covered capture and boundary UI at the Chrome API boundary.

The live purchase restore path handled invalid input correctly. A short token
made no API request, showed `Paste the complete token from your receipt.`, and
focused the field. A complete fake token made only the documented Sociobot
verification request and recovered with `License no longer active. You can
keep using every free recovery feature.`

## Privacy, accessibility, delivery, and performance

- A cold page load made four requests, all to
  `focus-resume-card.sociobot.in` (document, image, JS, CSS). There were no
  analytics, remote font, CDN, console, or page-error requests. The explicit
  fake-license action added only the documented `api.sociobot.in` request.
- Source and manifest use `chrome.storage.local` and only `storage`, `activeTab`,
  and `scripting` permissions. Free extension use has no product-server call.
- Live HTML has HSTS, CSP (`default-src 'self'`, with only Sociobot API in
  `connect-src`), Permissions-Policy, `nosniff`, strict-origin referrer policy,
  and `max-age=0, must-revalidate`. The hashed JS has one-year immutable
  caching. The ZIP is attachment-served as `application/zip`.
- Candidate and live SHA-256 values match: homepage
  `8d9152cedc068ccd765e5cb29d748f1c7b60029ac0066a67e87d2bfc6346a3b9`;
  extension ZIP
  `406f554fe90ba8ee128468335206ff69b89346809eac8fe41b216618b739e194`.
- Built initial JS is 3,545 B (1,722 B gzip), CSS is 13,122 B (3,861 B gzip),
  and the hero WebP is 124,548 B, all within budget.
- Fresh live mobile Lighthouse: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 30 ms, CLS 0, transfer
  132 KiB. INP is not available from this no-interaction lab run.
- At 390 px, every visible link, button, and expanded restore input measured at
  least 44 px in both dimensions. Reduced-motion transition duration was
  `0.00001s`; there was no horizontal overflow.

## Required remediation

1. Add `.factory/claims.json` and one demo-sandbox test per claim, then run
   every entry from the one-click demo URL.
2. Add a first-screen “Try it with sample data” action, isolated demo storage,
   persistent demo banner/reset/start-real controls, `/demo`, and
   `.factory/demo.md`. Rewrite the first screen to name interrupted developers.
3. Enforce the documented 12/60 verify and 6/60 checkout limits at the
   Sociobot gateway; the next request must return 429 with `Retry-After` and
   `Cache-Control: no-store`.
4. Complete the copy audit/rewriting and required metadata/404 surface.

No product code was modified during this verification.
