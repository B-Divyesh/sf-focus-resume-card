# Focus Resume Card — repair 12 handoff

## Status: blocked by an external P0

The repository repair is buildable and all repository-owned product checks pass.
The release remains blocked by the shared Sociobot billing gateway, which is not
implemented or deployable from this static-site/MV3 repository.

## Finding reproduced and regression coverage

Independent verification 13 reported that the billing gateway did not enforce
the checked-in per-client-IP/product allowance. A fresh clean-install probe at
2026-08-29T13:30:59Z reproduced the exact failure against
`https://api.sociobot.in/api/v1`:

| Route | Required behaviour | Fresh result |
| --- | --- | --- |
| `GET /products/focus-resume-card/verify` | Requests 1–13: `200`; request 14: `429`, positive `Retry-After`, `Cache-Control: no-store` | Request 14 was `200` |
| `GET /products/focus-resume-card/checkout` | Requests 1–7: `303`; request 8: `429`, positive `Retry-After`, `Cache-Control: no-store`, no `Location` | Request 8 was `303` with a Dodo `Location` |

The probe writes the full ignored request evidence to
`.factory/evidence/gateway-rate-limit.json`. This confirms the root cause is
the external gateway's missing/enforced-at-the-wrong-threshold rate-limit
policy, not a browser client or packaged extension defect.

Added `tests/gateway-rate-limit-policy.test.ts` as exact deterministic
regression coverage for `scripts/gateway-rate-limit-check.mjs`. It proves that
the live probe accepts only the documented 13 verify / 7 checkout allowance
when over-limit responses are `429` with a positive `Retry-After` and
`Cache-Control: no-store`, and rejects the observed unlimited `200`/`303`
behaviour, zero `Retry-After`, a cacheable `429`, and a limited checkout that
still redirects. This preserves every existing product behaviour and keeps the
real `npm run test:gateway` probe as the release gate.

## Verification

Fresh dependencies and local release checks:

```text
npm ci                                      PASS — 178 packages, 0 vulnerabilities
npm test                                    PASS — 32 tests (includes gateway policy regression)
npm run typecheck                           PASS
npm run lint                                PASS
npm run build                               PASS — MV3 plus static site and ZIP
npm run test:artifact                       PASS — 37,549 B ZIP and static response rules
npm run test:package                        PASS — 13 fixed-date ZIP entries
npm run test:demo                           PASS — 4/4 isolated 390 px demo claims
npm run test:claims                         PASS — 12/12 installed-MV3 claims
npm run test:extension                      PASS — capture/resume/clear/undo/focus/offline/keyboard/390 px/axe/console
A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
                                             PASS — desktop + 390 px, light/dark, reduced motion,
                                                    skip-link keyboard flow, focus contrast, axe, no overflow/errors
verify-url.sh http://127.0.0.1:4173/        PASS — title, lang, h1, main, alt text, no console errors
```

All 19 exact command rows in `.factory/claims.json` were also run separately
from this workspace and passed.

Local mobile Lighthouse recorded Performance 100, Accessibility 100, Best
Practices 100, and SEO 100; FCP was 1.0 s, LCP 1.7 s, TBT 0 ms, and CLS 0. The
report completed at `/tmp/focus-resume-lighthouse.json`; Chromium printed its
known post-report tab-crash message while closing, after writing those scores.

Live identity and delivery checks against
`https://focus-resume-card.sociobot.in` also pass for the unchanged production
artifact:

```text
npm run test:live                           PASS — 19 release files byte-match; real 404s;
                                                    MV3 ZIP 37,549 B; ordinary checkout 303
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
                                             PASS — all public routes, desktop + 390 px, axe/keyboard/console
verify-url.sh https://focus-resume-card.sociobot.in/
                                             PASS — title, lang, h1, main, alt text, no console errors
npm run test:gateway                        FAIL — external gateway: verify 14 = 200; checkout 8 = 303
```

## Deployment and next step

No production deployment was made: the only release blocker is still present,
and a static deployment cannot repair it. The `dist/site` artifact is
unchanged from the live 19-file release; the added regression test is
repository verification only.

The Sociobot gateway owner must enforce the checked-in
`.factory/gateway-rate-limit-contract.json` exactly: key by trusted client IP
plus product slug, allow 13 verify and 7 checkout requests per 60 seconds,
then return `429` with a positive `Retry-After` and `Cache-Control: no-store`;
the limited checkout must have no redirect. After that external change, run a
fresh `npm run test:gateway` followed by the verification matrix above before
deploying.
