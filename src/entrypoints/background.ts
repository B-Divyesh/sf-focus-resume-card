import { CARD_KEY, PREFS_KEY, type Preferences, type ResumeCard } from '../shared/model';

export default defineBackground(() => {
  async function updateBadge() {
    const stored = await chrome.storage.local.get([CARD_KEY, PREFS_KEY]);
    const card = stored[CARD_KEY] as ResumeCard | undefined;
    const preferences = stored[PREFS_KEY] as Preferences | undefined;
    const visible = Boolean(card && preferences?.quietBadge);
    await chrome.action.setBadgeBackgroundColor({ color: '#B84A32' });
    await chrome.action.setBadgeText({ text: visible ? '•' : '' });
    await chrome.action.setTitle({ title: card ? `Resume: ${card.nextAction}` : 'Create a focus resume card' });
  }

  chrome.runtime.onInstalled.addListener(() => void updateBadge());
  chrome.runtime.onStartup.addListener(() => void updateBadge());
  chrome.storage.onChanged.addListener(() => void updateBadge());
  void updateBadge();
});
