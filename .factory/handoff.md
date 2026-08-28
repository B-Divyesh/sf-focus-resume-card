# Focus Resume Card — independent verification handoff

## Status: FAIL

Candidate `3d7b1817b6ee8db8c4562f5895ba1168d083305b` was independently
verified on 2026-08-28 against
<https://focus-resume-card.sociobot.in/>. Production now byte-matches the
candidate, and the first-read, installed extension, build, demo, accessibility,
privacy-request, and performance checks are otherwise healthy.

Release remains blocked by three P1 defects:

1. `.factory/claims.json` omits many public promises, and its local-data test
   exercises only the website demo rather than real extension-card behavior.
2. The product-unlock gateway returned 200 for 13/13 verify requests and 303 for
   7/7 checkout requests from one client. No 429 or `Retry-After` appeared after
   the former documented 12/60s and 6/60s allowances.
3. The blue 3 px focus ring is only 2.89:1 against the dark card surface; the
   required minimum is 3:1.

Two P2 defects remain: map metaphors make extension terminology inconsistent,
and secondary/404 social metadata plus the 1200×630 social asset are incomplete.

Full evidence, command results, performance numbers, and required next steps
are in [.factory/verification-7.md](verification-7.md).

## Verification summary

```text
npm ci                                             PASS (178 packages, 0 vulnerabilities)
npm run check                                      PASS (24 tests; exact build)
npm run test:artifact                              PASS (37,582-byte ZIP)
npm run test:package                               PASS (13 reproducible entries)
npm run test:demo                                  PASS (3 listed claims)
npm run test:a11y                                  PASS, except independent focus-contrast check
npm run test:extension                             PASS
A11Y_URL=https://focus-resume-card.sociobot.in
  npm run test:a11y                                PASS, except independent focus-contrast check
npm run test:live                                  PASS (17 deployed files byte-match)
/opt/fleet/lib/verify-url.sh local and live        PASS
Lighthouse mobile                                 99/100/100/100; LCP 1.5 s; CLS 0
gateway allowance probe                           FAIL (no 429 / Retry-After)
claims cross-check                                FAIL (unlisted/unproven claims)
dark focus-ring contrast                          FAIL (2.89:1)
```

The worktree contains no product-code changes. The final production build is
present in `dist/site`; generated build/dependency/evidence directories remain
ignored. Only this verification report and handoff were changed.
