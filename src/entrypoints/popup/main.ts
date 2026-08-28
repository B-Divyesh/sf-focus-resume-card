import './style.css';
import { createCard, formatDuration, safeHostname, validateNextAction, type ResumeCard } from '../../shared/model';
import { getCard, getPreferences, setCard, setPreferences } from '../../shared/storage';

const cardView = requireElement<HTMLElement>('card-view');
const captureView = requireElement<HTMLElement>('capture-view');
const loadingView = requireElement<HTMLElement>('loading-view');
const status = requireElement<HTMLElement>('status');
const offlineNote = requireElement<HTMLElement>('offline-note');
const dialog = requireElement<HTMLDialogElement>('confirm-dialog');
const confirmTitle = requireElement<HTMLElement>('confirm-title');
const confirmCopy = requireElement<HTMLElement>('confirm-copy');
const confirmAction = requireElement<HTMLButtonElement>('confirm-action');

let timerHandle: number | null = null;
let pendingConfirm: (() => Promise<void>) | null = null;

function requireElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element as T;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

function setStatus(message: string, kind: 'success' | 'error' | '' = '') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function showOnly(view: HTMLElement) {
  loadingView.hidden = view !== loadingView;
  cardView.hidden = view !== cardView;
  captureView.hidden = view !== captureView;
}

async function getActiveContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) throw new Error('Open a regular web page, then try again.');
  let selection = '';
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() ?? '',
    });
    selection = typeof result?.result === 'string' ? result.result.slice(0, 1200) : '';
  } catch {
    // Browser-internal pages cannot run scripts. The URL and title still work.
  }
  return { tab, selection };
}

async function compactScreenshot(dataUrl: string): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, 960 / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not prepare the screenshot.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

function openConfirmation(title: string, copy: string, actionLabel: string, action: () => Promise<void>) {
  confirmTitle.textContent = title;
  confirmCopy.textContent = copy;
  confirmAction.textContent = actionLabel;
  pendingConfirm = action;
  dialog.showModal();
}

dialog.addEventListener('close', () => {
  if (dialog.returnValue === 'confirm' && pendingConfirm) void pendingConfirm();
  pendingConfirm = null;
});

function renderCard(card: ResumeCard) {
  const date = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(card.createdAt);
  cardView.innerHTML = `
    <article class="resume-card">
      <div class="card-coordinate"><span>Saved card</span><span>${escapeHtml(date)}</span></div>
      <div class="route-heading">
        <span class="waypoint" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">Your next action</p>
          <h2>${escapeHtml(card.nextAction)}</h2>
        </div>
      </div>
      ${card.screenshot ? `<img class="screenshot" src="${card.screenshot}" width="960" height="540" alt="Saved view of ${escapeHtml(card.title ?? safeHostname(card.url))}" />` : ''}
      <dl class="context-list">
        <div><dt>Location</dt><dd>${card.title ? escapeHtml(card.title) : '<span class="redacted">Title hidden</span>'}<small>${escapeHtml(safeHostname(card.url))}</small></dd></div>
        ${card.selection ? `<div><dt>Carried note</dt><dd class="selection">“${escapeHtml(card.selection)}”</dd></div>` : ''}
        <div><dt>Focus block</dt><dd>${escapeHtml(formatDuration(card.elapsedSeconds))}</dd></div>
      </dl>
      <button class="button primary full" id="resume-button">Resume this page <span aria-hidden="true">→</span></button>
      <div class="secondary-actions">
        <button class="text-button" id="replace-button">Replace with this page</button>
        <button class="text-button danger-text" id="clear-button">Clear card</button>
      </div>
    </article>`;

  requireElement<HTMLButtonElement>('resume-button').addEventListener('click', async () => {
    try {
      const resumed = { ...card, resumedAt: Date.now() };
      await setCard(resumed);
      setStatus('Card resumed. Opening the saved page…', 'success');
      await chrome.tabs.create({ url: card.url });
      window.close();
    } catch {
      setStatus('The page could not be opened. Copy the address and try it in a tab.', 'error');
    }
  });
  requireElement<HTMLButtonElement>('replace-button').addEventListener('click', () => openConfirmation(
    'Replace the current card?',
    `“${card.nextAction}” will be removed before the new card is saved.`,
    'Replace card',
    async () => { await renderCapture(); },
  ));
  requireElement<HTMLButtonElement>('clear-button').addEventListener('click', () => openConfirmation(
    'Clear this saved card?',
    `“${card.nextAction}” and its local context will be removed.`,
    'Clear card',
    async () => {
      const cleared = card;
      await setCard(null);
      await renderCapture();
      setStatus('Card cleared.');
      const undo = document.createElement('button');
      undo.className = 'inline-undo';
      undo.textContent = 'Undo';
      undo.addEventListener('click', async () => { await setCard(cleared); renderCard(cleared); setStatus('Card restored.', 'success'); });
      status.append(' ', undo);
    },
  ));
  showOnly(cardView);
}

async function renderCapture() {
  showOnly(loadingView);
  try {
    const [{ tab, selection }, preferences] = await Promise.all([getActiveContext(), getPreferences()]);
    document.documentElement.dataset.theme = preferences.theme;
    const canCapture = /^https?:/u.test(tab.url ?? '');
    captureView.innerHTML = `
      <form id="capture-form" novalidate>
        <div class="capture-heading">
          <div>
            <p class="eyebrow">Save one card</p>
            <h2>Where should you restart?</h2>
          </div>
          <div class="timer" aria-label="Elapsed focus block"><span id="timer-value">${escapeHtml(formatDuration(preferences.focusStartedAt ? (Date.now() - preferences.focusStartedAt) / 1000 : 0))}</span></div>
        </div>
        <div class="field-block">
          <label for="next-action">Next physical action <span aria-hidden="true">*</span></label>
          <textarea id="next-action" name="nextAction" rows="3" required aria-describedby="action-help action-error" placeholder="Write failing test for empty response"></textarea>
          <div class="field-meta"><span id="action-help">Use 5–12 words. Start with a verb.</span><span id="word-count">0 / 12</span></div>
          <p class="field-error" id="action-error" role="alert"></p>
        </div>
        <fieldset>
          <legend>Context to carry</legend>
          <label class="check-row"><input id="keep-title" type="checkbox" checked /><span><strong>Page title</strong><small>${escapeHtml(tab.title || 'Untitled page')}</small></span></label>
          <label class="check-row" ${selection ? '' : 'data-disabled="true"'}><input id="keep-selection" type="checkbox" ${selection ? 'checked' : 'disabled'} /><span><strong>Selected text</strong><small>${selection ? escapeHtml(selection.slice(0, 100)) : 'No text selected on this page'}</small></span></label>
          <label class="check-row" ${canCapture ? '' : 'data-disabled="true"'}><input id="keep-screenshot" type="checkbox" ${canCapture ? '' : 'disabled'} /><span><strong>Visible screenshot</strong><small>Optional; compressed and stored locally</small></span></label>
        </fieldset>
        <div class="timer-controls">
          <button type="button" class="text-button" id="timer-button">${preferences.focusStartedAt ? 'Reset focus clock' : 'Start focus clock'}</button>
          <span>Optional elapsed context, never a score.</span>
        </div>
        <button class="button primary full" id="save-button" type="submit">Save resume card</button>
      </form>`;

    const form = requireElement<HTMLFormElement>('capture-form');
    const actionInput = requireElement<HTMLTextAreaElement>('next-action');
    const wordCount = requireElement<HTMLElement>('word-count');
    const actionError = requireElement<HTMLElement>('action-error');
    let startedAt = preferences.focusStartedAt;
    const updateTimer = () => {
      requireElement<HTMLElement>('timer-value').textContent = formatDuration(startedAt ? (Date.now() - startedAt) / 1000 : 0);
    };
    if (timerHandle) window.clearInterval(timerHandle);
    timerHandle = window.setInterval(updateTimer, 15_000);

    actionInput.addEventListener('input', () => {
      const words = actionInput.value.trim() ? actionInput.value.trim().split(/\s+/u).length : 0;
      wordCount.textContent = `${words} / 12`;
      actionError.textContent = '';
      actionInput.removeAttribute('aria-invalid');
    });
    requireElement<HTMLButtonElement>('timer-button').addEventListener('click', async (event) => {
      startedAt = Date.now();
      const updated = { ...preferences, focusStartedAt: startedAt };
      await setPreferences(updated);
      (event.currentTarget as HTMLButtonElement).textContent = 'Reset focus clock';
      updateTimer();
      setStatus('Focus clock started. It stays only on this device.', 'success');
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const error = validateNextAction(actionInput.value);
      if (error) {
        actionError.textContent = error;
        actionInput.setAttribute('aria-invalid', 'true');
        actionInput.focus();
        return;
      }
      const saveButton = requireElement<HTMLButtonElement>('save-button');
      saveButton.disabled = true;
      saveButton.textContent = 'Saving card…';
      setStatus('');
      try {
        let screenshot: string | null = null;
        if (requireElement<HTMLInputElement>('keep-screenshot').checked) {
          screenshot = await compactScreenshot(await chrome.tabs.captureVisibleTab({ format: 'jpeg', quality: 78 }));
        }
        const card = createCard({
          url: tab.url!,
          title: requireElement<HTMLInputElement>('keep-title').checked ? (tab.title || safeHostname(tab.url!)) : null,
          selection: requireElement<HTMLInputElement>('keep-selection').checked ? selection : null,
          screenshot,
          elapsedSeconds: Math.round(startedAt ? (Date.now() - startedAt) / 1000 : 0),
          nextAction: actionInput.value.trim(),
        });
        await setCard(card);
        await setPreferences({ ...preferences, focusStartedAt: null });
        renderCard(card);
        setStatus('Resume card saved locally.', 'success');
      } catch (error) {
        saveButton.disabled = false;
        saveButton.textContent = 'Save resume card';
        setStatus(error instanceof Error ? error.message : 'The card could not be saved. Try without a screenshot.', 'error');
      }
    });
    showOnly(captureView);
    actionInput.focus();
  } catch (error) {
    captureView.innerHTML = `<div class="error-state"><span class="waypoint" aria-hidden="true"></span><h2>This page cannot be saved</h2><p>${escapeHtml(error instanceof Error ? error.message : 'Open a regular browser tab and try again.')}</p><button class="button secondary" id="retry-button">Try again</button></div>`;
    showOnly(captureView);
    requireElement<HTMLButtonElement>('retry-button').addEventListener('click', () => void renderCapture());
  }
}

async function initialize() {
  offlineNote.hidden = navigator.onLine;
  window.addEventListener('online', () => { offlineNote.hidden = true; });
  window.addEventListener('offline', () => { offlineNote.hidden = false; });
  requireElement<HTMLButtonElement>('settings-button').addEventListener('click', () => void chrome.runtime.openOptionsPage());
  const [card, preferences] = await Promise.all([getCard(), getPreferences()]);
  document.documentElement.dataset.theme = preferences.theme;
  if (card) renderCard(card);
  else await renderCapture();
}

void initialize().catch(() => {
  captureView.innerHTML = '<div class="error-state"><h2>Your local card could not be read</h2><p>Reload the extension. Your browsing data has not been sent anywhere.</p></div>';
  showOnly(captureView);
});
