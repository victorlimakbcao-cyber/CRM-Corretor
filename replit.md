# CRM Corretor

CRM imobiliário para corretores brasileiros organizarem leads, imóveis, negociações e próximos passos em um só lugar.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
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

- `artifacts/crm-corretor/src/App.tsx` — shell, auth routes, dashboards, CRUD screens and responsive navigation
- `artifacts/crm-corretor/src/index.css` — design tokens and application theme
- `artifacts/api-server/src/routes/crm.ts` — CRM API routes and development seed
- `lib/db/src/schema/crm.ts` — PostgreSQL schema for CRM records
- `lib/api-spec/openapi.yaml` — source of truth for the generated API client and Zod validators

## Architecture decisions

- OpenAPI is the contract between the React client and the shared Express API.
- Clerk owns browser authentication; the API uses the Clerk session cookie and protects mutations.
- CRM calendar-day fields use PostgreSQL `date` values to avoid timezone shifts.
- Development data is seeded idempotently on the first CRM API read so the first preview is useful.

## Product

CRM Corretor includes a public product entry page, Clerk sign-in/sign-up, executive dashboard, leads and client 360 views, property inventory, drag-and-drop funnel, tasks, visits, agenda, proposals, captures, commissions, reports, notifications and settings.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm run typecheck:libs` before checking packages that import `@workspace/db` or generated API types.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
