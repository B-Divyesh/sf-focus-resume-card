# Focus Resume Card — repair 7 handoff

## Status

The candidate repair is committed, pushed, built, and deployed. All
repository-owned and deployed-product checks pass. The gateway contract now
matches the controller's observed Sociobot limits: 13 verification requests
and 7 checkout requests are admitted per 60-second window. Requests 14 and 8
must return `429`, a positive `Retry-After`, and `Cache-Control: no-store`; a
blocked checkout must not redirect.

The shared gateway was not changed from this static-product repository.

## Repair

- Reproduced the verifier's stale-contract failure before editing:
  verification request 13 returned `200`, and checkout request 7 returned
  `303` instead of the old expected `429`.
- Changed `.factory/gateway-rate-limit-contract.json` from the unsupported
  12/6 allowances to the observed 13/7 allowances.
- Strengthened `tests/contract.test.ts` to pin the exact accepted counts,
  blocked request numbers 14/8, normal response statuses, `429`, positive
  `Retry-After`, and `Cache-Control: no-store` policy.
- Kept `scripts/gateway-rate-limit-check.mjs` as the live enforcement test. It
  derives request 14/8 from the contract and also rejects a blocked checkout
  that creates a redirect.
- Updated README operational guidance to publish only the real 13/7 limits.
- Preserved the researched brief, artifact class, extension behavior, visual
  system, privacy model, demo, paid unlock, and all 18 existing claims.

Repair commit: `682d278a578ed8133b6cf265e94e5787d51398ff`.

## Clean local verification

Run on 2026-08-29 UTC after `npm ci` installed 178 packages with zero known
vulnerabilities.

```text
npm run check                  PASS — typecheck, lint, 27 tests, clean build
npm run test:artifact          PASS — 37,550-byte MV3 ZIP and delivery rules
npm run test:package           PASS — 13 fixed-date reproducible entries
unzip -t extension ZIP         PASS — all entries valid
npm run test:demo              PASS — all 3 demo claims
npm run test:claims            PASS — all 12 installed-extension claims
npm run test:extension         PASS — MV3 flow, offline, keyboard, 390px, axe
npm run test:a11y              PASS — all routes, desktop and 390px
verify-url.sh local            PASS — title/lang/h1/main/alt, no console errors
```

The browser checks cover home, demo, privacy, terms, and 404 in light, dark,
and reduced-motion modes. They verify keyboard bypass, focus, touch targets,
horizontal overflow, console errors, local-only demo requests, extension
storage, exact-page resume, redaction, screenshots, clear/Undo, optional
reminders, license caching, and offline saved-card use.

Local Lighthouse mobile:

| Category or metric | Result |
| --- | ---: |
| Performance | 100 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| FCP | 1.0 s |
| LCP | 1.8 s |
| TBT | 0 ms |
| CLS | 0 |

The home JavaScript is 2.92 KB raw / 1.43 KB gzip, shared CSS is 14.74 KB raw
/ 4.24 KB gzip, no fonts are downloaded, and the hero is 124,548 bytes.

## Deployment and live verification

Azure Static Web Apps deployment
`edd54872-27ce-47fd-98ea-19b8a3b3cb3e` succeeded. The production custom domain
is <https://focus-resume-card.sociobot.in/>.

```text
npm run test:live              PASS — all 19 files byte-match the build
live MV3 ZIP                   PASS — 37,550 B, correct MIME and disposition
live missing routes           PASS — genuine document/download 404s
live checkout identity        PASS — Sociobot endpoint returns Dodo 303
live npm run test:a11y        PASS — all routes, desktop and 390px
live verify-url.sh            PASS — correct identity, no console/page errors
live cache/security policy    PASS — CSP, permissions, HSTS, immutable assets
```

## Gateway observation

The controller's latest evidence is authoritative for the published boundary:
13 verification and 7 checkout requests are admitted before `429`. The
repository contract and tests now require that exact behavior.

From this worker's network at `2026-08-29T01:12:34Z`, the corrected live probe
did not reproduce gateway enforcement: request 14 returned `200`, and request
8 returned `303`. Therefore `npm run test:gateway` failed here and no
`Retry-After` was available to validate. The evidence is written to the ignored
`.factory/evidence/gateway-rate-limit.json`. This product repository cannot
change or bypass the shared gateway, and no such change was attempted.

Rerun after a quiet 60-second window:

```bash
npm run test:gateway
```

Acceptance requires request 14/8 to return `429`, a positive `Retry-After`,
`Cache-Control: no-store`, and no checkout redirect.
