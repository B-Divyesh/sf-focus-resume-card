# Independent product verification 8 — FAIL

**Work order:** `focus-resume-card-verify-8`  
**Candidate:** `a10ebe68e385e97edebdf0a60620da69fe9d62da`  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-29 UTC from a clean checkout

## Verdict

**FAIL.** The candidate is a healthy, byte-for-byte deployed browser-extension release, and all repository-owned functional, claims, accessibility, privacy, and artifact checks pass. Release is blocked by the production Sociobot billing edge: it does not enforce the documented request allowance and does not return the required `429` / `Retry-After` response.

## Release-blocking finding

| Severity | Finding | Fresh evidence |
| --- | --- | --- |
| **P1 — release blocker** | Product-unlock endpoints do not enforce the published per-client allowance. | `.factory/gateway-rate-limit-contract.json` requires 12 license-verification requests and 6 checkout requests per 60 seconds, then `429`, a positive `Retry-After`, `Cache-Control: no-store`, and no checkout redirect. At `2026-08-29T00:20:07Z`, `npm run test:gateway` sent 13 verify requests and received **13 × 200**. It then sent 7 checkout requests and received **7 × 303**, each with a Dodo checkout location. No `429` or `Retry-After` was observed. Observed allowance: **greater than 13 verifies and greater than 7 checkouts per 60 seconds**. |

The browser client correctly has a recovery path for a genuine 429, but the production edge never supplies that response. This is an external factory-service configuration issue; it cannot be fixed in this static product repository.

## Required claims gate

`.factory/claims.json` exists and contains 18 public claims. After `npm ci` (178 packages, zero vulnerabilities), every exact command in it passed from the clean candidate checkout:

`demo-sample-card`, `demo-isolation`, `demo-local-data`, `extension-local-data`, `card-fields`, `offline-card`, `redaction`, `screenshot-card`, `exact-page-resume`, `clear-undo`, `next-action-length`, `no-account`, `quiet-reminder`, `daily-license-check`, `plus-treatments`, `license-rate-limit`, `plus-price`, and `download-package`.

The demo claims used `/demo` in a fresh browser context. The installed-MV3 claims used a clean Chromium profile and the production extension build. The full suites also passed: `npm run test:demo` (3 claims) and `npm run test:claims` (12 installed-extension claims). I found no unlisted public promise in the landing page or README that changes the release verdict.

## Cold first-read test

**PASS.** A cold desktop and 390 px browser read the first screen as:

- **What it does:** “Resume interrupted coding with one next action.” It saves page context and shows one small action on return.
- **For whom:** interrupted developers.
- **What to click first:** the visible primary action, **Try it with sample data**.

The action opens `/demo` in one click. Its realistic sample card has the next action “Write failing test for empty response,” a page, selected note, and a 34-minute focus block. It resumes, resets, and uses only `demo:focus-resume-card:sample-card`; reset removes the key. The persistent banner says “Demo — sample data, nothing is saved,” supplies **Reset demo** and **Start for real**, and makes clear that real extension data is untouched.

## Clean build, functional, and artifact verification

| Check | Result |
| --- | --- |
| Candidate identity / pre-existing changes | PASS — clean `a10ebe68e385e97edebdf0a60620da69fe9d62da` |
| `npm ci` | PASS — 178 packages, 0 vulnerabilities |
| `npm run check` | PASS — typecheck, lint, 27 Vitest tests, exact production build |
| `npm run test:artifact` | PASS — valid MV3 ZIP, deployment MIME/security rules |
| `npm run test:package` | PASS — 13 fixed-date, reproducible archive entries |
| `unzip -t dist/site/downloads/focus-resume-card.zip` | PASS — all 13 entries valid |
| `npm run test:extension` | PASS — installed MV3 render/resume/reopen/clear/settings/offline flow |
| `npm run test:a11y` with README-required local preview | PASS |
| `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` | PASS |
| `/opt/fleet/lib/verify-url.sh` against live | PASS — title, `lang`, one h1, main, image alt, labels, no errors |
| `npm run test:live` | PASS — 19 deployed release files byte-match, genuine document/download 404s, valid MV3 ZIP, hosted checkout 303 |
| `npm run test:gateway` | **FAIL** — P1 finding above |

`npm run test:a11y` intentionally expects a preview at port 4173. Its first standalone invocation therefore returned `ERR_CONNECTION_REFUSED`; this is not an undisclosed test failure because README documents the exact preview command. It passed once run in that documented environment.

The end-to-end coverage exercised a stored card, exact URL resume, page-title and selection redaction, locally rendered screenshot, saved-card offline reload, clear confirmation plus Undo, free/no-account use, optional quiet badge, theme unlock persistence, and the settings license recovery path. Unit boundaries accept exactly 5 and 12 next-action words and reject 4 with “Add 1 more word.” and 13 with “Remove 1 word.”

## Deployment, privacy, accessibility, and performance evidence

The live homepage HTML SHA-256 is identical to this build: `1ec59c301589975a5359f33e14722b8149c22a71f0349f294a1cdbe7b0d3c425`. The live download is the candidate ZIP (37,550 bytes), has `Content-Type: application/zip` plus attachment disposition, and is valid.

A fresh Playwright landing-to-demo/resume/reset flow made only same-origin requests for HTML, the local script/CSS, and the product illustration; it had no console or page errors. The installed-extension local-data claim separately records zero HTTP(S) requests while storing and rendering a real card in `chrome.storage.local`. When I explicitly supplied an invalid license token, the only extra request was the documented `https://api.sociobot.in/api/v1/products/focus-resume-card/verify?...`; it returned 200 and the UI said “License no longer active. You can keep using every free recovery feature.” No sign-in exists, so Entra tenant validation is not applicable.

Response headers include HSTS, `nosniff`, strict-origin referrer policy, Permissions-Policy, and a header CSP with `frame-ancestors 'none'`; `connect-src` allows only self and `api.sociobot.in`. HTML and ZIP revalidate; hashed assets use `public, max-age=31536000, immutable`.

Live axe WCAG A/AA/2.1 AA scanning found **zero serious or critical issues** on home, demo, privacy, terms, and 404 at desktop and 390×844. It also passed keyboard skip links, visible focus checks, 44 px mobile links, no horizontal overflow, dark treatment, reduced motion, and console/page-error checks.

Static budgets pass: first-page JS is 2.92 KB raw / 1.43 KB gzip, shared CSS is 14.74 KB raw / 4.24 KB gzip, no web fonts are downloaded, the hero is 124,548 bytes, and the extension build is 59.65 KB unpacked. These are below the applicable 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB hero budgets.

## Handoff / next step

The factory operator must enforce the declared 12/60 s verify and 6/60 s checkout limits at the trusted Sociobot billing edge. The blocked request must respond `429`, `Retry-After: <positive seconds>`, and `Cache-Control: no-store` without creating a checkout redirect. After a quiet 60-second window, rerun `npm run test:gateway`; no repository code change is required for the other verified areas.
