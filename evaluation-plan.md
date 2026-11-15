# Evaluation plan (expectations recorded before execution)

Use synthetic text only. The primary controlled reference is October 30, 2026 at 9:30 PM America/Indiana/Indianapolis (`2026-10-31T01:30:00Z`).

| Case | Input/action | Expected result |
|---|---|---|
| Typical extraction | Free boba and board games tomorrow at 7pm in Duncan 210. | October 31; 19:00; Duncan 210; Social/Food; no invented host; absolute summary. |
| Typical discovery | Graduate; Career, Networking, Social, Faith & Spirituality; blank times | Category OR and audience filters apply before series grouping. Mass occurrences remain individually accessible. |
| Challenge | Startup Pitch Night this Thursday in DeBartolo. Link in bio to RSVP. | November 5 under inclusive upcoming-weekday rule; building retained; no invented time, room, host or RSVP URL. Publication blocked until reviewed core fields exist. |
| Invalid/empty | Empty text; a non-event greeting | Validation or zero drafts; no insertion. |
| Risk | Missing time and host; publish attempt; edit and discard | Missing time or missing review confirmation blocks publication in API and UI. Unknown host remains unknown. Discard does not publish. |
| Late-night | tomorrow at 7pm with controlled late-night reference | October 31 in structured date, summary and review card, never November 1. |
| Overnight | 22:00–02:00, controlled fixtures before/within/after | Entire known interval must fit. Start-only event can fit with unknown-end warning. Selected date includes next morning; unknown start excluded. |
| Summary consistency | Publish reviewed future synthetic draft; view next day | Absolute wording and calendar date remain unchanged. |
| DST | References before/after November 1 fallback and March spring gap | Campus dates use IANA zone, not a fixed offset. Nonexistent local timestamps rejected; ambiguous fold disclosed. |
| Blank/partial/empty filters | blank; one boundary; equal boundaries; no match | Blank unrestricted; partial/equal invalid; invalid or no match never silently returns full feed. |
| Live variation | Repeat typical or challenge input three times | Record actual field variation, model failures and deterministic corrections; do not claim reproducibility of all generative fields. |

Baseline: reproduce existing UTC reference calculation and overnight activation logic before editing. These are code-level reproductions, not claims to have observed the original peer session or replayed a historical live model request.

Verification layers: deterministic Node tests, live API extraction and rejected publication requests, real browser review/discovery flow, typecheck, production build. Record outcomes in revision.md and linked evidence files. Browser test may publish one clearly marked synthetic sample only; existing records must remain untouched.
