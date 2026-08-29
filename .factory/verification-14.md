# Focus Resume Card — independent verification 14

**Candidate:** `9856ff209cf7576323c8e26ee5794644ae730b07`  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-29 UTC  
**Verdict: FAIL — do not release.**

The candidate and deployed static artifact match, and the core extension works.
Release remains blocked because the live Sociobot billing endpoints do not
enforce the documented request allowance. The required claims inventory is
also incomplete, and one screenshot-failure message omits the recovery step.
No product code was modified during this verification.

## Mandatory first gates

### Cold first read — PASS

Fresh desktop (1440×900) and mobile (390×844) contexts showed, without
scrolling:

- **What it does:** “Resume interrupted coding with one next action.”
- **For whom:** “For interrupted developers.”
- **What to click first:** **Try it with sample data**.

The action opens `/demo` in one click. The destination immediately shows the
realistic “Write failing test for empty response” sample, page context,
selected note, 34-minute focus block, and **Resume this page**. Its persistent
banner says “Demo — sample data, nothing is saved” and provides **Reset demo**
and **Start for real**.

The cold page requested only the same-origin document, hero, CSS, and two
scripts. There were no console or page errors.

### Declared claims — all 19 commands PASS

`.factory/claims.json` exists. After `npm ci` (178 packages, zero
vulnerabilities), every listed `test` command was run independently before the
rest of QA.

| Claim | Result |
| --- | --- |
| `demo-sample-card` | PASS |
| `demo-isolation` | PASS |
| `demo-exit-discard` | PASS |
| `demo-local-data` | PASS |
| `extension-local-data` | PASS |
| `card-fields` | PASS |
| `offline-card` | PASS |
| `redaction` | PASS |
| `screenshot-card` | PASS |
| `exact-page-resume` | PASS |
| `clear-undo` | PASS |
| `next-action-length` | PASS |
| `no-account` | PASS |
| `quiet-reminder` | PASS |
| `daily-license-check` | PASS |
| `plus-treatments` | PASS |
| `license-rate-limit` | PASS |
| `plus-price` | PASS |
| `download-package` | PASS |

The claim-level `license-rate-limit` test covers client parsing and fallback;
it does not supersede the separate live server-policy failure below.

## Clean checkout, build, and artifact results

| Check | Result |
| --- | --- |
| Initial identity | PASS — clean `main` at the exact candidate hash |
| `npm run check` | PASS — typecheck, oxlint, 32/32 Vitest tests, exact production build |
| `npm run test:artifact` | PASS — MV3 ZIP and deployment rules |
| `npm run test:package` | PASS — reproducible 37,549-byte ZIP, 13 fixed-date files |
| `npm run test:demo` | PASS — 4/4 isolated demo claims |
| `npm run test:claims` | PASS — 12/12 installed-MV3 claims |
| `npm run test:extension` | PASS — installed extension smoke flow |
| Local `npm run test:a11y` | PASS — all public routes and required modes |
| Local `verify-url.sh` | PASS — title/lang/h1/main/alt/console baseline |
| `unzip -t` | PASS — all 13 archive entries valid |

`npm run build` produced `.output/chrome-mv3`, `dist/site`, and
`dist/site/downloads/focus-resume-card.zip`. The manifest is MV3 and requests
only `storage`, `activeTab`, and `scripting`.

## End-to-end product exercise

Independent installed-extension checks used the production build at 390 px:

- Blank and four-word actions were rejected with “Add 5 more words.” and “Add
  1 more word.”; focus returned to the field.
- Exactly 5 and 12 words saved. Thirteen words were rejected with “Remove 1
  word.”
- A saved URL retained its query and fragment. Title and selection redaction
  stored `null`, not the hidden values.
- Optional screenshot capture converted a fixture image to a local JPEG data
  URL, stored it in `chrome.storage.local`, and rendered the exact stored data.
- Cancelling replacement preserved the existing card. Confirmed clear plus
  Undo, exact-page resume, focus clock, settings, and offline reopen passed in
  the repository smoke and claim suites.
- A missing active tab showed a specific error and **Try again**. A simulated
  screenshot failure left Save enabled; deselecting the screenshot and saving
  again succeeded.
- The popup had no horizontal overflow. Settled Field, Lichen, and Night
  popup/settings scans had zero serious/critical axe findings.

The native browser-toolbar click itself cannot be automated in headless
Chromium, so active-tab, selection, and screenshot browser inputs were injected
while the shipped popup UI, model, storage, canvas compression, and recovery
paths ran unchanged.

The live demo was also exercised at both viewport sizes. Resume wrote only
`demo:focus-resume-card:sample-card`; Reset removed it; Start for real removed
it and returned home. All 14 requests in each complete flow were same-origin,
with no console or page errors.

## Live identity, privacy, accessibility, and delivery

`npm run test:live` passed: all 19 release files byte-match this build, real
document/download 404s work, and the normal checkout redirects to Dodo. Direct
hash evidence:

```text
homepage local/live  4ec38c1373bc36eb771cc2d7f148ff70e17f2aaef16c3490eb8c36a4fea0190f
ZIP local/live       e70a3b52f74fa60bff56971280c7b3f4d7a828da89f9beb811551eaba9b2f523
```

The live ZIP is 37,549 bytes, `application/zip`, attachment-dispositioned, and
contains the required popup, settings, background, manifest, and assets. Every
authored home/demo/privacy/terms/404 link returned 200, except the intentional
Sociobot checkout 303 and `mailto:` links.

Fresh Playwright logs show no analytics, trackers, third-party scripts, fonts,
or runtime CDN calls. The free installed-card flow made zero HTTP requests. An
explicit invalid license caused the sole expected cross-origin request to
`api.sociobot.in`, returned `200` with `Cache-Control: no-store`, and left all
free recovery features available. Short license input made no request and
returned focus with a correction message.

Live headers include HSTS, `nosniff`, strict-origin referrer policy,
Permissions-Policy, and a response CSP with `frame-ancestors 'none'`.
`connect-src` allows only self and `api.sociobot.in`. HTML and the ZIP
revalidate; fingerprinted assets use one-year immutable caching. A real 404
returns the designed 404 body with status 404.

Live `npm run test:a11y` passed home, demo, privacy, terms, and 404 on desktop
and 390 px mobile, in light/dark and reduced-motion modes. It found zero
serious/critical axe issues, no overflow, no undersized mobile links, no
console/page errors, and passed skip-link focus and visible-focus contrast.
All public routes also reflowed without horizontal overflow at a 640 CSS-pixel
viewport, the 200% zoom equivalent of a 1280-pixel desktop. `verify-url.sh`
independently passed. There is no sign-in, backend, library, CLI, or site PWA,
so Entra, backend persistence/concurrency, consumer-package, and service-worker
update checks are not applicable.

## Performance

Fresh live mobile Lighthouse scored Performance 100, Accessibility 100, Best
Practices 100, and SEO 100. FCP was 1.0 s, LCP 1.5 s, TBT 80 ms, CLS 0, and
total transfer 133 KiB.

Static budgets pass: initial home JavaScript is 2,920 bytes raw / 1,441 bytes
gzip plus a 670-byte raw preload helper; shared CSS is 14,779 bytes raw / 4,241
bytes gzip; no font files ship; the hero is 124,548 bytes; the unpacked
extension is 59.64 kB.

## Findings

### P0 — live product endpoints do not enforce the documented allowance

The checked-in contract requires one trusted client/product to receive 13
successful verification requests and 7 checkout redirects in 60 seconds, then
receive `429` with a positive `Retry-After`, `Cache-Control: no-store`, and no
checkout redirect.

Fresh `npm run test:gateway` evidence at `2026-08-29T14:07:01.546Z` instead
showed:

```text
GET /products/focus-resume-card/verify    requests 1–14: 200
GET /products/focus-resume-card/checkout requests 1–8: 303 with Dodo Location
```

Request 14 and request 8 had no `Retry-After`; checkout request 8 created a new
Dodo session. The observed allowance is therefore **at least 14 verify and at
least 8 checkout requests per 60 seconds**, not the documented 13/7. This is a
shared gateway defect outside this static/MV3 repository, but the work order
makes it release-blocking.

### P1 — public claims are absent from the mandatory claims inventory

The claims contract says every visitor-facing promise must appear in
`.factory/claims.json` with one matching observable test. The current manifest
has no claim/test for these public promises:

- settings: “No notifications, sounds, or schedules”;
- settings/terms: “A refunded [or disputed] license is automatically revoked”;
- settings: clearing extension data removes the card, preferences, and license;
- extension/privacy/README: screenshots are compressed during capture.

Some behaviors are visible in source or passed an ad-hoc verification (notably
actual screenshot compression), but that does not satisfy the required
manifest-driven regression contract. Add focused `@claim:` tests or remove the
promises.

### P2 — screenshot failure omits the recovery instruction

When screenshot capture throws an `Error`, the popup displays only that raw
message. The reproduced state said “Screenshot capture failed.” The Save button
was correctly re-enabled and saving without the screenshot worked, but the UI
did not tell the user to deselect the screenshot and retry. This misses the
required error pattern of what happened plus what to do next.

## Required next steps

1. Enforce the checked-in 13/7 per-IP/product, 60-second gateway policy and its
   required 429 headers/no-redirect behavior.
2. Bring every public promise into `.factory/claims.json` with an observable
   tagged test, or remove the promise.
3. Make screenshot-capture errors name the recovery action and add an
   end-to-end regression.
4. Re-run every claim command, the full matrix above, and a fresh live gateway
   probe before release.
