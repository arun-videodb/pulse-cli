/**
 * Parse user-friendly date strings into ISO 8601 UTC.
 *
 * Supported formats:
 *   "tomorrow 10am"         → tomorrow at 10:00 IST
 *   "tomorrow 2:30pm"       → tomorrow at 14:30 IST
 *   "today 5pm"             → today at 17:00 IST
 *   "Mar 10 10am"           → March 10 at 10:00 IST
 *   "March 10 2:30pm"       → March 10 at 14:30 IST
 *   "2026-03-10 10:00"      → March 10 at 10:00 IST
 *   "2026-03-10 2:30pm"     → March 10 at 14:30 IST
 *   "10 Mar 10am"           → March 10 at 10:00 IST
 *   "2026-03-10T10:00:00Z"  → passed through as-is (already ISO)
 *
 * All times are assumed IST (UTC+5:30) unless the string contains Z, UTC, or +/-.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +5:30

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  // "10am", "2:30pm", "14:00", "2pm", "10:00am"
  const match = timeStr
    .toLowerCase()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function istToUtc(date: Date): Date {
  return new Date(date.getTime() - IST_OFFSET_MS);
}

function hasExplicitTimezone(input: string): boolean {
  return /[Zz]$/.test(input.trim()) || /UTC/i.test(input) || /[+-]\d{2}:\d{2}/.test(input);
}

export function parseDate(input: string): string | null {
  const trimmed = input.trim();

  // Already ISO 8601 with timezone — pass through
  if (hasExplicitTimezone(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  // "YYYY-MM-DD HH:MM" or "YYYY-MM-DD H:MMam/pm"
  const isoLike = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})\s+(.+)$/
  );
  if (isoLike) {
    const datePart = isoLike[1];
    const time = parseTime(isoLike[2]);
    if (!time) return null;
    const d = new Date(`${datePart}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    d.setHours(time.hours, time.minutes, 0, 0);
    return istToUtc(d).toISOString();
  }

  // "YYYY-MM-DDTHH:MM:SS" (no timezone) — treat as IST
  const isoNoTz = trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (isoNoTz) {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    return istToUtc(d).toISOString();
  }

  const lower = trimmed.toLowerCase();
  const now = new Date();

  // "today <time>" or "tomorrow <time>"
  const relMatch = lower.match(/^(today|tomorrow)\s+(.+)$/);
  if (relMatch) {
    const time = parseTime(relMatch[2]);
    if (!time) return null;
    const d = new Date(now);
    if (relMatch[1] === "tomorrow") d.setDate(d.getDate() + 1);
    d.setHours(time.hours, time.minutes, 0, 0);
    return istToUtc(d).toISOString();
  }

  // "Mar 10 10am", "March 10 2:30pm"
  const monthFirst = lower.match(
    /^([a-z]+)\s+(\d{1,2})\s+(.+)$/
  );
  if (monthFirst && MONTH_MAP[monthFirst[1]] !== undefined) {
    const time = parseTime(monthFirst[3]);
    if (!time) return null;
    const month = MONTH_MAP[monthFirst[1]];
    const day = parseInt(monthFirst[2], 10);
    let year = now.getFullYear();
    const d = new Date(year, month, day, time.hours, time.minutes, 0, 0);
    // If the date is in the past, assume next year
    if (d < now) {
      year++;
      d.setFullYear(year);
    }
    return istToUtc(d).toISOString();
  }

  // "10 Mar 10am", "10 March 2:30pm"
  const dayFirst = lower.match(
    /^(\d{1,2})\s+([a-z]+)\s+(.+)$/
  );
  if (dayFirst && MONTH_MAP[dayFirst[2]] !== undefined) {
    const time = parseTime(dayFirst[3]);
    if (!time) return null;
    const month = MONTH_MAP[dayFirst[2]];
    const day = parseInt(dayFirst[1], 10);
    let year = now.getFullYear();
    const d = new Date(year, month, day, time.hours, time.minutes, 0, 0);
    if (d < now) {
      year++;
      d.setFullYear(year);
    }
    return istToUtc(d).toISOString();
  }

  // Fallback: try native Date parsing, treat as IST if no timezone
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return hasExplicitTimezone(trimmed)
      ? fallback.toISOString()
      : istToUtc(fallback).toISOString();
  }

  return null;
}

/** Format a UTC ISO string as a readable IST string for display */
export function formatDateIST(isoUtc: string): string {
  const d = new Date(new Date(isoUtc).getTime() + IST_OFFSET_MS);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm} IST`;
}
