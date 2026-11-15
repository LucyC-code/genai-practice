# CampusCue — Notre Dame campus event discovery

CampusCue helps Notre Dame students discover relevant campus events and turn informal announcements into clear, reviewable event cards. It is a responsive classroom prototype, not an authoritative university calendar or a production moderation system.

## Try the prototype

[Open the current development preview](https://c60c30f1-5962-46a3-86b4-fb4c75bfa134-00-3v0i52r6al0f8.spock.replit.dev/).

No application sign-in is implemented. Start the existing API and CampusCue web workflows in this project, open Preview, and choose **Discover** or **Submit**. Development URLs are temporary and are not a permanent published deployment. Check instructor access separately; replace this link with a stable published URL if one is created. Do not put credentials in this README.

## What works

- Search; up to four categories combined with **OR**; stated class-year eligibility; date, activity, sport, and availability filters.
- List/calendar views, event details, original source links, calendar exports, and reporting inaccurate listings.
- Expandable **Campus Masses** cards for explicitly identified recurring worship schedules. Date/time/audience filters run **before** grouping. Expand to see every matching occurrence, venue, and source.
- Separate occurrence/card counts and card-level pagination. Strict exact-content duplicates can share a presentation entry; database records are not deleted.
- Paste an announcement, extract drafts, inspect original text and the reference timestamp, edit, discard, explicitly confirm review, and publish.
- Publication requires a title, valid date, start time, and review confirmation in both UI and API. Other missing facts remain unconfirmed.

## AI: actual implementation

The existing server requests **`gpt-5.4-mini`** through an OpenAI-compatible Replit AI integration. This is live extraction, not prewritten sample responses. Input is pasted announcement text, its source label, and a campus-local date reference. Output is up to ten structured drafts, uncertainty notes, and missing-field labels. AI helps separate multiple announcements and identify event facts without requiring students to fill every field manually.

Deterministic code validates dates/times, resolves supported relative dates, normalizes summaries, and checks publication requirements. A narrow date/time-only fragment such as “tomorrow at 7pm” produces a clearly labeled **rule-based incomplete draft**, with an empty title and no AI request. It cannot be published until its identity is supplied and reviewed. This is not a simulated fallback. Ordinary AI failures return a visible error and publish nothing.

Model configuration is not a guarantee of factual correctness. One evaluated challenge produced an incorrect model weekday date; deterministic rules corrected the structured date and summary. Users must still check the source.

### Date and availability rules

- Campus timezone: **America/Indiana/Indianapolis**, with IANA daylight-saving rules.
- Optional original post time: use a campus-local date/time or an offset-aware ISO timestamp through the API. Otherwise, use server submission time. The review screen states the actual reference used. Changing the input reference requires extracting again.
- “This Thursday” is the upcoming Thursday **including today**. “Next Thursday” is seven days after that occurrence. Other weekdays follow the same rule; review warnings explain that conversational usage can differ.
- At October 30, 2026, 9:30 PM campus time, “tomorrow” is **October 31**, not November 1.
- New reviewed summaries use absolute dates. Editing a draft’s structured date also updates the generated readable date in its summary.
- Blank availability boundaries do not restrict time. A partial, invalid, or equal-boundary window produces an explanation and zero matches.
- Known start/end intervals must fit completely. Start-only events can match by start, clearly labeled **End time not confirmed**. Unknown starts do not match a strict window.
- `22:00–02:00` crosses midnight. With a date, include the next morning of that night. Without a date, use the same wall-time rule each night. Today/rolling-seven-day windows also include their final night’s next morning.
- Calendar-day arithmetic avoids UTC date shifts. Availability represents campus **wall time**, not an elapsed-hours calculation across a clock change. A repeated fall-back hour remains ambiguous without an offset; verify with the organizer.
- Default discovery shows today/future calendar dates, plus undated legacy listings. Choose a date to revisit past records. “Upcoming” is calendar-day based, not a guarantee that today’s start time has not passed.

## Data, persistence, and privacy

Existing PostgreSQL event/report data and original source links are preserved. Public-source import fixtures are under `scripts/data/`: NDCentral, university/SAO calendars, official department/library/athletics pages, Campus Ministry/Basilica schedules, and organizer-confirmed alumni/Mendoza/Giving Society events. Imports are researched snapshots, **not** continuous synchronization. Published weekly schedules are labeled occurrences with documented semester exceptions, not thousands of independently announced special events.

The app does not connect to private GroupMe, email, or Instagram accounts. A source selector is only a label. Before extraction, students are told to share only authorized announcements and remove private names, contact details, private links, and other sensitive information.

- Ordinary pasted announcements are sent to the configured external AI service via Replit. Provider/platform retention is outside this app’s control; no zero-retention guarantee is made.
- Raw text and review drafts live in React page memory, not the app database, localStorage, or sessionStorage. Original text remains available while reviewing. Clear input/drafts or leave the page to discard it. Draft autosave is not implemented.
- Request logs omit bodies and query strings. Extraction failures omit provider error payloads; generic server errors log the error type rather than potentially sensitive request contents.
- Only an explicitly published structured card is inserted. Raw announcement text is not automatically inserted. The summary/fields **can still contain private facts** if users fail to remove/review them.
- Review confirmation is a human attestation, not authentication or proof of truth. A determined API client can lie about having reviewed. No automated privacy scrubber, organizer verification, or private-data access integration is claimed.
- Existing imported records can have unknown times/eligibility and were not retroactively “confirmed.” New publication rules do not fabricate missing legacy values.

## Run and verify

Use the existing pnpm workspace and managed Replit workflows:

1. `pnpm install` if dependencies are missing.
2. Start **artifacts/api-server: API Server** (`pnpm --filter @workspace/api-server run dev`).
3. Start **artifacts/campus-cue: web** (`pnpm --filter @workspace/campus-cue run dev`).
4. Open the CampusCue artifact in Preview. Managed routing sends `/api` to the API service and `/` to the frontend; do not substitute unproxied localhost links.

Keep the existing PostgreSQL connection and AI integration configured. Never commit their values. No database migration or new integration was required for these revisions.

From the repository root:

```sh
pnpm run typecheck
scripts/node_modules/.bin/tsx --test artifacts/api-server/src/lib/date-reference.test.ts artifacts/campus-cue/src/lib/*.test.ts
PORT=22554 BASE_PATH=/ pnpm --filter @workspace/campus-cue run build
pnpm --filter @workspace/api-server run build
```

Contract changes: `pnpm --filter @workspace/api-spec run codegen`.

Optional live development API evaluation (uses external AI requests; does not publish):

```sh
pnpm --filter @workspace/scripts exec tsx src/evaluate-revision.ts
pnpm --filter @workspace/scripts exec tsx src/evaluate-revision.ts --fragment-only
```

The full live evaluator overwrites its results file and depends on a running development API, AI availability, and the current research snapshot. The API limits extraction to 15 requests per IP per ten minutes. The historical baseline script documents old expressions; it is not the current regression suite.

## Assignment documentation

- [Revision rationale, risk response, evaluation and next priorities](revision.md)
- [Expected outcomes recorded before evaluation](evaluation-plan.md)
- [Executed pre-edit baseline](evaluation-baseline.json)
- [Live API evidence](evaluation-api-results.json) and [targeted fragment follow-up](evaluation-fragment-results.json)
- [Browser evaluation](evaluation-browser.md)
- [AI-use disclosure and personal-contribution placeholders](ai-use-disclosure.md)
- [2–3 minute demo script](demo-script.md)

### Implemented / simulated / planned

Implemented functionality is listed above and evaluated in `revision.md`. There is no simulated “successful AI” fallback. Synthetic test announcements are test data, not real campus events. Broader recurring-series metadata, optional privacy detection, draft recovery, source freshness checks, and organizer correction workflows are not claimed as completed by this revision.

## Demo Video

**Placeholder — add your Google Drive recording link here: `[YOUR GOOGLE DRIVE DEMO VIDEO LINK]`.**

No recording or upload was performed by this revision. Record the walkthrough, upload it, grant the instructor the required access, add the link here, and submit the repository link **plus the video file** in Canvas as instructed.
