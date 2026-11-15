import { test } from "node:test";
import assert from "node:assert/strict";
import type { Event } from "@workspace/api-client-react";
import { availabilityError, matchesAvailability, matchesDiscoveryTime } from "./availability";
import { groupFilteredEvents } from "./event-series";
import { matchesCategories } from "./category-selection";
const sample = (overrides: Partial<Event> = {}): Event => ({
  id: 1, title: "Dorm Mass", summary: "Published weekly schedule",
  category: "Faith & Spirituality", classYears: ["All years"], tags: ["Published weekly schedule"],
  eventDate: "2026-10-30", startTime: "22:00", endTime: null, location: "Dillon Hall",
  hostOrganization: "Campus Ministry", source: "Campus website",
  sourceUrl: "https://campusministry.nd.edu/pray/mass-schedule/campus-mass-schedule/",
  missingFields: ["End time"], createdAt: "2026-10-01T00:00:00Z", ...overrides,
});
test("overnight window fits known intervals, next morning and start-only events", () => {
  const cases: [string, string | null, string, boolean][] = [
    ["21:00", "23:00", "2026-10-30", false], ["22:00", "23:00", "2026-10-30", true],
    ["23:00", "01:00", "2026-10-30", true], ["00:30", "02:00", "2026-10-31", true],
    ["01:00", "03:00", "2026-10-31", false], ["02:00", null, "2026-10-31", false],
    ["23:00", null, "2026-10-30", true], ["00:30", "01:00", "2026-10-30", false],
  ];
  for (const [startTime, endTime, eventDate, expected] of cases) {
    assert.equal(matchesAvailability(sample({ startTime, endTime, eventDate }), "22:00", "02:00", "2026-10-30"), expected, `${eventDate} ${startTime}-${endTime}`);
  }
  assert.equal(matchesAvailability(sample({ startTime: null }), "22:00", "02:00"), false);
});
test("blank is unrestricted; partial, equal and invalid inputs never show full results", () => {
  assert.equal(matchesAvailability(sample({ startTime: null }), "", ""), true);
  for (const [from, to] of [["22:00", ""], ["", "02:00"], ["22:00", "22:00"], ["25:00", "02:00"]]) {
    assert.ok(availabilityError(from, to));
    assert.equal(matchesAvailability(sample(), from, to), false);
  }
  assert.equal(matchesAvailability(sample({ startTime: "19:00", endTime: "20:00" }), "22:00", "02:00"), false);
});
test("each night uses the same rule without a selected date, including after midnight", () => {
  for (const eventDate of ["2026-10-30", "2026-10-31", "2026-11-01"]) {
    assert.equal(matchesAvailability(sample({ eventDate, startTime: "00:30", endTime: "01:00" }), "22:00", "02:00"), true);
  }
});
test("today/week overnight filters include the final night's next morning", () => {
  const nextMorning = sample({ eventDate: "2026-10-31", startTime: "01:00", endTime: "02:00" });
  assert.equal(matchesDiscoveryTime(nextMorning, "22:00", "02:00", "", "today", "2026-10-30"), true);
  const weekEndMorning = sample({ eventDate: "2026-11-06", startTime: "01:00", endTime: "02:00" });
  assert.equal(matchesDiscoveryTime(weekEndMorning, "22:00", "02:00", "", "week", "2026-10-30"), true);
});
test("category, graduate audience and times filter occurrences before grouping", () => {
  const events = [
    sample(), sample({ id: 2, eventDate: "2026-10-31", location: "Stanford Hall" }),
    sample({ id: 3, classYears: ["Freshman"] }),
    sample({ id: 4, category: "Sports", title: "Game" }),
    sample({ id: 5, category: "Networking", title: "Mixer", tags: [] }),
  ];
  const filtered = events.filter(event => matchesCategories(event.category, ["Career", "Networking", "Social", "Faith & Spirituality"]) &&
    (event.classYears.includes("Graduate") || event.classYears.includes("All years")) &&
    matchesAvailability(event, "", ""));
  const feed = groupFilteredEvents(filtered);
  assert.equal(feed.occurrences.length, 3);
  assert.equal(feed.items.length, 2);
  const series = feed.items.find(item => item.kind === "series")!;
  assert.equal(series.kind, "series");
  if (series.kind === "series") {
    assert.equal(series.occurrences.length, 2);
    assert.equal(series.event.eventDate, "2026-10-30");
    assert.deepEqual(series.occurrences.map(e => e.location), ["Dillon Hall", "Stanford Hall"]);
  }
  assert.equal(groupFilteredEvents(filtered.filter(event => event.eventDate === "2026-10-31")).items.length, 1);
});
test("only verified recurring Masses group; unrelated faith events remain distinct", () => {
  const feed = groupFilteredEvents([sample(), sample({ id: 2, eventDate: "2026-10-31" }), sample({ id: 3, title: "Retreat", tags: [] })]);
  assert.equal(feed.items.length, 2);
});
test("duplicates need exact title, time, venue, source and content; originals stay available", () => {
  const feed = groupFilteredEvents([sample(), sample({ id: 2 }), sample({ id: 3, location: "Other chapel" }), sample({ id: 4, sourceUrl: "https://example.com/other" })]);
  assert.equal(feed.occurrences.length, 3);
  assert.equal(feed.duplicateCount, 1);
  assert.equal(feed.duplicates.get(1)?.[0].id, 2);
});
