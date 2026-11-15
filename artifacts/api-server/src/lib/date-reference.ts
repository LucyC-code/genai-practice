export const CAMPUS_ZONE = "America/Indiana/Indianapolis";
const dateFormat = new Intl.DateTimeFormat("en-CA", { timeZone: CAMPUS_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
export const campusDate = (instant: Date) => dateFormat.format(instant);
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export const readableDate = (date: string) => new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC", year: "numeric", month: "long", day: "numeric",
}).format(new Date(`${date}T12:00:00Z`));
const localStamp = (instant: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: CAMPUS_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant).map(v => [v.type, v.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};

export function dateReference(original?: string, now = new Date()) {
  let instant = now;
  let ambiguous = false;
  if (original) {
    if (!isCalendarDate(original.slice(0, 10))) throw new Error("Invalid original post calendar date.");
    if (/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(original)) {
      // Enumerate the possible Eastern offsets, checking against the IANA zone.
      // This rejects spring gaps and identifies both occurrences of a fall fold.
      const candidates = [0, 1, 2, 3, 4, 5, 6].map(hours =>
        new Date(Date.parse(`${original}:00Z`) + hours * 3600000),
      ).filter(d => !Number.isNaN(d.getTime()) && localStamp(d) === original);
      if (!candidates.length) throw new Error("Original post time is invalid or does not exist during the daylight-saving change. Choose a valid campus time.");
      instant = candidates[0];
      ambiguous = candidates.length > 1;
    } else {
      if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(original)) {
        throw new Error("Use a campus date and time, or an ISO timestamp with a timezone offset.");
      }
      instant = new Date(original);
      if (Number.isNaN(instant.getTime())) throw new Error("Invalid original post timestamp.");
    }
  }
  return {
    instant, date: campusDate(instant),
    note: `Reference: ${original ? "original post time" : "submission time"} — ${new Intl.DateTimeFormat("en-US", {
      timeZone: CAMPUS_ZONE, dateStyle: "full", timeStyle: "long",
    }).format(instant)} (${CAMPUS_ZONE}; ${instant.toISOString()}).${ambiguous ? " Ambiguous fall-back time: used the earlier occurrence; verify or supply an offset-aware timestamp." : ""}`,
  };
}

export const RELATIVE_DATES = /\b(day after tomorrow|tomorrow|today|tonight|(?:this|next)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b/gi;
export function relativeDate(phrase: string, reference: string) {
  const text = phrase.toLowerCase().replace(/\s+/g, " ");
  if (text === "tomorrow") return addDays(reference, 1);
  if (text === "day after tomorrow") return addDays(reference, 2);
  if (text === "today" || text === "tonight") return reference;
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const [which, weekday] = text.split(" ");
  const delta = (weekdays.indexOf(weekday) - new Date(`${reference}T12:00:00Z`).getUTCDay() + 7) % 7;
  return addDays(reference, delta + (which === "next" ? 7 : 0));
}
export function absoluteSummary(summary: string, date: string | null) {
  if (!date) return summary;
  const absolute = readableDate(date);
  const cleaned = summary.replace(RELATIVE_DATES, absolute).trim();
  return (cleaned.includes(absolute) ? cleaned : `${cleaned} Date: ${absolute}.`).slice(0, 2000);
}

// A date/time fragment contains useful scheduling facts, but no event identity.
// Produce an explicitly incomplete draft, never a made-up activity.
export function partialTimeDraft(text: string, reference: string) {
  const match = text.trim().match(/^(day after tomorrow|tomorrow|today|tonight|(?:this|next)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)[.!]?$/i);
  if (!match || Number(match[2]) < 1 || Number(match[2]) > 12 || Number(match[3] ?? "00") > 59) return null;
  const hour = Number(match[2]) % 12 + (match[4].toLowerCase() === "pm" ? 12 : 0);
  return { eventDate: relativeDate(match[1], reference), startTime: `${String(hour).padStart(2, "0")}:${match[3] ?? "00"}` };
}

export function normalizedDateWarnings(notes: string[], phrases: string[], reference: string) {
  if (!phrases.length) return notes;
  // Model warnings are also generative: they can contradict a correct date field.
  // Date-resolution statements come from the deterministic resolver instead.
  return [
    ...notes.filter(note => !/\b(resolv\w*|interpret\w*|relative|reference|today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\d{4}-\d{2}-\d{2}/i.test(note)),
    ...[...new Set(phrases.map(p => p.toLowerCase()))].map(phrase =>
      `“${phrase}” resolves to ${readableDate(relativeDate(phrase, reference))} using the displayed original/submission reference and documented weekday rule. Verify against the source.`),
  ];
}
