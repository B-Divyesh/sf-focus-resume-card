# Focus Resume Card — verification 14 handoff

## Status: FAIL — do not release

Independent verification was performed on 2026-08-29 against candidate
`9856ff209cf7576323c8e26ee5794644ae730b07` and
<https://focus-resume-card.sociobot.in/>. The live static deployment exactly
matches the candidate, and the core browser-extension workflow passes, but the
release contract is not complete.

## Release blockers

1. **P0 — gateway allowance is not enforced.** The contract permits 13 license
   verification requests and 7 checkout requests per trusted client/product in
   60 seconds. Fresh `npm run test:gateway` received 200 on verify request 14
   and 303 with a Dodo `Location` on checkout request 8. Neither had
   `Retry-After`. The observed allowance is at least 14/8, not 13/7.
2. **P1 — required claims inventory is incomplete.** Public promises about no
   notifications/sounds/schedules, automatic refund revocation, clearing all
   extension data, and screenshot compression have no corresponding entry and
   observable `@claim:` test in `.factory/claims.json`.

One additional **P2** defect: a screenshot-capture exception reports only the
raw error (“Screenshot capture failed.”). Saving without the screenshot works,
but the message does not tell the user to deselect it and retry.

## What passed

```text
npm ci                         PASS — 178 packages, 0 vulnerabilities
all 19 claims.json commands    PASS
npm run check                  PASS — typecheck, lint, 32 tests, build
npm run test:artifact          PASS — valid MV3 package/deployment rules
npm run test:package           PASS — reproducible 37,549-byte ZIP
npm run test:demo              PASS — 4/4
npm run test:claims            PASS — 12/12 installed-extension claims
npm run test:extension         PASS
local and live test:a11y       PASS
local and live verify-url.sh   PASS
npm run test:live              PASS — all 19 files byte-match
npm run test:gateway           FAIL — external allowance breach above
```

Cold first-read passed on desktop and 390 px mobile: the first screen plainly
says what the extension does, who it is for, and presents **Try it with sample
data** in the initial viewport. The one-click demo is realistic and isolated.

Independent UI exercises passed normal capture, exact-URL resume, 5/12-word
boundaries, 0/4/13-word errors, title/selection redaction, real local screenshot
compression/rendering, replace cancellation, clear/undo, offline reopen,
invalid-license recovery, 429 client fallback, 200% desktop reflow, and settled
Field/Lichen/Night axe scans. Live requests stayed same-origin except explicit
license verification. Security headers, real 404s, immutable hashed caching,
and bundle budgets pass.

Fresh live mobile Lighthouse: Performance 100, Accessibility 100, Best
Practices 100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 80 ms, CLS 0, total transfer
133 KiB.

## Handoff

Full evidence and reproduction details are in
`.factory/verification-14.md`. No product code was changed. The Sociobot
gateway owner must first enforce the checked-in 13/7 policy with a positive
`Retry-After`, `Cache-Control: no-store`, and no checkout redirect on the
limited request. Then the product owner must close the claim inventory and
screenshot-error copy findings before a new independent verification.
