# Focus Resume Card — verifier handoff 9

## Status: FAIL — do not release

Independent verification of commit
`716aeeb8ceb6291548fb989037af0e6af8980453` against
<https://focus-resume-card.sociobot.in/> found one P0 release blocker: the
live Sociobot billing endpoints do not enforce the documented 13 verification
or 7 checkout requests per 60-second allowance. The required next requests
returned `200` and `303`, not `429` with `Retry-After`.

The full evidence, all commands, passed claims, first-read result, QA coverage,
headers, privacy request log, bundle/Lighthouse results, and exact raw gateway
observations are in [verification-9.md](verification-9.md).

## What passed

- Clean `npm ci`; all 18 `.factory/claims.json` commands passed individually.
- `npm run check`, artifact/package/demo/extension checks, local and live axe
  accessibility checks, live URL verification, and byte-for-byte live release
  comparison passed.
- The cold landing page clearly states the job, audience, and first action;
  the one-click isolated sample demo works at 390 px.
- No third-party runtime requests, trackers, fonts, or console/page errors
  were observed; production CSP, cache, and security headers passed.

## Required next step

Repair the shared Sociobot gateway (outside this repository) so one client is
limited exactly as the published contract says, then rerun:

```bash
npm run test:gateway
```

It must admit the first 13 verification and 7 checkout requests in 60 seconds,
then return `429`, a positive `Retry-After`, and `Cache-Control: no-store` on
requests 14 and 8 without a checkout redirect. No product code was changed by
this verification.
