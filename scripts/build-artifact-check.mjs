import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';

const root = resolve('dist/site');
const zipPath = resolve(root, 'downloads/focus-resume-card.zip');
const configPath = resolve(root, 'staticwebapp.config.json');

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const zip = await readFile(zipPath);
const config = JSON.parse(await readFile(configPath, 'utf8'));
const zipStat = await stat(zipPath);
const archive = await JSZip.loadAsync(zip);

requireCondition(zipStat.size > 1000, 'extension ZIP is unexpectedly small');
requireCondition(zip.subarray(0, 4).equals(Buffer.from('PK\x03\x04')), 'extension download is not a ZIP file');
requireCondition(Object.values(archive.files).filter((entry) => !entry.dir).every((entry) => entry.date.toISOString() === '1980-01-01T00:00:00.000Z'), 'extension ZIP entries must have fixed timestamps');
requireCondition(config.navigationFallback === undefined, 'static documents must use real 404 responses, not an SPA fallback');
requireCondition(config.routes?.some((route) => route.route === '/downloads/focus-resume-card.zip' && route.headers?.['Content-Type'] === 'application/zip'), 'download route must declare application/zip');
requireCondition(config.routes?.some((route) => route.route === '/assets/*' && /immutable/.test(route.headers?.['Cache-Control'] ?? '')), 'hashed assets must have immutable caching');
requireCondition(typeof config.globalHeaders?.['Content-Security-Policy'] === 'string', 'CSP header is required');
requireCondition(typeof config.globalHeaders?.['Permissions-Policy'] === 'string', 'Permissions-Policy header is required');

console.log(`artifact: ZIP ${zipStat.size} B; Azure routes and security headers verified`);
if (process.argv.join(' ').includes('@claim:download-package')) console.log('@claim:download-package pass');
