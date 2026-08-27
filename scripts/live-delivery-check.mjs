import JSZip from 'jszip';

const site = (process.env.LIVE_URL ?? 'https://focus-resume-card.sociobot.in').replace(/\/$/u, '');
const apiBase = (process.env.API_BASE ?? 'https://api.sociobot.in/api/v1').replace(/\/$/u, '');
const product = process.env.PRODUCT_SLUG ?? 'focus-resume-card';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

const [home, download, missingDownload, checkout] = await Promise.all([
  fetch(`${site}/`),
  fetch(`${site}/downloads/focus-resume-card.zip`),
  fetch(`${site}/downloads/not-present.zip`, { redirect: 'manual' }),
  fetch(`${apiBase}/products/${product}/checkout`, { redirect: 'manual' }),
]);

const zip = Buffer.from(await download.arrayBuffer());
const homeHtml = await home.text();
const hashedAsset = homeHtml.match(/\/assets\/[^"']+\.(?:js|css)/u)?.[0];
const csp = home.headers.get('content-security-policy') ?? '';
const permissions = home.headers.get('permissions-policy') ?? '';
const cacheControl = download.headers.get('cache-control') ?? '';

requireCondition(home.ok, `homepage returned ${home.status}`);
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
requireCondition(csp.includes("default-src 'self'"), 'CSP header is missing or incomplete');
requireCondition(permissions.includes('camera=()'), 'Permissions-Policy header is missing or incomplete');
requireCondition(!/max-age=30/u.test(cacheControl), 'download inherited the prior 30-second cache policy');
requireCondition(/max-age=31536000/u.test(asset.headers.get('cache-control') ?? '') && /immutable/u.test(asset.headers.get('cache-control') ?? ''), 'hashed asset does not have immutable caching');
requireCondition(checkout.status >= 300 && checkout.status < 400, `live checkout returned ${checkout.status}`);
requireCondition((checkout.headers.get('location') ?? '').startsWith('https://checkout.dodopayments.com/'), 'live checkout did not redirect to Dodo');

console.log(`live delivery: installable MV3 ZIP ${zip.length} B, missing download 404, checkout ${checkout.status}`);
