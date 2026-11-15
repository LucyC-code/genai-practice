# CampusCue browser evaluation: central journey

> Final combined status: the two first-pass defects below were fixed and passed the targeted after-fix re-check appended at the end. Preserve the first-pass failures as evaluation history, not current unresolved defects. Main-agent cleanup removed only synthetic record 1884 after testing; a final API request returned HTTP 200, 1,879 records, and no record 1884. The original data count was restored.

- Target: current web preview (`/` and `/submit`), no login, no app code edited.
- Browser clock: sandbox real time, Sun Nov 15 2026 (campus time). Page clock was briefly moved to Nov 1 2026 and then restored to real time.
- Original-post reference used throughout: `2026-10-30T21:30` (America/Indiana/Indianapolis, Friday).
- Extraction calls used: **2 of 2** budgeted (server limit 15 per 10 min). Live model: `gpt-5.4-mini`, as shown in parse notes.
- Baseline `/api/events?timeframe=all`: **1879** records (max id 1883).
- Final `/api/events?timeframe=all`: **1880** records. The only new record is the synthetic sample below. No baseline record was removed or changed.

## Synthetic record created (for cleanup only)

| Field | Value |
|---|---|
| **ID** | **1884** |
| **Exact title** | `SYNTHETIC EVALUATION - Boba board games` |
| Date / start | 2026-10-31 / 19:00 |
| Location | Duncan 210 |
| Host / end time / source URL | none (null) |
| Category / tags | Social / `Synthetic`, `Evaluation` |
| Original channel | Email (form default; not changed) |
| Audience (classYears) | none (`[]`) |

Clean up by ID 1884 only. No other records were created, edited, or deleted.

## Results

| # | Step / expectation | Expected | Actual | Result |
|---|---|---|---|---|
| 1 | Empty announcement: Extract disabled | Extract button disabled while text is empty | Extract disabled on empty `/submit` (observed in the snapshot) | PASS |
| 2a | Challenge: original time entered | `2026-10-30T21:30` accepted | Field shows `2026-10-30T21:30` (displayed 10/30/2026 09:30 PM) | PASS |
| 2b | Challenge: date | Nov 5 2026 (coming Thursday, inclusive rule from Friday Oct 30) | Date `2026-11-05`, summary "Startup Pitch Night at DeBartolo. Date: November 5, 2026." | PASS |
| 2c | Challenge: building retained, no invented room | DeBartolo kept; no room | Location `DeBartolo`; notes say "No room was specified within DeBartolo" | PASS |
| 2d | Challenge: no invented time, host, end, URL | Start, End, Host, source URL blank | Start, End, Host, source URL all blank; "Unconfirmed" markers shown | PASS |
| 2e | Challenge: reference notes and "Check these" visible | Notes show reference; "Check these" list shown | `text-parse-notes` shows reference `Friday, October 30, 2026 at 9:30 PM EDT`; "Check these" list shown | PASS (see defect A) |
| 2f | Challenge: Publish disabled after checking reviewed box | Publish stays disabled because Start is missing | Checkbox checked; Publish disabled; "A confirmed title, date, and start time are required to publish." shown | PASS |
| 2g | Source text in disclosure | Original text available in disclosure | `text-review-source` = exact input text | PASS |
| 2h | Edit focuses field and clears review | Focus `input-title-0`; checkbox cleared | Focus = `input-title-0`; checkbox unchecked; Publish disabled | PASS |
| 2i | Fill Start, then modify any field resets review | Start filled and reviewed = Publish enabled; then title change clears review | Start 19:00 + review = Publish enabled. Title change: checkbox cleared, Publish disabled. Title restored. (Not published.) | PASS |
| 2j | Discard removes draft without insertion | Card removed, API count unchanged | Card removed ("All suggestions handled."). `/api/events` still 1879, no new ids | PASS |
| 3a | Clear input and drafts | Input, time, drafts cleared | Announcement "", time "", cards 0 | PASS |
| 3b | Typical extraction: date, time, room | Oct 31, 19:00, Duncan 210 | `2026-10-31`, `19:00`, `Duncan 210` | PASS |
| 3c | Typical: no host/end, absolute summary, live status | Host/end blank; summary with absolute date; live AI status | Host and End blank; summary "Free boba and board games are happening October 31, 2026 at 7:00 PM in Duncan 210."; notes "Live AI extraction (configured gpt-5.4-mini)" | PASS |
| 3d | Typical: category | Social/Food per plan | Social | PASS |
| 3e | Set title and tags; no audience fabricated | Title and tags set; no audience checked | Title `SYNTHETIC EVALUATION - Boba board games`; tags `Synthetic, Evaluation`; 0 audience boxes checked | PASS |
| 3f | Publish disabled before review checkbox | Disabled | Disabled while reviewed = false | PASS |
| 3g | Publish succeeds after review checkbox | Success; `status-published-0`; API gains 1 record | Success; `status-published-0` shown; API 1879 → 1880, new id 1884 | PASS |
| 4a | Discover: date + exact title search | One card for the synthetic record | `input-event-date=2026-10-31` + exact title → "1 matching occurrences · 1 cards", `card-event-1884` | PASS |
| 4b | Dialog summary and date | Oct 31 absolute date; 7:00 PM; Duncan 210; Host unconfirmed | "Sat, Oct 31", "Starts 7:00 PM · End time not confirmed", Duncan 210, Host "Unconfirmed", summary "October 31, 2026" | PASS |
| 4c | Persists after reload when date and search reapplied | Same card and count | Reload resets filters (564). Reapplied → 1 card, `card-event-1884`, "OCT 31" | PASS |
| 4d | Advance clock to Nov 1 with date kept | Summary unchanged | Page clock Nov 1 19:00 UTC; date and search kept; still 1 card "OCT 31", same summary | PASS |
| 5a | Clear filters (button) | All filters reset; baseline count | Button shown with active filter; click → 564 occurrences, Any year, All categories | PASS |
| 5b | Career, Networking, Social, Faith & Spirituality + Graduate, time blank | Combined category + audience filter; expandable Campus Masses card | 4 of 4 categories + Graduate → "426 matching occurrences · 5 cards" incl. `card-series` "Campus Masses · 422 matching occurrences". API check: all 1,225 Graduate-filtered records are Graduate or All years (no guessed audiences) | PASS |
| 5c | Open "View times and locations" | Date, source, venue on each row; count and next reflect filters | 24 rows shown of 422 ("Show 24 more times"); each row shows date, time, venue, "Original source" link; "Next matching: November 15, 2026 · 8:00 AM" | PASS |
| 5d | Selected date = remaining Mass date (Nov 16) | Grouped count changes, not full-series count | Date 2026-11-16 → "24 matching occurrences · 1 cards"; series card count 24 (was 422); all 24 rows dated November 16 | PASS |
| 5e | Overnight 22:00 → 02:00 | Not invalid; real matches or honest empty | No alert; 100 matches, all Campus Masses starting 22:00 (API cross-check: 100 upcoming overnight-start records, all `22:00`) | PASS (live data only; no controlled fixtures) |
| 5f | Partial time input (From only) | Alert and zero results | Alert "Enter both the From and To times, or clear both to leave time unrestricted."; "0 matching occurrences · 0 cards"; status-empty shown; restoring To → 100 again | PASS |
| 5g | Mobile 402px: no horizontal overflow | scrollWidth = clientWidth | **scrollWidth 398 vs clientWidth 387**, horizontal scrollbar on `/` and `/submit`. Overflowing elements: header `NAV` and `link-nav-submit` (right edge at 398). Submit button visibly clipped at the right edge. | **FAIL (defect B)** |

## Defects found

**A. Wrong resolved-date note on the challenge draft (accuracy; does not affect the saved date).**
- Input: "Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP", reference `2026-10-30T21:30`.
- The date field correctly shows `2026-11-05`.
- The "Check these" note reads that "This Thursday" was resolved to **2026-10-30** (per observation snapshot; verbatim text was not captured with innerText). 2026-10-30 is a Friday, so the note is wrong and contradicts the date field.
- Earlier evaluation data in `evaluation-api-results.json` shows a similar note with **2026-10-29**. Both are incorrect for "coming Thursday including today".
- Expected: note names 2026-11-05 (or does not name a resolved date).

**B. Mobile 402px horizontal overflow in the header (minor, layout).**
- Reproduce: viewport 402×874, open `/` or `/submit`.
- Expected: no horizontal scroll (`scrollWidth == clientWidth`).
- Actual: `scrollWidth` 398, `clientWidth` 387; horizontal scrollbar visible. The `NAV` element and `link-nav-submit` extend to x=398, and the Submit button is clipped. The Discover body and filter panel fit.

## Observations (not counted as failures)

- **Series card label is hard-coded.** `event-series-card.tsx` always shows "Recurring series · Faith & Spirituality". It is correct for Campus Masses, but any future series in another category would be mislabeled. Only one series type exists in this data, so this was not reproduced with a second series.
- **Clear-filters button hidden at defaults.** It appears only while a filter is active. Expected by the source; noted because the plan implies it is always visible.
- **Campus Masses card on Graduate filter.** The card is shown under the Graduate filter, and the API check confirmed every Graduate-filtered record has "Graduate" or "All years". I did not read the audience values of the Mass records individually.
- **Series occurrence count vs October snapshot.** Not compared numerically to an October snapshot. I did not have one. Current count: 422 Mass occurrences upcoming from Nov 15, 425 upcoming weekly/Mass records in API.

## Verification gaps and limitations

- Live AI variation was not tested beyond the two extraction calls (budget). Only one challenge and one typical draft were produced; no repeat runs.
- No late-night (Nov 1 extraction) or DST reference tests. Overnight used live data, not controlled fixtures. Start-only overnight fixtures were not exercised.
- Calendar view and ICS download were not exercised.
- Discard was tested on the challenge draft only.
- Screenshots were captured as session observations (IDs listed in the tool log), not written to `generated-artifacts/evaluation/`.
- Editing or deleting data: none. The only write was the one synthetic publish (id 1884).

## Overall

| Area | Result |
|---|---|
| Challenge extraction and review gating | PASS, except defect A (wrong "This Thursday" note) |
| Edit, reset, discard | PASS |
| Typical extraction and publish | PASS |
| Discovery: date, search, dialog, reload, clock | PASS |
| Filters: category + Graduate, series expand, date, overnight, partial time | PASS |
| Mobile 402px overflow | FAIL (defect B, minor) |

Overall: **partial**. The core journey works end to end. Two defects: A (incorrect note text) and B (mobile header overflow).

---

## After-fix re-check (second pass, fixed flow only)

Scope: the two first-run defects only (A: date-resolution note; B: 402px header overflow), plus the single challenge extraction. No full journey re-run, no publish, no discard, no data writes. Extraction budget: one call in this pass. Synthetic record 1884 was not touched. The first-run results and defect text above are kept as recorded.

Screenshots: `generated-artifacts/evaluation/after-fix-402-discover-top.png`, `after-fix-402-submit-top.png`, `after-fix-challenge-draft-card.png`, `after-fix-challenge-page.png`.

### B. 402px overflow (fixed)

| Page | Before fix (first run) | After fix | Result |
|---|---|---|---|
| `/` at 402×874 | scrollWidth 398 > clientWidth 387; NAV and link-nav-submit right = 398 | scrollWidth 387 = clientWidth 387; overflowing elements `[]`; link-nav-submit left 289, right 371 (fully visible) | PASS |
| `/submit` at 402×874 | same as above | scrollWidth 387 = clientWidth 387; overflowing elements `[]`; link-nav-submit right 371 | PASS |

### A. Date-resolution note (fixed)

Input: "Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP.", original post time 2026-10-30T21:30, one extraction call.

| Item | Expected after fix | Actual after fix | Result |
|---|---|---|---|
| Date field | 2026-11-05 | `2026-11-05` (summary "Date: November 5, 2026.") | PASS |
| Date-resolution note | Comes from the deterministic resolver and says November 5, 2026 | "“this thursday” resolves to November 5, 2026 using the displayed original/submission reference and documented weekday rule. Verify against the source." | PASS |
| Stale wrong claim | No "2026-10-29/2026-10-30 resolved" model assertion | None present in Check these. The only 2026-10-30 mention is "The AI proposed 2026-10-30; the deterministic relative-date rule corrected it to November 5, 2026." | PASS |
| Was the AI date correct? | Answer from the notes | **No.** The AI proposed 2026-10-30. The deterministic rule corrected it to 2026-11-05. The fix replaces the AI's wrong date. | Finding (AI date needed correction) |
| Publish | Disabled | Disabled. Reviewed unchecked. Required message: "A confirmed title, date, and start time are required to publish." | PASS |
| Start / End / Host / source URL | Blank | Start, End, Host, source URL all blank, marked unconfirmed | PASS |
| Unknown time note | Remains | "No time was provided." | PASS |
| RSVP URL note | Remains | ""Link in bio" is not a usable RSVP URL, so the RSVP destination is not captured." | PASS |
| Unknown room note | Remains | **Not present in this run.** First run had "No room was specified within DeBartolo." (model-generated parse note). The code does not generate a room note; it passes model notes through a filter that only removes date-word notes, so the absence is live model variation. The location field "DeBartolo" has no invented room. | PARTIAL (not reproduced; see gaps) |
| Unknown host note | Remains | No host note in the list. Host is blank and marked Unconfirmed, which the code treats as the host signal. | PASS (by design) |
| Parse notes reference | Shown | Reference shown: Friday, October 30, 2026 at 9:30 PM EDT; live AI status shown | PASS |

Unit-test coverage (not re-run by me): `date-reference.test.ts` asserts that a model note "resolved to 2026-10-30" is removed, that the November 5 note is added, and that "No room was specified." and "No host organization was supplied." are kept. The build and tests were reported as passing by the requester.

### Final status (after fix)

| Defect | Status |
|---|---|
| A. Wrong date-resolution note | **FIXED** in the live flow. The note is deterministic and says November 5, 2026. The AI date (2026-10-30) was wrong and is corrected; the saved date is correct. |
| B. 402px header overflow | **FIXED** on `/` and `/submit`. No horizontal overflow, Submit fully visible. |
| Room note retention (new gap) | **NOT REPRODUCED** in this single run. Passes through the model note path only, so it may not appear on every extraction. Expected, since the room note is model-generated. |

Overall for this pass: **PASS for both fixes**, with the room-note retention as a partial item.

### Gaps and limitations for this pass

- One extraction only, per the request. Repeat variation was not tested, so the room note's absence may be live-model variation rather than a code change.
- The draft was left unpublished and undiscarded on `/submit`. No data written.
- The first run's room note was not re-checked on a second extraction because the requester asked for one call.
