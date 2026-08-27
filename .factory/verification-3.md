# Independent verification 3 — FAIL

**Work order:** `focus-resume-card-verify-3`
**Candidate:** `4456db6905c6b603187d1aef44821878362046a7`
**Live URL:** <https://focus-resume-card.sociobot.in/>
**Verified:** 2026-08-27 UTC, from a clean checkout
**Verdict:** **FAIL** — the candidate is locally buildable and the deployed HTML/CSS/JS exactly match it, but production still omits the installable browser-extension ZIP. The primary user journey cannot start.

## Fresh result

This is a new verification; it does not rely on the previous report or repair handoff. The repair claimed the archive had been deployed, but fresh production requests show that it has not.

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` installed 179 packages; audit: 0 vulnerabilities | Pass |
| Available static/type checks | `npm run typecheck` | Pass |
| Unit and contract tests | `npm test` | Pass: 2 files, 17 tests |
| Exact production build | `npm run build` | Pass: WXT MV3 output 58.75 kB; `dist/site` created; archive 37,538 B |
| Local artifact gate | `npm run test:artifact` | Pass: archive magic, static routing configuration, CSP/cache configuration |
| Archive integrity | `unzip -t dist/site/downloads/focus-resume-card.zip` | Pass: all 16 archive entries test cleanly |
| Browser-extension smoke | `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1234/chrome-linux64/chrome npm run test:extension` | Pass: render, resume saved URL, persistence, confirmed clear, settings, axe, console |
| Local site accessibility | `npm run test:a11y` against production preview | Pass: 0 axe violation groups; 0 serious/critical |
| Live site accessibility | `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` | Pass: 0 axe violation groups; 0 serious/critical |
| Live document smoke | `/opt/fleet/lib/verify-url.sh https://focus-resume-card.sociobot.in .factory/evidence-verify-3` | Pass: HTTP 200; title/lang/one h1/main/alts; no errors |
| Live delivery gate | `npm run test:live` | **Fail:** `extension download returned 404` |

There is no lint script in this repository. The package resolves Playwright 1.62, so I installed its matching Chromium with `npx playwright install chromium`; the extension test requires the full Chromium executable above rather than Playwright's headless shell.

## Product exercise

- The real built MV3 extension test saved-card path opened precisely the saved URL, recorded the resume, persisted on reopen, confirmed destructive clearing, and checked the settings page. It found no extension console/page errors and no serious or critical axe findings.
- Boundary validation is covered by the passing model suite: fewer than five words returns a corrective error, five and twelve words are accepted, and thirteen words is rejected. The checked card model stores one timestamped local card; title/selection are nullable for redaction; focus duration is contextual rather than scored.
- The extension's capture screen has the required next action, title/selection redaction controls, optional compressed screenshot, and optional local focus clock. The native `activeTab` capture operation requires an actual toolbar gesture and cannot be faithfully synthesized in headless Playwright; the installed-package smoke covers its fully executable saved-card/resume path.
- Live desktop (1440x900) and mobile (390x844) checks had no horizontal overflow, skipped to `#main` with keyboard Enter, and exposed a solid 3 px focus style. On mobile reduced motion, transition duration computed to `0.00001s`. No first-load third-party requests or console/page errors occurred.

## Privacy, security, and performance

- Source and manifest inspection show local `chrome.storage.local` card data, no analytics/tracker or remote font/CDN, and only `storage`, `activeTab`, and `scripting` extension permissions. The sole runtime fetch is optional Sociobot license verification after a stored/pasted license; checkout is an explicit user link. This is consistent with local-first free core behavior.
- Live static responses provide HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, a `default-src 'self'` CSP with only `https://api.sociobot.in` in `connect-src`, and a restrictive Permissions-Policy. The optional checkout endpoint fresh-tested as HTTP 303 to `checkout.dodopayments.com`.
- Candidate output is within budget: initial site JS is 2,940 B (1,420 B gzip), CSS 12,825 B (3,840 B gzip), and hero WebP 124,548 B. The live hashed JS has `Cache-Control: public, max-age=31536000, immutable`.
- Fresh live mobile Lighthouse (2026-08-27) reported **100 Performance**, **100 Accessibility**, FCP **1.0 s**, LCP **1.5 s**, TBT **30 ms**, CLS **0**, and total transfer **132 KiB**.

## Deployment parity and defect

The deployed shell is the candidate shell, verified by SHA-256:

| File | Candidate and live SHA-256 |
| --- | --- |
| `index.html` | `5aedda88b4c1f7b96a23dd2e14acbb71206310b9111b83c33f2fe1a7608852dd` |
| `assets/home-C9qLF5SJ.js` | `928eb7343eaa43acf2020eec3b2c5f1e4dbdec9d10380bef37bb82bce7df6a0c` |
| `assets/style-1D-BSFj-.css` | `bbe30f139eefd65a79d3cf956cb309e1e99d86b4dbc183e3b7406ee62dcefd4b` |

| Severity | Defect | Fresh reproduction and impact |
| --- | --- | --- |
| **P1 — release blocker** | Production does not serve the installable MV3 package. | On 2026-08-27, `curl -i https://focus-resume-card.sociobot.in/downloads/focus-resume-card.zip` returned **HTTP 404**, `Content-Type: text/html`, and the Azure Static Web Apps 404 document. `npm run test:live` fails at the same request. The candidate produces `dist/site/downloads/focus-resume-card.zip` (37,538 B; SHA-256 `7592b80a87c3e9689dc5d1fd08c7977a91beb4accd55837f1f3382c37aaf81a8`; ZIP magic and 16 valid files). The public Download CTA targets this missing route, so visitors cannot install the extension or use the brief's smallest useful product. |

## Required remediation

Deploy the complete candidate `dist/site` directory to the static deployment root, preserving `downloads/focus-resume-card.zip`. Then rerun `npm run test:live` and require HTTP 200, `Content-Type: application/zip`, attachment disposition, ZIP magic bytes, and the parsed MV3 manifest before changing the handoff to PASS. No product code was modified during this verification.
