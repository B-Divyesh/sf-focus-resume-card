import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import JSZip from 'jszip';

const run = promisify(execFile);
const destination = 'dist/site/downloads/focus-resume-card.zip';
const packageDate = '1980-01-01T00:00:00.000Z';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const first = await readFile(destination);
await run(process.execPath, ['scripts/package-extension.mjs']);
const second = await readFile(destination);

requireCondition(first.equals(second), 'extension ZIP changed when packaged twice from the same build output');

const archive = await JSZip.loadAsync(second);
const datedEntries = Object.values(archive.files).filter((entry) => !entry.dir);
requireCondition(datedEntries.length > 0, 'extension ZIP has no files');
requireCondition(
  datedEntries.every((entry) => entry.date.toISOString() === packageDate),
  `extension ZIP entries must use the fixed ${packageDate} timestamp`,
);

console.log(`reproducible package: ${second.length} B and ${datedEntries.length} fixed-date files`);
