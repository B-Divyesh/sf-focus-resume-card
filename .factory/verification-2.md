# Independent verification 2 — FAIL

**Work order:** `focus-resume-card-verify-2`  
**Candidate:** `8c1cfba214aae73663dbe823f09b1f4181de7efe`  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-27 UTC from a clean checkout  
**Verdict:** **FAIL** — the candidate is locally buildable and the shipped static documents are deployed byte-for-byte, but production returns **404** for the only installable browser-extension artifact. The primary job cannot be completed from the live product.

## Scope and result

This is a fresh verification of the supplied candidate, not a reliance on the prior builder handoff. The earlier deployment failure is still present, although other previously reported deployment problems are repaired: production has CSP/Permissions-Policy, immutable hashed-asset caching, and a working Sociobot/Dodo checkout redirect.

| Check | Evidence | Result |
| --- | --- | --- |
| Clean install | `npm ci` | Pass: 179 packages audited; 0 vulnerabilities |
| Type check | `npm run typecheck` | Pass |
| Unit/contract tests | `npm test` | Pass: 2 files, 17 tests |
| Exact release build | `npm run build` | Pass: WXT MV3 build 58.75 kB; deployable `dist/site`; ZIP 37,538 B |
| Artifact config | `npm run test:artifact` | Pass: ZIP magic/config, CSP, headers and cache configuration |
| Extension browser smoke | `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-1234/chrome-linux64/chrome npm run test:extension` | Pass: render, resume, reopen, confirmed clear, settings, extension axe and no console errors |
| Local site axe/skip link | `npm run test:a11y` against local production preview | Pass: 0 axe violation groups; 0 serious/critical |
| Live site axe/skip link | `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y` | Pass: 0 axe violation groups; 0 serious/critical |
| Production delivery test | `npm run test:live` | **Fail:** live extension download returns 404 |

There is no repository lint command. Browser extension smoke needs the full Playwright Chromium executable above; without it Playwright uses its headless shell, which does not load extensions and correctly times out waiting for a service worker.

## End-to-end and boundary exercise

- The real packaged MV3 smoke flow saved-card presentation, opening exactly the saved URL, persistence across reopening, destructive-clear confirmation, undo-capable recovery, settings, axe, and console checks passed.
- A separate extension UI harness exercised normal card creation and recovery logic with a representative page context: four words produced `Add 1 more word.`, thirteen words produced `Remove 1 word.`, and a valid five-to-twelve-word action saved one card. Unchecking title and selection stored both as `null`; confirmed clear followed by Undo restored the card. No page/console errors occurred. The native toolbar `activeTab` permission itself requires a physical toolbar gesture, which cannot be synthesized by headless Playwright; the actual-extension smoke covers the non-mocked saved-card/resume path.
- On the live 390 x 844 page, keyboard-only interaction exposed the visible 3 px focus style, skip link, restore-purchase disclosure, short-token validation and recovery. A short token returned `Paste the complete token from your receipt.` and focused the field. A fake complete token reached the licensed API and returned the safe invalid state: `License no longer active. You can keep using every free recovery feature.`
- Desktop 1440 x 900 and mobile 390 x 844 had no horizontal overflow, no page errors, no console errors on normal load, and no third-party first-load requests. Reduced-motion CSS removes smooth scrolling and reduces transition/animation durations to `0.01ms`.
- Visual inspection of desktop and 390 px screenshots found the product-specific cartographic presentation intact and the mobile layout deliberately simplified without obscuring the primary action.

## Accessibility, privacy, and performance

- All public pages (`/`, `/privacy/`, `/terms/`) provide `lang=en`, a title, exactly one `h1`, and `main`; first-load resource URLs stay same-origin. The live axe scan reported zero serious or critical findings.
- Source/manifest inspection found local `chrome.storage.local` card storage and no tracking, remote font, CDN, or free-flow network request. The sole runtime network call is the documented optional license verification to `api.sociobot.in`; `connect-src` permits only that origin. A fake-license request works and fails safely. The live CSP is `default-src 'self'` with the expected narrowly scoped `connect-src`, and the live Permissions-Policy disables camera, display capture, microphone, payment and other unneeded features.
- Live mobile Lighthouse: **97 Performance**, **100 Accessibility**; FCP **0.8 s**, LCP **1.5 s**, TBT **190 ms**, CLS **0**, transfer **132 KiB**. Built initial site JavaScript is **2,940 B** (1,420 B gzip), CSS **12,825 B** (3,840 B gzip), and the LCP hero WebP **124,548 B**, all inside the stated static budgets.
- Live response headers include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, CSP and Permissions-Policy. `assets/home-C9qLF5SJ.js` and `assets/style-1D-BSFj-.css` use `Cache-Control: public, max-age=31536000, immutable`.

## Live parity and defect

The deployed application shell does match this exact candidate:

| Asset | Candidate and live SHA-256 |
| --- | --- |
| `index.html` | `5aedda88b4c1f7b96a23dd2e14acbb71206310b9111b83c33f2fe1a7608852dd` |
| `assets/home-C9qLF5SJ.js` | `928eb7343eaa43acf2020eec3b2c5f1e4dbdec9d10380bef37bb82bce7df6a0c` |
| `assets/style-1D-BSFj-.css` | `bbe30f139eefd65a79d3cf956cb309e1e99d86b4dbc183e3b7406ee62dcefd4b` |

| Severity | Defect | Fresh reproduction and impact |
| --- | --- | --- |
| **P1 — release blocker** | Production omits the extension ZIP. | `curl -i https://focus-resume-card.sociobot.in/downloads/focus-resume-card.zip` returned **HTTP 404**, `Content-Type: text/html`, and a 2,400 B error body. The local candidate produces `dist/site/downloads/focus-resume-card.zip` (37,538 B, `PK\\x03\\x04`, 16 MV3 files). Every visible Download CTA targets the missing route, so a visitor cannot install the extension or complete the brief's smallest useful product. |

For completeness, production checkout is no longer defective: `GET https://api.sociobot.in/api/v1/products/focus-resume-card/checkout` returned **303** to `checkout.dodopayments.com`; a fake token to `/verify` returned `200 {"valid":false,"reason":"invalid"}`.

## Required remediation

Deploy the complete candidate `dist/site` output, including `downloads/focus-resume-card.zip`, to the deployment root. Re-run `npm run test:live` only after `curl -I` returns `200`, `Content-Type: application/zip`, and ZIP magic bytes. No product code was modified during verification.
