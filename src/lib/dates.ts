import { InputError } from "./format";

export function parseISODate(value: string, label = "date"): Date {
  if (!value) throw new InputError(`Enter a ${label}.`);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new InputError(`Enter a valid ${label}.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new InputError(`Enter a real calendar ${label}.`);
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", weekday: "long" }).format(date);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, last));
  return next;
}

export function addYears(date: Date, years: number): Date {
  return addMonths(date, years * 12);
}

export function daysBetween(a: Date, b: Date): number {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86_400_000);
}

export function ageParts(birth: Date, asOf: Date): { years: number; months: number; days: number; totalDays: number } {
  if (asOf < birth) throw new InputError("The as-of date is before the date of birth.");
  let years = asOf.getFullYear() - birth.getFullYear();
  let months = asOf.getMonth() - birth.getMonth();
  let days = asOf.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
    days += prev;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days, totalDays: daysBetween(birth, asOf) };
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function countWorkingDays(start: Date, end: Date, holidays: Date[] = [], inclusive = true): number {
  if (end < start) throw new InputError("The end date must be on or after the start date.");
  const holidaySet = new Set(holidays.map((d) => formatISODate(d)));
  let count = 0;
  const cursor = new Date(start);
  const last = new Date(end);
  if (!inclusive) last.setDate(last.getDate() - 1);
  while (cursor <= last) {
    if (!isWeekend(cursor) && !holidaySet.has(formatISODate(cursor))) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export const timeZones = [
  { id: "UTC", label: "UTC" },
  { id: "Pacific/Honolulu", label: "Honolulu (HT)" },
  { id: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { id: "America/Denver", label: "Denver (MT)" },
  { id: "America/Chicago", label: "Chicago (CT)" },
  { id: "America/New_York", label: "New York (ET)" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris, Berlin, Madrid" },
  { id: "Europe/Helsinki", label: "Helsinki, Athens" },
  { id: "Africa/Johannesburg", label: "Johannesburg" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Kolkata", label: "India (IST)" },
  { id: "Asia/Bangkok", label: "Bangkok, Jakarta" },
  { id: "Asia/Singapore", label: "Singapore, Hong Kong" },
  { id: "Asia/Tokyo", label: "Tokyo, Seoul" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Pacific/Auckland", label: "Auckland" },
] as const;

function timeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") map[part.type] = part.value;
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour) % 24, Number(map.minute), Number(map.second));
  return asUtc - date.getTime();
}

export function zonedWallTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new InputError("Enter a valid date and time.");
  }
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = timeZoneOffset(guess, timeZone);
  const utc = new Date(guess.getTime() - offset);
  const offset2 = timeZoneOffset(utc, timeZone);
  return new Date(guess.getTime() - offset2);
}

export function formatInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(date);
}

export function durationFromMs(ms: number): { days: number; hours: number; minutes: number; seconds: number; sign: number } {
  const sign = ms < 0 ? -1 : 1;
  let rest = Math.abs(ms);
  const days = Math.floor(rest / 86_400_000);
  rest -= days * 86_400_000;
  const hours = Math.floor(rest / 3_600_000);
  rest -= hours * 3_600_000;
  const minutes = Math.floor(rest / 60_000);
  rest -= minutes * 60_000;
  const seconds = Math.floor(rest / 1000);
  return { days, hours, minutes, seconds, sign };
}
