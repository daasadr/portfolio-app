// Calendar-day helpers in the pupils' timezone. Safe for both server and client.

const PRAGUE_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague' }); // → YYYY-MM-DD

/** Today's date (YYYY-MM-DD) in Europe/Prague. */
export function pragueToday(): string {
  return PRAGUE_DAY.format(new Date());
}

/**
 * Normalises a date value from Directus to a Prague calendar day (YYYY-MM-DD).
 * Directus may return a plain date ("2026-10-12"), a datetime without zone
 * ("2026-10-12T00:00:00") or a UTC timestamp ("2026-10-11T22:00:00.000Z") —
 * taking the first 10 characters of the last one gives the wrong day.
 */
export function toPragueDate(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : PRAGUE_DAY.format(d);
  }
  return value.slice(0, 10);
}

/** The calendar day before `isoDate` (YYYY-MM-DD). */
export function previousDay(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
