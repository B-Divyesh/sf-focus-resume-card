const API_BASE = 'https://api.sociobot.in/api/v1';
const PRODUCT_SLUG = 'focus-resume-card';
const LICENSE_KEY = `sb_license:${PRODUCT_SLUG}`;
const CACHE_KEY = `sb_license_cache:${PRODUCT_SLUG}`;

type LicenseResult = { valid: boolean; reason?: string; expires_at?: string | null };

const restoreToggle = document.querySelector<HTMLButtonElement>('#restore-toggle');
const restoreForm = document.querySelector<HTMLFormElement>('#restore-form');
const licenseInput = document.querySelector<HTMLInputElement>('#license-input');
const licenseMessage = document.querySelector<HTMLElement>('#license-message');
const offlineToast = document.querySelector<HTMLElement>('#offline-toast');

function setLicenseMessage(message: string, valid = false) {
  if (!licenseMessage) return;
  licenseMessage.textContent = message;
  licenseMessage.dataset.valid = String(valid);
}

async function verifyLicense(token: string, force = false) {
  let cache: { token: string; valid: boolean; checkedAt: number } | null = null;
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null'); } catch { /* ignore malformed local data */ }
  if (!force && cache?.token === token && Date.now() - cache.checkedAt < 86_400_000) {
    if (cache.valid) setLicenseMessage('Plus license active. Paste this same token into the extension settings.', true);
    else setLicenseMessage('License no longer active. You can keep using every free recovery feature.');
    return;
  }
  setLicenseMessage('Verifying license…');
  try {
    const response = await fetch(`${API_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('unavailable');
    const result = await response.json() as LicenseResult;
    localStorage.setItem(CACHE_KEY, JSON.stringify({ token, valid: result.valid, checkedAt: Date.now(), reason: result.reason }));
    if (result.valid) setLicenseMessage('Plus license active. Paste this same token into the extension settings.', true);
    else setLicenseMessage('License no longer active. You can keep using every free recovery feature.');
  } catch {
    if (cache?.token === token && cache.valid) setLicenseMessage('Offline. Your last valid Plus check is still remembered.', true);
    else setLicenseMessage('Could not verify right now. Check your connection and try again.');
  }
}

restoreToggle?.addEventListener('click', () => {
  const expanded = restoreToggle.getAttribute('aria-expanded') === 'true';
  restoreToggle.setAttribute('aria-expanded', String(!expanded));
  if (restoreForm) restoreForm.hidden = expanded;
  if (!expanded) licenseInput?.focus();
});

restoreForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const token = licenseInput?.value.trim() ?? '';
  if (token.length < 10) { setLicenseMessage('Paste the complete token from your receipt.'); licenseInput?.focus(); return; }
  localStorage.setItem(LICENSE_KEY, token);
  void verifyLicense(token, true);
});

const returnedToken = new URLSearchParams(location.search).get('license');
if (returnedToken) {
  localStorage.setItem(LICENSE_KEY, returnedToken);
  history.replaceState({}, '', `${location.pathname}${location.hash}`);
  if (restoreToggle && restoreForm && licenseInput) {
    restoreToggle.setAttribute('aria-expanded', 'true');
    restoreForm.hidden = false;
    licenseInput.value = returnedToken;
    setLicenseMessage('Purchase received. Copy this token into the extension settings, then verify it.', true);
  }
  void verifyLicense(returnedToken, true);
} else {
  const savedToken = localStorage.getItem(LICENSE_KEY);
  if (savedToken && licenseInput) { licenseInput.value = savedToken; void verifyLicense(savedToken); }
}

function updateOnlineState() { if (offlineToast) offlineToast.hidden = navigator.onLine; }
window.addEventListener('online', updateOnlineState);
window.addEventListener('offline', updateOnlineState);
updateOnlineState();
