import JSZip from 'jszip';
import { readdir, readFile } from 'node:fs/promises';

const site = (process.env.LIVE_URL ?? 'https://focus-resume-card.sociobot.in').replace(/\/$/u, '');
const apiBase = (process.env.API_BASE ?? 'https://api.sociobot.in/api/v1').replace(/\/$/u, '');
const product = process.env.PRODUCT_SLUG ?? 'focus-resume-card';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

async function listReleaseFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relativePath = `${prefix}${entry.name}`;
    return entry.isDirectory()
      ? listReleaseFiles(`${directory}/${entry.name}`, `${relativePath}/`)
      : [relativePath];
  }));
  return files.flat();
}

const [home, privacy, terms, download, missingDownload, missingDocument, checkout] = await Promise.all([
  fetch(`${site}/`),
  fetch(`${site}/privacy/`),
  fetch(`${site}/terms/`),
  fetch(`${site}/downloads/focus-resume-card.zip`),
  fetch(`${site}/downloads/not-present.zip`, { redirect: 'manual' }),
  fetch(`${site}/definitely-missing-page`, { redirect: 'manual' }),
  fetch(`${apiBase}/products/${product}/checkout`, { redirect: 'manual' }),
]);

const zip = Buffer.from(await download.arrayBuffer());
const homeBytes = Buffer.from(await home.arrayBuffer());
const homeHtml = homeBytes.toString('utf8');
const hashedAsset = homeHtml.match(/\/assets\/[^"']+\.(?:js|css)/u)?.[0];
const csp = home.headers.get('content-security-policy') ?? '';
const permissions = home.headers.get('permissions-policy') ?? '';
const cacheControl = download.headers.get('cache-control') ?? '';

requireCondition(home.ok, `homepage returned ${home.status}`);
requireCondition(privacy.ok, `privacy page returned ${privacy.status}`);
requireCondition(terms.ok, `terms page returned ${terms.status}`);
requireCondition(Boolean(hashedAsset), 'homepage did not reference a hashed asset');
const asset = await fetch(`${site}${hashedAsset}`);
requireCondition(download.ok, `extension download returned ${download.status}`);
requireCondition(/application\/zip|application\/x-zip-compressed/u.test(download.headers.get('content-type') ?? ''), `extension download MIME is ${download.headers.get('content-type')}`);
requireCondition(zip.subarray(0, 4).equals(Buffer.from('PK\x03\x04')), 'extension download did not contain ZIP bytes');
requireCondition(zip.length > 1000, `extension download is unexpectedly small (${zip.length} B)`);
requireCondition(/attachment/u.test(download.headers.get('content-disposition') ?? ''), 'extension download must be served as an attachment');
const archive = await JSZip.loadAsync(zip);
const manifest = archive.file('manifest.json');
requireCondition(Boolean(manifest), 'extension download is missing manifest.json');
const manifestJson = JSON.parse(await manifest.async('text'));
requireCondition(manifestJson.manifest_version === 3, 'extension download is not an MV3 package');
for (const requiredFile of ['popup.html', 'options.html', 'background.js']) {
  requireCondition(Boolean(archive.file(requiredFile)), `extension download is missing ${requiredFile}`);
}
requireCondition(missingDownload.status === 404, `missing download must be 404, received ${missingDownload.status}`);
requireCondition(missingDocument.status === 404, `missing document must be 404, received ${missingDocument.status}`);
requireCondition(csp.includes("default-src 'self'"), 'CSP header is missing or incomplete');
requireCondition(permissions.includes('camera=()'), 'Permissions-Policy header is missing or incomplete');
requireCondition(!permissions.includes('web-share=()'), 'Permissions-Policy contains unsupported web-share directive');
requireCondition(home.headers.get('x-content-type-options') === 'nosniff', 'X-Content-Type-Options is missing or incorrect');
requireCondition(home.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Referrer-Policy is missing or incorrect');
requireCondition(Boolean(home.headers.get('strict-transport-security')), 'HSTS is missing');
requireCondition(/max-age=0/u.test(home.headers.get('cache-control') ?? ''), 'HTML must revalidate');
requireCondition(!/max-age=30/u.test(cacheControl), 'download inherited the prior 30-second cache policy');
requireCondition(/max-age=31536000/u.test(asset.headers.get('cache-control') ?? '') && /immutable/u.test(asset.headers.get('cache-control') ?? ''), 'hashed asset does not have immutable caching');
requireCondition(checkout.status >= 300 && checkout.status < 400, `live checkout returned ${checkout.status}`);
requireCondition((checkout.headers.get('location') ?? '').startsWith('https://checkout.dodopayments.com/'), 'live checkout did not redirect to Dodo');

const releaseFiles = (await listReleaseFiles('dist/site')).filter((path) => path !== 'staticwebapp.config.json');
for (const path of releaseFiles) {
  const localBytes = await readFile(`dist/site/${path}`);
  const route = path === 'index.html' ? '/' : path.endsWith('/index.html') ? `/${path.slice(0, -'index.html'.length)}` : `/${path}`;
  const response = await fetch(`${site}${route}`);
  requireCondition(response.ok, `live ${path} returned ${response.status}`);
  const liveBytes = Buffer.from(await response.arrayBuffer());
  requireCondition(localBytes.equals(liveBytes), `live ${path} does not exactly match the built release`);
}

console.log(`live delivery: ${releaseFiles.length} files exactly match, real document/download 404s, MV3 ZIP ${zip.length} B, checkout ${checkout.status}`);
