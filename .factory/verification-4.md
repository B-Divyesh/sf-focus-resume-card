# Independent product verification 4 — FAIL

**Work order:** `focus-resume-card-verify-4`

**Candidate:** `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2`

**Live URL:** <https://focus-resume-card.sociobot.in/>

**Verified:** 2026-08-28 06:01 UTC from a clean candidate checkout

**Verdict:** **FAIL**

The candidate builds and its core extension workflow is healthy, and the earlier missing-download deployment failure is fixed. It is still not releasable under the acceptance contract: production does not exactly match the candidate, candidate and live keyboard bypass links fail on multiple screens, and several mobile targets are below the required 44×44 CSS px.

## Clean install and repository gates

| Check | Fresh evidence | Result |
| --- | --- | --- |
| Checkout | Detached clean checkout at exact SHA `e7fc8af83cd103cf1afd4e227bb685b71f38ffc2`; `node_modules` absent before install | Pass |
| Runtime | Node `v22.23.2`; npm `10.9.8` | Pass |
| Install | `npm ci`: 178 packages added, 179 audited, 0 vulnerabilities | Pass |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | Pass |
| Unit/contract tests | `npm test`: 2 files, 15/15 tests | Pass |
| Lint | No lint script or linter configuration exists | Not available |
| Exact production build | `npm run build` | Pass |
| Extension package | WXT MV3 output 58.75 kB; ZIP 37,538 B; `unzip -t` passed all 16 files | Pass |
| Site output | JS 2,940 B (1,420 B gzip); CSS 12,825 B (3,840 B gzip); hero WebP 124,548 B | Pass |
| Repository site axe | Local and live `npm run test:a11y`: 0 violation groups | Pass |
| Repository extension smoke | Render, resume, reopen, confirmed clear, settings, axe, and console checks | Pass |
| URL smoke | Local and live `verify-url.sh`: HTTP 200, title/lang/one h1/main/alts valid, 0 console/page errors | Pass |

The browser checks used Chrome for Testing `145.0.7632.6` at `/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`, explicitly passed to the candidate's Playwright 1.62 scripts.

## Product exercise

Fresh automation loaded the built unpacked extension into a clean Chromium profile and exercised:

- empty capture state and initial next-action focus;
- 4-word rejection (`Add 1 more word.`), valid 5-word save, and 13-word rejection (`Remove 1 word.`), including focus recovery and `aria-invalid`;
- title and selection redaction, screenshot compression/storage, named clear confirmation, Escape cancellation, clear, and keyboard-operated undo;
- exact saved-URL resume, persisted `resumedAt`, reopen persistence, 1h 1m duration formatting, and stored-markup escaping;
- free/paid control boundaries, short and invalid license recovery, daily valid-cache reuse without another request, offline cached unlock, Night theme persistence, and opt-in toolbar dot;
- stable-state axe scans of capture, saved card, and settings: 0 serious/critical findings and 0 console/page errors.

Chromium grants `activeTab` only from a physical toolbar invocation, which headless Playwright cannot synthesize. The active page/selection/screenshot inputs were injected at the Chrome API boundary for the capture-form exercise; the real built package and permissions were used for storage, card lifecycle, resume tabs, license calls, and background badge behavior. The manifest has only `storage`, `activeTab`, and `scripting`; source inspection confirms the toolbar gesture is the intended permission grant.

The live site was checked at 1366×900 light and 390×844 dark on `/`, `/privacy/`, and `/terms/`. All rendered without horizontal overflow, console/page/request errors, or axe serious/critical findings. Reduced motion computed to `0.00001s`; dark mode applied; visible focus is a solid 3 px outline. Visual review found a coherent topographic system and usable responsive stacking.

## Privacy, outbound requests, and paid path

- A normal live first load requested only `https://focus-resume-card.sociobot.in`; there are no analytics, trackers, CDN scripts, or remote fonts.
- The free extension made no remote request. The only observed extension request was the explicit invalid-token check to `https://api.sociobot.in/api/v1/products/focus-resume-card/verify?...` after submitting a license-shaped value.
- Cards, screenshot, selection, timer, preferences, license, and cached verdict remained in extension/local storage. Invalid verification returned `{valid:false, reason:"invalid"}` without blocking the free workflow.
- Fresh checkout request returned HTTP 303 to `checkout.dodopayments.com`; the candidate handoff's registration warning is now stale external-state information.
- No PWA/service worker is shipped by the landing site, so PWA offline/update checks do not apply. The MV3 background service worker and extension shell loaded offline from the installed package.

## Live response policy, caching, and performance

- HTML, legal pages, and ZIP are HTTP 200. The ZIP is `application/zip`, has attachment disposition, is 37,538 B, and passes `unzip -t`.
- Responses include HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, restrictive CSP and Permissions-Policy, and no third-party runtime allowance except the documented Sociobot API in `connect-src`.
- HTML and mutable named assets use `max-age=0, must-revalidate`; hashed JS/CSS use `public, max-age=31536000, immutable`.
- Lighthouse 12.8.2 mobile on production: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 60 ms, CLS 0, total transfer 132 KiB. INP is unavailable from a navigation-only lab run.

## Deployment identity

The public extension artifact is now present and its 16 unpacked file hashes exactly match the candidate build. Privacy, terms, JS, CSS, and hero also match. The homepage does not:

| Artifact | Candidate SHA-256 | Live SHA-256 | Result |
| --- | --- | --- | --- |
| `index.html` | `1bed05c6ec3863c27e8faed99c661823d07ae6195f29c1fb5feeaa67abf47dfc` | `5aedda88b4c1f7b96a23dd2e14acbb71206310b9111b83c33f2fe1a7608852dd` | **Mismatch** |
| `privacy/index.html` | `3f28f04110443317e9c4defbcf8c54fdcf62563c6ca9c0e0d431bfedaf3af463` | same | Match |
| `terms/index.html` | `f7adbf9a294235322b7c2ebd5957670a318c4ac97fdd4f9165c50ec8c7660b77` | same | Match |
| `home-C9qLF5SJ.js` | `928eb7343eaa43acf2020eec3b2c5f1e4dbdec9d10380bef37bb82bce7df6a0c` | same | Match |
| `style-1D-BSFj-.css` | `bbe30f139eefd65a79d3cf956cb309e1e99d86b4dbc183e3b7406ee62dcefd4b` | same | Match |
| Hero WebP | `201310e88b4f74d84003326fa66f53a90fc0f5cb893cc0f9876627ad6f03f0f6` | same | Match |

The exact HTML delta is live `<main id="main" tabindex="-1">` versus candidate `<main id="main">`. This is the later keyboard-focus repair in repository history, so production is derived from a post-candidate revision rather than the nominated commit.

## Defects by severity

| Severity | Defect | Reproduction and impact |
| --- | --- | --- |
| **P1 — release blocker** | Production is not the nominated candidate. | Build `e7fc8af`, hash `dist/site/index.html`, then compare with `curl https://focus-resume-card.sociobot.in/`. Hashes above differ, with a one-line focus repair present only live. The public extension matches semantically, but the deployed product as a whole cannot be attested to candidate `e7fc8af`. |
| **P2 — major accessibility** | Skip links do not transfer focus on candidate home/privacy/terms and extension settings; live privacy/terms and settings still fail. | Keyboard Tab focuses the visible 3 px-outlined skip link. Enter changes `location.hash` to `#main`, but `document.activeElement` remains `<body>` because those `<main>` elements lack `tabindex="-1"`. This defeats the promised bypass mechanism (WCAG 2.4.1). Live home passes only because of the post-candidate delta. |
| **P2 — major mobile accessibility** | Multiple visible link targets are below the attached 44×44 px contract. | At 390 px, measured examples include the wordmark at 166×16, “Installation steps” at 157×25, “Read the privacy note” at 199×19, the install ZIP link at 224×19, and footer legal links at 47–58×25. Legal email links are 19 px high. Primary CTAs pass, but frequent navigation/install/legal targets do not. |
| **P3 — minor response correctness** | Unknown document routes are soft 404s. | `GET /definitely-missing-page` returns HTTP 200 and the homepage. Missing `/assets/...` and `/downloads/...` correctly return 404. This can mislead monitoring and search indexing but does not block the core flow. |

## Required release action

Nominate and deploy one exact revision containing the homepage focus repair, add the same focusable main target to privacy, terms, and extension settings, and enlarge mobile hit areas to 44×44 CSS px. Add regression coverage that presses Enter on each skip link and asserts `document.activeElement === main`, plus mobile target-size assertions. Redeploy that exact build and verify byte/semantic identity before changing the verdict to PASS.

No product code was modified during verification.
