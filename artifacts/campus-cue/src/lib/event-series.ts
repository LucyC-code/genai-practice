import type { Event } from "@workspace/api-client-react";
export type FeedItem = { kind: "event"; event: Event } |
  { kind: "series"; title: string; event: Event; occurrences: Event[] };
const order = (a: Event, b: Event) =>
  `${a.eventDate ?? "9999"}T${a.startTime ?? "99:99"}`.localeCompare(`${b.eventDate ?? "9999"}T${b.startTime ?? "99:99"}`) || a.id - b.id;
function duplicateKey(event: Event) {
  if (!event.eventDate || !event.startTime || !event.location || !event.sourceUrl) return `id:${event.id}`;
  // Deliberately conservative: never merge on title/category alone, or when
  // conflicting summaries/audiences could describe different events.
  return JSON.stringify([event.title.trim().toLowerCase(), event.eventDate, event.startTime,
    event.endTime, event.location.trim().toLowerCase(), event.sourceUrl, event.source,
    event.hostOrganization, event.category, event.summary, [...event.classYears].sort(), [...event.tags].sort()]);
}
export function groupFilteredEvents(filtered: Event[]) {
  const unique = new Map<string, Event>();
  const duplicates = new Map<number, Event[]>();
  for (const event of [...filtered].sort(order)) {
    const key = duplicateKey(event), existing = unique.get(key);
    if (existing) duplicates.set(existing.id, [...(duplicates.get(existing.id) ?? []), event]);
    else unique.set(key, event);
  }
  const occurrences = [...unique.values()];
  const masses: Event[] = [];
  const items: FeedItem[] = [];
  for (const event of occurrences) {
    const isMass = event.category === "Faith & Spirituality" &&
      event.tags.includes("Published weekly schedule") && /\bmass(?:es)?\b/i.test(event.title) &&
      /^https:\/\/(?:campusministry|basilica)\.nd\.edu\//.test(event.sourceUrl ?? "");
    if (isMass) masses.push(event);
    else items.push({ kind: "event", event });
  }
  if (masses.length > 1) items.push({ kind: "series", title: "Campus Masses", event: masses[0], occurrences: masses });
  else if (masses.length) items.push({ kind: "event", event: masses[0] });
  items.sort((a, b) => order(a.event, b.event));
  return { items, occurrences, duplicates, duplicateCount: filtered.length - occurrences.length };
}
