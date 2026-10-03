import { CalendarPlus, Download } from "lucide-react";
import type { Event } from "@workspace/api-client-react";
import { downloadEventIcs, googleCalendarUrl } from "@/lib/calendar-export";
import { useToast } from "@/hooks/use-toast";

export function CalendarActions({ event }: { event: Event }) {
  const { toast } = useToast();
  const download = () => {
    try {
      downloadEventIcs(event);
      toast({ title: "Calendar file ready", description: "Open the .ics file in your calendar, or import it in Google Calendar under Settings > Import & export." });
    } catch (error) {
      toast({ title: "Could not create calendar file", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };
  return (
    <section className="space-y-2 rounded-xl border-2 border-border bg-muted/40 p-3" aria-label="Add event to your calendar">
      <h3 className="text-sm font-bold">Add to your calendar</h3>
      {event.eventDate ? <>
        <div className="flex flex-wrap gap-2">
          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" data-testid="link-google-calendar" className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <CalendarPlus className="h-4 w-4" />Add to Google Calendar
          </a>
          <button type="button" onClick={download} data-testid="button-download-ics" className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-card px-3 py-1.5 text-sm font-semibold">
            <Download className="h-4 w-4" />Download .ics
          </button>
        </div>
        {!event.startTime && <p className="text-xs font-semibold">Start time is unconfirmed. This exports as an all-day placeholder labeled “Time unconfirmed,” not a confirmed all-day event.</p>}
        {event.startTime && !event.endTime && <p className="text-xs font-semibold">End time is unconfirmed. Review the duration in your calendar before saving.</p>}
        <p className="text-xs text-muted-foreground">Google opens an event for you to review and save. ICS works with Google, Apple, and Outlook calendars. Imported events do not automatically update.</p>
      </> : <p className="text-xs text-muted-foreground" data-testid="status-calendar-date-unconfirmed">A confirmed event date is needed before adding this to your calendar.</p>}
    </section>
  );
}