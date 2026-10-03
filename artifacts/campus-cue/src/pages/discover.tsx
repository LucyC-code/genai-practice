import { useMemo, useState } from "react";
import { Search, MapPin, Clock, Flag, Users, CheckCircle2, RotateCcw, CalendarX, ExternalLink, Handshake, GraduationCap } from "lucide-react";
import { useGetEvents, useGetEventOverview, useReportEvent, EventReportInputReason, type Event, type EventCategory, type GetEventsParams, type ClassYear } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, CLASS_YEARS, audienceLabel, CAT_COLOR, EventArt, SourceIcon, Unconfirmed, dateParts, timeRange } from "@/lib/cue";

const TF = [["all", "Anytime"], ["today", "Today"], ["week", "This week"]] as const;

function Stat({ n, label, id }: { n?: number; label: string; id: string }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-card px-4 py-3 stamp" data-testid={id}>
      <div className="text-3xl font-extrabold leading-none">{n ?? "-"}</div>
      <div className="mt-1 text-xs font-mono-cue uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function EventCard({ ev, i, onOpen, fits }: { ev: Event; i: number; onOpen: () => void; fits: boolean }) {
  const d = dateParts(ev.eventDate);
  const t = timeRange(ev.startTime, ev.endTime);
  return (
    <button onClick={onOpen} data-testid={`card-event-${ev.id}`} style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
      className="rise ticket group flex w-full overflow-hidden rounded-2xl border-2 border-foreground bg-card text-left">
      <div className="relative w-24 shrink-0 sm:w-32">
        <EventArt seed={ev.id} category={ev.category} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute left-2 top-2 rounded-md bg-card px-2 py-1 text-center border-2 border-foreground leading-tight">
          {d ? <><div className="text-[10px] font-mono-cue uppercase">{d.mon}</div><div className="text-lg font-extrabold">{d.day}</div></> : <div className="text-[10px] font-mono-cue">TBA</div>}
        </div>
      </div>
      <div className="min-w-0 flex-1 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: CAT_COLOR[ev.category] }}>{ev.category}</span>
          <span className="flex items-center gap-1 text-muted-foreground"><SourceIcon source={ev.source} />{ev.source}</span>
          <span className="flex items-center gap-1 text-muted-foreground"><GraduationCap className="h-3.5 w-3.5" />{audienceLabel(ev.classYears)}</span>
        </div>
        <h3 className="mt-1.5 text-lg font-bold leading-snug group-hover:text-primary transition-colors">{ev.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-foreground/80">{ev.summary}</p>
        {fits && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-chart-2"><CheckCircle2 className="h-3.5 w-3.5" />Fits your free time</span>}
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t ?? <Unconfirmed label="Time unconfirmed" />}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{ev.location ?? <Unconfirmed label="Location unconfirmed" />}</span>
        </div>
      </div>
    </button>
  );
}

function Detail({ ev, onClose }: { ev: Event | null; onClose: () => void }) {
  const { toast } = useToast();
  const report = useReportEvent();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<string>(EventReportInputReason.Incorrect_details);
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);
  const close = () => { setReporting(false); setSent(false); setDetails(""); onClose(); };
  const d = ev ? dateParts(ev.eventDate) : null;
  const submit = () => {
    if (!ev) return;
    report.mutate({ eventId: ev.id, data: { reason: reason as never, details: details.trim() || null } }, {
      onSuccess: () => { setSent(true); toast({ title: "Report received", description: "Thanks for flagging this event." }); },
      onError: () => toast({ title: "Could not send report", description: "Please try again.", variant: "destructive" }),
    });
  };
  return (
    <Dialog open={!!ev} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg overflow-hidden border-2 border-foreground p-0 max-h-[90dvh] overflow-y-auto">
        {ev && <>
          <div className="relative h-32"><EventArt seed={ev.id} category={ev.category} className="absolute inset-0 h-full w-full object-cover" /></div>
          <div className="space-y-4 p-6 pt-2">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: CAT_COLOR[ev.category] }}>{ev.category}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><SourceIcon source={ev.source} />Original channel: {ev.source}</span>
              </div>
              <DialogTitle className="text-2xl font-extrabold" data-testid="text-detail-title">{ev.title}</DialogTitle>
              <DialogDescription className="text-foreground/80">{ev.summary}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-mono-cue text-xs uppercase text-muted-foreground">Date</dt><dd>{d ? `${d.dow}, ${d.mon} ${d.day}` : <Unconfirmed />}</dd>
              <dt className="font-mono-cue text-xs uppercase text-muted-foreground">Time</dt><dd>{timeRange(ev.startTime, ev.endTime) ?? <Unconfirmed />}</dd>
              <dt className="font-mono-cue text-xs uppercase text-muted-foreground">Where</dt><dd>{ev.location ?? <Unconfirmed />}</dd>
              <dt className="font-mono-cue text-xs uppercase text-muted-foreground">Host</dt><dd>{ev.hostOrganization ?? <Unconfirmed />}</dd>
              <dt className="font-mono-cue text-xs uppercase text-muted-foreground">Class years</dt><dd>{audienceLabel(ev.classYears)}</dd>
            </dl>
            {ev.sourceUrl && <a href={ev.sourceUrl} target="_blank" rel="noopener noreferrer" data-testid="link-event-source" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">View original event listing<ExternalLink className="h-4 w-4" /></a>}
            {ev.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{ev.tags.map(t => <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono-cue">#{t}</span>)}</div>}
            {ev.missingFields.length > 0 && <p className="rounded-lg bg-accent/40 px-3 py-2 text-xs">Not confirmed in the original announcement: {ev.missingFields.join(", ")}.</p>}
            <div className="border-t-2 border-dashed pt-4">
              {sent ? <p className="pop flex items-center gap-2 text-sm font-semibold text-chart-2" data-testid="status-report-sent"><CheckCircle2 className="h-4 w-4" />Report sent. Thank you.</p>
              : !reporting ? <button onClick={() => setReporting(true)} data-testid="button-report-open" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" />Report this event</button>
              : <div className="space-y-3">
                <select value={reason} onChange={e => setReason(e.target.value)} data-testid="select-report-reason" className="w-full rounded-lg border-2 border-input bg-card px-3 py-2 text-sm">
                  {Object.values(EventReportInputReason).map(r => <option key={r}>{r}</option>)}
                </select>
                <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Details (optional)" data-testid="input-report-details" rows={3} className="w-full rounded-lg border-2 border-input bg-card px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={submit} disabled={report.isPending} data-testid="button-report-submit" className="rounded-full bg-destructive px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{report.isPending ? "Sending..." : "Send report"}</button>
                  <button onClick={() => setReporting(false)} className="rounded-full px-4 py-1.5 text-sm" data-testid="button-report-cancel">Cancel</button>
                </div>
              </div>}
            </div>
          </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}

export default function Discover() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [classYear, setClassYear] = useState<ClassYear | "">("");
  const [timeframe, setTimeframe] = useState<"all" | "today" | "week">("all");
  const [open, setOpen] = useState<Event | null>(null);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const params = useMemo<GetEventsParams>(() => {
    const p: GetEventsParams = { timeframe };
    if (search.trim()) p.search = search.trim();
    if (category) p.category = category;
    if (classYear) p.classYear = classYear;
    return p;
  }, [search, category, timeframe, classYear]);
  const { data: events, isLoading, isError, refetch } = useGetEvents(params);
  const { data: ov } = useGetEventOverview();
  const availabilityActive = !!availableFrom && !!availableUntil && availableFrom < availableUntil;
  const matchingEvents = (events ?? []).filter(ev => !availabilityActive ||
    (ev.startTime && ev.endTime && ev.startTime < ev.endTime && ev.startTime >= availableFrom && ev.endTime <= availableUntil));
  const filtersActive = !!search || !!category || !!classYear || timeframe !== "all" || !!availableFrom || !!availableUntil;
  const reset = () => { setSearch(""); setCategory(""); setClassYear(""); setTimeframe("all"); setAvailableFrom(""); setAvailableUntil(""); };
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="rise">
          <p className="font-mono-cue text-xs uppercase tracking-widest text-primary">Notre Dame · Between-class board</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">What's on, <span className="bg-accent px-2 -rotate-1 inline-block">right now</span> on campus.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Discover Notre Dame events from university calendars and student clubs. Open a card for the original listing and check the latest details.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 rise" style={{ animationDelay: "120ms" }}>
          <Stat n={ov?.totalUpcoming} label="Upcoming" id="stat-upcoming" />
          <Stat n={ov?.happeningToday} label="Today" id="stat-today" />
          <Stat n={ov?.happeningThisWeek} label="This week" id="stat-week" />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border-2 border-foreground bg-card p-4 stamp">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-full border-2 border-input bg-background px-4 py-2 focus-within:border-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events or hosts" aria-label="Search events or hosts" data-testid="input-search" className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="flex rounded-full border-2 border-foreground p-0.5">
            {TF.map(([v, l]) => <button key={v} aria-pressed={timeframe === v} onClick={() => setTimeframe(v)} data-testid={`button-timeframe-${v}`} className={`flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${timeframe === v ? "bg-foreground text-background" : "hover:bg-muted"}`}>{l}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["", ...CATEGORIES] as const).map(c => (
            <button key={c || "all"} aria-pressed={category === c} onClick={() => setCategory(c as EventCategory | "")} data-testid={`button-category-${c || "all"}`}
              className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold transition-all hover:-translate-y-0.5 ${category === c ? "border-foreground text-white" : "border-border bg-background"}`}
              style={category === c ? { background: c ? CAT_COLOR[c] : "hsl(var(--foreground))" } : undefined}>{c === "Networking" && <Handshake className="h-4 w-4" />}{c || "All"}</button>
          ))}
        </div>
        <fieldset className="border-t border-border pt-3">
          <legend className="flex items-center gap-1.5 pt-3 text-sm font-semibold"><GraduationCap className="h-4 w-4" />My class year</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["", ...CLASS_YEARS] as const).map(y => <button key={y || "all"} aria-pressed={classYear === y} onClick={() => setClassYear(y)} data-testid={`button-year-${y || "all"}`}
              className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${classYear === y ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-muted"}`}>{y || "Any year"}</button>)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{classYear ? `Showing ${classYear.toLowerCase()} and explicitly all-year events. Unspecified audiences are excluded; other registration or membership requirements may still apply.` : "Choose a year to see its stated audience plus events open to all years. No audience is guessed."}</p>
        </fieldset>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-sm">
          <span className="font-semibold">My free-time window</span>
          <label className="flex items-center gap-2">From <input type="time" value={availableFrom} onChange={e => setAvailableFrom(e.target.value)} data-testid="input-available-from" className="rounded-lg border-2 border-input bg-background px-2 py-1" /></label>
          <label className="flex items-center gap-2">to <input type="time" value={availableUntil} onChange={e => setAvailableUntil(e.target.value)} data-testid="input-available-until" className="rounded-lg border-2 border-input bg-background px-2 py-1" /></label>
          {(availableFrom || availableUntil) && <button onClick={() => { setAvailableFrom(""); setAvailableUntil(""); }} data-testid="button-clear-availability" className="text-xs underline">Clear</button>}
          <p className="w-full text-xs text-muted-foreground">{availabilityActive ? "Showing events fully inside this window with confirmed start and end times. No calendar connection needed." : availableFrom && availableUntil ? "End time must be later than start time." : "Optional: enter both times to find events that fit."}</p>
        </div>
      </section>
      <div className="flex items-center justify-between gap-3 text-sm" aria-live="polite">
        <span className="font-mono-cue text-muted-foreground">{isLoading ? "Finding events…" : isError ? "Feed unavailable" : `${matchingEvents.length} matching event${matchingEvents.length === 1 ? "" : "s"}`}</span>
        {filtersActive && <button onClick={reset} data-testid="button-clear-filters" className="flex items-center gap-1.5 font-semibold underline underline-offset-4"><RotateCcw className="h-3.5 w-3.5" />Clear filters</button>}
      </div>

      {isLoading ? <div className="grid gap-5 md:grid-cols-2">{[0,1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      : isError ? <div className="rounded-2xl border-2 border-dashed border-destructive p-10 text-center" data-testid="status-error">
          <p className="font-bold">The board didn't load.</p>
          <button onClick={() => refetch()} data-testid="button-retry" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background"><RotateCcw className="h-4 w-4" />Retry</button></div>
      : matchingEvents.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-foreground/40 p-12 text-center" data-testid="status-empty">
          <CalendarX className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-lg font-bold">Nothing matches that yet.</p>
          <p className="text-sm text-muted-foreground">Loosen a filter, or post an announcement you spotted.</p>
          <button onClick={reset} data-testid="button-reset" className="mt-4 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Clear filters</button></div>
      : <div className="grid gap-5 md:grid-cols-2">{matchingEvents.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} fits={availabilityActive} onOpen={() => setOpen(ev)} />)}</div>}
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />Source labels show where an announcement originally appeared.</p>
      <Detail ev={open} onClose={() => setOpen(null)} />
    </div>
  );
}
