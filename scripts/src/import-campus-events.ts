import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { CreateEventBody, GetEventsResponse, CreateEventResponse } from "../../lib/api-zod/src/index";

const fixturePath = fileURLToPath(new URL("../data/notre-dame-deep-coverage-events.json", import.meta.url));
const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
const events = (fixture.events as unknown[]).map(event => CreateEventBody.parse(event));
const dateValid = (date: string) => new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
const keys = new Set<string>();
function key(event: { title: string; eventDate?: string | null; startTime?: string | null }) {
  const title = event.title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/^(film|screening|lecture|workshop)\s*[:—–-]\s*/, "").replace(/\(\d{4}\)/g, "").replace(/[^a-z0-9]/g, "");
  return `${title}|${event.eventDate}|${event.startTime}`;
}
for (const event of events) {
  assert.ok(event.eventDate && dateValid(event.eventDate), `Invalid date: ${event.title}`);
  assert.ok(event.eventDate >= fixture.researchedAt, `Past listing: ${event.title}`);
  assert.ok(event.sourceUrl?.startsWith("https://"), `Missing primary source: ${event.title}`);
  assert.ok(event.location, `Missing campus venue: ${event.title}`);
  assert.ok(event.title.length <= 200 && event.summary.length <= 2000, `Announcement exceeds publish limits: ${event.title}`);
  for (const time of [event.startTime, event.endTime]) {
    assert.ok(time === null || time === undefined || /^([01]\d|2[0-3]):[0-5]\d$/.test(time), `Invalid time: ${event.title}`);
  }
  assert.ok(!keys.has(key(event)), `Duplicate occurrence: ${event.title}`);
  keys.add(key(event));
  if (event.tags?.includes("Published weekly schedule")) {
    assert.ok(event.eventDate <= "2026-12-09");
    assert.ok(event.endTime === null);
    assert.ok(![["2026-10-17", "2026-10-25"], ["2026-11-25", "2026-11-29"]].some(([from, until]) => event.eventDate! >= from && event.eventDate! <= until));
    assert.match(event.summary, /not a separately announced special event/);
  }
}
const counts = events.reduce<Record<string, number>>((counts, event) => {
  counts[event.category] = (counts[event.category] ?? 0) + 1;
  return counts;
}, {});
assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), events.length);
console.log(JSON.stringify({ validated: events.length, categories: counts, apply: process.argv.includes("--apply") }));

if (process.argv.includes("--apply")) {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (!domain) throw new Error("REPLIT_DEV_DOMAIN is required for this development-only import.");
  const endpoint = `https://${domain}/api/events`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`Unable to load current events: ${response.status}`);
  const before = GetEventsResponse.parse(await response.json());
  const existing = new Set(before.map(key));
  const pending = events.filter(event => !existing.has(key(event)));
  let cursor = 0, inserted = 0, failed = false;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (!failed && cursor < pending.length) {
      const event = pending[cursor++];
      try {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(event) });
        if (!response.ok) throw new Error(`Import failed for ${event.title} (${response.status}): ${await response.text()}`);
        CreateEventResponse.parse(await response.json());
        inserted++;
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }));
  const afterResponse = await fetch(endpoint);
  if (!afterResponse.ok) throw new Error(`Unable to verify imported events: ${afterResponse.status}`);
  const after = GetEventsResponse.parse(await afterResponse.json());
  assert.equal(after.length, before.length + inserted);
  for (const event of before) {
    assert.deepEqual(after.find(candidate => candidate.id === event.id), event, "An existing submission or correction was changed.");
  }
  assert.ok(after.length > 1000, "Requested coverage target not reached.");
  console.log(JSON.stringify({ before: before.length, inserted, alreadyPresent: events.length - pending.length, total: after.length,
    upcoming: after.filter(event => event.eventDate && event.eventDate >= fixture.researchedAt).length,
    weeklyScheduleOccurrences: after.filter(event => event.tags.includes("Published weekly schedule")).length,
    categories: after.reduce<Record<string, number>>((counts, event) => { counts[event.category] = (counts[event.category] ?? 0) + 1; return counts; }, {}),
    allPreviousRecordsPreserved: true }));
}