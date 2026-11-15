# AI-use disclosure

## Tools and models known

- **Replit Agent** assisted with inspecting code, implementation, debugging, test construction, documentation and browser-test coordination. Its underlying active development model is not known/disclosed here; no particular model name is claimed.
- The **product** already requested `gpt-5.4-mini` through an OpenAI-compatible Replit AI integration. This configured model identifier is visible in code. Successful live extraction requests were executed in this revision. Underlying service routing and provider retention were not independently audited.
- A Playwright-based testing helper was used for the browser evaluation; see its actual report. Node’s test runner, TypeScript, Vite, and the API build tool performed non-generative checks.

The product model and the development assistant are different roles; this disclosure does not assume the same model powered both.

## Representative prompts and actual revisions

These excerpts come from the user’s supplied revision request, not a reconstructed development history:

| Prompt excerpt | Outcome / actual revision |
|---|---|
| “First inspect the actual code, extraction implementation, data sources, date handling, filtering, persistence, and README.” | Found existing live AI, UTC date reference, overnight-filter bypass, permissive publishing, and no root README. Kept the existing stack/model and documented actual behavior. |
| “Apply active filters to individual occurrences before forming groups.” | Implemented filtered Mass series, next matching occurrence, occurrence/card counts, chronological grouping, and conservative duplicate treatment. |
| “Ensure ‘tomorrow’ at October 30, 2026, 9:30 PM campus time resolves to October 31, 2026.” | Added IANA reference conversion and deterministic date rules. Live typical tests passed; a bare fragment initially produced no model event, so a clearly labeled, incomplete rule-based draft was added rather than pretending AI succeeded. |

The browser helper was instructed to exercise challenge extraction, blocked publication, editing/discard, a clearly labeled synthetic publication, persistence, discovery filters and mobile layout. Its results and any gaps are recorded in `evaluation-browser.md`.

## Verification and limits

- Expected outcomes were recorded in `evaluation-plan.md` before test execution.
- Executed 31 deterministic regression tests, full workspace type checks, and frontend/API builds.
- Executed three identical live boba inputs; recorded wording/uncertainty variation and stable core fields.
- Executed challenge, non-event, invalid publication and controlled discovery checks; retained JSON evidence.
- A challenge response’s proposed date needed deterministic correction. Prompts alone did not make model behavior reliable.
- Baseline reproduction used inspected code expressions with a fixed clock. It was not a historical replay of the peer’s model output or browser session.
- The browser report distinguishes observed behavior, screenshots, and untested limitations.

Generated suggestions and documentation still require the student’s review. This disclosure does not invent a human decision, rejected suggestion, model identity, authorship history, or evaluation participant quote.

## AI behavior inside the product

Ordinary announcements are sent to the existing external service for structured extraction. Code validates supported dates/times, normalizes relative wording, and returns editable drafts. A narrow date/time-only fragment uses a labeled server rule, with an empty title and review required. There is no hidden sample/simulated success fallback.

Nothing is automatically published. Users must provide core details and confirm review against the original text. Unknown host, venue, end time and eligibility are not converted into confirmed facts. Raw input is page-memory-only in the app, but external provider/platform retention is outside its control. Private accounts are not connected. Human review can still be mistaken.

## Student contributions — complete personally

- **[Fill in: your own problem framing, research, design decisions and implementation contributions.]**
- **[Fill in: what you accepted, changed, or rejected after reviewing this revision, with truthful examples.]**
- **[Fill in: how you personally checked the app and documentation, and any course-required AI citation format.]**
- **[Fill in: your final reflection and recording date after making the demo.]**

No video is claimed to have been recorded or uploaded. Review this disclosure before submission.
