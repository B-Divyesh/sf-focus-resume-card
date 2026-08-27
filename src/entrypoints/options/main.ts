import './style.css';
import { CARD_KEY, DEFAULT_PREFERENCES, LICENSE_CACHE_KEY, LICENSE_KEY, PREFS_KEY, isLicenseFresh, type LicenseCache, type Theme } from '../../shared/model';
import { getPreferences, setPreferences } from '../../shared/storage';

const API_BASE = 'https://api.sociobot.in/api/v1';
const PRODUCT_SLUG = 'focus-resume-card';
const licenseState = getElement<HTMLElement>('license-state');
const licenseError = getElement<HTMLElement>('license-error');
const saveStatus = getElement<HTMLElement>('save-status');
const badgeInput = getElement<HTMLInputElement>('quiet-badge');
let unlocked = false;

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing #${id}`);
  return element as T;
}

function readCache(): LicenseCache | null {
  try { return JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) ?? 'null') as LicenseCache | null; }
  catch { return null; }
}

function applyUnlockedState(value: boolean, message: string) {
  unlocked = value;
  licenseState.textContent = message;
  licenseState.dataset.valid = String(value);
  document.querySelectorAll<HTMLInputElement>('[data-plus] input').forEach((input) => { input.disabled = !value; });
}

async function lockPaidPreferences() {
  const preferences = await getPreferences();
  if (preferences.theme !== 'field' || preferences.quietBadge) {
    await setPreferences({ ...preferences, theme: 'field', quietBadge: false });
    document.documentElement.dataset.theme = 'field';
    getElement<HTMLInputElement>('quiet-badge').checked = false;
    getElement<HTMLInputElement>('theme-fieldset').querySelector<HTMLInputElement>('[value="field"]')!.checked = true;
  }
}

async function verifyLicense(token: string, force = false) {
  const cache = readCache();
  if (!force && cache?.token === token && Date.now() - cache.checkedAt < 86_400_000) {
    if (isLicenseFresh(cache)) applyUnlockedState(true, 'Plus is active on this device.');
    else applyUnlockedState(false, 'License no longer active. Free resume cards still work.');
    return;
  }
  if (!navigator.onLine && cache?.token === token && cache.valid) {
    applyUnlockedState(true, 'Offline — using the last valid license check.');
    return;
  }
  licenseState.textContent = 'Verifying license…';
  try {
    const response = await fetch(`${API_BASE}/products/${PRODUCT_SLUG}/verify?license=${encodeURIComponent(token)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Verification service unavailable.');
    const result = await response.json() as { valid: boolean; reason?: string };
    const nextCache: LicenseCache = { token, valid: result.valid, checkedAt: Date.now(), reason: result.reason };
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(nextCache));
    if (result.valid) applyUnlockedState(true, 'Plus is active on this device.');
    else {
      applyUnlockedState(false, 'License no longer active. Free resume cards still work.');
      await lockPaidPreferences();
    }
  } catch {
    if (cache?.token === token && cache.valid) applyUnlockedState(true, 'Could not re-check while offline. Plus remains available from the last valid check.');
    else applyUnlockedState(false, 'Could not verify right now. Your free resume card still works.');
  }
}

async function initialize() {
  const returnedLicense = new URLSearchParams(location.search).get('license');
  if (returnedLicense) {
    localStorage.setItem(LICENSE_KEY, returnedLicense);
    history.replaceState({}, '', location.pathname);
  }
  const preferences = await getPreferences();
  document.documentElement.dataset.theme = preferences.theme;
  document.querySelector<HTMLInputElement>(`input[name="theme"][value="${preferences.theme}"]`)!.checked = true;
  badgeInput.checked = preferences.quietBadge;
  const token = localStorage.getItem(LICENSE_KEY);
  const cache = readCache();
  if (token && cache?.token === token && cache.valid) applyUnlockedState(true, 'Plus is active on this device.');
  else applyUnlockedState(false, 'Free edition active.');
  if (token) void verifyLicense(token);

  document.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((radio) => radio.addEventListener('change', async () => {
    const theme = radio.value as Theme;
    if (theme !== 'field' && !unlocked) return;
    const current = await getPreferences();
    await setPreferences({ ...current, theme });
    document.documentElement.dataset.theme = theme;
    saveStatus.textContent = 'Appearance saved.';
  }));
  badgeInput.addEventListener('change', async () => {
    if (!unlocked) return;
    const current = await getPreferences();
    await setPreferences({ ...current, quietBadge: badgeInput.checked });
    saveStatus.textContent = badgeInput.checked ? 'Quiet toolbar marker enabled.' : 'Quiet toolbar marker off.';
  });
  getElement<HTMLFormElement>('restore-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = getElement<HTMLInputElement>('license-input');
    const tokenValue = input.value.trim();
    if (tokenValue.length < 10) { licenseError.textContent = 'Paste the complete license token from your receipt.'; input.focus(); return; }
    licenseError.textContent = '';
    localStorage.setItem(LICENSE_KEY, tokenValue);
    await verifyLicense(tokenValue, true);
  });
  getElement<HTMLButtonElement>('clear-local').addEventListener('click', async () => {
    if (!confirm('Clear the active resume card and all preferences from this browser?')) return;
    await chrome.storage.local.remove([CARD_KEY, PREFS_KEY]);
    localStorage.removeItem(LICENSE_KEY);
    localStorage.removeItem(LICENSE_CACHE_KEY);
    await chrome.storage.local.set({ [PREFS_KEY]: DEFAULT_PREFERENCES });
    location.reload();
  });
}

void initialize();
