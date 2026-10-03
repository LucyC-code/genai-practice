# CampusCue

A mobile-responsive campus discovery hub that organizes scattered announcements into a shared, filterable event feed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server through its managed workflow
- `pnpm --filter @workspace/campus-cue run dev` — run the website through its managed workflow
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Website: `artifacts/campus-cue`; shared API: `artifacts/api-server`
- API contract: `lib/api-spec/openapi.yaml`; generated clients: `lib/api-client-react`
- Database schema: `lib/db/src/schema`; event extraction logic: `artifacts/api-server/src/lib/event-extraction.ts`

## Architecture decisions

- The discovery feed uses researched Notre Dame university and club listings with original source links, alongside manually published announcements. This is a curated snapshot, not automatic live scraping or an authorized Instagram connection.
- AI extraction proposes metadata; users review and edit every suggestion before publishing. Unknown facts remain null instead of being invented.
- Relative dates are resolved against the server's current UTC date, with that reference date shown in parser notes for human verification.
- Calendar days remain `YYYY-MM-DD` strings end to end to avoid timezone shifts.
- Calendar export is a one-time ICS copy or a prefilled Google Calendar event, not an OAuth connection or live/two-way synchronization. Campus-local Eastern times must remain correct for viewers in other timezones.
- Discovery's Today/This week use Notre Dame's Eastern calendar date, including daylight-saving changes; this is separate from the parser's explicitly disclosed UTC reference date.
- Reports are stored for manual follow-up; an organizer correction queue is not part of this first slice.

## Product

- Discover shared events with search (including tags), categories (including Networking, Sports, and Clubs), class-year audiences (Freshman through Graduate), today/this-week and exact-date filters, and a manually entered free-time window.
- Coverage should span campus life: spectators and participating athletes, tennis, hockey, track/running, soccer, football, rugby, clubs, socials, mixers, and networking. Broader public-source coverage is the goal, not a promise to capture private or unannounced events.
- The user wants over 1,000 listings across a much wider range of categories. Distinguish dated occurrences from unique event series; a large count must not imply 1,000 distinct one-off events or unrestricted attendance.
- Activity filters distinguish watching sports, playing/training, club activities, and socials/mixers; sport filters use explicit tags. Longer feeds load 48 cards at a time without removing access to the remaining matches.
- Category browsing allows up to four selections and shows events from any selected category in both list and calendar views. The user requested multi-selection because they may not know which categories to choose. All/clear resets the selection; a sport choice narrows Sports without excluding other selected categories.
- The optional calendar view shares the discovery filters and displays weekday/date agendas. Event details offer Google Calendar and ICS exports. Dated listings with unknown start times export only as explicitly labeled date placeholders; unknown end times have no estimated duration, and undated listings cannot be exported. This preserves save-the-date usefulness without presenting guesses as confirmed schedules.
- Year filters include explicitly all-year events and exclude unspecified audiences. An empty audience is unknown, not open eligibility. Department, club, and registration restrictions stay in event summaries.
- Paste an email, caption, or chat announcement; extract multiple events with AI; review missing fields and uncertainties; publish each approved suggestion.
- Read event details and report inaccurate or duplicate entries.
- The user chose to replace the original three demo entries with verified Notre Dame events, preserving user-submitted entries. Import data is in `scripts/data/notre-dame-events.json`; dates and times were checked against primary listings.
- The expanded October listings are in `scripts/data/notre-dame-events-expanded.json`, verified against public NDCentral RSS/event listings and university department calendars. Imports add records without removing submissions or duplicating source URLs or exact title/date/start-time matches.
- The campus-wide researched snapshot is in `scripts/data/notre-dame-campus-wide-events.json`, including recurring student listings, selected official home athletics, and SAO activities. Each dated occurrence is a listing; a multi-day tennis tournament is represented once per day with that relationship disclosed. Shared athletics schedule URLs are intentionally reused across different games.
- The deeper snapshot is in `scripts/data/notre-dame-deep-coverage-events.json`, with per-source evidence and labeled weekly schedule rules. Campus Ministry occurrences stop at the fall last-class day and exclude academic breaks and home-football Saturdays. The discovery checkbox can hide these occurrences. `scripts/src/import-campus-events.ts` validates this fixture and imports idempotently with `--apply`, preserving existing records; it is not automatic synchronization.
- The pre-Stanford networking snapshot is in `scripts/data/notre-dame-stanford-networking-events.json`, with organizer evidence, Instagram research limitations, and excluded candidates. Import it from the scripts package with `tsx src/import-campus-events.ts --fixture data/notre-dame-stanford-networking-events.json --apply`. The `Stanford weekend` tag works with the Networking category and search; public, adults-only, and donor-member gatherings retain their distinct attendance rules.
- Unannounced athletics times remain null, end times are not estimated, and conflicting venue/setup blocks are flagged or replaced only by explicit public activity times. Runs do not imply a verified track meet.
- Prototype boundaries from the problem framing: responsive web only; no ticketing/payments, user messaging/profiles, two-way calendar sync, or live source scraping.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
