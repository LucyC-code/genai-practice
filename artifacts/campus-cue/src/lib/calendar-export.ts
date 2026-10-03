import type { Event } from "@workspace/api-client-react";

export const CAMPUS_TIMEZONE = "America/Indiana/Indianapolis";
type CalendarEvent = Pick<Event, "id" | "title" | "summary" | "eventDate" | "startTime" | "endTime" | "location" | "hostOrganization" | "sourceUrl" | "classYears">;

export function nextCalendarDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function calendarDates(event: CalendarEvent) {
  if (!event.eventDate) throw new Error("A confirmed date is needed to add this event to a calendar.");
  const date = event.eventDate.replaceAll("-", "");
  if (!event.startTime) {
    return { start: date, end: nextCalendarDate(event.eventDate).replaceAll("-", ""), timed: false };
  }
  const start = `${date}T${event.startTime.replace(":", "")}00`;
  const endDate = event.endTime && event.endTime < event.startTime
    ? nextCalendarDate(event.eventDate).replaceAll("-", "") : date;
  return {
    start,
    end: event.endTime ? `${endDate}T${event.endTime.replace(":", "")}00` : null,
    timed: true,
  };
}

export function calendarTitle(event: CalendarEvent) {
  return `${event.title}${event.startTime ? "" : " (Time unconfirmed)"}`;
}

export function calendarDescription(event: CalendarEvent) {
  const notes = [
    event.summary,
    event.hostOrganization ? `Host: ${event.hostOrganization}` : null,
    `Class years: ${event.classYears.length ? event.classYears.join(", ") : "not specified"}. Membership, ticket, and registration restrictions in the listing still apply.`,
    !event.startTime ? "Start time is unconfirmed. This is an all-day placeholder, not a confirmed all-day event." : null,
    !event.startTime && event.endTime ? `Published end time: ${event.endTime} Eastern. Confirm the start time with the organizer.` : null,
    event.startTime && !event.endTime ? "End time is unconfirmed. No duration has been estimated; adjust the end time before saving if needed." : null,
    `Times are Notre Dame campus-local Eastern time (${CAMPUS_TIMEZONE}).`,
    event.sourceUrl ? `Original listing: ${event.sourceUrl}` : null,
    "This is a one-time calendar copy, not an automatically updating subscription. Check the original listing for changes.",
  ];
  return notes.filter(Boolean).join("\n\n");
}

export function googleCalendarUrl(event: CalendarEvent) {
  const dates = calendarDates(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: calendarTitle(event),
    dates: `${dates.start}/${dates.end ?? dates.start}`,
    ctz: CAMPUS_TIMEZONE,
    details: calendarDescription(event),
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

// RFC 5545 folds content lines at 75 UTF-8 octets, not 75 characters.
export function foldCalendarLine(value: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let line = "";
  let bytes = 0;
  for (const character of value) {
    const length = encoder.encode(character).length;
    if (bytes + length > 75) {
      lines.push(line);
      line = " ";
      bytes = 1;
    }
    line += character;
    bytes += length;
  }
  lines.push(line);
  return lines.join("\r\n");
}

export function buildCalendarIcs(events: CalendarEvent[], now = new Date()) {
  if (!events.length) throw new Error("Choose at least one event to export.");
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CampusCue//Campus Events//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-TIMEZONE:${CAMPUS_TIMEZONE}`,
    "BEGIN:VTIMEZONE", `TZID:${CAMPUS_TIMEZONE}`,
    "BEGIN:DAYLIGHT", "DTSTART:20070311T020000", "TZOFFSETFROM:-0500", "TZOFFSETTO:-0400",
    "TZNAME:EDT", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "DTSTART:20071104T020000", "TZOFFSETFROM:-0400", "TZOFFSETTO:-0500",
    "TZNAME:EST", "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU", "END:STANDARD",
    "END:VTIMEZONE",
  ];
  for (const event of events) {
    const dates = calendarDates(event);
    lines.push("BEGIN:VEVENT", `UID:campuscue-event-${event.id}@campuscue.invalid`, `DTSTAMP:${timestamp}`,
      `SUMMARY:${escapeText(calendarTitle(event))}`, `DESCRIPTION:${escapeText(calendarDescription(event))}`);
    if (dates.timed) {
      lines.push(`DTSTART;TZID=${CAMPUS_TIMEZONE}:${dates.start}`);
      // Omit DTEND when the source has no end time; do not invent a duration.
      if (dates.end) lines.push(`DTEND;TZID=${CAMPUS_TIMEZONE}:${dates.end}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dates.start}`, `DTEND;VALUE=DATE:${dates.end}`, "TRANSP:TRANSPARENT");
    }
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.sourceUrl) lines.push(`URL:${event.sourceUrl.replace(/[\r\n]/g, "")}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}

export function downloadEventIcs(event: CalendarEvent) {
  const blob = new Blob([buildCalendarIcs([event])], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  anchor.href = url;
  anchor.download = `campuscue-${slug}-${event.eventDate}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}