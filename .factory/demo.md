# Focus Resume Card demo

Open `/demo` or select **Try it with sample data** on the first screen.

The sample is a realistic saved coding checkpoint: the page context is `Retry
middleware · api.ts`, the selected note describes the empty-response error, the
focus block is 34 minutes, and the next action is “Write failing test for empty
response.” Select **Resume this page** to see the saved state, then select
**Reset demo** to restore it.

Demo state uses only the browser-storage key
`demo:focus-resume-card:sample-card`. It never reads or writes the extension's
real `chrome.storage.local` card namespace. **Start for real** returns home;
the next demo visit starts from the isolated sample state unless the demo was
intentionally resumed in that browser context.

Each public demo statement is exercised from a fresh browser context by the
commands in `.factory/claims.json`.
