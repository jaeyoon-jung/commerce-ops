# Tasks: Stack scaffold

Implementation contract for `spec.md` / `plan.md`. Dependency-ordered; each task ends at a verifiable state.

- [x] **T1 — Repo baseline**
  - Refs: `spec.md` → Scope, Technical approach; `plan.md` → step 1 (C1)
  - Acceptance: Next.js App Router app on pnpm at the repository root with TypeScript strict, Tailwind, ESLint and Prettier. Scripts `dev`, `build`, `start`, `typecheck`, `lint`, `format`, `test` exist. Pre-existing tracked files (`PRD.md`, `README.md`, `ROADMAP.md`, `tech-stack.md`, `specs/`) are untouched. `.gitignore` covers `node_modules`, `.next`, `.env*` except `.env.example`.
  - Tests: None — this task creates the harness the later tests run in; proven by T2's first assertion.
  - Verify: `pnpm install && pnpm typecheck && pnpm lint && pnpm build`; `git status` shows only additions.
  - Files: generated Next.js skeleton (`package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.gitignore`, `src/app/*`). Exceeds five files because a framework scaffold is atomic — splitting it produces intermediate states that neither build nor typecheck.

- [x] **T2 — Environment module and test harness**
  - Refs: `spec.md` → Technical approach → Environment configuration, Testing strategy; `plan.md` → step 2 (C2, C3)
  - Acceptance: A single Zod-validated module is the only reader of `process.env`. It separates the pooled runtime URL from the direct/session URL, and server secrets from `NEXT_PUBLIC_` values. Import-time validation throws naming the offending variables. `.env.example` lists every variable with a placeholder and no real secret. Vitest is configured with unit tests under `tests/unit/`.
  - Tests: `tests/unit/env.test.ts` — rejects missing/blank `DATABASE_URL`, `DIRECT_URL`, and the Sentry DSN; accepts a valid set; keeps pooled and direct URLs distinct.
  - Verify: `pnpm test`; blanking a required variable and running `pnpm build` fails with that variable named.
  - Files: `src/lib/env.ts`, `.env.example`, `vitest.config.ts`, `tests/unit/env.test.ts`, `package.json`

- [x] **T3 — i18n routing skeleton**
  - Refs: `spec.md` → Scope, User-facing behavior; `plan.md` → step 3 (C4)
  - Acceptance: next-intl pinned. `[locale]` segment routing with `ja` default and `ko` second. `/` redirects to `/ja`; `/ko` renders Korean; an unsupported locale segment redirects into the default locale and 404s there. Both message files exist, are non-empty, and hold every scaffold string — no hard-coded strings in components.
  - Tests: `tests/unit/i18n.test.ts` — `messages/ja.json` and `messages/ko.json` have identical key sets; default locale is `ja`; configured locales are exactly `[ja, ko]`.
  - Verify: `pnpm test`; `pnpm dev` then check `/`, `/ja`, `/ko`, `/fr`.
  - Files: `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `messages/ja.json`, `messages/ko.json`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/page.tsx`, `tests/unit/i18n.test.ts`. Exceeds five because next-intl's routing rewrite is a single indivisible move of the app tree; an intermediate commit would leave the app unroutable.

- [x] **T4 — UI baseline**
  - Refs: `spec.md` → Scope; `plan.md` → step 4 (C5)
  - Acceptance: shadcn/ui initialized against the installed Tailwind major, with its config and utility helper committed. The locale layout is mobile-first and uses at least one real shadcn component. All visible text resolves through next-intl.
  - Tests: None new — the rendered component is asserted by `e2e/smoke.spec.ts` in T9.
  - Verify: `pnpm lint && pnpm build`; both locales render the component.
  - Files: `components.json`, `src/lib/utils.ts`, `src/components/ui/*`, `src/app/[locale]/page.tsx`, `src/app/globals.css`

- [x] **T5 — Data layer**
  - Refs: `spec.md` → Data model changes, Technical approach → Database connectivity and RLS; `plan.md` → step 5 (C6)
  - Acceptance: Docker Compose runs Postgres on a non-default host port. Prisma schema defines `journey_stage` with a unique machine key, unique sort position, non-null label, timestamps, and an index on sort position. The initial migration is hand-extended to enable RLS with no policy. The seed idempotently upserts the eight stages in PRD order. The Prisma client is a hot-reload-safe singleton.
  - Tests: None new — CI has no Postgres by decision, so DB assertions are covered by `e2e/smoke.spec.ts` in T9 against local Docker.
  - Verify: `docker compose up -d`; `pnpm prisma migrate dev`; run the seed twice and confirm eight rows both times; catalog query confirms `relrowsecurity` true with zero policies.
  - Files: `docker-compose.yml`, `prisma/schema.prisma`, `prisma/migrations/*/migration.sql`, `prisma/seed.ts`, `src/lib/prisma.ts`

- [x] **T6 — Health route**
  - Refs: `spec.md` → User-facing behavior; `plan.md` → step 6 (C7)
  - Acceptance: `/api/health` returns 200 with JSON reporting database reachability and the journey-stage count. With the database stopped it returns a non-200 with an error indicator and no stack trace in the body, and reports to Sentry once T8 lands.
  - Tests: None new — asserted by `e2e/smoke.spec.ts` in T9.
  - Verify: `curl` the route with Docker up (200, count 8) and with Docker stopped (non-200, no stack trace).
  - Files: `src/app/api/health/route.ts`

- [x] **T7 — Background jobs**
  - Refs: `spec.md` → Technical approach → Background jobs; `plan.md` → step 7 (C8)
  - Acceptance: A single exported Inngest client configured from the env module. One hello-world function whose handler is a plain exported function, directly callable without the Inngest runtime. `/api/inngest` serves the handler and lists registered functions.
  - Tests: `tests/unit/inngest/hello.test.ts` — the handler, invoked directly with an event payload, returns the expected result.
  - Verify: `pnpm test`; Inngest dev server discovers `/api/inngest` and the function runs on a sent event.
  - Files: `src/lib/inngest.ts`, `src/inngest/functions/hello.ts`, `src/app/api/inngest/route.ts`, `tests/unit/inngest/hello.test.ts`

- [x] **T8 — Error monitoring**
  - Refs: `spec.md` → Technical approach → Error monitoring; `plan.md` → step 8 (C9)
  - Acceptance: Sentry initialized for server, edge, and client runtimes with the DSN from the env module. Source-map upload is guarded on auth-token presence so a tokenless build still succeeds. A deliberate server error and a deliberate client error both report.
  - Tests: None new — verified manually; asserting real delivery to a third-party service is not a useful automated test at this stage.
  - Verify: `pnpm build` succeeds with no Sentry auth token set, and activates the source-map upload path when all three credentials are present — both confirmed. Actual delivery of a thrown server and client error to Sentry is BLOCKED pending a real DSN, and is verified together with T12.
  - Files: `sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `next.config.ts`

- [x] **T9 — End-to-end harness**
  - Refs: `spec.md` → Testing strategy; `plan.md` → step 9 (C10)
  - Acceptance: Playwright configured to boot the app itself, excluded from CI per decision. The smoke spec covers locale routing, the rendered component, and the health payload in one pass.
  - Tests: `e2e/smoke.spec.ts` — app boots; `/` redirects to `/ja`; a shadcn component renders; `/ko` renders the Korean string; `/api/health` returns 200 with a reachable database and eight seeded stages.
  - Verify: `pnpm exec playwright test` green with Docker Postgres up and the database seeded.
  - Files: `playwright.config.ts`, `e2e/smoke.spec.ts`, `package.json`, `.gitignore`

- [x] **T10 — Continuous integration**
  - Refs: `spec.md` → Technical approach → Migration flow, Success criteria 9–10; `plan.md` → step 10 (C11)
  - Acceptance: A PR workflow installs with pnpm, runs `prisma generate`, `typecheck`, `lint`, and the unit suite, and needs no database or secret. A separate `main` workflow runs `prisma migrate deploy` against Supabase through the session-mode pooler host, using a repository secret, gated behind the test job. Playwright is not run in CI.
  - Tests: None new — the workflow's job is to execute the existing suite.
  - Verify: the PR job passes on this branch's pull request. The migration job is verified post-merge, per `plan.md` checkpoint 12.
  - Files: `.github/workflows/ci.yml`, `.github/workflows/migrate.yml`

- [x] **T11 — Documentation**
  - Refs: `spec.md` → Scope (final bullet), Boundaries, Success criteria 12; `plan.md` → step 11 (C12)
  - Acceptance: `AGENTS.md` documents the stack, every command, repository layout, the reserved domain module boundaries, testing expectations, the Docker prerequisite and its port, the manual `prisma migrate deploy` fallback, and the conventions from `spec.md` → Boundaries. `README.md` covers setup. `.env.example` matches what the env module actually requires. Every documented command is executed and confirmed, not assumed.
  - Tests: None new — documentation accuracy is verified by running the commands it lists.
  - Verify: DONE — the README quick-start was executed verbatim in a fresh clone against a clean database (install, migrate, seed twice, typecheck, lint, test), and `.env.example` was diffed against the env schema programmatically: identical key sets.
  - Files: `AGENTS.md`, `README.md`, `.env.example`

- [ ] **T12 — Hosting**
  - Refs: `spec.md` → Success criteria 11; `plan.md` → step 12 (C13)
  - Acceptance: Vercel project linked to the repository with production tracking `main`, pnpm as the package manager, and every required environment variable set. The production deployment serves the app and `/api/health` returns 200 with eight stages.
  - Tests: None new — Vercel's build and deploy status is the signal, per `spec.md` → Testing strategy.
  - Verify: the production URL serves both locales and `/api/health` returns 200 with eight stages.
  - Files: `vercel.json` if required; otherwise dashboard configuration only.
  - Blocked: NOT DONE. The Vercel CLI is installed but unauthenticated, and creating accounts or entering credentials is out of bounds for the implementer. Handover steps:
    1. `vercel login`, then `vercel link` in the repository root.
    2. Set the package manager to pnpm in Vercel project settings.
    3. Set production environment variables: `DATABASE_URL` (Supabase transaction pooler, port 6543), `DIRECT_URL` (session-mode pooler, port 5432), `NEXT_PUBLIC_SENTRY_DSN`, `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`, and optionally `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` for source maps.
    4. Add the repository secret `SUPABASE_MIGRATION_URL` (session-mode pooler URL) so `.github/workflows/migrate.yml` can apply migrations.
    5. Register the production `/api/inngest` endpoint with the Inngest app.
    Then verify: the production URL serves `/ja` and `/ko`, and `/api/health` returns 200 with eight stages.

## Task generation report

- Total tasks: 12
- Sequential tasks: 9 (T1 → T2 → T3 → T4; T5 → T6; T9 → T10 → T12)
- Parallel candidates: T5–T6 (data layer and health route) run independently of T7 (Inngest) and T8 (Sentry); all four are unblocked once T2 lands. T11 can be drafted early but must be re-verified against the finished state.
- Test tasks: T2 (`tests/unit/env.test.ts`), T3 (`tests/unit/i18n.test.ts`), T7 (`tests/unit/inngest/hello.test.ts`), T9 (`e2e/smoke.spec.ts`). All four tests from `spec.md` → Testing strategy are allocated. T1, T4, T5, T6, T8, T10, T11, T12 each record a project-specific reason for adding none.
- MVP slice: T1–T4 — a deployable, typechecked, localized, tested app with no database. This is the fallback slice if service provisioning stalls, per `plan.md` → Parallelizable vs sequential.
- Context budget check: every task carries `Refs`, `Acceptance`, `Tests`, `Verify`, and `Files`. T1 and T3 exceed five files, each recording why splitting would leave a non-building intermediate state; the remaining ten are within budget.
