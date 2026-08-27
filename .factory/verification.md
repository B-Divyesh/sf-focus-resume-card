# Independent verification — FAIL

**Work order:** `focus-resume-card-verify-1`  
**Candidate:** `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2` (`docs: record final release metrics`)  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-27 UTC from a clean checkout.  
**Verdict:** **FAIL** — the candidate builds and its core local extension checks pass, but the live product cannot deliver its required extension package and its advertised paid checkout is broken.

## What passed locally

Fresh dependency install completed with `npm ci` (179 packages audited, 0 vulnerabilities). The repository has no lint script; all declared validation scripts were run.

| Check | Command / evidence | Result |
| --- | --- | --- |
| Type checking | `npm run typecheck` | Pass |
| Unit and contract tests | `npm test` | Pass: 2 files, 15 tests |
| Exact production build | `npm run build` | Pass: WXT MV3 build, Vite site build, extension ZIP created |
| Local landing a11y | `npm run test:a11y` against production preview at 390×844 | Pass: axe 0 violation groups; 0 serious/critical |
| Local extension smoke | `npm run test:extension` | Pass: saved-card render, resume navigation, persistence, confirmed clear, settings, extension axe, and no console errors |
| Archive validity | `unzip -l dist/site/downloads/focus-resume-card.zip` | Pass: 16 MV3 files including manifest, popup/options/background and assets |
| Boundary/recovery logic | `tests/model.test.ts` | Pass: 4 words rejected; 5 and 12 accepted; 13 rejected; duration and local license-cache boundaries covered |

The production artifact is well within static budgets: initial landing JS 2,940 B (1,420 B gzip), CSS 12,825 B (3,840 B gzip), hero WebP 124,548 B, and ZIP 37,538 B. The extension build reports 58.75 KB uncompressed.

## Browser, accessibility, privacy, and security observations

On the live URL, Playwright exercised desktop (1440×1000) and mobile (390×844) rendering, keyboard tabbing, malformed license restore input, reduced motion, console/page errors, and outbound requests. Both sizes had zero axe WCAG 2 A/AA/2.1 AA violation groups and zero serious/critical findings, no horizontal overflow, zero console/page errors, and reduced-motion transition duration of `0.01ms`. The malformed token recovery message is present: “Paste the complete token from your receipt.” Requests on first load stayed on `focus-resume-card.sociobot.in`; no analytics, font CDN, or third-party runtime request was observed.

The native toolbar-action capture flow cannot be driven by Playwright's headless extension harness because `activeTab` is granted only from a real browser-toolbar user gesture. The repository's actual extension smoke test did exercise the shipped MV3 popup's saved-card/resume/clear/settings path. Source and manifest inspection confirms local `chrome.storage.local` storage, optional title/selection/screenshot capture, 5–12 word validation, and only the optional Sociobot license verification request; the free popup/background make no network request. The extension's fake-token settings test made one successful request to the documented verification endpoint and correctly displayed the invalid-license state, with no console errors.

The live site exposes HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and DNS-prefetch control. It does not expose a Content-Security-Policy or Permissions-Policy. The skip link scrolls to `#main` but leaves keyboard focus on no focusable main target (`<main>` has no `tabindex`); axe does not flag this, but it is a minor keyboard polish issue.

Lighthouse CLI could not be run in this container because its launcher rejected/failed to connect to the supplied Playwright Chromium binary. This does not affect the directly measured bundle, axe, console, viewport, or motion checks above.

## Live parity and release-blocking defects

The deployed HTML, hashed JS, CSS, and hero image are byte-identical to this commit's `dist/site` output (SHA-256 comparisons passed):

- `index.html`: `1bed05c6ec3863c27e8faed99c661823d07ae6195f29c1fb5feeaa67abf47dfc`
- `assets/home-C9qLF5SJ.js`: `928eb7343eaa43acf2020eec3b2c5f1e4dbdec9d10380bef37bb82bce7df6a0c`
- `assets/style-1D-BSFj-.css`: `bbe30f139eefd65a79d3cf956cb309e1e99d86b4dbc183e3b7406ee62dcefd4b`
- `illustrations/topographic-route.webp`: `201310e88b4f74d84003326fa66f53a90fc0f5cb893cc0f9876627ad6f03f0f6`

Despite that parity, the deployment is incomplete:

| Severity | Defect | Reproduction / impact |
| --- | --- | --- |
| **P1 release blocker** | Extension download is absent from live deployment. | `curl -i https://focus-resume-card.sociobot.in/downloads/focus-resume-card.zip` returns **HTTP 200**, `Content-Type: text/html`, 8,868 B — exactly the homepage, not the 37,538 B ZIP built locally. Both visible “Download” links point here, so a visitor cannot install the extension or perform the primary job. |
| **P1 release blocker** | Advertised `$9 once` checkout is unregistered/broken. | `curl -I https://api.sociobot.in/api/v1/products/focus-resume-card/checkout` returns **HTTP 404**. The live page presents this as an active purchase button. The verification API itself responds correctly to a malformed token (`200 {"valid":false,"reason":"invalid"}`), so this is specifically missing product registration/checkout availability. |
| **P2** | Hashed static assets are cached for only 30 seconds, not immutable long-lived cache. | Live `assets/home-C9qLF5SJ.js` returns `Cache-Control: public, must-revalidate, max-age=30`; factory performance policy calls for long-lived immutable caching of hashed assets. |
| **P2** | No CSP or Permissions-Policy response headers. | Live HTML response has HSTS/referrer/nosniff but neither `Content-Security-Policy` nor `Permissions-Policy`. Add deployment-level hardening appropriate for the static site. |
| **P3** | Skip link does not transfer focus into main content. | Keyboard Enter on the visible skip link navigates to `#main`, but no focusable main target receives focus. Add an appropriate focus target as accessibility polish. |

The server currently returns the homepage with HTTP 200 for arbitrary missing paths as well (`/does-not-exist`, `/.git/config`, and the missing ZIP). No repository file was disclosed in this test, but the fallback masks deployment failures such as the missing package.

## Required release remediation and re-verification

1. Publish `dist/site/downloads/focus-resume-card.zip` alongside the deployed static site and verify a download returns a ZIP MIME type/content with the expected archive bytes.
2. Register/enable the `focus-resume-card` Sociobot product before exposing the live checkout link, or remove/disable that paid CTA until registration is complete.
3. Configure immutable cache control for fingerprinted assets and add CSP/Permissions-Policy at the deployment layer.
4. Re-run this verification against the updated URL, including a real toolbar click capture test in a Chromium profile.

No product source code was modified during verification.
