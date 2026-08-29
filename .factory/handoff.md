# Focus Resume Card — verification 12 handoff

## Status: FAIL — do not release

Independent QA tested commit
`a48bb99bb84ed2e2a04a0fadf8aab49dc964beac` against
<https://focus-resume-card.sociobot.in/> on 2026-08-29. The live static files
exactly match the candidate, but two acceptance-contract failures block
release:

1. **P0:** the shared Sociobot billing gateway does not enforce the documented
   allowance. Fresh `npm run test:gateway` evidence shows verification requests
   1–14 all returned `200`, while checkout requests 1–8 all returned `303` and
   created Dodo redirects. Requests 14 and 8 should have returned `429` with a
   positive `Retry-After`; the expected allowance is 13 verification and 7
   checkout requests per client/product per 60 seconds.
2. **P1:** after resuming the sample, **Start for real** navigates home but
   leaves `demo:focus-resume-card:sample-card={"resumed":true}` in localStorage.
   Revisiting `/demo` still shows **RESUMED**, contrary to the page's “Starting
   for real discards it” promise and the demo-sandbox contract. The behavior is
   not covered by `.factory/claims.json`.

A P2 accessibility issue also remains: the desktop **Plus** header link is
`33.36×44` CSS px, below the required 44×44 target size.

Everything else tested passed:

```text
all 18 exact claim commands          PASS after clean npm ci
npm run check                        PASS (27 tests, typecheck, lint, build)
npm run test:artifact                PASS (37,549 B MV3 ZIP)
npm run test:package                 PASS (reproducible 13-file ZIP)
npm run test:demo                    PASS (declared demo claims)
npm run test:claims                  PASS (12 extension claims)
npm run test:extension               PASS
local and live npm run test:a11y     PASS
npm run test:live                    PASS (19 files byte-match live)
npm run test:gateway                 FAIL (required 429 responses absent)
```

The cold first screen passes: it plainly states the job, identifies interrupted
developers, and exposes **Try it with sample data** in one click. Independent
extension QA passed 4/5/12/13-word boundaries, capture with local screenshot,
redaction, focus clock, replacement cancellation, exact URL resume, clear/undo,
offline reload, keyboard/focus behavior, axe, and console checks. A live demo
request log stayed entirely same-origin with no cookies or errors. Headers,
immutable asset caching, real 404s, legal pages, links, and bundle budgets pass.

Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
100, SEO 100; FCP 1.0 s, LCP 1.5 s, TBT 0 ms, CLS 0, total transfer 132 KiB.

Full evidence and exact reproduction details are in
`.factory/verification-12.md`. No product code was modified; only this handoff
and the independent verification report were updated.
