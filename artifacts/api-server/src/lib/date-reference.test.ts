import { test } from "node:test";
import assert from "node:assert/strict";
import { dateReference, relativeDate, absoluteSummary, campusDate, isCalendarDate, partialTimeDraft, normalizedDateWarnings } from "./date-reference";
import { publicationError } from "./publication";

test("late-night submission reference is October 30, not the UTC October 31", () => {
  const ref = dateReference(undefined, new Date("2026-10-31T01:30:00Z"));
  assert.equal(ref.date, "2026-10-30");
  assert.equal(relativeDate("tomorrow", ref.date), "2026-10-31");
  assert.match(ref.note, /submission time/);
  assert.match(absoluteSummary("Board games tomorrow at 7pm.", "2026-10-31"), /October 31, 2026/);
  assert.doesNotMatch(absoluteSummary("Board games tomorrow at 7pm.", "2026-10-31"), /tomorrow/);
});
test("original local post timestamp overrides later submission clock", () => {
  const ref = dateReference("2026-10-30T21:30", new Date("2026-11-15T20:00:00Z"));
  assert.equal(ref.instant.toISOString(), "2026-10-31T01:30:00.000Z");
  assert.match(ref.note, /original post time/);
});
test("this weekday includes today; next weekday is seven days later", () => {
  assert.equal(relativeDate("this Thursday", "2026-10-30"), "2026-11-05");
  assert.equal(relativeDate("next Thursday", "2026-10-30"), "2026-11-12");
  assert.equal(relativeDate("this Thursday", "2026-11-05"), "2026-11-05");
  assert.equal(relativeDate("next Thursday", "2026-11-05"), "2026-11-12");
});
test("DST fallback offsets resolve to the same campus calendar date", () => {
  for (const stamp of ["2026-11-01T01:30:00-04:00", "2026-11-01T01:30:00-05:00"]) {
    const ref = dateReference(stamp);
    assert.equal(ref.date, "2026-11-01");
    assert.equal(relativeDate("tomorrow", ref.date), "2026-11-02");
  }
  assert.match(dateReference("2026-11-01T01:30").note, /Ambiguous/);
  assert.equal(dateReference("2026-12-01T21:30").instant.toISOString(), "2026-12-02T02:30:00.000Z");
});
test("spring gap and invalid calendar dates are rejected", () => {
  assert.throws(() => dateReference("2026-03-08T02:30"), /does not exist/);
  assert.throws(() => dateReference("2026-02-30T12:30:00Z"), /calendar date/);
  assert.equal(isCalendarDate("2026-02-30"), false);
  assert.equal(campusDate(new Date("2026-03-09T03:30:00Z")), "2026-03-08");
});
test("absolute summary remains accurate under the next day's clock", context => {
  context.mock.timers.enable({ apis: ["Date"], now: Date.parse("2026-10-31T01:30:00Z") });
  const text = absoluteSummary("Games tomorrow at 7pm.", "2026-10-31");
  context.mock.timers.setTime(Date.parse("2026-11-01T01:30:00Z"));
  assert.equal(new Date().toISOString(), "2026-11-01T01:30:00.000Z");
  assert.equal(absoluteSummary(text, "2026-10-31"), text);
  assert.match(text, /October 31, 2026/);
});
test("publication requires core details and review, not a confirmed host", () => {
  const complete = { title: "Synthetic games", eventDate: "2026-10-31", startTime: "19:00", reviewConfirmed: true };
  assert.equal(publicationError(complete), null);
  assert.match(publicationError({ ...complete, startTime: null })!, /start time/);
  assert.match(publicationError({ ...complete, eventDate: null })!, /valid date/);
  assert.match(publicationError({ ...complete, title: " " })!, /title/);
  assert.match(publicationError({ ...complete, reviewConfirmed: false })!, /review/i);
  assert.ok(publicationError({ ...complete, eventDate: "2026-02-30" }));
});
test("bare late-night fragment extracts a date/time without inventing an event title", () => {
  const ref = dateReference(undefined, new Date("2026-10-31T01:30:00Z"));
  assert.deepEqual(partialTimeDraft("tomorrow at 7pm", ref.date), { eventDate: "2026-10-31", startTime: "19:00" });
  assert.equal(partialTimeDraft("Hello, have a nice day!", ref.date), null);
});
test("incorrect model date notes cannot contradict a corrected or already-correct date", () => {
  const notes = normalizedDateWarnings([
    '"This Thursday" was resolved to 2026-10-30.',
    "No room was specified.", "No host organization was supplied.",
  ], ["this Thursday"], "2026-10-30");
  assert.ok(notes.some(note => note.includes("November 5, 2026")));
  assert.ok(!notes.some(note => note.includes("2026-10-30")));
  assert.ok(notes.includes("No room was specified."));
  assert.ok(notes.includes("No host organization was supplied."));
});
