import { isCalendarDate } from "./date-reference";
export function publicationError(event: {
  title: string; eventDate: string | null; startTime: string | null; reviewConfirmed?: boolean;
}) {
  if (!event.title.trim() || !event.eventDate || !isCalendarDate(event.eventDate) ||
      !event.startTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.startTime)) {
    return "Confirm a title, a valid date, and a start time before publishing. Other missing details may remain unconfirmed.";
  }
  if (event.reviewConfirmed !== true) return "Review the title, date, start time and summary against the source, then confirm your review before publishing.";
  return null;
}
