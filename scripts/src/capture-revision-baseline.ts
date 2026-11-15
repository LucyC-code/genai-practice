import { readFile } from "node:fs/promises";
const extraction = await readFile("artifacts/api-server/src/lib/event-extraction.ts", "utf8");
const discover = await readFile("artifacts/campus-cue/src/pages/discover.tsx", "utf8");
const legacyExpressionsPresent = extraction.includes("new Date().toISOString().slice(0, 10)") &&
  discover.includes("availableFrom < availableUntil");
const clock = new Date("2026-10-31T01:30:00Z");
const oldReference = clock.toISOString().slice(0, 10);
const tomorrow = new Date(`${oldReference}T12:00:00Z`);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const oldActivation = (from: string, until: string) => !!from && !!until && from < until;
const active = oldActivation("22:00", "02:00");
console.log(JSON.stringify({
  method: "Executed reproduction of inspected pre-edit expressions, not a historical live-model replay",
  legacyExpressionsPresent,
  expected: { referenceDate: "2026-10-30", tomorrow: "2026-10-31", availabilityActive: true },
  observed: { referenceDate: oldReference, tomorrow: tomorrow.toISOString().slice(0, 10), availabilityActive: active, consequence: "Time predicate bypassed: all otherwise matching events pass." },
}, null, 2));
