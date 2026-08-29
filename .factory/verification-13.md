# Focus Resume Card — independent verification 13

**Candidate:** `886a29acbf333811de70a8bc4da6eac5afeb115e`  
**Live URL:** <https://focus-resume-card.sociobot.in/>  
**Verified:** 2026-08-29  
**Verdict: FAIL — the documented live Sociobot gateway allowance is not enforced at its required threshold.**

This was a fresh `npm ci` verification. No product source was changed.

## First read — PASS

A cold 390 px visit says: “Resume interrupted coding with one next action.” It states the audience (“For interrupted developers”) and the first click (“Try it with sample data”). That one click opens `/demo`, already containing a realistic saved card (“Write failing test for empty response”), page context, selected note, a 34-minute focus block, Resume action, and the persistent “Demo — sample data, nothing is saved” banner with Reset and Start for real.

## Mandatory claims — PASS

Every exact `test` in `.factory/claims.json` was run from this clean clone. The aggregate `npm run test:demo` (4/4) and `npm run test:claims` (12/12) also passed.

| Claim ID | Result | Observable evidence |
| --- | --- | --- |
| `demo-sample-card` | PASS | Fresh 390 px `/demo` shows a complete sample card. |
| `demo-isolation` | PASS | Uses only `demo:focus-resume-card:sample-card`. |
| `demo-exit-discard` | PASS | Start for real removes demo state; revisit is Waiting. |
| `demo-local-data` | PASS | Demo flow request log remained same-origin. |
| `extension-local-data` | PASS | Installed MV3 card storage/render had zero HTTP requests. |
| `card-fields` | PASS | Saved page, title/selection, focus time, and next action render. |
| `offline-card` | PASS | Stored card and offline state remain visible offline. |
| `redaction` | PASS | Hidden values are omitted; UI says Title hidden. |
| `screenshot-card` | PASS | Local data-URL screenshot stores and renders. |
| `exact-page-resume` | PASS | Opens stored URL including query and fragment. |
| `clear-undo` | PASS | Confirmed clear removes card; immediate Undo restores it. |
| `next-action-length` | PASS | 5/12 accepted; 4/13 rejected with recovery messages. |
| `no-account` | PASS | Clean MV3 profile uses card without credentials. |
| `quiet-reminder` | PASS | Badge is off by default; dot appears only after opt-in. |
| `daily-license-check` | PASS | Cached result avoids request; fixture verifies after 24 h. |
| `plus-treatments` | PASS | Valid recorded response enables/persists cosmetic treatments. |
| `license-rate-limit` | PASS | Client parses Retry-After and free workflow remains usable. |
| `plus-price` | PASS | $9 once and Sociobot checkout endpoint verified. |
| `download-package` | PASS | Build yields valid fixed-date MV3 ZIP and MIME rules. |

## Build and product QA — PASS

| Check | Result |
| --- | --- |
| `npm test` | PASS — 27/27 Vitest. |
| `npm run typecheck`, `npm run lint` | PASS. |
| `npm run build` | PASS — WXT MV3, Vite site, ZIP. |
| `npm run test:package` | PASS — reproducible 37,549 B package, 13 fixed-date files. |
| `npm run test:artifact` | PASS — archive/MV3/deployment rule checks. |
| `npm run test:extension` | PASS — capture, resume, reopen, clear/undo, focus clock, settings, keyboard, 390 px, offline, axe, console. |
| `unzip -t` | PASS — all 13 ZIP files valid; manifest is MV3 with `storage`, `activeTab`, `scripting` only. |

The functional paths cover normal capture/resume, exact saved URL, optional screenshot/redaction, clear confirmation/undo, offline reload, and invalid next-action boundaries. This is the brief’s bounded local recovery card, not a task manager, timer, or treatment product.

## Live deployment, privacy, accessibility, and performance — PASS

- `npm run test:live`: PASS. All 19 static files byte-match the fresh build; homepage SHA-256 is `4ec38c1373bc36eb771cc2d7f148ff70e17f2aaef16c3490eb8c36a4fea0190f` locally and live. Live download is a 37,549 B `application/zip` attachment, valid MV3 archive; 404 and Dodo checkout checks pass.
- Fresh 390 px Playwright home→demo→resume→Start-for-real flow made only seven same-origin static requests and logged zero page/console errors. No analytics, trackers, third-party scripts, fonts, or runtime CDNs appeared.
- Response headers include HSTS, `nosniff`, `strict-origin-when-cross-origin`, restrictive response CSP/frame ancestors, revalidated HTML, and immutable hashed JS caching. Extension storage/privacy claim tests also pass.
- `A11Y_URL=https://focus-resume-card.sociobot.in npm run test:a11y`: PASS for home/demo/privacy/terms/404 on desktop and 390 px; light/dark, reduced motion, keyboard skip/focus, target sizes, no overflow, no errors, and zero axe serious/critical findings. `verify-url.sh` also passed.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 10 ms, CLS 0. It emitted a Chromium-tab crash only after writing the complete report.
- Budgets: 2,920 B raw / 1,420 B gzip home JS; 14,779 B raw / 4,250 B gzip CSS; no web-font payload; 124,548 B hero; 59,640 B unpacked extension.

There is no sign-in, so Entra tenant validation is not applicable. Privacy, terms, README, MIT license, demo docs, and artwork provenance are present.

## Defect

| Severity | Finding | Evidence and resolution |
| --- | --- | --- |
| **P0 — release blocker** | Live Sociobot billing gateway does not enforce the checked-in allowance at the documented threshold. | Contract requires 13 `/verify` and 7 `/checkout` requests per trusted client/product/60 s, then 429 with positive `Retry-After`, `Cache-Control: no-store`, and no checkout redirect. Fresh `npm run test:gateway` got **200 on verify request 14** and **303 on checkout request 8**. Continuing the same-client probe reached 429 only later; checkout sent invalid `Retry-After: 0`, and both observed 429s lacked `Cache-Control: no-store`. Thus no compliant observed allowance exists (and certainly not 13/7). The Sociobot gateway owner must enforce the exact contract and `npm run test:gateway` must pass from a fresh client/window. |

The static repository and extension cannot repair this shared gateway, but the work order makes its enforcement a release condition. The client’s graceful 429 behavior itself is tested and passes; the server policy fails.

