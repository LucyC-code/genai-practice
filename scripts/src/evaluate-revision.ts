import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { GetEventsResponse, ParseAnnouncementResponse } from "../../lib/api-zod/src/index";
const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) throw new Error("Development domain required.");
const base = `https://${domain}/api`;
const rows: {case: string; expected: string; actual: unknown; status: string}[] = [];
const current = async () => GetEventsResponse.parse(await (await fetch(`${base}/events`)).json());
const before = await current();
const parse = async (announcement: string) => {
  const response = await fetch(`${base}/events/parse`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ announcement, source: "Other", originalPostTime: "2026-10-30T21:30" }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Extraction ${response.status}: ${JSON.stringify(body)}`);
  return ParseAnnouncementResponse.parse(body);
};
if (process.argv.includes("--fragment-only")) {
  const result = await parse("tomorrow at 7pm");
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, "");
  assert.equal(result.events[0].eventDate, "2026-10-31");
  assert.equal(result.events[0].startTime, "19:00");
  assert.match(result.events[0].summary, /October 31, 2026/);
  assert.match(result.notes[0], /Rule-based/);
  const evidence = { case: "Bare late-night fragment follow-up", expected: "Incomplete rule-based draft, October 31, 19:00, no invented title; no AI call", actual: result, status: "pass" };
  await writeFile(new URL("../../evaluation-fragment-results.json", import.meta.url), JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify(evidence, null, 2));
  process.exit(0);
}
try {
  const repeats = [];
  for (let i = 0; i < 3; i++) {
    const result = await parse("Free boba and board games tomorrow at 7pm in Duncan 210.");
    assert.equal(result.events.length, 1);
    const event = result.events[0];
    assert.equal(event.eventDate, "2026-10-31");
    assert.equal(event.startTime, "19:00");
    assert.match(event.location ?? "", /Duncan.*210/i);
    assert.equal(event.hostOrganization, null);
    assert.ok(["Social", "Food"].includes(event.category));
    assert.match(event.summary, /October 31, 2026/);
    assert.doesNotMatch(event.summary, /tomorrow/i);
    repeats.push(event);
    console.log(`Typical repeat ${i + 1}: ${JSON.stringify(event)}`);
  }
  rows.push({ case: "Typical extraction + live repeats", expected: "Three live drafts: October 31, 19:00, Duncan 210, Social/Food, no host, absolute summary", actual: repeats, status: "pass" });
  const challenge = await parse("Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP.");
  assert.equal(challenge.events.length, 1);
  const risk = challenge.events[0];
  assert.equal(risk.eventDate, "2026-11-05");
  assert.match(risk.location ?? "", /DeBartolo/i);
  assert.doesNotMatch(risk.location ?? "", /\d/);
  assert.equal(risk.startTime, null);
  assert.equal(risk.hostOrganization, null);
  assert.ok(!risk.sourceUrl);
  rows.push({ case: "Challenge", expected: "November 5, DeBartolo, no invented time/room/host/URL", actual: challenge, status: "pass" });
  for (const [name, body] of [
    ["Missing start", { ...risk, reviewConfirmed: true }],
    ["Missing date", { ...repeats[0], eventDate: null, reviewConfirmed: true }],
    ["Empty title", { ...repeats[0], title: " ", reviewConfirmed: true }],
    ["Invalid date", { ...repeats[0], eventDate: "2026-02-30", reviewConfirmed: true }],
    ["No review confirmation", { ...repeats[0], reviewConfirmed: false }],
  ] as const) {
    const response = await fetch(`${base}/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const error = await response.json();
    assert.equal(response.status, 400);
    rows.push({ case: `Risk: ${name}`, expected: "400; no insertion", actual: error, status: "pass" });
  }
  const empty = await fetch(`${base}/events/parse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcement: "", source: "Other" }) });
  assert.equal(empty.status, 400);
  const nonEvent = await parse("Hello! I hope you are having a very nice day.");
  assert.equal(nonEvent.events.length, 0);
  rows.push({ case: "Empty/non-event", expected: "400 empty; zero drafts for greeting", actual: { emptyStatus: empty.status, nonEvent }, status: "pass" });
  const late = await parse("tomorrow at 7pm");
  assert.equal(late.events.length, 1);
  assert.equal(late.events[0].title, "");
  assert.equal(late.events[0].eventDate, "2026-10-31");
  assert.equal(late.events[0].startTime, "19:00");
  rows.push({ case: "Bare late-night fragment", expected: "Rule-based incomplete draft: October 31, 19:00, no invented title and no AI claim", actual: late, status: "pass" });
  const { groupFilteredEvents } = await import(new URL("../../artifacts/campus-cue/src/lib/event-series.ts", import.meta.url).href);
  const { matchesDiscoveryTime } = await import(new URL("../../artifacts/campus-cue/src/lib/availability.ts", import.meta.url).href);
  const selected = new Set(["Career", "Networking", "Social", "Faith & Spirituality"]);
  const filtered = before.filter(e => selected.has(e.category) &&
    (e.classYears.includes("Graduate") || e.classYears.includes("All years")) &&
    matchesDiscoveryTime(e, "", "", "", "all", "2026-10-03"));
  const grouped = groupFilteredEvents(filtered);
  const series = grouped.items.find((item: {kind: string}) => item.kind === "series");
  assert.ok(series && series.occurrences.length > 100);
  assert.ok(grouped.items.length < filtered.length / 2);
  rows.push({ case: "Controlled graduate discovery", expected: "Filters first; Masses grouped; every occurrence accessible; fewer cards", actual: {
    clockDate: "2026-10-03", matchingOccurrences: grouped.occurrences.length, cards: grouped.items.length,
    massOccurrences: series.occurrences.length, next: { date: series.event.eventDate, start: series.event.startTime, location: series.event.location },
  }, status: "pass" });
  const after = await current();
  for (const event of before) assert.deepEqual(after.find(e => e.id === event.id), event);
  assert.equal(after.length, before.length);
  rows.push({ case: "Read-only extraction and rejected publications", expected: "All existing rows preserved; no insertion", actual: { before: before.length, after: after.length }, status: "pass" });
} catch (error) {
  rows.push({ case: "Execution interrupted", expected: "All checks complete", actual: error instanceof Error ? error.message : String(error), status: "fail" });
  process.exitCode = 1;
} finally {
  await writeFile(new URL("../../evaluation-api-results.json", import.meta.url), JSON.stringify({ executedAt: new Date().toISOString(), reference: "2026-10-30T21:30 America/Indiana/Indianapolis", rows }, null, 2) + "\n");
  console.log(JSON.stringify(rows.map(({case: name, status, actual}) => ({case: name, status, actual})), null, 2));
}
