// IANA timezone names (Area/Location, optionally with sub-location).
// Matches "UTC", "America/New_York", "America/Indiana/Indianapolis", "Etc/GMT+3".
export const TIMEZONE_REGEX =
  /^[A-Za-z][A-Za-z0-9+_-]*(?:\/[A-Za-z][A-Za-z0-9+_-]*){0,2}$/;

export function isValidTimezone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0) return false;
  return TIMEZONE_REGEX.test(tz);
}

export function detectTimezone(): string | null {
  if (typeof Intl === "undefined") return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return isValidTimezone(tz) ? tz : null;
  } catch {
    return null;
  }
}
