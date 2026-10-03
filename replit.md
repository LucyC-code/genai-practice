# CampusCue

A mobile-responsive campus discovery hub that organizes scattered announcements into a shared, filterable event feed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
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

- The first slice uses labeled demo seed events and pasted source announcements, not live scraping. This keeps the prototype focused on the aggregation-to-discovery pipeline without channel authorization or scraping complexity.
- AI extraction proposes metadata; users review and edit every suggestion before publishing. Unknown facts remain null instead of being invented.
- Relative dates are resolved against the server's current UTC date, with that reference date shown in parser notes for human verification.
- Calendar days remain `YYYY-MM-DD` strings end to end to avoid timezone shifts.
- Reports are stored for manual follow-up; an organizer correction queue is not part of this first slice.

## Product

- Discover shared events with search, categories, today/this-week filters, and a manually entered free-time window.
- Paste an email, caption, or chat announcement; extract multiple events with AI; review missing fields and uncertainties; publish each approved suggestion.
- Read event details and report inaccurate or duplicate entries.
- Prototype boundaries from the problem framing: responsive web only; no ticketing/payments, user messaging/profiles, two-way calendar sync, or live source scraping.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
