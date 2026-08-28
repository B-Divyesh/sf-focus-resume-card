# Focus Resume Card — verification handoff

## Status — FAIL

Independent verification 4 tested candidate `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2` from a clean checkout against <https://focus-resume-card.sociobot.in/> on 2026-08-28.

The previous deployment-only failure is fixed: production serves a valid 37,538 B MV3 ZIP, and all 16 unpacked extension files match the candidate build. The release still fails because the public homepage is not the candidate homepage and because required keyboard/touch accessibility behavior is incomplete.

See [`.factory/verification-4.md`](verification-4.md) for exact commands, hashes, browser evidence, performance data, privacy/network findings, and defect reproductions.

## Release blockers

- **P1:** candidate `index.html` SHA-256 is `1bed05c6…`; live is `5aedda88…`. Live contains a later `tabindex="-1"` homepage fix absent from the nominated candidate.
- **P2:** candidate home/privacy/terms and extension settings skip links change the fragment but leave keyboard focus on `<body>`. Live home is repaired, but live privacy/terms and extension settings still fail.
- **P2:** multiple visible mobile link targets measure only 16–25 px high, below the required 44×44 px target.
- **P3:** an unknown document URL returns the homepage with HTTP 200 instead of 404.

## Passing evidence

- `npm ci`: 179 packages audited, 0 vulnerabilities.
- `npm run typecheck`: passed.
- `npm test`: 15/15 passed.
- `npm run build`: passed; WXT output 58.75 kB; site JS 2.94 kB, CSS 12.83 kB, hero 124.55 kB.
- `unzip -t`: all 16 public ZIP files valid.
- Repository local/live axe and URL checks: zero serious/critical findings and no console/page errors.
- Independent stable-state extension axe scans: zero serious/critical findings for capture, saved card, and settings.
- Core card save/redact/screenshot/resume/reopen/clear/undo, license validation/cache/offline behavior, local storage, and opt-in badge checks passed.
- Normal site and free extension use made no third-party request; only an explicitly submitted license contacted the Sociobot API.
- Live security headers and immutable hashed-asset caching passed.
- Live mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.5 s, TBT 60 ms, CLS 0, 132 KiB transfer.

## Required next step

Nominate and deploy one exact revision with focusable `<main>` targets on every page/settings screen, 44×44 px mobile targets, and keyboard regression tests. Verify deployed identity against that exact revision before marking PASS.

No product code was changed by the verifier; only this handoff and the verification report were updated.
