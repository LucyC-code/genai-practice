import { test } from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import type { Event } from "@workspace/api-client-react";
import { buildCalendarIcs, foldCalendarLine, googleCalendarUrl, nextCalendarDate } from "./calendar-export";

const sample = (overrides: Partial<Event> = {}): Event => ({
  id: 123, title: "Notre Dame home game", summary: "A verified campus event.",
  eventDate: "2026-10-10", startTime: "15:30", endTime: "17:00",
  location: "Notre Dame Stadium", hostOrganization: "Notre Dame Athletics",
  source: "Campus website", sourceUrl: "https://fightingirish.com/sports/football/schedule",
  category: "Sports", classYears: [], tags: ["Spectator"], missingFields: [],
  createdAt: "2026-10-03T00:00:00Z", ...overrides,
});
const stamp = new Date("2026-10-03T20:00:00Z");
const unfold = (ics: string) => ics.replace(/\r\n[ \t]/g, "");
const eventBody = (ics: string) => unfold(ics).split("BEGIN:VEVENT\r\n")[1];

test("timed exports retain campus wall time and include Eastern DST rules", () => {
  const ics = buildCalendarIcs([sample()], stamp);
  assert.match(ics, /TZID:America\/Indiana\/Indianapolis/);
  assert.match(ics, /BYMONTH=3;BYDAY=2SU/);
  assert.match(ics, /BYMONTH=11;BYDAY=1SU/);
  assert.match(eventBody(ics), /DTSTART;TZID=America\/Indiana\/Indianapolis:20261010T153000/);
  assert.match(eventBody(ics), /DTEND;TZID=America\/Indiana\/Indianapolis:20261010T170000/);
  assert.match(ics, /DTSTAMP:20261003T200000Z/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("overnight events roll the end date into the next month or year", () => {
  const body = eventBody(buildCalendarIcs([sample({ eventDate: "2026-12-31", startTime: "21:00", endTime: "02:00" })], stamp));
  assert.match(body, /DTEND;TZID=America\/Indiana\/Indianapolis:20270101T020000/);
  assert.equal(nextCalendarDate("2028-02-28"), "2028-02-29");
});

test("unknown end times have no invented duration", () => {
  const event = sample({ endTime: null });
  const body = eventBody(buildCalendarIcs([event], stamp));
  assert.ok(!body.includes("DTEND"));
  assert.match(body, /End time is unconfirmed/);
  const url = new URL(googleCalendarUrl(event));
  assert.equal(url.searchParams.get("dates"), "20261010T153000/20261010T153000");
});

test("unknown start time is an explicitly labeled transparent date placeholder", () => {
  const event = sample({ startTime: null, endTime: null });
  const body = eventBody(buildCalendarIcs([event], stamp));
  assert.match(body, /SUMMARY:Notre Dame home game \(Time unconfirmed\)/);
  assert.match(body, /DTSTART;VALUE=DATE:20261010/);
  assert.match(body, /DTEND;VALUE=DATE:20261011/);
  assert.match(body, /TRANSP:TRANSPARENT/);
  assert.match(body, /not a confirmed all-day event/);
  assert.equal(new URL(googleCalendarUrl(event)).searchParams.get("dates"), "20261010/20261011");
});

test("undated listings and empty exports fail rather than using today", () => {
  assert.throws(() => buildCalendarIcs([sample({ eventDate: null })]), /confirmed date/);
  assert.throws(() => googleCalendarUrl(sample({ eventDate: null })), /confirmed date/);
  assert.throws(() => buildCalendarIcs([]), /at least one event/);
});

test("Google links preserve title, location, source, and timezone", () => {
  const event = sample({ title: "Clubs & Coffee, résumé night", location: "Room 2; LaFortune" });
  const url = new URL(googleCalendarUrl(event));
  assert.equal(url.origin, "https://calendar.google.com");
  assert.equal(url.searchParams.get("action"), "TEMPLATE");
  assert.equal(url.searchParams.get("text"), event.title);
  assert.equal(url.searchParams.get("location"), event.location);
  assert.equal(url.searchParams.get("ctz"), "America/Indiana/Indianapolis");
  assert.ok(url.searchParams.get("details")?.includes(event.sourceUrl!));
  assert.ok(url.searchParams.get("details")?.includes("not an automatically updating subscription"));
});

test("ICS text escapes punctuation and newline injection; Unicode lines stay under 75 octets", () => {
  const event = sample({ title: "Coffee, tea; café", summary: "Backslash \\\nATTENDEE:untrusted@example.test\n" + "日本語 café ".repeat(40) });
  const ics = buildCalendarIcs([event], stamp);
  assert.match(unfold(ics), /SUMMARY:Coffee\\, tea\\; café/);
  assert.ok(!ics.includes("\r\nATTENDEE:"));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  const value = "DESCRIPTION:" + "é日本語".repeat(50);
  assert.equal(unfold(foldCalendarLine(value)), value);
});

test("multiple exports include one event per record with stable identifiers", () => {
  const ics = buildCalendarIcs([sample(), sample({ id: 456 })], stamp);
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.match(ics, /UID:campuscue-event-123@campuscue.invalid/);
  assert.match(ics, /UID:campuscue-event-456@campuscue.invalid/);
});