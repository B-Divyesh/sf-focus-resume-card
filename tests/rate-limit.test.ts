import { describe, expect, it } from 'vitest';
import { DEFAULT_RETRY_AFTER_SECONDS, rateLimitMessage, retryAfterSeconds } from '../src/shared/rate-limit';

describe('gateway Retry-After handling', () => {
  it('uses a positive delta-seconds value from the real response header', () => {
    expect(retryAfterSeconds('17')).toBe(17);
    expect(retryAfterSeconds('0')).toBe(1);
  });

  it('accepts an HTTP-date and safely falls back for missing or malformed headers', () => {
    const now = Date.UTC(2026, 7, 28, 12, 0, 0);
    expect(retryAfterSeconds('Fri, 28 Aug 2026 12:00:09 GMT', now)).toBe(9);
    expect(retryAfterSeconds(null, now)).toBe(DEFAULT_RETRY_AFTER_SECONDS);
    expect(retryAfterSeconds('soon', now)).toBe(DEFAULT_RETRY_AFTER_SECONDS);
  });

  it('@claim:license-rate-limit keeps the rate-limited state honest about the free workflow', () => {
    expect(retryAfterSeconds('17')).toBe(17);
    expect(retryAfterSeconds(null)).toBe(DEFAULT_RETRY_AFTER_SECONDS);
    expect(rateLimitMessage(1)).toBe('The license service is busy. Try again in 1 second. Your free recovery features still work.');
    expect(rateLimitMessage(2, true)).toBe('The license service is busy. Try again in 2 seconds. Plus remains available from your last valid check.');
  });
});
