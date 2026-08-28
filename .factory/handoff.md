# Focus Resume Card — independent verification 6 handoff

## Status: FAIL

Candidate `952f3f8f94767aba7890a775efe18e15a68852a7` was verified from a clean
checkout against <https://focus-resume-card.sociobot.in/> on 2026-08-28 UTC.
Production now exactly matches the candidate and serves the valid extension
ZIP, so the previously reported deployment-only failure is resolved.

Release is still blocked by three fresh acceptance failures:

1. `.factory/claims.json` is missing. The mandated claims-first command failed
   immediately with exit 42.
2. The cold first screen does not identify the intended interrupted-developer
   audience and has no one-click “Try it with sample data” demo. `/demo` is
   404; `.factory/demo.md` is also missing.
3. The Sociobot gateway does not enforce the repository's documented limits.
   All 13 verification requests returned 200, and all 7 checkout requests
   returned 303. The over-limit requests should have returned 429 with
   `Retry-After` after allowances of 12/60 seconds and 6/60 seconds.

The full evidence, severity list, and conditional-check disposition are in
[`.factory/verification-6.md`](verification-6.md).

## What passed

- `npm ci`: 178 packages added; 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm test`: 3 files, 21 tests pass.
- Independent Oxlint scan: 0 warnings/errors (the repository declares no lint
  script).
- `npm run build`: pass; `dist/` contains the site and MV3 extension archive.
- `npm run test:artifact`, `npm run test:package`, and `unzip -t`: pass;
  deterministic 37,582-byte ZIP with 13 valid files.
- `npm run test:extension`: pass for installed-package render/resume,
  persistence, clear, settings, keyboard, mobile targets, offline shell, axe,
  and console checks.
- Local and live `npm run test:a11y`: pass at desktop and 390 px, light/dark,
  and reduced motion; no axe serious/critical findings or console/page errors.
- `npm run test:live`: pass; 12 files match exactly, ZIP and real 404 behavior
  are valid, and checkout redirects to Dodo.
- Live Lighthouse mobile: 100 Performance, 100 Accessibility, 100 Best
  Practices, 100 SEO; LCP 1.5 s and CLS 0.

## Commands to reproduce

```bash
test -f .factory/claims.json # currently fails
npm ci
npm run typecheck
npm test
npm run build
npm run test:artifact
npm run test:package
unzip -t dist/site/downloads/focus-resume-card.zip
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome npm run test:extension
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome A11Y_URL=http://127.0.0.1:4173 npm run test:a11y
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1208/chrome-linux64/chrome A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y
npm run test:live
npm run test:gateway # currently fails: no 429/Retry-After
```

## Next steps

Add the claims manifest and isolated one-click demo first. Then rewrite the
first screen to name the audience, enforce the gateway limits, and finish the
plain-words/metadata/404 requirements. Re-run every claims entry before all
other checks. Do not mark the release PASS until both over-limit API calls
return 429 with `Retry-After` and every claims test passes through the demo.

No product code was changed during verification.
