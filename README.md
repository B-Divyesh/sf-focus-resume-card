# Focus Resume Card

Focus Resume Card is a local-first Chromium extension for developers who need a small, concrete way back into interrupted work. It saves exactly one checkpoint: the current URL, optional page title and selected text, an optional compressed screenshot, elapsed focus time, and a required 5–12-word next physical action.

It is intentionally not a task manager, Pomodoro tracker, AI planner, or health treatment. Opening the extension shows the one waiting card before any planning interface.

Live site: [focus-resume-card.sociobot.in](https://focus-resume-card.sociobot.in)

## What is included

- WXT + TypeScript Manifest V3 extension for Chromium browsers
- One-card capture, title/selection redaction, optional local screenshot, and focus clock
- Resume flow that opens only the saved page
- Confirmed clear with an immediate undo action
- Offline-first `chrome.storage.local` persistence; no account or card sync
- Free Field theme; optional $9 one-time Plus license for Lichen/Night themes and a quiet opt-in toolbar dot
- Static responsive product site with install instructions, privacy policy, and terms
- Packaged extension at `dist/site/downloads/focus-resume-card.zip`

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Develop

```bash
npm install
npm run dev          # extension development build
npm run dev:site     # landing site at http://localhost:5173
```

## Test and build

```bash
npm run typecheck
npm test
npm run build
npm run test:artifact
```

`npm run build` is the reproducible release command. It creates the unpacked extension in `.output/chrome-mv3`, builds the deployable static site in `dist/site`, and places the installable ZIP at `dist/site/downloads/focus-resume-card.zip`. The static deployment root is exactly `dist/site`.

Optional browser checks require a locally installed Playwright Chromium:

```bash
npm exec playwright install chromium
npm run build
npm exec vite -- preview --config vite.site.config.ts --host 127.0.0.1 --port 4173
npm run test:a11y
npm run test:extension
```

If Chromium is managed outside Playwright, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/absolute/path/to/chrome` for the final two commands.

After deployment, verify the production download, headers, immutable assets, missing-download handling, and live Dodo checkout redirect with:

```bash
npm run test:live
```

## Install the extension locally

1. Run `npm run build` and unzip `dist/site/downloads/focus-resume-card.zip`.
2. Open `chrome://extensions` and enable Developer mode.
3. Choose **Load unpacked** and select the extracted directory.
4. Pin Focus Resume Card to the toolbar.

## Privacy and payments

The extension does not load remote scripts or fonts. Resume cards remain in browser extension storage. A network request is made only when a user supplies a Plus license, at most once per day, to the Sociobot billing verification endpoint. Checkout is hosted by Sociobot/Dodo; no payment provider is embedded here. The live `focus-resume-card` checkout is registered with Sociobot.

See [Privacy](https://focus-resume-card.sociobot.in/privacy/) and [Terms](https://focus-resume-card.sociobot.in/terms/).

## Project notes

- Product scope: [.factory/brief.json](.factory/brief.json)
- Visual thesis and asset provenance: [.factory/design.md](.factory/design.md)
- Build handoff: [.factory/handoff.md](.factory/handoff.md)

## License

MIT — see [LICENSE](LICENSE).
