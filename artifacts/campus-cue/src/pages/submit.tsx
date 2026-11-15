import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, CheckCircle2, AlertTriangle, Loader2, Send, X } from "lucide-react";
import { useParseAnnouncement, useCreateEvent, getGetEventsQueryKey, getGetEventOverviewQueryKey, type ParsedEvent, type EventSource, type EventCategory, type ClassYear } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, CLASS_YEARS, SOURCES, SourceIcon, EventArt } from "@/lib/cue";

type Draft = { key: number; ev: ParsedEvent; tags: string; done: boolean; removed: boolean; reviewed: boolean; summaryDate: string | null };
const fld = "w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function failureMessage(error: unknown, fallback: string) {
  const data = (error as { data?: { error?: unknown } } | null)?.data;
  return typeof data?.error === "string" ? data.error : fallback;
}

function Field({ label, missing, children }: { label: string; missing?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 flex items-center gap-2 font-mono-cue uppercase text-muted-foreground">{label}{missing && <span className="rounded bg-accent px-1.5 text-[10px] text-accent-foreground">unconfirmed</span>}</span>
      {children}
    </label>
  );
}

function DraftCard({ d, idx, update, publish, remove, confirmReview, pending, busy }: { d: Draft; idx: number; update: (p: Partial<ParsedEvent>, tags?: string) => void; publish: () => void; remove: () => void; confirmReview: (value: boolean) => void; pending: boolean; busy: boolean }) {
  const e = d.ev;
  const nul = (v: string) => v.trim() === "" ? null : v;
  if (d.done) return (
    <div className="pop flex items-center gap-3 rounded-2xl border-2 border-foreground bg-accent/40 p-4 stamp" data-testid={`status-published-${idx}`}>
      <CheckCircle2 className="h-6 w-6 text-chart-2" />
      <div className="flex-1"><p className="font-bold">{e.title}</p><p className="text-xs text-muted-foreground">Published to the feed.</p></div>
      <Link href="/" className="text-sm font-semibold underline">View feed</Link>
    </div>
  );
  return (
    <div className="rise overflow-hidden rounded-2xl border-2 border-foreground bg-card stamp" data-testid={`card-draft-${idx}`}>
      <div className="flex items-center gap-3 border-b-2 border-foreground bg-muted px-4 py-2">
        <EventArt seed={idx + 1} category={e.category} className="h-8 w-8 rounded" />
        <span className="font-mono-cue text-xs uppercase">Suggested event {idx + 1}</span>
        <button onClick={() => { confirmReview(false); document.querySelector<HTMLInputElement>(`[data-testid="input-title-${idx}"]`)?.focus(); }} className="ml-auto rounded border px-2 py-1 text-xs font-bold" data-testid={`button-edit-${idx}`}>Edit</button>
        <button onClick={remove} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive" aria-label="Discard" data-testid={`button-discard-${idx}`}><X className="h-4 w-4" />Discard</button>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {e.uncertainties.length > 0 && <div className="sm:col-span-2 rounded-lg bg-accent/40 p-3 text-xs"><p className="mb-1 flex items-center gap-1 font-bold"><AlertTriangle className="h-3.5 w-3.5" />Check these</p><ul className="list-disc pl-4">{e.uncertainties.map((u, i) => <li key={i}>{u}</li>)}</ul></div>}
        <div className="sm:col-span-2"><Field label="Title" missing={!e.title.trim()}><input className={fld} value={e.title} placeholder="Not confirmed" onChange={x => update({ title: x.target.value })} data-testid={`input-title-${idx}`} /></Field></div>
        <div className="sm:col-span-2"><Field label="Summary"><textarea rows={3} className={fld} value={e.summary} onChange={x => update({ summary: x.target.value })} data-testid={`input-summary-${idx}`} /></Field></div>
        <Field label="Date" missing={!e.eventDate}><input type="date" className={fld} value={e.eventDate ?? ""} onChange={x => update({ eventDate: nul(x.target.value) })} data-testid={`input-date-${idx}`} /></Field>
        <Field label="Location" missing={!e.location}><input className={fld} value={e.location ?? ""} placeholder="Not confirmed" onChange={x => update({ location: nul(x.target.value) })} data-testid={`input-location-${idx}`} /></Field>
        <Field label="Start" missing={!e.startTime}><input type="time" className={fld} value={e.startTime ?? ""} onChange={x => update({ startTime: nul(x.target.value) })} data-testid={`input-start-${idx}`} /></Field>
        <Field label="End (optional)" missing={!e.endTime}><input type="time" className={fld} value={e.endTime ?? ""} onChange={x => update({ endTime: nul(x.target.value) })} data-testid={`input-end-${idx}`} /></Field>
        <Field label="Host" missing={!e.hostOrganization}><input className={fld} value={e.hostOrganization ?? ""} placeholder="Not confirmed" onChange={x => update({ hostOrganization: nul(x.target.value) })} data-testid={`input-host-${idx}`} /></Field>
        <Field label="Category"><select className={fld} value={e.category} onChange={x => update({ category: x.target.value as EventCategory })} data-testid={`select-category-${idx}`}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Tags (comma separated)"><input className={fld} value={d.tags} onChange={x => update({}, x.target.value)} data-testid={`input-tags-${idx}`} /></Field>
        <Field label="Original channel"><select className={fld} value={e.source} onChange={x => update({ source: x.target.value as EventSource })} data-testid={`select-source-${idx}`}>{SOURCES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <div className="sm:col-span-2"><Field label="Original listing URL (optional)"><input type="url" className={fld} value={e.sourceUrl ?? ""} placeholder="https://..." onChange={x => update({ sourceUrl: nul(x.target.value) })} data-testid={`input-source-url-${idx}`} /></Field></div>
        <fieldset className="sm:col-span-2 rounded-lg border-2 border-input p-3">
          <legend className="px-1 text-xs font-mono-cue uppercase text-muted-foreground">Stated class-year audience</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {(["All years", ...CLASS_YEARS] as ClassYear[]).map(year => <label key={year} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" data-testid={`checkbox-year-${idx}-${year}`} checked={(e.classYears ?? []).includes(year)} onChange={x => {
                const current = e.classYears ?? [];
                update({ classYears: x.target.checked ? year === "All years" ? ["All years"] : [...current.filter(y => y !== "All years"), year] : current.filter(y => y !== year) });
              }} />{year}
            </label>)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Leave unchecked if the source does not specify an audience. Select “All years” only if everyone is explicitly welcome. Keep other participation requirements in the summary.</p>
        </fieldset>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed p-3">
        <div className="min-w-0 flex-1">
          <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={d.reviewed} onChange={event => confirmReview(event.target.checked)} data-testid={`checkbox-reviewed-${idx}`} /><span>I checked the title, date, start time, and summary against the source. Unresolved details remain unconfirmed.</span></label>
          {(!e.title.trim() || !e.eventDate || !e.startTime) && <p className="mt-2 text-xs text-destructive" data-testid={`error-required-${idx}`}>A confirmed title, date, and start time are required to publish.</p>}
        </div>
        <button onClick={publish} disabled={busy || !e.title.trim() || !e.eventDate || !e.startTime || !d.reviewed} data-testid={`button-publish-${idx}`} className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publish to feed
        </button>
      </div>
    </div>
  );
}

export default function Submit() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const parse = useParseAnnouncement();
  const create = useCreateEvent();
  const [text, setText] = useState("");
  const [originalPostTime, setOriginalPostTime] = useState("");
  const [reviewSource, setReviewSource] = useState("");
  const [source, setSource] = useState<EventSource>("Email");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [pendingKey, setPendingKey] = useState<number | null>(null);
  const [empty, setEmpty] = useState(false);

  const run = () => {
    if (drafts.some(d => !d.done && !d.removed) && !window.confirm("Replace the unpublished drafts? They are not saved automatically.")) return;
    const submittedText = text.trim();
    setDrafts([]); setNotes([]); setEmpty(false);
    parse.mutate({ data: { announcement: submittedText, source, ...(originalPostTime ? { originalPostTime } : {}) } }, {
      onSuccess: (r) => {
        setReviewSource(submittedText);
        setNotes(r.notes);
        setEmpty(r.events.length === 0);
        setDrafts(r.events.map((ev, i) => ({ key: Date.now() + i, ev, tags: ev.tags.join(", "), done: false, removed: false, reviewed: false, summaryDate: ev.eventDate })));
      },
      onError: (error) => toast({ title: "Extraction failed", description: failureMessage(error, "Check the text and try again."), variant: "destructive" }),
    });
  };
  const patch = (key: number, p: Partial<ParsedEvent>, tags?: string) =>
    setDrafts(ds => ds.map(d => {
      if (d.key !== key) return d;
      const ev = { ...d.ev, ...p };
      if (p.eventDate && d.summaryDate && p.eventDate !== d.summaryDate) {
        const label = (date: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00Z`));
        ev.summary = ev.summary.split(label(d.summaryDate)).join(label(p.eventDate));
      }
      return { ...d, ev, tags: tags ?? d.tags, reviewed: false, summaryDate: p.eventDate || d.summaryDate };
    }));
  const publish = (d: Draft) => {
    if (!d.reviewed || !d.ev.title.trim() || !d.ev.eventDate || !d.ev.startTime) {
      toast({ title: "Review required", description: "Confirm title, date, start time and your review against the source.", variant: "destructive" });
      return;
    }
    const { missingFields: _m, uncertainties: _u, ...input } = d.ev;
    void _m; void _u;
    setPendingKey(d.key);
    create.mutate({ data: { ...input, reviewConfirmed: true, tags: d.tags.split(",").map(t => t.trim()).filter(Boolean) } }, {
      onSuccess: (ev) => {
        setDrafts(ds => ds.map(x => x.key === d.key ? { ...x, done: true } : x));
        qc.invalidateQueries({ queryKey: getGetEventsQueryKey() });
        qc.invalidateQueries({ queryKey: ["/api/events"] });
        qc.invalidateQueries({ queryKey: getGetEventOverviewQueryKey() });
        toast({ title: "Published", description: `${ev.title} is now in the feed.` });
      },
      onError: (error) => toast({ title: "Could not publish", description: failureMessage(error, "Please try again."), variant: "destructive" }),
      onSettled: () => setPendingKey(null),
    });
  };
  const visible = drafts.filter(d => !d.removed);
  const tooShort = text.trim().length < 12;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <p className="font-mono-cue text-xs uppercase tracking-widest text-primary">Step 1</p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Paste the announcement.</h1>
        <p className="text-sm text-muted-foreground">Drop in an email, caption or chat message. We suggest the details; you review every field before anything goes live.</p>
        <p className="rounded-lg border border-border bg-muted p-3 text-xs">Paste only announcements you are allowed to share. Remove names, phone numbers, private links, and other private details first. Text is sent to the configured external OpenAI-compatible AI service via Replit for live extraction. The app does not save raw announcements to its database or browser storage; text remains in page memory until cleared or you leave. Provider/platform retention is outside this app’s control. No account or private chat is connected.</p>
        <label className="block text-sm font-semibold">Original post time (optional, campus time)
          <input type="datetime-local" value={originalPostTime} onChange={event => setOriginalPostTime(event.target.value)} data-testid="input-original-post-time" className={`${fld} mt-1`} />
        </label>
        <p className="text-xs text-muted-foreground">For older text, use the original post time; otherwise submission time is used. Campus timezone: America/Indiana/Indianapolis, including daylight saving. “This Thursday” is the coming Thursday including today; “next Thursday” is seven days later. Check the displayed reference after extraction.</p>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10} maxLength={12000} aria-label="Original campus announcement" data-testid="input-announcement" placeholder="Paste the original text here..." className={`${fld} stamp border-foreground`} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-semibold"><SourceIcon source={source} className="h-4 w-4" />
            <select value={source} onChange={e => setSource(e.target.value as EventSource)} data-testid="select-announcement-source" className="rounded-lg border-2 border-input bg-background px-3 py-2 text-sm">{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
          </label>
          <button onClick={run} disabled={tooShort || parse.isPending} data-testid="button-extract" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 disabled:opacity-50 sm:ml-auto">
            {parse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{parse.isPending ? "Reading..." : "Extract events"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">The channel is a label for where the text came from, not a connected service. {tooShort && "Needs at least 12 characters."}</p>
        <button disabled={parse.isPending || create.isPending} onClick={() => { setText(""); setReviewSource(""); setDrafts([]); setNotes([]); setOriginalPostTime(""); setEmpty(false); }} className="text-xs font-semibold underline" data-testid="button-clear-private-input">Clear input and drafts</button>
        <p className="text-xs text-muted-foreground">Live AI + deterministic date checks, not prewritten responses. Date/time-only fragments use clearly labeled rule-based partial drafts without an AI call. Drafts are not automatically published or saved. Leaving or clearing this page discards unpublished work.</p>
      </section>

      <section className="space-y-5">
        <p className="font-mono-cue text-xs uppercase tracking-widest text-primary">Step 2: review and publish</p>
        {parse.isPending && [0, 1].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
        {notes.length > 0 && <div className="rounded-xl border-2 border-dashed border-foreground/40 p-3 text-sm" data-testid="text-parse-notes">{notes.map((n, i) => <p key={i}>{n}</p>)}</div>}
        {reviewSource && <details className="rounded-lg border border-border p-3"><summary className="cursor-pointer text-sm font-bold">Original text used for these drafts</summary><pre className="mt-2 whitespace-pre-wrap break-words text-xs" data-testid="text-review-source">{reviewSource}</pre></details>}
        {visible.map((d) => {
          const idx = drafts.indexOf(d);
          return <DraftCard key={d.key} d={d} idx={idx} pending={pendingKey === d.key} busy={create.isPending} confirmReview={reviewed => setDrafts(ds => ds.map(x => x.key === d.key ? { ...x, reviewed } : x))} update={(p, t) => patch(d.key, p, t)} publish={() => publish(d)} remove={() => setDrafts(ds => ds.map(x => x.key === d.key ? { ...x, removed: true } : x))} />;
        })}
        {!parse.isPending && visible.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-foreground/40 p-12 text-center" data-testid="status-review-empty">
            <Sparkles className="mx-auto h-9 w-9 text-primary" />
            <p className="mt-3 font-bold">{empty ? "No events found in that text." : drafts.length ? "All suggestions handled." : "Suggested events show up here."}</p>
            <p className="text-sm text-muted-foreground">{empty ? "Try pasting the full announcement." : drafts.length ? <Link href="/" className="underline">Back to the feed</Link> : "Each one gets its own editable card."}</p>
          </div>
        )}
      </section>
    </div>
  );
}
