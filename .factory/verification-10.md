# Focus Resume Card — independent verification 10

## Result: FAIL — do not release

Tested on 2026-08-29 from clean candidate commit
`151c34ece86a35d8bd499b51b42d7a599bf1aab7` against
<https://focus-resume-card.sociobot.in/>.

The live static deployment exactly matches the candidate and the core card
workflow is otherwise usable. Release is blocked by two fresh findings:

1. **P0:** the Sociobot product endpoints still do not enforce their documented
   13/7 requests-per-60-seconds allowance.
2. **P1:** selecting **Start focus clock** in the extension throws an uncaught
   error and fails to update the button or success status.

## Cold first read — PASS

A new desktop browser context showed this first screen without scrolling:

- What it does: “Resume interrupted coding with one next action.”
- Who it is for: “For interrupted developers, it saves page context and shows
  one small action when you return.”
- What to click first: **Try it with sample data**.

That action opens `/demo` in one click. The destination immediately shows the
realistic “Write failing test for empty response” card and a persistent
“Demo — sample data, nothing is saved” banner with **Reset demo** and
**Start for real**. This satisfies the mandatory first-read/demo gate.

The cold request log contained only the page, self-hosted JavaScript/CSS, and
the self-hosted hero image. It contained no cross-origin request, console
error, or page error.

## Required claims — PASS

`.factory/claims.json` exists and contains 18 unique entries. After `npm ci`
(178 packages, 0 vulnerabilities), I ran every listed `test` command
individually before the rest of the review. Every claim passed:

```text
demo-sample-card          PASS
demo-isolation            PASS
demo-local-data           PASS
extension-local-data      PASS
card-fields               PASS
offline-card              PASS
redaction                 PASS
screenshot-card           PASS
exact-page-resume         PASS
clear-undo                PASS
next-action-length        PASS
no-account                PASS
quiet-reminder            PASS
daily-license-check       PASS
plus-treatments           PASS
license-rate-limit        PASS
plus-price                PASS
download-package          PASS
```

The aggregate demo and extension claim suites also passed later in the run.
The landing page, legal pages, extension UI, and README claims map to these
entries; I found no material unlisted product claim.

## Source, build, and artifact gates — PASS

```text
npm run check             PASS — typecheck, oxlint, 27/27 Vitest tests, build
npm run test:artifact     PASS — valid 37,550 B Manifest V3 ZIP and route rules
npm run test:package      PASS — 13 fixed-date files; reproducible 37,550 B ZIP
npm run test:demo         PASS — all 3 demo claims
npm run test:claims       PASS — all 12 installed-extension claims
npm run test:extension    PASS — installed MV3 smoke flow
npm run test:a11y         PASS — local home/demo/privacy/terms/404
```

The exact production command creates `.output/chrome-mv3`, `dist/site`, and
`dist/site/downloads/focus-resume-card.zip`. The manifest requests only
`storage`, `activeTab`, and `scripting` and declares the popup, settings page,
and MV3 service worker.

## Functional product exercise

### Core workflow — PASS except focus-clock feedback

I exercised the unmodified built popup at 390×844 with representative page
title, selected text, an exact URL containing query and fragment, and a local
screenshot. Because headless Chromium cannot click browser chrome, only the
active-tab query/selection/screenshot inputs were injected; all UI, validation,
model, `chrome.storage.local`, clear/undo, and real `chrome.tabs.create`
behavior came from the built extension.

- Four words were rejected with “Add 1 more word.”, `aria-invalid`, and focus
  returned to the textarea.
- Exactly five words saved successfully.
- Thirteen words were rejected with “Remove 1 word.”
- Exactly twelve words saved successfully.
- Page title, selected text, screenshot, URL, and elapsed field were stored in
  the one local card and rendered.
- Unchecking title and selection stored `null` and did not leak either value in
  the rendered card.
- Escape cancelled the clear dialog. Confirming removed the card. **Undo**
  restored it.
- Replace required confirmation and saved the new card.
- Resume opened the exact saved URL, including query and fragment, and wrote
  `resumedAt`.
- Dynamic capture and open-confirmation screens had zero axe serious/critical
  findings; the modal focused **Keep card**.

The repository's installed-extension suite independently passed stored-card
rendering, exact resume, reopen, clear, settings, offline reload, desktop/390px
layouts, touch targets, focus contrast, keyboard bypass, axe, and console
checks. All claim flows used a fresh extension profile.

### Demo — PASS

At 390×844 in dark mode with reduced motion:

- Keyboard activation of the first-screen action opened `/demo`.
- **Resume this page** changed Waiting to Resumed and announced the result.
- Reload preserved only `demo:focus-resume-card:sample-card`.
- **Reset demo** removed that key and restored Waiting.
- There were no cookies, cross-origin requests, browser errors, or horizontal
  overflow.
- Every visible link/button was at least 44 px high. The focused primary action
  used a visible 3 px outline. Reduced-motion transition durations were
  effectively zero.

## Accessibility and responsive QA — PASS

Local and live `npm run test:a11y` runs covered home, demo, privacy, terms, and
404 at desktop and 390 px in light and dark modes. They found no axe
serious/critical violations, keyboard bypass failures, focus-contrast failures,
undersized mobile link targets, overflow, reduced-motion failures, console
errors, or page errors.

`/opt/fleet/lib/verify-url.sh` passed both local and live: HTTP 200, descriptive
title, `lang="en"`, one h1, main landmark, all image alt text, labeled buttons,
and no browser errors. The native confirmation dialog receives focus and has
an accessible name and description.

## Deployment, privacy, headers, and performance — PASS

- `npm run test:live` proved all 19 deployable files byte-for-byte match the
  candidate build. The live download is the same valid 37,550 B MV3 ZIP.
- Missing documents and downloads return a real styled 404. All crawled
  internal links and the GitHub source link returned 200; mail links were
  explicitly exempt. Normal checkout returned the expected Dodo 303.
- A complete fresh demo flow made only same-origin requests. Extension claim
  coverage recorded zero HTTP requests while storing/rendering free card data.
  The live site set zero cookies.
- Production sends CSP (`default-src 'self'`, only `api.sociobot.in` in
  `connect-src`), HSTS, `nosniff`, `strict-origin-when-cross-origin`, and a
  restrictive Permissions-Policy. HTML and ZIP revalidate with `max-age=0`;
  hashed assets use `max-age=31536000, immutable`.
- Fresh mobile Lighthouse: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 30 ms, CLS 0, total transfer 132 KiB.
- Home JavaScript is 2,920 B raw (plus a 670 B modulepreload helper), shared
  CSS is 14,741 B, the hero is 124,548 B, and the unpacked extension is
  59,646 B. All are within the contract budgets.

This is a static site plus browser extension, not a PWA, library, CLI, or
product backend. It does not require sign-in. PWA update/offline-shell,
consumer-package, backend concurrency/persistence, and Entra checks therefore
do not apply. The external billing routes were tested separately below.

## Defects

### P0 — live billing gateway ignores the documented request allowance

`npm run test:gateway` failed against
`https://api.sociobot.in/api/v1` at `2026-08-29T10:06:14.771Z`.

The checked-in contract permits 13 license-verification and 7 checkout
requests per client/product in 60 seconds. Requests 14 and 8 must return `429`,
a positive `Retry-After`, and `Cache-Control: no-store`; the blocked checkout
must not create a redirect.

Fresh observations from one client:

```text
license verification requests 1–14: 200
checkout requests 1–8:             303 with a Dodo Location
request 14 Retry-After:             absent
request 8 Retry-After:              absent
```

The observable allowance is at least 14 verification requests and at least 8
checkout requests per 60 seconds. Checkout request 8 created a new hosted
checkout session. This repeats the prior deployment-only failure and violates
an explicit work-order gate. The raw observations are in the local ignored
evidence file `.factory/evidence/gateway-rate-limit.json`.

### P1 — Start focus clock throws and gives no feedback

In a fresh installed-extension profile, open the capture form and select
**Start focus clock**. The timestamp is written, but the page logs:

```text
Cannot set properties of null (setting 'textContent')
```

The button still says **Start focus clock** and the status region stays empty,
so the action gives the user no confirmation. The cause is
`src/entrypoints/popup/main.ts:194`: the async click listener awaits storage at
line 197 and then dereferences `event.currentTarget` at line 198. Per the DOM
event model, `currentTarget` is null after the listener yields. Capture the
button in a local variable before `await`, then add an interaction regression
test that asserts the label, status, stored timestamp, and zero page errors.

## Evidence

Local ignored evidence was captured under `.factory/evidence/verification-10/`
(cold desktop, mobile demo, extension card, verify-url JSON/screenshots, and
Lighthouse JSON). The exact gateway observations are in
`.factory/evidence/gateway-rate-limit.json`. The decisive values are reproduced
above so this committed report is self-contained.
