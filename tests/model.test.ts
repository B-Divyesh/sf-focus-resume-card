import { describe, expect, it, vi } from 'vitest';
import { countWords, createCard, formatDuration, isLicenseFresh, safeHostname, validateNextAction } from '../src/shared/model';

describe('next-action boundary', () => {
  it('requires at least five words', () => {
    expect(countWords('write the failing test now')).toBe(5);
    expect(validateNextAction('write a failing test')).toBe('Add 1 more word.');
  });

  it('accepts five through twelve words and rejects more', () => {
    expect(validateNextAction('write the failing test for empty response')).toBeNull();
    expect(validateNextAction('one two three four five six seven eight nine ten eleven twelve')).toBeNull();
    expect(validateNextAction('one two three four five six seven eight nine ten eleven twelve thirteen')).toBe('Remove 1 word.');
  });
});

describe('card model', () => {
  it('creates a single timestamped, unresumed card', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'card-1' });
    const card = createCard({ url: 'https://example.com/work', title: null, selection: null, screenshot: null, elapsedSeconds: 90, nextAction: 'write the failing test for empty response' }, 1234);
    expect(card).toMatchObject({ id: 'card-1', createdAt: 1234, resumedAt: null, title: null });
    vi.unstubAllGlobals();
  });

  it('formats elapsed context without turning it into a score', () => {
    expect(formatDuration(0)).toBe('Less than 1 minute');
    expect(formatDuration(60)).toBe('1 minute');
    expect(formatDuration(3900)).toBe('1h 5m');
  });

  it('shows only a hostname for secondary location context', () => {
    expect(safeHostname('https://docs.example.com/private?q=secret')).toBe('docs.example.com');
    expect(safeHostname('not a URL')).toBe('this page');
  });
});

describe('license cache', () => {
  it('is optimistic for a valid verdict for at most one day', () => {
    const now = 200_000_000;
    expect(isLicenseFresh({ token: 'token', valid: true, checkedAt: now - 86_399_999 }, now)).toBe(true);
    expect(isLicenseFresh({ token: 'token', valid: true, checkedAt: now - 86_400_000 }, now)).toBe(false);
    expect(isLicenseFresh({ token: 'token', valid: false, checkedAt: now }, now)).toBe(false);
  });
});
