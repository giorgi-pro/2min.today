import { getCountryForTimezone } from 'countries-and-timezones';

export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

/**
 * The visitor's local timezone as a country name (e.g. "Georgia") instead of
 * the raw IANA zone id (e.g. "Asia/Tbilisi") — the continent prefix reads as
 * a bug to users. Falls back to the zone's city segment for the rare zones
 * with no single country (e.g. "Etc/UTC").
 */
export function getLocalTimezoneLabel(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const country = getCountryForTimezone(tz);
  if (country) return country.name;
  const city = tz.split('/').pop() ?? tz;
  return city.replace(/_/g, ' ');
}

export function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDisplayTime(time: string, utc: boolean): string {
  if (utc) return time;
  const parts = time.split(':').map(Number);
  const d = new Date();
  d.setUTCHours(parts[0] ?? 0, parts[1] ?? 0, 0, 0);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Formats an ISO timestamp as `DD.MM` — digits only, no month names. */
export function formatDigestRunDate(iso: string, utc: boolean): string {
  const d = new Date(iso);
  const day = utc ? d.getUTCDate() : d.getDate();
  const month = utc ? d.getUTCMonth() + 1 : d.getMonth() + 1;
  return `${padTime(day)}.${padTime(month)}`;
}

/** Formats an ISO timestamp as `HH:MM`, for the 7-segment display tiles. */
export function formatDigestRunClock(iso: string, utc: boolean): string {
  const d = new Date(iso);
  const hours = utc ? d.getUTCHours() : d.getHours();
  const minutes = utc ? d.getUTCMinutes() : d.getMinutes();
  return `${padTime(hours)}:${padTime(minutes)}`;
}

export function formatDateLabel(now: Date, utc: boolean): string {
  const day = utc ? now.getUTCDay() : now.getDay();
  const date = utc ? now.getUTCDate() : now.getDate();
  const month = utc ? now.getUTCMonth() : now.getMonth();
  const year = utc ? now.getUTCFullYear() : now.getFullYear();
  return `${DAY_NAMES[day]} — ${date} ${MONTH_NAMES[month]} ${year}`;
}
