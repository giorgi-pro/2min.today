export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

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

export function formatDateLabel(now: Date, utc: boolean): string {
  const day = utc ? now.getUTCDay() : now.getDay();
  const date = utc ? now.getUTCDate() : now.getDate();
  const month = utc ? now.getUTCMonth() : now.getMonth();
  const year = utc ? now.getUTCFullYear() : now.getFullYear();
  return `${DAY_NAMES[day]} — ${date} ${MONTH_NAMES[month]} ${year}`;
}
