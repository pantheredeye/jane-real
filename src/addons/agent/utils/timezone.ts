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

// Convert a wall-clock date+time in the given IANA zone to a UTC Date.
// date: "YYYY-MM-DD", time: "HH:MM", timezone: IANA name (falls back to UTC on error).
export function zonedTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  let utcMs = Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0);

  let fmt: Intl.DateTimeFormat;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return new Date(utcMs);
  }

  // Two-pass correction handles DST transitions correctly.
  for (let i = 0; i < 2; i++) {
    const parts = fmt.formatToParts(new Date(utcMs));
    const p: Record<string, string> = {};
    for (const part of parts) p[part.type] = part.value;
    const wallMs = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour) % 24,
      Number(p.minute),
      Number(p.second),
    );
    const offsetMs = wallMs - utcMs;
    utcMs -= offsetMs;
  }
  return new Date(utcMs);
}
