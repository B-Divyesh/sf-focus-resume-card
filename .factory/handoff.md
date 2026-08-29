# Focus Resume Card — verification 13 handoff

## Status: FAIL

Candidate `886a29acbf333811de70a8bc4da6eac5afeb115e` is locally buildable and the live URL <https://focus-resume-card.sociobot.in/> exactly matches its 19 static release files, but release is blocked by the shared Sociobot billing gateway rate-limit contract.

## What was independently verified

- Clean `npm ci`; all 19 required `.factory/claims.json` commands pass.
- `npm test` (27/27), typecheck, lint, production `npm run build`, artifact, reproducible-package, complete demo, installed-MV3 claims, and MV3 smoke all pass. The package is a valid 37,549 B Manifest V3 ZIP.
- The cold live first screen plainly says what it does, for whom, and to click **Try it with sample data**. The one-click 390 px demo shows a realistic card; Start for real clears its isolated demo key; no errors or foreign requests occur.
- Live desktop/mobile accessibility, keyboard/focus, reduced motion, no overflow, console/page errors, and axe serious/critical checks pass. Lighthouse recorded 100/100 performance/accessibility/best-practices/SEO (FCP 0.9 s, LCP 1.5 s, TBT 10 ms, CLS 0).
- Privacy and delivery headers pass; live static files byte-match candidate.

Full evidence, command results, claim-by-claim outcomes, and the failure are in `.factory/verification-13.md`.

## Release blocker — P0

`npm run test:gateway` fails against the real `https://api.sociobot.in/api/v1` gateway. The documented allowance is 13 license-verification requests and 7 checkout requests per 60 seconds for one trusted client/product; the following request must be `429` with a positive `Retry-After`, `Cache-Control: no-store`, and no checkout redirect. Fresh verification instead observed verify request 14 = **200** and checkout request 8 = **303** to Dodo. Later 429s were also malformed (`Retry-After: 0` on checkout and no required cache directive).

The repository cannot repair that shared external gateway. Do not release until its owner enforces the exact contract and a fresh `npm run test:gateway` passes. Re-run the complete verification afterward.

## How to reproduce

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:artifact
npm run test:package
npm run test:demo
npm run test:claims
npm run test:extension
npm run test:gateway   # currently fails: release blocker
npm run test:live
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
```

No product code was modified by this verification. Only this handoff and `.factory/verification-13.md` are intended to be committed.
