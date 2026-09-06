<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# commerce-ops

Internal operations app for walking-assistance-device sales and rental. Operators
are a small internal team working mostly from phones in the field.

Read `PRD.md` for the business process, `tech-stack.md` for technology choices and
their rationale, and `ROADMAP.md` for what is built and what is next. Feature specs
live under `specs/<feature-slug>/`.

## Status

Scaffold only. The stack is wired and verified end to end; no product feature is
implemented yet. `journey_stage` is the only table.

## Commands

| Command | Does |
|---|---|
| `pnpm dev` | Dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build (requires the Inngest keys — see below) |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier (markdown is excluded) |
| `pnpm test` | Vitest unit suite |
| `pnpm test:e2e` | Playwright smoke — needs the database up and seeded |
| `pnpm db:up` / `pnpm db:down` | Local Postgres in Docker |
| `pnpm db:migrate` | `prisma migrate dev` against local Postgres |
| `pnpm db:seed` | Seed journey stages (idempotent) |
| `pnpm db:studio` | Prisma Studio |

`pnpm typecheck` runs `next typegen` first on purpose: Next 16 generates
`LayoutProps` and `PageProps` into `.next/types`, so bare `tsc` fails on a clean
checkout.

## First-time setup

```bash
pnpm install
cp .env.example .env.local && cp .env.example .env   # Prisma CLI reads .env
pnpm db:up            # Docker Desktop must be running
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Docker is required for local development. Postgres binds host port **55432**, not
5432, so it will not collide with a system Postgres.

## Layout

```
src/app/[locale]/     Localized pages. next-intl owns <html lang> here.
src/app/api/          Route handlers: health, inngest. Never locale-prefixed.
src/components/ui/    shadcn components (generated; edit freely)
src/i18n/             Locale config and the next-intl request config
src/inngest/          Background job definitions
src/lib/              env, prisma, inngest clients
src/proxy.ts          Locale routing (Next 16's rename of middleware.ts)
prisma/               Schema, migrations, seed
messages/             ja.json (default) and ko.json
e2e/                  Playwright specs
tests/unit/           Vitest specs
```

Domain modules — crm, trials, devices, payments, comms, ingestion — are code
boundaries inside this one app, not services. They do not exist yet; create them
under `src/` as their roadmap items land.

## Conventions

- **Never read `process.env` outside `src/lib/env.ts`.** It is the single
  validated entry point. Add new variables to its schema and to `.env.example`.
- **No hard-coded user-facing strings.** Every string goes in `messages/ja.json`
  and `messages/ko.json`. A unit test enforces that the two files have identical
  key sets, so a string added to one and forgotten in the other fails CI.
- **Enable RLS on every new table**, with no permissive policy, until the auth
  item adds policies deliberately. Prisma bypasses RLS, so this costs nothing at
  runtime. Prisma cannot express RLS, so append the `ALTER TABLE ... ENABLE ROW
  LEVEL SECURITY` statement to the generated migration by hand.
- **Soft delete, never hard delete** (`deactivated_at`), per the PRD's compliance
  requirement. The audit roadmap item makes this systematic.
- **Lookup tables, not enums**, for journey stages, device statuses, and payment
  statuses — the PRD requires operators to configure them.
- **Keep Inngest handlers as plain functions**, with `createFunction` as a thin
  wrapper, so jobs stay testable without the Inngest runtime. See
  `src/inngest/functions/hello.ts`.
- **Never commit real secrets.** `.env.example` carries placeholders only.

## Databases

There are two, and CI owns neither.

| Where | What | Used by |
|---|---|---|
| Docker, host port 55432 | Local Postgres | You, and the Playwright smoke |
| Supabase `ap-northeast-1` | Production | The deployed Vercel app |

Two connection strings, and they must differ:

- `DATABASE_URL` — the transaction pooler (Supabase port 6543). What the running
  app queries through.
- `DIRECT_URL` — the session-mode pooler (port 5432). What `prisma migrate` and
  `prisma db seed` use. **Migrations cannot run through a transaction pooler.**

The env schema rejects a configuration where the two are identical, because that
mistake otherwise only surfaces as a CI failure.

### Migrations reach production through CI

`.github/workflows/migrate.yml` runs `prisma migrate deploy` after CI passes on
`main`. It is deliberately not part of the Vercel build: a preview deploy must
never migrate production, and a failed migration must not break hosting.

It needs the repository secret `SUPABASE_MIGRATION_URL`, set to the **session-mode
pooler** URL:

```
postgresql://postgres.<ref>:<password>@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```

Not `db.<ref>.supabase.co`. That host resolves IPv6-only and GitHub runners are
IPv4-only, so it is unreachable from CI.

**Manual fallback**, if the workflow is unavailable:

```bash
DIRECT_URL="<session-mode pooler URL>" pnpm exec prisma migrate deploy
```

Never run `prisma migrate dev`, `migrate reset`, or the seed against production.

## Environment variables

See `.env.example` for the full list. Two notes that cost time otherwise:

- `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are **required in production** and
  optional locally. `pnpm start` runs as production, so it refuses to boot without
  them; use `pnpm dev` locally, or set them to any placeholder. Without them
  `/api/inngest` would return 500 at request time, so the check happens at boot
  instead (`assertRuntimeEnv` in `src/lib/env.ts`).
- Sentry source-map upload activates only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
  and `SENTRY_PROJECT` are all set. Builds without them succeed.

## Testing

- **Vitest** (`tests/unit/`) runs in CI. Pure functions only — no database.
- **Playwright** (`e2e/`) runs locally only, because it needs the Docker Postgres
  the GitHub runner does not have. Run `pnpm db:up && pnpm db:seed` first.

If you add DB-backed tests, CI needs a Postgres service container; that was
deliberately deferred, not overlooked.

## Background jobs

Run the Inngest dev server alongside `pnpm dev`:

```bash
pnpm dlx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```
