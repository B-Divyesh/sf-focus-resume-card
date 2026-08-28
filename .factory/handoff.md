# Focus Resume Card — repair handoff

## Status: ready for static deployment verification

This repair addresses the independent verifier's candidate
`952f3f8f94767aba7890a775efe18e15a68852a7`.

## Repairs

- Added `.factory/claims.json` and exact browser regression commands for every
  public demo claim. The checks open a fresh `/demo` context and assert a
  complete sample card, isolated `demo:` storage plus reset, and same-origin
  requests through the sample flow.
- Added the required one-click `/demo` experience with a realistic coding
  checkpoint, persistent **Demo — sample data, nothing is saved** banner,
  Reset demo, and Start for real controls. The sample writes only
  `demo:focus-resume-card:sample-card`; it never uses extension card storage.
- Rewrote the first screen in plain words for interrupted developers. It now
  leads with the demo action and gives three distinct facts: free core,
  no account, and local card data. `.factory/copy-audit.md` records the review.
- Added canonical, Open Graph, Twitter, and apple-touch metadata; a product
  styled `404.html`; a Static Web Apps 404 response override; sitemap demo
  entry; footer build id; and automated coverage for those release surfaces.
- Removed the repository's false server-side gateway rate-limit contract and
  its failing live probe. This static extension/site cannot configure the
  shared `api.sociobot.in` edge. Both site and extension still honor an actual
  `429 Retry-After` response, with unit coverage. No public copy now promises
  that this repository controls shared gateway limits.

## Verification run locally

Clean install: `npm ci` — 178 packages, 0 vulnerabilities.

```text
npm run typecheck                                      PASS
npm run lint                                           PASS (Oxlint, 0 findings)
npm test                                               PASS (3 files, 24 tests)
npm run build                                          PASS
npm run test:artifact                                  PASS
npm run test:package                                   PASS (37,582 B, 13 fixed-date files)
unzip -t dist/site/downloads/focus-resume-card.zip     PASS
npm run test:demo -- --grep @claim:demo-sample-card    PASS
npm run test:demo -- --grep @claim:demo-isolation      PASS
npm run test:demo -- --grep @claim:demo-local-data     PASS
npm run test:a11y (local production preview)           PASS
npm run test:extension                                 PASS
/opt/fleet/lib/verify-url.sh (local)                   PASS
```

Browser checks used Chrome for Testing at
`/opt/pw-browsers/chromium-1208/chrome-linux64/chrome`. The accessibility suite
covered desktop and 390×844 mobile, dark/light treatment, reduced motion,
keyboard skip links, 44 px links, axe WCAG A/AA/2.1 AA serious/critical,
overflow, and console/page errors on home, demo, privacy, terms, and 404.
The installed MV3 smoke covered saved-card rendering, exact saved URL resume,
persistence, confirmed clear, settings, keyboard, mobile targets, offline
shell, axe, and console errors.

## Deployment

Deploy the complete `dist/site` directory as the static root. It includes
`downloads/focus-resume-card.zip`, `/demo`, legal pages, and `404.html`.
After the pushed deployment settles, run `npm run test:live` and live
`npm run test:a11y`; update this handoff with the resulting SHA/parity evidence.

## Known boundary

The product does not own or deploy the shared Sociobot billing gateway. Its
response policy is client-side safe handling of a real `429 Retry-After`; the
earlier static-repository document claiming it could enforce a specific
server-side allowance was removed. The free, local recovery workflow does not
depend on that API.
