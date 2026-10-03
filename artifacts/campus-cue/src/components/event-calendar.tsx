import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarX, Clock } from "lucide-react";
import type { Event } from "@workspace/api-client-react";
import { CAT_COLOR, fmtTime, timeRange } from "@/lib/cue";

const TZ = "America/Indiana/Indianapolis";
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const valid = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

function todayLocal() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return p;
}
function parse(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m: m - 1, d };
}
function dow(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d)).getUTCDay();
}
function longDate(s: string) {
  const { y, m, d } = parse(s);
  return `${DOW_FULL[dow(y, m, d)]}, ${MONTHS[m]} ${d}, ${y}`;
}
function sortEv(a: Event, b: Event) {
  return (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99") || a.title.localeCompare(b.title);
}

export function EventCalendar({ events, onOpen, anchorDate }: { events: Event[]; onOpen: (event: Event) => void; anchorDate?: string }) {
  const today = todayLocal();
  const { byDate, undated, earliest } = useMemo(() => {
    const byDate = new Map<string, Event[]>();
    const undated: Event[] = [];
    for (const ev of events) {
      if (valid(ev.eventDate)) {
        const l = byDate.get(ev.eventDate) ?? [];
        l.push(ev);
        byDate.set(ev.eventDate, l);
      } else undated.push(ev);
    }
    byDate.forEach(l => l.sort(sortEv));
    const earliest = Array.from(byDate.keys()).sort()[0];
    return { byDate, undated, earliest };
  }, [events]);

  const initial = () => {
    if (valid(anchorDate)) return anchorDate;
    const prefix = today.slice(0, 7);
    const inMonth = Array.from(byDate.keys()).some(k => k.startsWith(prefix));
    return inMonth || !earliest ? today : earliest;
  };
  const [sel, setSel] = useState<string>(initial);
  const [view, setView] = useState(() => { const p = parse(initial()); return { y: p.y, m: p.m }; });

  useEffect(() => {
    if (valid(anchorDate)) {
      const p = parse(anchorDate);
      setSel(anchorDate);
      setView({ y: p.y, m: p.m });
    }
  }, [anchorDate]);

  const shift = (n: number) => {
    const t = view.y * 12 + view.m + n;
    const y = Math.floor(t / 12);
    const m = ((t % 12) + 12) % 12;
    setView({ y, m });
    const prefix = `${y}-${pad(m + 1)}`;
    setSel(Array.from(byDate.keys()).filter(date => date.startsWith(prefix)).sort()[0] ?? key(y, m, 1));
  };
  const goToday = () => { const p = parse(today); setView({ y: p.y, m: p.m }); setSel(today); };

  const first = dow(view.y, view.m, 1);
  const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const monthPrefix = `${view.y}-${pad(view.m + 1)}`;
  const monthCount = Array.from(byDate.entries()).filter(([k]) => k.startsWith(monthPrefix)).reduce((n, [, l]) => n + l.length, 0);
  const selEvents = byDate.get(sel) ?? [];

  return (
    <div id="event-calendar" className="scroll-mt-20 space-y-5" data-testid="calendar-events">
      <div className="min-w-0 rounded-2xl border-2 border-foreground bg-card p-3 stamp sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-extrabold" data-testid="text-calendar-month">{MONTHS[view.m]} {view.y}</h2>
            <p className="font-mono-cue text-xs text-muted-foreground" data-testid="text-calendar-month-count">{monthCount} event{monthCount === 1 ? "" : "s"} this month</p>
            <p className="mt-1 text-xs text-muted-foreground">Select a day to see its events. Times are campus-local Eastern time; all your filters still apply.</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => shift(-1)} aria-label="Previous month" data-testid="button-calendar-prev" className="rounded-full border-2 border-foreground p-1.5 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={goToday} data-testid="button-calendar-today" className="rounded-full border-2 border-foreground px-3 py-1 text-sm font-semibold hover:bg-muted">Today</button>
            <button onClick={() => shift(1)} aria-label="Next month" data-testid="button-calendar-next" className="rounded-full border-2 border-foreground p-1.5 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {DOW.map(d => <div key={d} className="py-1 text-center font-mono-cue text-[10px] uppercase text-muted-foreground sm:text-xs">{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} aria-hidden className="min-h-12 rounded-md bg-muted/30 sm:min-h-24" />;
            const k = key(view.y, view.m, d);
            const list = byDate.get(k) ?? [];
            const isSel = k === sel;
            return (
              <button key={i} onClick={() => setSel(k)} aria-pressed={isSel} aria-label={`${longDate(k)}, ${list.length} event${list.length === 1 ? "" : "s"}`} data-testid={`button-calendar-day-${k}`}
                className={`flex min-h-12 min-w-0 flex-col items-stretch overflow-hidden rounded-md border-2 p-1 text-left transition-colors sm:min-h-24 ${isSel ? "border-foreground bg-accent/50" : "border-border bg-background hover:bg-muted"}`}>
                <span className="flex items-center justify-between">
                  <span className={`text-xs font-bold sm:text-sm ${k === today ? "rounded-full bg-primary px-1.5 text-primary-foreground" : ""}`}>{d}</span>
                  {list.length > 0 && <span className="rounded-full bg-foreground px-1.5 text-[10px] font-bold text-background" data-testid={`text-calendar-count-${k}`}>{list.length}</span>}
                </span>
                <span className="mt-1 hidden min-w-0 flex-col gap-0.5 sm:flex">
                  {list.slice(0, 2).map(ev => (
                    <span key={ev.id} className="truncate rounded px-1 text-[10px] font-semibold text-white" style={{ background: CAT_COLOR[ev.category] }}>{ev.title}</span>
                  ))}
                  {list.length > 2 && <span className="text-[10px] text-muted-foreground">+{list.length - 2} more</span>}
                </span>
                {list.length > 0 && <span className="mt-auto flex gap-0.5 pt-1 sm:hidden">{list.slice(0, 3).map(ev => <span key={ev.id} className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_COLOR[ev.category] }} />)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <section className="rounded-2xl border-2 border-foreground bg-card p-4 stamp" aria-live="polite" data-testid="section-calendar-agenda">
        <h3 className="text-xl font-extrabold" data-testid="text-agenda-date">{longDate(sel)}</h3>
        {selEvents.length === 0 ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border-2 border-dashed border-foreground/30 p-4 text-sm text-muted-foreground" data-testid="status-agenda-empty">
            <CalendarX className="h-6 w-6 shrink-0 text-primary" />No matching events on this day.
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {selEvents.map(ev => <AgendaItem key={ev.id} ev={ev} onOpen={onOpen} />)}
          </ul>
        )}
      </section>

      {undated.length > 0 && (
        <section className="rounded-2xl border-2 border-dashed border-foreground/40 p-4" data-testid="section-calendar-undated">
          <h3 className="font-bold">Date unconfirmed ({undated.length})</h3>
          <p className="text-xs text-muted-foreground">These listings did not state a date, so they are not placed on the calendar.</p>
          <ul className="mt-3 space-y-2">
            {undated.map(ev => <AgendaItem key={ev.id} ev={ev} onOpen={onOpen} />)}
          </ul>
        </section>
      )}
    </div>
  );
}

function AgendaItem({ ev, onOpen }: { ev: Event; onOpen: (e: Event) => void }) {
  const t = ev.startTime ? timeRange(ev.startTime, ev.endTime)
    : ev.endTime ? `Start time unconfirmed · Ends ${fmtTime(ev.endTime)}` : "Time unconfirmed";
  return (
    <li>
      <button onClick={() => onOpen(ev)} data-testid={`button-agenda-event-${ev.id}`}
        className="flex w-full min-w-0 items-stretch gap-3 rounded-xl border-2 border-foreground bg-background p-3 text-left hover:bg-muted">
        <span className="w-1.5 shrink-0 rounded-full" style={{ background: CAT_COLOR[ev.category] }} />
        <span className="min-w-0 flex-1">
          <span className="block break-words font-bold leading-snug">{ev.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: CAT_COLOR[ev.category] }}>{ev.category}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{t}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

export default EventCalendar;
