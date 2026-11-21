const MONTHS = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];
const WEEKDAYS = ["нд", "пн", "вт", "ср", "чт", "пт", "сб"];

export type DateRange = {
  start: string;
  end: string;
};

export function calendarParts(isoDate: string): { year: number; month: number; day: number; weekday: number } {
  const [year, month, day] = isoDate.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

export function todayInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(isoDate: string, days: number): string {
  const { year, month, day } = calendarParts(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function yesterday(timeZone: string): DateRange {
  const day = addDays(todayInTimeZone(timeZone), -1);
  return { start: day, end: day };
}

export function formatHeading(range: DateRange): string {
  const start = calendarParts(range.start);
  const end = calendarParts(range.end);
  if (range.start === range.end) {
    return `Jingle Plan · ${WEEKDAYS[start.weekday]}, ${start.day} ${MONTHS[start.month - 1]}.`;
  }
  if (start.year === end.year && start.month === end.month) {
    return `Jingle Plan · ${start.day}–${end.day} ${MONTHS[start.month - 1]}.`;
  }
  const startLabel = `${start.day} ${MONTHS[start.month - 1]}.`;
  const endLabel = `${end.day} ${MONTHS[end.month - 1]}.`;
  const year = start.year === end.year ? "" : ` ${end.year}`;
  return `Jingle Plan · ${startLabel} – ${endLabel}${year}`;
}

export function parseRange(input: string, timeZone: string): DateRange | null {
  const matches = input.match(/\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/g);
  if (!matches || matches.length < 2) return null;
  const start = parseDate(matches[0]);
  const end = parseDate(matches[1]);
  if (!start || !end || start > end) return null;
  const today = todayInTimeZone(timeZone);
  if (end > today) return null;
  if (daysBetween(start, end) > 92) return null;
  return { start, end };
}

function parseDate(value: string): string | null {
  const parts = value.split(/[./-]/).map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  let year: number;
  let month: number;
  let day: number;
  if (parts[0] > 31) {
    [year, month, day] = parts;
  } else {
    [day, month, year] = parts;
  }
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const from = calendarParts(start);
  const to = calendarParts(end);
  const a = Date.UTC(from.year, from.month - 1, from.day);
  const b = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((b - a) / 86_400_000);
}
