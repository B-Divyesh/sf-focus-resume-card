export const DEFAULT_RETRY_AFTER_SECONDS = 60;

/** Parse the standard Retry-After response header without treating an absent
 * or malformed header as a successful gateway rate-limit response. */
export function retryAfterSeconds(value: string | null, now = Date.now()): number {
  if (!value) return DEFAULT_RETRY_AFTER_SECONDS;
  const trimmed = value.trim();
  if (/^\d+$/u.test(trimmed)) return Math.max(1, Number.parseInt(trimmed, 10));
  const retryAt = Date.parse(trimmed);
  if (Number.isFinite(retryAt)) return Math.max(1, Math.ceil((retryAt - now) / 1000));
  return DEFAULT_RETRY_AFTER_SECONDS;
}

export function rateLimitMessage(seconds: number, keepCachedPlus = false): string {
  const availability = keepCachedPlus
    ? 'Plus remains available from your last valid check.'
    : 'Your free recovery features still work.';
  return `The license service is busy. Try again in ${seconds} second${seconds === 1 ? '' : 's'}. ${availability}`;
}
