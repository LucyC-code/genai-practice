import { useState } from "react";
import type { Event } from "@workspace/api-client-react";
import { timeRange } from "@/lib/cue";

export function EventSeriesCard({ title, occurrences, onOpen }: {
  title: string; occurrences: Event[]; onOpen: (event: Event) => void;
}) {
  const [shown, setShown] = useState(24);
  const next = occurrences[0];
  const date = (event: Event) => event.eventDate
    ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${event.eventDate}T12:00:00Z`))
    : "Date not confirmed";
  return <details className="self-start rounded-2xl border-2 border-foreground bg-card p-4 stamp" data-testid="card-series">
    <summary className="cursor-pointer list-none">
      <span className="text-xs font-mono-cue uppercase text-muted-foreground">Recurring series · Faith &amp; Spirituality</span>
      <h3 className="mt-1 text-xl font-bold">{title}</h3>
      <p className="mt-1 font-semibold">{occurrences.length} matching occurrences</p>
      <p className="mt-2 text-sm">Next matching: {date(next)} · {timeRange(next.startTime, next.endTime)}</p>
      <p className="text-sm text-muted-foreground">{next.location || "Location not confirmed"}</p>
      <span className="mt-3 inline-block rounded-full border-2 border-foreground px-3 py-1.5 text-sm font-bold">View times and locations</span>
    </summary>
    <p className="mt-4 text-xs text-muted-foreground">Each occurrence retains its own location and original source. Only occurrences matching your active filters are included. Weekly schedules are not separate special-event announcements.</p>
    <ol className="mt-3 max-h-96 space-y-2 overflow-y-auto" data-testid="list-series-occurrences" aria-label="Matching times and locations">
      {occurrences.slice(0, shown).map(event => <li key={event.id} className="rounded-lg border border-border p-3 text-sm">
        <button onClick={() => onOpen(event)} className="text-left font-semibold underline" data-testid={`series-occurrence-${event.id}`}>{event.title}</button>
        <p>{date(event)} · {timeRange(event.startTime, event.endTime)}</p>
        <p>{event.location || "Location not confirmed"}</p>
        {event.sourceUrl && <a className="text-primary underline" href={event.sourceUrl} target="_blank" rel="noopener noreferrer">Original source</a>}
      </li>)}
    </ol>
    {shown < occurrences.length && <button onClick={() => setShown(count => count + 24)} className="mt-3 rounded-full border-2 px-3 py-1.5 text-sm font-semibold">Show {Math.min(24, occurrences.length - shown)} more times ({shown} of {occurrences.length} shown)</button>}
  </details>;
}
