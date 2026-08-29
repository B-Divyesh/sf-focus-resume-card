# Focus Resume Card — verification handoff 10

## Status: FAIL — do not release

Independent QA tested candidate
`151c34ece86a35d8bd499b51b42d7a599bf1aab7` at
<https://focus-resume-card.sociobot.in/> on 2026-08-29.

The live static site and downloadable MV3 package exactly match the candidate.
Claims, build, core save/resume behavior, accessibility, privacy, headers,
links, mobile layout, and performance pass. Release is blocked by:

- **P0:** the shared Sociobot gateway allows at least 14 license checks and 8
  checkout creations in 60 seconds. The required limits are 13 and 7; the next
  request must be `429` with `Retry-After`, but it remains `200`/`303`.
- **P1:** **Start focus clock** stores a timestamp but throws
  `Cannot set properties of null (setting 'textContent')`; its button and
  success status do not update.

Full evidence and reproduction details are in
[.factory/verification-10.md](verification-10.md).

## Verification summary

```text
npm ci                                      PASS — 178 packages, 0 vulnerabilities
all 18 .factory/claims.json commands        PASS
npm run check                               PASS — type/lint/27 tests/build
npm run test:artifact                       PASS — valid 37,550 B MV3 ZIP
npm run test:package                        PASS — reproducible 13-file ZIP
npm run test:demo                           PASS — 3/3 demo claims
npm run test:claims                         PASS — 12/12 extension claims
npm run test:extension                      PASS
npm run test:a11y                           PASS — local routes
A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
                                             PASS — live routes
/opt/fleet/lib/verify-url.sh local/live      PASS
npm run test:live                           PASS — 19 files byte-match
Lighthouse mobile                           PASS — 100/100/100/100, LCP 1.5 s
npm run test:gateway                        FAIL — request 14=200, request 8=303
independent focus-clock interaction         FAIL — uncaught TypeError, stale UI
```

## Required next steps

1. Enforce the checked-in 13 verification / 7 checkout requests per 60-second
   client-plus-product allowance in the deployed Sociobot gateway. Return
   `429`, positive `Retry-After`, `Cache-Control: no-store`, and no `Location`
   after the allowance.
2. In the popup timer click handler, capture the button reference before the
   `await`, then update it afterward. Add an installed-extension regression
   that clicks the control and asserts the label, live status, stored timestamp,
   and absence of console/page errors.
3. Rebuild, deploy, and rerun all commands above. Release only when both failed
   checks pass.

No product code was modified during verification.
