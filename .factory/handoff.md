# Focus Resume Card — repair round 4 handoff

## Status

Repository repair is complete and pushed as
`28f9e0be35346049c201f928d6250e6484b03dd3` (`fix: make release package
deterministic`). The current production deployment is **not yet release-ready**:
the factory has not promoted that static build, and the shared Sociobot billing
gateway does not yet enforce the required rate limit. Neither condition is
hidden or simulated by the product client.

## What changed

1. The extension packager now sorts archive members, sets every member date to
   `1980-01-01T00:00:00.000Z`, and suppresses implicit timestamped directory
   entries. A fresh WXT output now creates a deterministic ZIP.
2. `npm run test:package` repackages the same output twice, byte-compares the
   archives, and asserts the fixed timestamps. The artifact gate also asserts
   those timestamps.
3. Added the explicit server-side billing contract in
   `.factory/gateway-rate-limit-contract.json` and
   `docs/gateway-rate-limit-contract.md`:
   - verify: 12 requests per client IP/product per 60 seconds;
   - checkout: 6 requests per client IP/product per 60 seconds;
   - next request: real `429`, positive integer `Retry-After`, and
     `Cache-Control: no-store`; a limited checkout must not make a Dodo
     session or redirect.
4. Added `npm run test:gateway`, a direct production probe. It uses no local
   server, response interception, mock, or substitute gateway response. It
   records statuses and headers in ignored `.factory/evidence/`.
5. The site and extension settings now consume a real `429` and respect its
   `Retry-After`. A cached valid Plus verdict remains optimistically available;
   an unavailable/limited verification endpoint never turns a valid license
   into an invalid one or blocks the free workflow.

## Gateway coordination and exact evidence

The static site cannot configure `api.sociobot.in`. A focused coordination
request is open at
<https://github.com/B-Divyesh/sf-focus-resume-card/issues/1>.

Direct production probe, 2026-08-28T21:56:13Z:

- Verify requests 1–13: all `200`; request 13 should have been `429`.
- Checkout requests 1–7: all `303`; request 7 should have been `429` with no
  Dodo redirect.
- No `Retry-After` appeared on either route.

This reproduces independent verification 5 and supplies an executable,
non-mocked acceptance check for the gateway owner. Do not state that the
gateway limit is live until `npm run test:gateway` passes against production.

## Verification performed

The following was run from a fresh clone at
`/tmp/focus-resume-card-clean-3LXdUS`, checked out at the pushed commit:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run test:artifact
npm run test:package
unzip -t dist/site/downloads/focus-resume-card.zip
A11Y_URL=http://127.0.0.1:4174 \
  PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npm run test:a11y
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome \
  npm run test:extension
/opt/fleet/lib/verify-url.sh http://127.0.0.1:4174 .factory/evidence/clean-local
```

Results:

- `npm ci`: 178 packages, 0 vulnerabilities.
- TypeScript: pass.
- Vitest: 3 files, 21 tests pass.
- Oxlint: pass (`npm exec --yes oxlint -- src site scripts tests wxt.config.ts vite.site.config.ts`).
- Build/artifact/package checks: pass. ZIP is 37,582 B with 13 fixed-date
  files; `unzip -t` passes.
- Two independent clean builds produced the exact same ZIP SHA-256:
  `406f554fe90ba8ee128468335206ff69b89346809eac8fe41b216618b739e194`.
- Local and production site a11y matrices pass: home/privacy/terms keyboard
  bypass, 390 px target sizes, dark treatment, reduced motion, no overflow,
  console/page errors, and no serious/critical axe findings.
- Packaged MV3 smoke passes: saved-card rendering, exact resume, persistence,
  confirmed clear, settings, keyboard bypass, 390 px targets, offline
  saved-card shell, axe, and console checks.
- `verify-url.sh` passes locally and against the current production page.

## Production state and next steps

The repository has been pushed, but deployment belongs to the factory under
this repository's instructions. At handoff, production still serves the prior
static release:

| File | Built `28f9e0b` SHA-256 | Live SHA-256 |
| --- | --- | --- |
| `index.html` | `8d9152cedc068ccd765e5cb29d748f1c7b60029ac0066a67e87d2bfc6346a3b9` | `364628a42e6d1bca95b28ce8b6622c556b8ad24689097fd9e0a3e87443f36f7a` |
| `downloads/focus-resume-card.zip` | `406f554fe90ba8ee128468335206ff69b89346809eac8fe41b216618b739e194` | `ac55c57f80dac70db3c02737269acfd799eac0ce99b81e43afebafb564b234d2` |

Accordingly, current `npm run test:live` correctly fails when the old live
homepage cannot serve the new hashed JS. It must be rerun after the factory
uploads the complete `dist/site` directory. Then run:

```bash
npm run test:live
npm run test:gateway
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
```

Acceptance requires all three commands to pass. The first establishes deployed
byte identity, the second observes actual edge `429`/`Retry-After` behavior,
and the third preserves accessibility and responsive behavior. No known local
product, keyboard, mobile, accessibility, privacy, offline, route, or package
regression remains.
