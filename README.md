# CampusCue — Notre Dame campus event discovery

CampusCue helps Notre Dame students discover relevant campus events and turn informal announcements into clear, reviewable event cards. It is a responsive classroom prototype, not an authoritative university calendar or a production moderation system.

## Try the prototype

### Project links

- [Open the live prototype](https://campus-event-discovery.replit.app/)
- [Open the Replit project](https://replit.com/@lcrowe4/Campus-Event-Discovery)
- [View the GitHub repository](https://github.com/LucyC-code/genai-practice)
- [Watch the demo video on Google Drive](https://drive.google.com/file/d/1efvcp-Az_a28L-IN0A6WUYThZkHUHkI1/view?usp=sharing)

### Source synchronization and evaluation status

This merge combines the updated Replit application code with GitHub's latest README revision, `9eba0b9`. The earlier GitHub README evaluated older repository code at `0667d820792a05318050b34569681e3922832967` and correctly reported that source synchronization was still needed at that time. That source gap is addressed by this merge; the earlier findings are preserved in full in the historical section below, not presented as new tests of this commit.

The newer Replit evaluation recorded **31 passing regression tests**, type checks, frontend/API builds, live extraction repeats, publication validation, and browser checks with targeted follow-up fixes. See [revision.md](revision.md), [the API evidence](evaluation-api-results.json), and [the browser report](evaluation-browser.md) for scope, dates, initial failures, and fixes. These are recorded evaluations, not claims of production readiness or a fresh live-model test run during Git synchronization.

Fresh synchronization checks passed: workspace TypeScript checks and **31/31 regression tests**. The Replit application and evaluation files were confirmed unchanged by the merge, and the historical GitHub README was verified verbatim, including the demo link and results. Outgoing historical blobs and the merged README were checked for common token, private-key, and credential-URL patterns; no matches were found. No live AI requests, browser tests, dependency installation, database changes, or deployment were performed for this Git-only synchronization.

### Development access

[Open the current development preview](https://c60c30f1-5962-46a3-86b4-fb4c75bfa134-00-3v0i52r6al0f8.spock.replit.dev/).

No application sign-in is implemented. Start the existing API and CampusCue web workflows in this project, open Preview, and choose **Discover** or **Submit**. Development URLs are temporary and are not a permanent published deployment; use the live prototype link above for submission. The live and video links were preserved from GitHub's latest README; their access permissions and deployed revision were not independently audited during this source synchronization. Do not put credentials in this README.

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

On November 15, 2026, 50 more student opportunities dated November 16–December 8 were curated from current public NDCentral listings and added without changing the previous 1,879 records. The fixture `scripts/data/notre-dame-november-student-events.json` preserves source links, graduate/program and club restrictions, the Thanksgiving meal's advance-ticket deadline, and an explicitly overnight Board Game Night. Unknown class-year eligibility is left unset rather than guessed. Curated imports now require an explicit `--reviewed` approval in addition to `--apply`:

```bash
pnpm --filter @workspace/scripts exec tsx src/import-campus-events.ts --fixture data/notre-dame-november-student-events.json
# After checking the original sources:
pnpm --filter @workspace/scripts exec tsx src/import-campus-events.ts --fixture data/notre-dame-november-student-events.json --reviewed --apply
```

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

[Watch the demo video on Google Drive](https://drive.google.com/file/d/1efvcp-Az_a28L-IN0A6WUYThZkHUHkI1/view?usp=sharing).

This is the video link from the latest GitHub README. No recording, upload, or sharing-permission change was performed during synchronization. Verify instructor access and submit the repository link **plus the video file** in Canvas as instructed.

## Historical GitHub README and evaluation

The complete README from GitHub commit `9eba0b9` is preserved below. Its references to unsynchronized code, outstanding tests, old counts, and submission TODOs describe that earlier evaluation, not the current merged repository. Later evidence above and in the linked evaluation files supplements—not erases—those results.

<details>
<summary>Expand the preserved GitHub README snapshot</summary>

CampusCue — Campus Event Discovery
CampusCue helps Notre Dame students find relevant campus events in one feed and turn informal announcements into structured, editable event cards. Its central task is to reduce searching and manual entry while making uncertain information visible.
## Project Links

- [Open the live prototype](https://campus-event-discovery.replit.app/)
- [Open the Replit project](https://replit.com/@lcrowe4/Campus-Event-Discovery)
- [View the GitHub repository](https://github.com/LucyC-code/genai-practice)
- https://drive.google.com/file/d/1efvcp-Az_a28L-IN0A6WUYThZkHUHkI1/view?usp=sharing - video link
Verification and version status
Last checked: November 15, 2026. This README records actual browser tests, live API checks, and local checks of repository commit 0667d820792a05318050b34569681e3922832967.

Important: the deployed Replit app is ahead of the GitHub application code checked here. The live app includes recurring-event grouping, revised availability handling, campus-local extraction, and stronger review controls. The checked GitHub version still contains UTC-based extraction and the earlier availability/publication logic. Updating this README does not synchronize that code. Push the current Replit source to this repository before claiming the repository reproduces the revised app, then rerun its checks.
How to use the live app
Discover events
1. Open Discover and select up to four categories.
2. Optionally select a class year, activity, sport, or date.
3. Enter both availability times, or leave both blank.
4. Expand Campus Masses → View times and locations to inspect individual occurrences and original-source links.
Category selection uses OR: an event can match any selected category. The Graduate filter includes explicitly graduate and all-year events, excluding unspecified audiences.

The live interface documents campus time as America/Indiana/Indianapolis. Known event intervals must fit completely within availability. Start-only events can match with the end visibly unconfirmed. Unknown starts are excluded. A later From time than To time represents an overnight window; a partial window shows validation rather than unrestricted results.
Extract and review an announcement
1. Open Submit.
2. Paste an announcement you are allowed to share and select its channel.
3. For older text, enter the original post time in campus time; otherwise submission time is used.
4. Select Extract events.
5. Review the editable draft, source text, displayed reference time, and Check these notes.
6. Correct details, confirm the review checkbox, and publish only a verified event. Discard unwanted drafts.
Example: Free boba and board games tomorrow at 7pm in Duncan 210.

The live form requires a title, date, and start time before publication. Missing hosts and other unresolved details remain unconfirmed. The verification session did not publish synthetic events into the public feed.
What AI does
Input: Announcement text, source-channel label, and reference-time context.

Output: Event title, summary, date, times, location, host, category, tags, audience, and uncertainty notes.

Value: Students can turn informal text into a reviewable card without transcribing every field manually. AI output is not verification that an event is authentic or correct.
Live, rule-based, and planned behaviour
- Live extraction: The checked repository makes server-side OpenAI-compatible calls configured for gpt-5.4-mini. Live responses also identify this configured model and report deterministic campus-date validation. This is not the prewritten-response simulation described in the old README.
- Date checks in the deployment: The historical late-night test produced the correct date. A challenge response explicitly reported correcting an AI-proposed date using a deterministic rule.
- Rule-based partial drafts: The live app handles a date/time-only fragment such as tomorrow at 7pm without an AI call. It labels this clearly, leaves the title blank, and prevents publication as a complete event.
- Source labels: Selecting GroupMe, Instagram, or Email labels pasted content; it does not connect an account or automatically read private messages.
- Preloaded listings: The app identifies its listings as researched snapshots and says it does not automatically synchronize sources. Check original listings for changes.
- Not established by this evaluation: Automatic flyer-image extraction, private-source integrations, comprehensive duplicate detection, or production-level model reliability.
The live weekday rule is: “this Thursday” means the upcoming Thursday including today; “next Thursday” is seven days after that. Casual language can differ, so the result requires review.
Response to peer feedback
Feedback	Decision and observed change	Status
Dorm Masses dominated results.	Group recurring Masses while preserving occurrence dates, locations, and source links.	Verified in live browser.
10 PM–2 AM returned unchanged results.	Support overnight filtering and make partial-input errors explicit.	Live narrowing and reset verified; full synthetic boundary suite remains outstanding.
Late-night “tomorrow” was one day late.	Use campus-local reference time and allow an original post timestamp.	Historical regression passed through API and browser.
Summaries retained “tomorrow.”	Use absolute dates in extracted summaries.	Verified in tested drafts/API outputs.
Missing details and “Check these” were useful.	Preserve editable fields and add explicit review and required-field controls.	Missing-start publication remained disabled after review was checked.
README contradicted the app.	Replace simulation claims with tested implementation details and distinguish live deployment from repository code.	Updated in this README.
Privacy of collected announcements was unclear.	Display processing, source-label, and retention explanations before extraction.	Notice observed; external retention was not independently audited.


The three priorities remain useful discovery, reliable scheduling, and transparent review. New integrations and broad redesigns are outside this revision's scope.
Evaluation results
Expected outcomes below follow the test criteria set before execution. Tests used synthetic announcements and existing public feed records. Pass applies to the stated scope, not every possible input. Counts are snapshots from November 15, 2026.
Case / method	Input or action	Expected result	Actual result	Outcome and implication
Typical extraction — live API, three runs	Boba announcement; original post time 2026-10-30T21:30; GroupMe	October 31, 19:00, Duncan 210, no invented host, absolute-date summary	All three returned 2026-10-31, 19:00, Duncan 210, null host/end, Social category, and absolute-date summaries.	Pass. Core details stable across these repeats.
Typical discovery — browser	Career, Networking, Social, Faith & Spirituality; Graduate; blank availability	Preserve filters and make recurring occurrences accessible through grouping	426 matching occurrences displayed as 5 cards; 422 Mass occurrences shared one expandable card with dated times, venues, and source links.	Pass. Grouping reduces visual repetition; the available mix still depends on source data and audience labels.
Challenge — live API	Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP.; reference October 30 at 21:30	November 5 under the documented rule; missing time/host not invented	Returned November 5, DeBartolo, null start/end/host. An uncertainty note reported correcting the model's proposed October 30 date.	Pass for tested fields. Deterministic checks added value; source interpretation still needs review.
Empty input — browser and API	Blank announcement	Prevent extraction or return validation without a draft	Browser Extract button disabled; API returned HTTP 400 with the 12–12,000-character requirement.	Pass. Empty input rejected.
Non-event — live API	I really like the blue colour of my new notebook.	No event extracted	HTTP 200, empty events array, explanatory note.	Pass. No fabricated event in this example.
Risk — browser	Incomplete Startup Pitch Night draft; check review checkbox while start is absent	Publication remains blocked	Publish stayed disabled and the form stated that confirmed title/date/start were required. Discard removed the draft.	Pass for UI safeguard. Server-side bypass resistance was not tested.
Overnight availability — browser	Same four categories and Graduate; 22:00–02:00	Narrow results, update grouped counts, exclude daytime occurrences	Results changed from 426 occurrences / 5 cards to 100 occurrences / 1 Mass card; next matching start was 22:00. Clearing times restored 426 / 5.	Pass for observed regression. Controlled after-midnight, end-boundary, and selected-date fixtures remain untested.
Partial availability — browser	From 22:00 with To blank	Explain incomplete input; do not silently show unrestricted results	Alert requested both times or clearing both; 0 occurrences and an empty state appeared.	Pass. Validation is visible.
Historical date fragment — browser	tomorrow at 7pm; original post time October 30, 2026, 21:30	October 31 at 19:00, correct reference, no invented identity	Form displayed October 30 at 21:30 EDT / October 31 at 01:30 UTC as reference, October 31 event date, absolute-date summary, blank title, and disabled Publish.	Pass. Rule-based path clearly identified.
DST date arithmetic — live API	tomorrow at 7pm; original time November 1, 2026, 00:30	November 2 despite the fall-back transition	Returned November 2 at 19:00; reference correctly identified as 00:30 EDT / 04:30 UTC.	Pass for this case. Ambiguous repeated-hour and spring-forward inputs remain untested.


Repeat variability
The three boba extractions agreed on date, start time, location, category, and missing host/end. Wording changed from “are happening” to “are scheduled,” and one response added an explicit missing-host uncertainty note. No materially different scheduling result occurred in these three runs. This is a small consistency check, not a model-accuracy estimate.
Before and after
Same task: Interpret tomorrow at 7pm for October 30, 2026 at 9:30 PM Eastern.
- Before: A peer reported November 1 instead of October 31. This is a historical peer report, not a rerun of the former deployment.
- After: The current live browser returned October 31 at 19:00 with the correct campus-local reference. Three complete boba announcements using the same reference also returned October 31 through the live API.
- Interpretation: The revised deployment resolves this reported failure. The checked GitHub extraction code still needs synchronization before it can reproduce the fix.
Repository checks
Checked application revision: 0667d820792a05318050b34569681e3922832967.
- Dependency installation with frozen lockfile: passed (install scripts disabled for this check).
- TypeScript checks across libraries, API, frontend, sandbox, and scripts: passed.
- Full build: passed with PORT=3000 BASE_PATH=/. The first attempt without those required variables failed at Vite configuration; it was rerun successfully with them.
- Existing category-selection tests: 7 passed.
- Existing calendar-export tests: 8 passed.
- Total existing unit tests executed: 15 passed, 0 failed.
Commands used:
pnpm install --frozen-lockfile --ignore-scripts
PORT=3000 BASE_PATH=/ pnpm build
pnpm --filter @workspace/api-server exec esbuild \
  ../campus-cue/src/lib/category-selection.test.ts \
  ../campus-cue/src/lib/calendar-export.test.ts \
  --bundle --platform=node --format=esm --outdir=/tmp/campus-tests
node --test /tmp/campus-tests/*.js
These tests cover the older GitHub source, not the unsynchronized Replit revisions. No local database or model credentials were provisioned, so local database-backed end-to-end tests were not run.
What the evidence supports
The live app now handles the reported late-night date case, groups repetitive Mass listings, narrows overnight searches, and blocks an incomplete draft in the UI. Extraction preserves important missing details in the tested examples. These results support usefulness for initial discovery and draft preparation. They do not establish event authenticity, comprehensive filter correctness, server-side enforcement, or production readiness.
Risk response and privacy
Concrete risk: A student may miss an event by relying on an incorrect generated date, time, or venue. Editable drafts, original-text review, uncertainty notes, a displayed reference time, and required-field publication controls make verification part of the task. The risk test confirmed that checking the review box did not override a missing start time. Human review can still be mistaken, and the source itself can be wrong.

Privacy: The live submission notice says text is sent to the configured external OpenAI-compatible service through Replit; raw announcements remain in page memory rather than app database/browser storage, and provider/platform retention is outside the app's control. This is the deployed app's stated policy, not an independent retention audit. The inspected GitHub parse route sends input to the external service without a raw-announcement database insert, and its database schema stores structured event records. Current deployed backend source must be synchronized for a full review. Use sample or de-identified information and do not paste private chat content without permission.
Remaining limitations and next priorities
1. Synchronize the revised Replit code to GitHub. This is the principal submission gap. Re-run checks on the synchronized revision.
2. Complete integration coverage. Test controlled overnight/date-boundary fixtures, server-side publication validation, successful publication/persistence, duplicate handling, and model-service failure behaviour in an isolated test environment. No synthetic public events were published during this evaluation.
3. Finish submission materials and source-quality checks. Add the demo and personal AI-use reflection. Verify mobile/accessibility behaviour and source freshness. An unfiltered browser view showed 563 “Upcoming” versus 564 matching occurrences and two similar sustainability listings; investigate count definitions and duplicate coverage.
Review and grouping reduce risk and clutter but do not guarantee every event is accurate or relevant. Calendar-export unit tests passed; browser download/export integration was not exercised. The evaluation was not a security audit.

</details>
