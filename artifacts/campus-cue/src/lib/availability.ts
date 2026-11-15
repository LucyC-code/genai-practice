import type { Event } from "@workspace/api-client-react";
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export function availabilityError(from: string, until: string) {
  if (!from && !until) return null;
  if (!from || !until) return "Enter both the From and To times, or clear both to leave time unrestricted.";
  if (!TIME_PATTERN.test(from) || !TIME_PATTERN.test(until)) return "Use valid times in HH:mm format.";
  if (from === until) return "From and To must differ. Clear both fields for unrestricted time.";
  return null;
}
export const nextDate = (date: string) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
export function matchesDiscoveryTime(event: Pick<Event, "eventDate" | "startTime" | "endTime">,
  from: string, until: string, selectedDate: string, timeframe: string, today: string) {
  if (selectedDate) return matchesAvailability(event, from, until, selectedDate);
  if (timeframe === "today") return matchesAvailability(event, from, until, today);
  let anchor = event.eventDate;
  if (anchor && from && until && from > until && event.startTime && event.startTime < until) {
    const previous = new Date(`${anchor}T12:00:00Z`);
    previous.setUTCDate(previous.getUTCDate() - 1);
    anchor = previous.toISOString().slice(0, 10);
  }
  if (event.eventDate && event.eventDate < today) return false;
  if (timeframe === "week") {
    if (!anchor || anchor < today) return false;
    let last = today;
    for (let i = 0; i < 6; i++) last = nextDate(last);
    if (anchor > last) return false;
  }
  return matchesAvailability(event, from, until);
}
export function matchesAvailability(
  event: Pick<Event, "eventDate" | "startTime" | "endTime">,
  from: string, until: string, date = "",
) {
  if (availabilityError(from, until)) return false;
  if (!from && !until) return !date || event.eventDate === date;
  if (!event.eventDate || !event.startTime || !TIME_PATTERN.test(event.startTime)) return false;
  if (event.endTime && !TIME_PATTERN.test(event.endTime)) return false;
  const startWindow = minutes(from);
  const overnight = minutes(until) < startWindow;
  const endWindow = minutes(until) + (overnight ? 1440 : 0);
  let start = minutes(event.startTime);
  if (date) {
    if (event.eventDate === date) { /* same-night event */ }
    else if (overnight && event.eventDate === nextDate(date)) start += 1440;
    else return false;
  } else if (overnight && start < minutes(until)) start += 1440;
  if (start < startWindow || start >= endWindow) return false;
  if (!event.endTime) return true;
  // Calendar arithmetic is in local wall time. A known end earlier than start
  // is on the following date; no UTC offsets are guessed.
  let end = Math.floor(start / 1440) * 1440 + minutes(event.endTime);
  if (minutes(event.endTime) <= minutes(event.startTime)) end += 1440;
  return end <= endWindow;
}
