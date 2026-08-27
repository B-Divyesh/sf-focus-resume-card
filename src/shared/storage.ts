import { CARD_KEY, DEFAULT_PREFERENCES, PREFS_KEY, type Preferences, type ResumeCard } from './model';

export async function getCard(): Promise<ResumeCard | null> {
  const result = await chrome.storage.local.get(CARD_KEY);
  return (result[CARD_KEY] as ResumeCard | undefined) ?? null;
}

export async function setCard(card: ResumeCard | null): Promise<void> {
  if (card) await chrome.storage.local.set({ [CARD_KEY]: card });
  else await chrome.storage.local.remove(CARD_KEY);
}

export async function getPreferences(): Promise<Preferences> {
  const result = await chrome.storage.local.get(PREFS_KEY);
  return { ...DEFAULT_PREFERENCES, ...(result[PREFS_KEY] as Partial<Preferences> | undefined) };
}

export async function setPreferences(preferences: Preferences): Promise<void> {
  await chrome.storage.local.set({ [PREFS_KEY]: preferences });
}
