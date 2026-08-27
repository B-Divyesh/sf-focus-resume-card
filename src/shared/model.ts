export const CARD_KEY = 'focusResumeCard';
export const PREFS_KEY = 'focusResumePreferences';
export const LICENSE_KEY = 'sb_license:focus-resume-card';
export const LICENSE_CACHE_KEY = 'sb_license_cache:focus-resume-card';

export type Theme = 'field' | 'lichen' | 'night';

export interface ResumeCard {
  id: string;
  url: string;
  title: string | null;
  selection: string | null;
  screenshot: string | null;
  elapsedSeconds: number;
  nextAction: string;
  createdAt: number;
  resumedAt: number | null;
}

export interface Preferences {
  focusStartedAt: number | null;
  quietBadge: boolean;
  theme: Theme;
}

export interface LicenseCache {
  token: string;
  valid: boolean;
  checkedAt: number;
  reason?: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  focusStartedAt: null,
  quietBadge: false,
  theme: 'field',
};

export function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function validateNextAction(value: string): string | null {
  const count = countWords(value);
  if (count < 5) return `Add ${5 - count} more ${5 - count === 1 ? 'word' : 'words'}.`;
  if (count > 12) return `Remove ${count - 12} ${count - 12 === 1 ? 'word' : 'words'}.`;
  return null;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h ${remainder}m`;
}

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname || 'this page';
  } catch {
    return 'this page';
  }
}

export function isLicenseFresh(cache: LicenseCache | null, now = Date.now()): boolean {
  return Boolean(cache?.valid && now - cache.checkedAt < 86_400_000);
}

export function createCard(input: Omit<ResumeCard, 'id' | 'createdAt' | 'resumedAt'>, now = Date.now()): ResumeCard {
  return {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    resumedAt: null,
  };
}
