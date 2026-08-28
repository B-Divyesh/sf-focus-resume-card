# Independent product verification 7 — FAIL

**Work order:** `focus-resume-card-verify-7`

**Candidate:** `3d7b1817b6ee8db8c4562f5895ba1168d083305b`

**Live URL:** <https://focus-resume-card.sociobot.in/>

**Verified:** 2026-08-28 UTC from the clean candidate checkout

**Verdict:** **FAIL**

The previous deployment mismatch is fixed. A production build from the candidate
byte-matches all 17 deployed release files, including the installable MV3 ZIP.
The first-read test and prepared-environment claim tests pass. Release is still
blocked by incomplete claims coverage, unenforced billing API request limits,
and a dark-theme focus indicator below the required 3:1 contrast.

## Release-blocking findings

| Severity | Finding | Fresh evidence and impact |
| --- | --- | --- |
| **P1 — release blocker** | Public product claims are not all listed and proven by `.factory/claims.json`. | The manifest lists only the sample card, demo isolation, and “Card data stays in your browser.” Public copy also promises offline operation, title/selection redaction, screenshot capture, exact-page resume, no analytics/tracking or runtime CDNs, no-account use, opt-in reminders, daily-only license verification, and paid theme behavior. These have no `@claim:<id>` entries. More importantly, `demo-local-data` records requests only while using the website demo; it never creates a real extension card and therefore does not prove the extension-wide local-data promise used on the landing page, privacy page, and README. The claims contract says an unlisted claim fails review. |
| **P1 — release blocker** | The product-unlock endpoints do not enforce the request allowances on this release lineage. | At `2026-08-28T23:21:57Z`, one client sent 13 immediate requests to `/verify` and all 13 returned 200 with no `Retry-After`. It then sent 7 immediate requests to `/checkout` and all 7 returned 303, each creating another hosted checkout session, with no `Retry-After`. The prior in-repository contract documented 12 verify and 6 checkout requests per 60 seconds; the candidate removed that contract instead of making the endpoint satisfy it. Observed allowance: **greater than 13 verify and greater than 7 checkout requests per window; no 429 observed**. The acceptance contract explicitly includes factory product-unlock calls. |
| **P1 — release blocker** | The designed focus ring misses the required contrast in the dark treatment. | The actual focused extension button computes to a 3 px `rgb(22,118,163)` outline against the resume-card surface `rgb(32,43,39)`. Their contrast is **2.89:1**, below the attached accessibility baseline of 3:1. The same outline is 3.30:1 against the dark page background and passes there, so the defect is specific to controls on dark surfaces. Axe does not detect focus-indicator contrast. |

## Additional findings

| Severity | Finding | Evidence |
| --- | --- | --- |
| **P2** | Product UI copy still uses inconsistent map metaphors prohibited by the plain-words contract. | The extension calls the same saved unit “card,” “trail marker,” “marker,” and “Waypoint 01”; actions/statuses include “Resume this trail,” “Placing marker…,” “Trail restored,” “Map room,” and “Finding your trail marker…”. `.factory/copy-audit.md` audits only landing-page sentences and does not disclose these inconsistencies. The cold landing screen itself is clear and passes. |
| **P2** | Social metadata is incomplete on secondary/404 routes, and the social image has the wrong aspect. | The shared `og:image` is 1200×800, not the required 1200×630. `404.html` has no canonical, Open Graph, Twitter-card, or apple-touch metadata. Demo/privacy/terms provide `twitter:card` but omit route-specific Twitter title, description, and image fields. |

## Mandatory claims gate and first read

The literal first invocation occurred before dependency installation, as
requested. All three commands exited 1 because `@playwright/test` was not yet
installed. After the required lockfile install (`npm ci`: 178 packages, zero
vulnerabilities), every exact claim command passed from the clean checkout:

| Claim | Exact command | Prepared clean-checkout result |
| --- | --- | --- |
| `demo-sample-card` | `npm run test:demo -- --grep @claim:demo-sample-card` | PASS — complete sample card visible at `/demo` |
| `demo-isolation` | `npm run test:demo -- --grep @claim:demo-isolation` | PASS — only `demo:focus-resume-card:sample-card`; reset clears it |
| `demo-local-data` | `npm run test:demo -- --grep @claim:demo-local-data` | PASS for the website demo flow; insufficient for the broader extension claim as noted above |

Cold first screen, desktop and 390×844:

- **What it does:** saves page context and one small next action, then shows it
  when the developer returns.
- **For whom:** interrupted developers.
- **What to click first:** **Try it with sample data**.
- Result: **PASS**. The action is on the first screen and opens a realistic saved
  coding checkpoint in one click.

## Clean build and automated gates

| Check | Result |
| --- | --- |
| Identity / clean tree | PASS — exact SHA `3d7b1817b6ee8db8c4562f5895ba1168d083305b`; no pre-existing tracked changes |
| Install | PASS — `npm ci`; 178 packages, 0 vulnerabilities |
| Composite quality gate | PASS — `npm run check` |
| TypeScript | PASS — `npm run typecheck` |
| Lint | PASS — `npm run lint`, 0 findings |
| Unit/contract tests | PASS — `npm test`, 3 files / 24 tests |
| Exact production build | PASS — `npm run build`; `dist/site` and packaged extension produced |
| Artifact contract | PASS — `npm run test:artifact`; ZIP 37,582 bytes |
| Reproducible package | PASS — `npm run test:package`; 13 fixed-date files |
| ZIP integrity | PASS — `unzip -t`; all 13 entries valid |
| Local browser accessibility | PASS except independently found focus contrast — `npm run test:a11y` |
| Installed extension smoke | PASS — `npm run test:extension` |
| Live browser accessibility | PASS except independently found focus contrast — `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` |
| Factory URL verifier | PASS local and live — title, `lang`, one `h1`, `main`, alt text, labels, and no console/page errors |
| Live delivery | PASS — `npm run test:live`; 17 files byte-match, real 404s, valid MV3 ZIP, checkout 303 |

The live ZIP and candidate ZIP have the same SHA-256:
`406f554fe90ba8ee128468335206ff69b89346809eac8fe41b216618b739e194`.

## End-to-end and boundary exercises

- Demo: opened cold, resumed the realistic sample, reset it, and confirmed the
  storage namespace was empty afterward. No console or page errors.
- Extension: loaded the built MV3 package into a clean Chromium profile;
  rendered the one waiting card, opened its exact saved URL, persisted across
  reopen, cleared after a named confirmation, cancelled with Escape, and
  restored through Undo.
- Boundaries: unit tests accept exactly 5 and 12 words and report “Add 1 more
  word.” at 4 words and “Remove 1 word.” at 13 words. Source inspection confirms
  the popup announces the error, sets `aria-invalid`, and returns focus.
- Offline: the installed saved-card popup reloaded from local extension storage
  while the browser context was offline.
- License recovery: a real invalid token produced one request only, was removed
  from the address bar, showed a recoverable error, and was not re-requested on
  reload. A mocked valid gateway response enabled Night, persisted it, cached
  the verdict for the daily window, and remained available offline.
- Links: all internal routes, the ZIP, image, icon, and repository link returned
  200; the checkout returned the expected 303 to hosted Dodo checkout; missing
  documents and downloads returned genuine 404 responses.
- No sign-in exists, so the Entra tenant requirement is not applicable. This is
  an extension/static site, not a PWA or product backend.

## Privacy, headers, accessibility, and performance

The complete live landing → demo → resume → reset flow made nine requests, all
to `focus-resume-card.sociobot.in`; there were no cross-origin requests and no
errors. The installed options page contacted only
`api.sociobot.in` after an explicit license token was supplied.

Browser-observed response policy:

- HTML: `public, max-age=0, must-revalidate`.
- Hashed JS/CSS: `public, max-age=31536000, immutable`.
- ZIP: `application/zip`, attachment, revalidated.
- CSP limits scripts/styles/fonts to self and connection to self plus the
  Sociobot billing API; `frame-ancestors 'none'` is a response header.
- HSTS, Permissions-Policy, `nosniff`, and strict-origin referrer policy present.

Accessibility coverage included home, demo, privacy, terms, and 404 at desktop
and 390×844; light/dark, reduced motion, keyboard traversal and activation,
skip links, 44 px targets, overflow, and axe WCAG A/AA/2.1 AA serious/critical.
Axe reported zero serious/critical findings. All demo controls were reachable,
had a visible 3 px focus outline, and worked with Enter/Space. The independent
contrast calculation above remains blocking.

Lighthouse 12.8.2 mobile against live production:

| Category/metric | Result |
| --- | ---: |
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 0.9 s |
| LCP | 1.5 s |
| TBT | 140 ms |
| CLS | 0 |

Lighthouse did not produce a lab INP value. Static budgets pass: home JS is
about 1.8 KB gzip total, CSS 4.22 KB gzip, no downloaded fonts, hero 124,548
bytes, and the extension build is 59.60 KB.

## Required next steps

1. List every public promise in `.factory/claims.json` and add one observable
   `@claim:` test per claim; test real extension storage/network behavior for
   extension privacy claims.
2. Restore a documented request allowance for verify and checkout and enforce
   it at the Sociobot gateway with 429 plus a positive `Retry-After`.
3. Use a focus color that reaches at least 3:1 against every dark surface and
   retain the independent contrast check.
4. Replace map-lore UI copy with the established terms `card`, `next action`,
   and `page context`; complete the copy audit.
5. Supply a true 1200×630 social image and complete metadata on every route.
