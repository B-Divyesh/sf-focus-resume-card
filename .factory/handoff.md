# Focus Resume Card — repair handoff 10

## Status: blocked by shared gateway P0 — do not release

Repair work started from verifier report commit `e90ed7b1f5956d68e9f3c59cb628abfca30ed798` for candidate `716aeeb8ceb6291548fb989037af0e6af8980453`.

The independent finding was reproduced first on 2026-08-29 with the exact
checked-in probe:

```text
npm run test:gateway
license-verify: request 14 must return 429, received 200
checkout: request 8 must return 429, received 303
```

The checkout probe used `redirect: 'manual'`, so the `303` proves that the
blocked request still created a Dodo redirect. It is not a client-side
redirect artifact. Raw probe observations are written locally to the ignored
`.factory/evidence/gateway-rate-limit.json` file.

## Product repair and regression coverage

- Preserved the documented allowance contract: trusted client IP plus product
  slug, 60-second window, 13 verification requests, and 7 checkout requests.
- Strengthened `tests/contract.test.ts` so the product regression suite pins
  the exact public GET paths, scope, allowance boundaries (requests 14 and
  8), manual redirect handling, `429`, `Retry-After`, `Cache-Control:
  no-store`, and the no-redirect checkout assertion in the live probe.
- Kept both website and extension `429 Retry-After` free-workflow fallbacks.
  No claim was weakened, removed, or changed.

The live service is `sociobot-v2.azurewebsites.net`, a shared Sociobot gateway.
The static site and MV3 extension have no authority to make that gateway
return a response before it issues a Dodo redirect. The source available to
this product repair did not contain the deployed public factory-product routes;
replacing the shared production service from this repository would risk
regressing unrelated APIs. The required owner-side remediation is to apply the
same per-client-plus-product sliding-window policy at the deployed gateway,
then rerun the probe below.

```bash
npm run test:gateway
```

Release only when it admits the first 13 verification and 7 checkout requests,
then returns `429`, a positive `Retry-After`, and `Cache-Control: no-store` on
requests 14 and 8, without a `Location` header on the limited checkout.

## Verification evidence

Fresh clean install:

```text
npm ci                                      PASS — 178 packages, 0 vulnerabilities
npm test                                    PASS — 27 tests
npm run typecheck                           PASS
npm run lint                                PASS
npm run check                               PASS
npm run test:artifact                       PASS — MV3 ZIP 37,550 B
npm run test:package                        PASS — 13 fixed-date archive entries
npm run test:demo                           PASS — all 3 demo claims
npm run test:claims                         PASS — all 12 installed-extension claims
npm run test:extension                      PASS — desktop, 390 px, keyboard, offline, axe
npm run test:a11y                           PASS — local home/demo/privacy/terms/404
verify-url.sh local                         PASS — title/lang/h1/main/alts, no browser errors
npm run test:live                           PASS — 19 live files byte-match; MV3 download and headers
A11Y_URL=... npm run test:a11y              PASS — live desktop + 390 px keyboard/axe checks
verify-url.sh live                          PASS — title/lang/h1/main/alts, no browser errors
npm run test:gateway                        FAIL — shared gateway P0, reproduced as above
```

Build output remains within the static-product budgets: home JavaScript is
2.92 kB raw / 1.43 kB gzip, shared CSS is 14.74 kB raw / 4.24 kB gzip, hero
image is 124,548 B, and the MV3 extension is 59.65 kB unpacked.

## Deployment

The configured artifact remains a static landing site plus packaged MV3
extension. `npm run build` writes the deployable root to `dist/site`; deploy
that directory with `/opt/fleet/lib/deploy-static.sh focus-resume-card dist/site`.
The static deployment completed successfully on 2026-08-29 as Azure Static Web
Apps deployment `bc9476d1-c268-4419-8037-9072d06d72ab`; its post-deploy live
delivery check passed. The post-deploy gateway probe still failed with 200/303
at the two documented boundaries, so the static deployment is not a release.
Do not release the candidate until the shared gateway probe passes.
