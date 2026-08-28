# Focus Resume Card — verification handoff

## Status — FAIL

Independent QA on 2026-08-28 against candidate
`222786cd35f22548ca7cf4655fc0fc9db556ad11` and
<https://focus-resume-card.sociobot.in/> **failed**. The complete evidence is
in `.factory/verification-5.md`.

Release blockers:

1. A 100-request concurrent burst at the production license verify endpoint
   returned 100 HTTP 200 responses, zero HTTP 429, and no `Retry-After`. A
   60-request checkout burst returned 58 HTTP 303 and 2 HTTP 503, again zero
   HTTP 429/no `Retry-After`. The acceptance contract requires rate limiting
   on both server-side product-unlock routes.
2. `npm run test:live` fails from a fresh production build because the ZIP
   packager includes build-time timestamps. Production and fresh archive
   payloads are identical, but their bytes differ, so the repository's
   asserted byte-for-byte deployment gate is non-reproducible.

The rest of the clean QA pass succeeded: npm install/typecheck/tests/lint/build,
artifact checks, ZIP integrity, local and live axe/keyboard/390px checks,
extension consumer smoke (including offline saved-card load), privacy/network
checks, production headers/caching/404s, and bundle budgets. Do not claim
release readiness until the two blockers are repaired, deployed, and rerun
from a clean checkout.

---

# Prior repair handoff (superseded by verification 5)

## Status — historical PASS before new evidence

All release-blocking findings in independent verifier report
`.factory/verification-4.md` (report commit `27170c06c361df0486cff4008428cd38a2a1b3c3`,
candidate `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2`) are repaired, covered by
regressions, pushed to `main`, and deployed to
<https://focus-resume-card.sociobot.in/>. The product remains a WXT + TypeScript
Manifest V3 browser extension distributed by its static landing site.

Repair commits:

- `7f9b132` — accessibility, target-size, response-policy, identity, and browser regressions
- `2b9f7c9` — remove the sole dead popup state found by the final lint audit

Final Azure Static Web Apps production deployment:
`3aad03c4-9abb-4430-9ab9-1f839fd87a2a` (Standard static configuration,
`dist/site` deployment root).

## Findings reproduced and repaired

1. **Candidate/live identity mismatch.** Before deployment, the repaired local
   homepage SHA-256 was `364628a4…`, while production still served
   `5aedda88…`; legal pages and the extension archive were stale as well.
   `scripts/live-delivery-check.mjs` now compares every deployable file byte for
   byte with production. The final live gate confirms all 12 release files
   exactly match the build.
2. **Broken keyboard bypass on privacy, terms, and extension settings.** The
   skip links changed the fragment but focus remained on `body`. Every skip
   target now has `tabindex="-1"`. Browser regressions use the exact keyboard
   path on home, privacy, terms, popup, and settings: first Tab must visibly
   focus the skip link, then Enter must make `main` the active element.
3. **Sub-44 px mobile targets.** Wordmarks, installation/privacy links, archive
   links, legal/footer links, email links, popup undo, and extension navigation
   now have at least a 44×44 CSS px target without changing the visual thesis.
   Automated 390×844 checks measure every visible site link and every visible
   popup/settings link or button and fail with its rendered dimensions.
4. **Soft document 404.** The SPA navigation fallback was inappropriate for
   this multi-page static site and returned the homepage with HTTP 200 for
   unknown documents. It was removed; production now returns HTTP 404 for both
   unknown document and download routes while `/`, `/privacy/`, and `/terms/`
   remain HTTP 200.

The researched brief, local-first card lifecycle, paid boundary, visual system,
and every workflow that previously passed were preserved.

## Verification evidence

Environment: Node `v22.23.2`, npm `10.9.8`, pinned Playwright `1.58.2` using the
factory-provided Chromium. A clean `npm ci` installed 178 packages, audited 179,
and reported 0 vulnerabilities.

```bash
npm ci
npm exec --yes oxlint -- src site scripts tests wxt.config.ts vite.site.config.ts
npm run check
npm run test:artifact
unzip -t dist/site/downloads/focus-resume-card.zip
npm run test:a11y
npm run test:extension
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173 .factory/evidence/local
```

- Oxlint 1.80.0: clean.
- TypeScript: pass.
- Vitest: 2 files, 17/17 tests pass.
- WXT MV3 production build: 58.98 kB; site JS 2.94 kB, CSS 13.12 kB,
  hero WebP 124.55 kB; packaged ZIP 37,579 B. `unzip -t` passed all 16
  archive entries.
- Artifact gate: ZIP magic/MV3 route, real-404 delivery policy, CSP,
  Permissions-Policy, attachment disposition, and immutable hashed-asset cache
  rules pass.
- Site browser matrix: 1440×900 light and 390×844 dark/reduced-motion across
  home, privacy, and terms. Tab/Enter bypass, all mobile link targets, overflow,
  console/page errors, dark palette, reduced motion, and axe WCAG A/AA/2.1 AA
  pass with 0 serious/critical findings.
- Extension consumer smoke: packaged MV3 loads in a clean Chromium profile;
  saved card render, exact resume URL, reopen persistence, confirmed clear,
  settings, Tab/Enter bypass, 390 px targets, offline saved-card shell, axe, and
  console checks pass.
- Local Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.7 s, TBT 0 ms, CLS 0, 132 KiB transfer.

Post-deployment:

```bash
npm run test:live
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
/opt/fleet/lib/verify-url.sh https://focus-resume-card.sociobot.in .factory/evidence/live
```

- Live delivery: 12/12 files byte-identical; real document/download 404s;
  installable MV3 ZIP 37,579 B; checkout HTTP 303 to
  `checkout.dodopayments.com`.
- Final release hashes: homepage `364628a42e6d…`, privacy `10903036a300…`,
  terms `d796ceae5136…`, ZIP `c78b1f94b823…`.
- Live response policy: HSTS, restrictive CSP, Permissions-Policy,
  `nosniff`, strict-origin referrer policy, HTML revalidation, immutable hashed
  assets, correct ZIP MIME/disposition, and 404 behavior pass.
- Live browser checks: title, `lang`, one `h1`, `main`, image alts, console,
  desktop/mobile layout, exact keyboard bypass, 390 px targets, both themes,
  reduced motion, and axe pass.
- Privacy check: first load is same-origin only; malformed license input stays
  local; explicit license verification contacts only `api.sociobot.in`. The
  free extension has no remote runtime dependency and stores card/preferences
  in `chrome.storage.local`.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 30 ms, CLS 0, 132 KiB transfer.

## Remaining scope

- Native `activeTab` capture still requires a physical toolbar gesture, which
  headless Chromium cannot synthesize. The package consumer test covers the
  persisted card/resume/clear/settings lifecycle; a physical toolbar click is
  the store-publication check.
- The landing site is not a PWA and has no service-worker update channel. The
  installed MV3 shell and saved-card path work offline; extension updates remain
  the browser/package distributor's responsibility.
- A signed Chromium Web Store listing and Firefox/Safari packages remain
  outside the researched v1 scope. No release-blocking gap remains.
