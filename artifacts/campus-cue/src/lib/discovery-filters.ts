import type { Event } from "@workspace/api-client-react";

export const ACTIVITIES = [
  ["", "Any activity"],
  ["spectator", "Watch sports"],
  ["participate", "Play & train"],
  ["clubs", "Clubs & meetings"],
  ["social", "Socials & mixers"],
] as const;
export type Activity = (typeof ACTIVITIES)[number][0];

export const SPORTS = [
  "Football", "Hockey", "Tennis", "Soccer", "Rugby", "Track & running",
  "Volleyball", "Basketball", "Lacrosse", "Swimming", "Boxing",
  "Field hockey", "Strength training", "Spikeball",
] as const;
export type Sport = (typeof SPORTS)[number] | "";

export function matchesDiscovery(
  event: Pick<Event, "category" | "tags" | "eventDate">,
  activity: Activity,
  sport: Sport,
  date: string,
) {
  const tags = new Set(event.tags.map(tag => tag.toLowerCase()));
  if (date && event.eventDate !== date) return false;
  if (sport && !tags.has(sport.toLowerCase())) return false;
  if (activity === "spectator" && !tags.has("spectator")) return false;
  if (activity === "participate" && !tags.has("participate")) return false;
  if (activity === "clubs" && event.category !== "Clubs" &&
      !tags.has("club meeting") && !tags.has("club activity")) return false;
  if (activity === "social" && event.category !== "Social" &&
      !tags.has("social") && !tags.has("mixer")) return false;
  return true;
}