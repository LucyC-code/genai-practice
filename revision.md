# Prototype revision and evaluation

## Inspection: what was actually implemented

Inspection found a React/Vite frontend, Express API, generated OpenAPI clients/validators, PostgreSQL persistence, and an existing live `gpt-5.4-mini` extraction request through the configured OpenAI-compatible integration. It did **not** find a root README describing the current implementation; this revision adds one based on code and tests. No replacement model, authentication system, or new external integration was added.

The previous extractor used `new Date().toISOString().slice(0,10)` as its UTC reference. The previous time predicate activated only when From < To, so overnight windows bypassed time filtering. Reviewable editable drafts already existed, but publication only required a nonblank title; missing dates and times were accepted. Raw announcements were not database columns. Existing request serializers omitted bodies/query strings, but logging full provider errors could expose unnecessary information.

## Three priorities

### 1. Group recurring occurrences after filtering

Only records explicitly tagged `Published weekly schedule`, categorized Faith & Spirituality, titled as Mass, and linked to Campus Ministry/Basilica are grouped into **Campus Masses**. Other faith events and unrelated categories are not arbitrarily merged. Within the series, chronological times, locations, source links, details, and incremental access to all occurrences remain available.

Search, category OR, stated audience, activity/sport, date, and availability filters run first. The series count and next matching occurrence are derived from that filtered set. Main pagination counts cards; result text distinguishes occurrences from cards. The calendar retains individual occurrences.

Duplicate handling is separate and intentionally conservative: equal title/date/start/end/venue/source/host/category/summary/audience/tags are necessary to combine presentation entries. Unknown key facts and conflicting records are not merged. Original database rows remain intact. This is not fuzzy event reconciliation.

### 2. Correct campus dates and overnight filtering

Original post time is optional and editable; otherwise use submission time. Reference conversion checks the IANA Indianapolis timezone, handles EDT/EST, rejects nonexistent spring-forward local timestamps, and discloses an ambiguous fall-back timestamp. Supported relative-date rules are deterministic, not solely model instructions.

“This weekday” includes today; “next weekday” is seven days later. Casual-language ambiguity is flagged. Absolute summaries are normalized before publication; editing the structured draft date updates its generated readable summary date.

Availability is a containment rule, not overlap. Known intervals must fit entirely; a missing end can match by known start but stays unconfirmed; missing starts do not qualify. Cross-midnight dates, blank/partial/equal/invalid boundaries, the following morning, and honest zero results are explicitly handled. Time filters apply in both views. Default feed dates are today onward; a selected date allows historical review.

### 3. Make review mandatory and minimize retained private input

Keep editable drafts, Check these, UNCONFIRMED labels and source text. Add explicit Edit, Discard and Publish controls, a review confirmation reset by edits, and independent API checks for title/date/start/review. Other missing details can remain unknown. A date/time-only fragment gets an explicitly rule-based partial draft with **no invented title** and cannot be published as-is.

The input warns about sharing permission and removing private details. Raw text is memory-only in this application; nothing automatically publishes it or connects private accounts. A clear action removes source/drafts. Provider/platform retention cannot be guaranteed. Provider error payloads and generic exception contents are omitted from server logs.

## Anonymized feedback response

| Feedback/issue | Acted on/adapted/deferred | Change or reason |
|---|---|---|
| Graduate browsing four categories receives a Mass-dominated list | Acted on | Mass series collapses repeated schedules after active filters. All occurrences remain accessible. |
| 10 PM–2 AM behaves like unfiltered discovery | Acted on | Overnight containment and next-morning dates; invalid windows never disable filtering silently. |
| Late-night tomorrow shifts by a day | Acted on | Campus reference, original-post correction and deterministic calendar arithmetic. |
| Published summaries still say tomorrow | Acted on | Absolute-date normalization and draft-date/summary synchronization. |
| README describes behavior inconsistently with demonstration | Acted on | Inspected actual code and successful requests; documented live AI plus explicit rule-based behavior. |
| Students may act on wrong AI details | Acted on | Required review and core facts at UI/API; visible uncertainty and source comparison. |
| Private chats/email might be collected | Acted on | No automatic account access; permission/redaction warning; memory-only source; error-log minimization. |
| Retain unfinished work | Deferred in this revision | No private-source autosave added; leaving the page discards drafts and says so. Existing separate recovery work is not duplicated here. |
| Group every repeated club/department event | Adapted | Masses have explicit recurrence evidence. Other families need trustworthy series identifiers before automatic merging. |
| Guarantee extraction truth or provider zero-retention | Not claimed | A checkbox cannot verify facts; external service retention is outside this app. |

## Before-and-after under controlled conditions

Expectations were written in [evaluation-plan.md](evaluation-plan.md) before executing checks.

The baseline capture was executed **before editing** against inspected legacy expressions, using instant `2026-10-31T01:30:00Z` (October 30, 9:30 PM campus time). It was not a replay of the peer’s browser session or a historical live AI request.

| Same controlled input | Observed before | Observed after |
|---|---|---|
| Late-night reference; tomorrow | UTC reference October 31 → November 1 | Campus reference October 30 → October 31. Automated regression and live typical extraction agree. |
| Availability 22:00–02:00 | Legacy activation expression returned false; time predicate bypassed | Window stays active; fixture intervals are checked and nonmatches excluded. |
| Four categories + Graduate; October 3 research clock; blank times | Prior renderer would render one card per matching record | Actual filtered snapshot: **1,087 matching occurrences → 37 cards**, including **1,051 Mass occurrences** in one expandable series. |

No before screenshot or claim of an observed original model response is made. The grouping comparison reuses the same filtered data and controlled date; current-calendar UI counts can be lower. The executed pre-edit calculation is recorded in [evaluation-baseline.json](evaluation-baseline.json).

## Actual evaluation

**Deterministic automation:** 31 Node tests passed, including previous calendar-export/multi-select regressions and a new regression for contradictory model review notes found by browser testing. Full workspace typecheck passed; affected frontend/API typechecks passed again after the final fixes. Frontend and API production builds passed. The frontend build emitted a pre-existing tooltip sourcemap warning but completed successfully. A plain build initially lacked required PORT/BASE_PATH configuration; it passed using the managed-service equivalent environment shown in README. No toolchain/configuration replacement was made.

**Live API:** [Detailed outputs](evaluation-api-results.json). Five intentionally invalid publication requests returned 400 and did not insert a record. Existing rows were compared field-for-field; **1,879 before and 1,879 after** this read-only/rejection pass.

| Case | Input/action | Expected result | Actual result | Pass/partial/fail | Implication/next step |
|---|---|---|---|---|---|
| Typical extraction | Exact boba/board-games text; Oct 30 21:30 original post | Oct 31, 19:00, Duncan 210, appropriate category, no host | Three live requests: same date/time/venue, Social each time, null host/end, absolute summaries | Pass | Stable core facts for this small sample, not a general accuracy estimate. |
| Typical discovery | Career/Networking/Social/Faith; Graduate; blank times; controlled Oct 3 | Eligible OR-filtered events; filtered Mass series | 1,087 occurrences, 37 cards, 1,051 grouped Masses; next Oct 3 10:00 Duncan Hall chapel | Pass (automated real-data calculation) | Browser verification is separately recorded below. |
| Challenge | Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP. | Nov 5; retain building; no room/time/host/URL inventions | Final draft Nov 5, DeBartolo, missing time/host, null URL; deterministic rule corrected the model’s proposed Oct 29 | Pass with model-error disclosure | A useful example of why model interpretation alone is insufficient. |
| Empty/non-event | Empty; conversational greeting | Validation/zero drafts; no insert | Empty returned 400; greeting returned zero events | Pass | AI failure/no-event results do not publish anything. |
| Risk | Challenge draft missing time/host; attempted publish with review=true | Missing start blocks publication; unknown host retained | HTTP 400; separate no-review, missing-date, blank-title and invalid-date requests also 400 | Pass (API + unit tests) | Unknown host is intentionally allowed once required facts are confirmed. Browser editing/discard tested separately. |
| Late-night regression | tomorrow at 7pm; Oct 30 21:30 campus reference | Oct 31 in structured date, card/summary; no invented identity | First live-model pass returned no event (partial). Added narrow labeled rule-based draft: blank title, Oct 31, 19:00, absolute summary; targeted API follow-up passed | Pass after correction | See [follow-up evidence](evaluation-fragment-results.json). Not presented as successful live AI. |
| Overnight | Controlled before/within/after fixtures, including next-day 00:30–02:00, 01:00–03:00, unknown start and start-only | Containment; next morning; unknown start excluded | All fixture expectations passed; no fallback; today/week include next morning | Pass (automated) | Campus wall-clock semantics, not elapsed-hour promises at a repeated DST hour. |
| Summary consistency | Normalize tomorrow; view/re-normalize with next-day clock | Absolute date remains Oct 31 | Idempotent absolute summary test passed; live drafts contain absolute date | Pass (automated); browser publication below | This does not retroactively prove every historical source text correct. |
| DST/validation | Nov 1 EDT/EST fold; March 8 gap; winter reference | Correct date under both offsets; gap rejected; fold disclosed | Automated checks passed | Pass | Event timestamps without offsets can still be ambiguous at the repeated hour. |
| Blank/invalid/empty time matches | No boundaries; one boundary; equal/invalid times; outside window | Blank unrestricted; errors produce zero, not full feed | Automated checks passed | Pass | No silent fallback. |

### Live model variation

The three identical boba requests all produced October 31, 19:00, Duncan 210, Social, and no invented host/end. Wording varied (“scheduled for” versus “happening”) and one response explicitly explained the absent host while the others omitted that note. These are three observations, not a reliability percentage.

The challenge showed a more important failure: a model-proposed Thursday date contradicted the requested rule. Deterministic validation corrected date/summary, and the review warning identifies corrections rather than treating the model as authoritative.

### Browser evaluation

See [evaluation-browser.md](evaluation-browser.md) for the actual central-flow report and remaining limitations. The first pass confirmed review/edit/discard/publish, reload persistence, an unchanged absolute summary after advancing the browser clock to November 1, grouped graduate filters, overnight live-data matches and invalid-window empty states. With the current November 15 clock, the four-category graduate view showed **426 occurrences / 5 cards**, including a **422-occurrence Mass series**. Choosing November 16 narrowed the series to **24**.

That pass found two defects: a model-generated Check these note could contradict an already-correct date, and the mobile header clipped Submit. Fixes replace model date-resolution notes with deterministic wording (including when the structured model date was already correct) and compact/wrap the mobile navigation. A new unit regression reproduces the exact bad-warning case. The targeted browser follow-up **passed both fixes**: on both routes at 402px, scrollWidth equals clientWidth (387px), Submit is fully visible, and the challenge’s deterministic note states November 5 without a stale October 29/30 resolution claim. The model again proposed a wrong date; the corrected date and explicit correction warning were observed. Missing time/host/URL remained unknown and Publish stayed disabled.

The browser created one clearly labeled synthetic record to verify real persistence, then the main agent deleted **only** that matching synthetic ID/title/channel. The removal returned exactly one row; the final API check returned 200 and the original **1,879-record** count. No existing event was edited or deleted. After-fix screenshots are saved under `generated-artifacts/evaluation/`, intentionally ignored by Git. Browser results are not interchangeable with unit/API results; the browser did not re-run all DST, controlled overnight, or calendar-export fixtures.

## Risk response and interpretation

**Concrete risk:** students act on an incorrect extracted date, time, location or eligibility statement, miss an event, or disclose private announcement content.

**Affected users:** students submitting informal text and other students relying on the resulting feed, including graduate students and students using late-night availability filters.

**Safeguards:** drafts before publication; source/reference visibility; mandatory review confirmation and title/date/start checks in UI/API; deterministic relative-date/availability rules; explicit unknowns; no private-account access; permission/redaction notice; no app-side raw-input persistence; minimized error logs.

**Remaining risk:** confirmation is not proof of truth, an API caller can falsely claim review, models can hallucinate non-core details, multi-event date associations need human checks, stored sources/schedules can change, ambiguous DST event times lack per-event offsets, and provider/platform retention is not controlled here. Users may still paste or publish private details despite warnings. No automatic privacy scrubber or organizer authentication is claimed.

Evidence supports the prototype’s narrower value: it turns short informal announcements into editable, structured drafts and makes an occurrence-heavy feed substantially easier to browse. It does not support unattended publication, guaranteed extraction accuracy, broad coverage claims for all campus events, or treating a successful request as verified organizer truth.

## Ranked next priorities

1. Add explicit, source-backed recurrence identifiers for club meetings and other series without relying on category/title similarity.
2. Add optional pre-send detection of contact details/private links, with user-controlled removal and clear false-positive/false-negative limits.
3. Improve conflict checks and provenance for multi-event announcements, especially when several dates or registration deadlines appear together.
