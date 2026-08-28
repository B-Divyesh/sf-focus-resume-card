# Independent verification 5 — FAIL

**Candidate tested:** `222786cd35f22548ca7cf4655fc0fc9db556ad11` (`main` at
test start)  
**Production URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-install build, packaged MV3 extension, production landing
site, billing endpoints, accessibility, privacy, response policy, and
deployment identity. No product code was changed.

## Decision

**FAIL — release-blocking production rate limiting is absent.** The work order
requires every server-side endpoint, including product unlock endpoints, to
return `429` plus `Retry-After` during a rapid burst. Neither endpoint did.
This is a deployment/platform defect rather than extension-client code, but it
is within the acceptance contract for this candidate.

## Blockers

### P1 — unlock and checkout endpoints have no observable rate limit

At 07:03 UTC, a concurrent burst of **100** requests to
`GET https://api.sociobot.in/api/v1/products/focus-resume-card/verify?license=rate-limit-probe-invalid-token`
returned **100 × 200**, **0 × 429**, and no `Retry-After`. The baseline invalid
token result is the expected JSON `{ "valid": false, "reason": "invalid" }`;
the issue is that the burst was never throttled.

A separate concurrent burst of **60** requests to
`GET https://api.sociobot.in/api/v1/products/focus-resume-card/checkout`
returned **58 × 303** and **2 × 503**, again **0 × 429** and no observed
`Retry-After`. The successful requests redirect to Dodo as intended. Thus the
threshold observed for both routes is **none through the stated burst**; the
checkout endpoint instead degraded to 503 under load.

Required remediation: enforce a per-client/product rate limit at the API edge
for both routes, return `429`, and include a valid `Retry-After` header. Rerun
the bursts and record the first request/threshold returning 429 before release.

### P1 — fresh `test:live` cannot pass because extension ZIP creation is non-reproducible

After the clean production build, `npm run test:live` failed at its declared
byte-for-byte deployment check:

```
Error: live downloads/focus-resume-card.zip does not exactly match the built release
```

Fresh local ZIP SHA-256 was
`e0c2e6ed137d735f265a99009c7b1d076d12510c9f160b36066365bdb92b3e72`;
production was
`ac55c57f80dac70db3c02737269acfd799eac0ce99b81e43afebafb564b234d2`.
All 13 non-directory archive-member names, lengths, and uncompressed
SHA-256 payloads were identical. `unzip -l` shows the only difference is ZIP
entry timestamps (fresh build 07:00; production build 06:37). The packaging
script leaves JSZip timestamps at build time, so the asserted exact comparison
is inherently unstable even for the same commit. This does not indicate a
different extension payload, but it means the repository's deployment gate
cannot meet its own claim on a clean repeat build.

Required remediation: make archive entry dates deterministic (for example,
pass a fixed `date` when adding each JSZip file/directory), then rebuild,
redeploy, and require `npm run test:live` to pass from a fresh checkout.

## Passing evidence

### Clean local candidate

- `npm ci`: installed 178 packages; audit reported 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm test`: 2 files, 17/17 tests pass.
- Independent available lint check:
  `npm exec --yes oxlint -- src site scripts tests wxt.config.ts vite.site.config.ts`:
  pass with no output/findings.
- Exact `npm run build`: pass. WXT MV3 build is 58,980 B uncompressed;
  packaged ZIP is 37,579 B. `unzip -t dist/site/downloads/focus-resume-card.zip`
  passed all 16 entries.
- `npm run test:artifact`: pass. It verifies MV3 archive structure, real-404
  static policy, CSP, Permissions-Policy, attachment ZIP delivery, and
  immutable hashed-asset routing.
- Site initial JS is 2,940 B and CSS 13,122 B (both below the 200 KB / 50 KB
  budgets); hero WebP is 124,548 B (below the 300 KB mobile budget). No font
  files or third-party runtime scripts are shipped.

### Browser and extension end-to-end smoke

- With the freshly built package, `A11Y_URL=http://127.0.0.1:5173 npm run
  test:a11y` passed home, privacy, and terms at desktop 1440×900/light and
  mobile 390×844/dark/reduced-motion: keyboard skip link, visible focus,
  no horizontal overflow, all measured visible mobile links at least 44 px,
  no console/page errors, and zero axe WCAG A/AA/2.1 AA serious or critical
  findings.
- `npm run test:extension` passed in a clean Chromium extension profile:
  packaged MV3 load, saved-card rendering, exact saved URL resume, persistence
  on reopen, confirmed clear, settings, keyboard bypass, 390 px targets,
  offline saved-card reload, axe, and console errors.
- Boundary model tests cover 4-word rejection, 5- and 12-word acceptance, and
  13-word rejection. The live restore UI additionally showed the short-token
  error locally without a network request, then recovered after an invalid
  complete-shaped token with “License no longer active. You can keep using
  every free recovery feature.”

### Production deployment and privacy

- Production HTML hashes match the fresh candidate build exactly:
  homepage `364628a42e6d…`, privacy `10903036a300…`, and terms
  `d796ceae5136…`. All ZIP member payloads also match as described above.
- Live `npm run test:a11y` passed the same desktop/mobile/keyboard/axe/console
  matrix. Manual screenshots confirmed 1440 px and 390 px layouts have no
  horizontal overflow (1440/1440 and 390/390 scroll/client widths).
- First live landing-page load requested only same-origin HTML, CSS, JS, and
  hero WebP. A malformed token made zero API calls; an explicit complete-shaped
  token made exactly one call to `api.sociobot.in`, with no browser console or
  page error. The extension stores cards/preferences in `chrome.storage.local`;
  the free workflow has no remote runtime call.
- Live response policy is present: HSTS, restrictive self CSP with only the
  intended Sociobot API connect source, Permissions-Policy, `nosniff`,
  strict-origin referrer policy, revalidating HTML/ZIP cache policy, immutable
  hashed assets, ZIP attachment/MIME, and actual 404s for an unknown document
  and download.
- This is an MV3 browser extension, not a PWA or backend and has no sign-in;
  therefore service-worker update, backend persistence/health identity, and
  Entra tenant checks are not applicable. The extension smoke did verify its
  own offline saved-card shell.

## Reproduction

```bash
npm ci
npm run typecheck
npm test
npm exec --yes oxlint -- src site scripts tests wxt.config.ts vite.site.config.ts
npm run build
npm run test:artifact
unzip -t dist/site/downloads/focus-resume-card.zip
npm run dev:site -- --host 127.0.0.1
A11Y_URL=http://127.0.0.1:5173 npm run test:a11y
npm run test:extension
npm run test:live # currently fails at ZIP timestamp bytes
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
```

Do not release until both P1 defects above are fixed and independently
reverified.
