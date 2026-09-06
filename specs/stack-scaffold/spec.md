# Spec: Stack scaffold

## Roadmap link
- Goal: Platform foundation
- Item: Scaffold the stack per `tech-stack.md`: Next.js (App Router) + Prisma + Supabase (Tokyo) + Inngest, deployed to Vercel with CI running typecheck/lint/tests

## Objective

Stand up the deployable skeleton every later goal assumes: one Next.js App Router application, one Postgres database reached through Prisma, one background-job layer, deployed to Vercel with CI enforcing typecheck, lint, and tests. The Goal's "Why" is that login, locales, and audit guarantees all presuppose a running app — nothing downstream can be built, reviewed, or demoed until this exists.

The scaffold's job is to prove each layer of `tech-stack.md` is wired and verifiable, not to implement any product behavior. Success is a boring, reproducible baseline: an agent picking up the next roadmap item should find every seam already in place and documented.

## Scope

**In scope**

- Next.js (App Router) + TypeScript strict, pnpm, at the repository root (single app, no monorepo).
- Tailwind CSS + shadcn/ui initialized, with a mobile-first root layout and at least one real component in use.
- next-intl routing skeleton: `[locale]` segment, `ja` as default and `ko` as the second locale, `messages/ja.json` and `messages/ko.json` present and non-empty. Scaffold-owned strings only.
- Prisma with a single `journey_stage` lookup model, its initial migration, and a seed script loading the eight journey stages derived from the PRD.
- Supabase Postgres (Tokyo, `ap-northeast-1`) as the production database. Local development and local tests run against Postgres in Docker.
- RLS enabled with no permissive policy on every table this feature creates.
- Inngest client, an `/api/inngest` route handler, and one trivial event-driven function.
- Sentry wired for server and client error capture.
- `/api/health` route reporting database reachability and seeded-stage count.
- Vitest and Playwright configured, with the tests listed under Testing strategy.
- GitHub Actions: a PR job running typecheck/lint/unit tests, and a `main` job applying pending migrations to Supabase.
- Vercel project connected to the repository, production tracking `main`.
- `AGENTS.md` as the project context capsule; `.env.example` documenting every required variable.

**Out of scope**

- Supabase Auth, operator accounts, roles, RBAC, and any RLS policy that grants access — roadmap item 2.
- Real product UI strings and the per-operator locale switcher — roadmap item 3. This feature ships the routing skeleton and the message-file discipline, not the translated product.
- `audit_log` triggers, `deactivated_at` soft-delete conventions, and edit stamping — roadmap item 4.
- Every CRM, trial, device, payment, communication, and ingestion domain model. `journey_stage` is the only table.
- The OpenRouter/GLM AI layer, Whisper transcription, and all third-party channel integrations (LINE, email, SMS, Square, Wix/FormRun).
- PWA install manifest and service worker.
- DB-backed integration tests in CI, and any Postgres in the CI runner.
- Staging or preview databases. Preview deploys point at the single Supabase project.

## User-facing behavior

The only "user" at this stage is a developer or an agent working in the repository; there is no operator-facing feature. Observable behavior:

- Visiting `/` redirects to `/ja`. `/ja` and `/ko` each render the scaffold's placeholder page in that locale, using a shadcn component and the mobile-first layout. An unsupported locale segment (`/fr`) is treated by next-intl as a path rather than a locale: it redirects to `/ja/fr`, which returns Next.js's 404.
- `/api/health` returns HTTP 200 with a small JSON body reporting database reachability and the number of seeded journey stages. When the database is unreachable it returns a non-200 with an error indicator and no stack trace in the body; the error is reported to Sentry.
- `/api/inngest` serves the Inngest handler so the local dev server and Inngest Cloud can discover registered functions.
- Missing or malformed environment variables fail fast at startup with a message naming the offending variables, rather than surfacing later as an opaque runtime error.

Loading and empty states are not applicable — there is no data-driven UI in this feature.

## Technical approach

No project baseline exists yet; this feature establishes it. All choices follow `tech-stack.md` — TypeScript strict end-to-end, Next.js App Router as the single deployable, Prisma as the ORM, Zod for validation, next-intl for i18n, Inngest for background jobs, Vitest + Playwright for tests, Vercel + Supabase for hosting. Deviations from that document: none.

Layout follows Next.js conventions with a `src/` root and module boundaries reserved (not yet populated) for the domains `tech-stack.md` names: crm, trials, devices, payments, comms, ingestion. Cross-cutting concerns live in dedicated modules from day one so later features have an obvious home: environment parsing, the Prisma client singleton, the Inngest client, and i18n configuration.

**Environment configuration.** A single Zod-validated environment module is the only place `process.env` is read. It distinguishes the pooled runtime connection from the direct/session connection used for migrations, and separates server-only secrets from `NEXT_PUBLIC_` values. Validation runs at import time so a misconfigured deployment fails at boot.

**Database connectivity.** Prisma uses two URLs: a transaction-pooler URL for application queries (serverless functions open many short-lived connections) and a session-mode URL for migrations. The GitHub Actions runner is IPv4-only while Supabase's direct host resolves IPv6-only, so the migration job connects through the session-mode pooler host in `ap-northeast-1` rather than the direct host. The Prisma client is a module-level singleton guarded against hot-reload duplication in development.

**Migration flow.** Migrations are authored locally against Docker Postgres and committed. On merge to `main`, after the test job passes, a CI job applies pending migrations to Supabase with `prisma migrate deploy`. Migrations never run during a Vercel build, so a preview deploy cannot mutate the production schema and a failed migration does not break hosting.

**RLS.** Prisma connects as a role that bypasses RLS, so enabling it does not affect application queries. Tables created by this feature get RLS enabled with no policy, making them unreadable by the anon and authenticated keys until the auth item adds policies deliberately.

**Background jobs.** The Inngest client is instantiated once and exported; functions are plain, directly-callable handlers registered with the route handler, so they remain unit-testable without the Inngest runtime.

**Error monitoring.** Sentry is initialized for server, edge, and client runtimes with the DSN supplied via environment. Source maps upload during the Vercel build.

## Data model changes

One new table, `journey_stage` — a lookup table, per `tech-stack.md`'s requirement that stages be operator-configurable data rather than enums.

- Columns: surrogate primary key; a stable machine-readable key; a display label; an integer sort position; timestamps.
- Constraints: the machine key is unique; the sort position is unique; both are non-null.
- Index: on sort position, since ordered retrieval is the only access pattern.
- RLS: enabled, no policy.
- Seed: idempotent upsert of eight stages in PRD order — New Inquiry, Consultation, Booking confirmed, Self-trial in progress, Post-trial follow up, Closed Won, On Hold, Closed Lost. The PRD numbers six stages, but its sixth line names three distinct terminal outcomes; they are seeded as separate rows because On Hold is not a closed state and later dashboards must distinguish them. Re-running the seed must not duplicate rows or disturb existing ones.
- Backfill: not applicable; the table is new and empty.

Localized stage labels and operator-editable stage management are decided by the CRM roadmap item, not here.

## External dependencies

**New packages:** `next`, `react`, `typescript`, `tailwindcss`, `shadcn/ui` (and its Radix peers), `next-intl`, `prisma` + `@prisma/client`, `zod`, `inngest`, `@sentry/nextjs`, `vitest`, `@playwright/test`, `eslint` with the Next.js config, and `prettier`.

**Third-party services, all provisioned by the user, who supplies credentials:**

| Service | Purpose | Needed from the user |
|---|---|---|
| Supabase (Tokyo) | Production Postgres | Pooled and session-mode connection strings |
| Vercel | Hosting, production tracking `main` | Project linked to the repository |
| Inngest | Background jobs | Event key and signing key |
| Sentry | Error monitoring | DSN, plus org/project/auth token for source maps |
| GitHub Actions | CI | Session-mode connection string stored as a repository secret |

No OAuth scopes. Docker is required locally for the development database. The implementer never creates accounts or handles credential entry into third-party consoles; the user provisions each service and provides values.

## Decision log

- **pnpm over npm.** Chosen for install speed; requires the corresponding package manager setting in Vercel and a matching setup step in CI.
- **Eight seeded stages, not the PRD's literal six.** The PRD's sixth line collapses Closed Won, On Hold, and Closed Lost; they are seeded separately because On Hold is not terminal and at-risk surfacing will need to distinguish them.
- **`journey_stage` over a throwaway health table.** A real, foundational table proves the migrate → seed → query path and survives into the CRM item, rather than being deleted.
- **Migrations in CI on merge, not in the Vercel build command.** Prevents preview builds from migrating production and decouples schema changes from deploy health.
- **RLS on with deny-all now.** Cheap to add at table creation, and avoids a window where anon-key reads are possible before the auth item lands.
- **One Supabase project plus local Docker Postgres.** Keeps development off the production database without provisioning and syncing a second Supabase project.
- **Session-mode pooler for migrations.** Forced by the IPv4-only GitHub runner against Supabase's IPv6-only direct host.
- **next-intl skeleton included now.** `tech-stack.md` calls retrofitting i18n the expensive path; the routing shape and message-file discipline cost little here.
- **Playwright configured but excluded from CI.** It needs the Docker database the runner does not have; adding a CI Postgres was declined for this item.

## Testing strategy

| File | Level | Asserts |
|---|---|---|
| `tests/unit/env.test.ts` | unit | The Zod environment schema rejects a missing or blank `DATABASE_URL`, `DIRECT_URL`, and Sentry DSN; accepts a valid set; and keeps the pooled and direct URLs distinct rather than collapsing them. |
| `tests/unit/i18n.test.ts` | unit | `messages/ja.json` and `messages/ko.json` have identical key sets, catching translation drift from the first commit; the default locale is `ja`; the configured locale list is exactly `[ja, ko]`. |
| `tests/unit/inngest/hello.test.ts` | unit | The hello-world function's handler, invoked directly with an event payload, returns the expected result — establishing that Inngest functions are testable units without the Inngest runtime, which every later ingestion job depends on. |
| `e2e/smoke.spec.ts` | e2e | The app boots; `/` redirects to `/ja`; a shadcn component renders; `/ko` renders the Korean string; `/api/health` returns 200 reporting a reachable database and eight seeded journey stages. |

The three unit files run in CI. The Playwright smoke runs locally only, because it requires the Docker Postgres the GitHub runner does not have.

Deliberately not covered:

- **DB-backed Vitest integration tests** — CI has no Postgres, so such tests would pass locally and fail in CI. The database path is instead covered by the Playwright smoke against local Docker.
- **Accessibility tests** — there is no real UI yet; the PRD's contrast, screen-reader, and keyboard bar belongs with the first operator screens.
- **A deployed-URL smoke test** — Vercel's own build and deploy status is the signal at this stage.

## Spec checklist

- [x] Scope boundaries are explicit, including at least one out-of-scope item.
- [x] User-visible behavior covers success, empty, loading, and failure states where applicable.
- [x] Data model changes are concrete, or explicitly say "None."
- [x] External dependencies are concrete, or explicitly say "None."
- [x] Trust / approval gates are stated for destructive, async, or AI-driven behavior.
- [x] Success criteria are verifiable by command, test, or manual check.
- [x] Testing strategy lists concrete files and assertions, or gives a project-specific reason for no new tests.
- [x] No implementation code, full migrations, stale alternatives, or duplicated decisions remain.

## Boundaries

**Always**
- Read environment variables through the single validated environment module, never `process.env` directly.
- Put every user-visible string in `messages/ja.json` and `messages/ko.json`; no hard-coded strings in components.
- Enable RLS on every table created, with no permissive policy in this feature.
- Author migrations locally against Docker Postgres and commit them; let CI apply them.

**Ask first**
- Adding any package, service, or environment variable beyond those listed under External dependencies.
- Any change to the Supabase schema outside the `journey_stage` table.
- Any deviation from `tech-stack.md`.

**Never**
- Create accounts, or enter credentials into Supabase, Vercel, Inngest, Sentry, or GitHub consoles — the user does this and supplies values.
- Commit real secrets. `.env.example` carries placeholders only.
- Run `prisma migrate` or a seed against the Supabase production database from a developer machine.
- Implement auth, audit triggers, soft-delete, or any domain model — those are separate roadmap items.

## Success criteria

1. `pnpm install && pnpm dev` boots the app; `/` redirects to `/ja`; `/ko` renders the Korean string; an unsupported locale 404s.
2. `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass locally.
3. `prisma migrate dev` against Docker Postgres creates `journey_stage`; the seed script inserts the eight stages and is idempotent across repeated runs.
4. `journey_stage` has RLS enabled and no policy, confirmed by querying Postgres catalog state.
5. The Inngest dev server discovers `/api/inngest` and the hello function executes on a sent event.
6. Sentry receives a deliberately triggered error from both a server and a client path.
7. `/api/health` returns 200 with database reachability and a stage count of eight.
8. `pnpm exec playwright test` passes locally against the running app and Docker Postgres.
9. The GitHub Actions PR job passes on this feature's pull request, running typecheck, lint, and the unit tests.
10. On merge to `main`, the migration job applies `journey_stage` to Supabase Tokyo through the session-mode pooler.
11. The Vercel production deployment from `main` serves the app against Supabase, with `/api/health` returning 200 and eight stages.
12. `AGENTS.md` documents the stack, commands, repository layout, testing expectations, and conventions; `.env.example` lists every required variable.

Criteria 10 and 11 depend on the user having provisioned the services and supplied credentials, and are verified after the pull request merges.

## Open questions

None.
