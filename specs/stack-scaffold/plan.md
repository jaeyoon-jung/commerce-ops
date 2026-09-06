# Plan: Stack scaffold

Sequencing for `spec.md`. Decisions live there; this file owns order, dependencies, risk, and checkpoints.

## Components

| # | Component | Owns | Spec reference |
|---|---|---|---|
| C1 | Repo baseline | Next.js App Router app at repo root, TypeScript strict, pnpm, Tailwind, ESLint + Prettier, package scripts | Technical approach; Scope (in scope, first bullet) |
| C2 | Environment module | Sole reader of `process.env`, Zod-validated, pooled/direct split, `.env.example` | Technical approach → Environment configuration |
| C3 | Test harness | Vitest config and the unit suite location | Testing strategy |
| C4 | i18n skeleton | `[locale]` routing, `ja`/`ko` message files, locale config | Scope; User-facing behavior |
| C5 | UI baseline | shadcn/ui init, mobile-first root layout, one real component | Scope |
| C6 | Data layer | Docker Postgres, Prisma client singleton, `journey_stage` model, migration, RLS statement, seed | Data model changes; Technical approach → Database connectivity, RLS |
| C7 | Health route | `/api/health` reporting reachability and stage count | User-facing behavior |
| C8 | Background jobs | Inngest client, `/api/inngest` route, hello function | Technical approach → Background jobs |
| C9 | Monitoring | Sentry server/edge/client init, conditional source-map upload | Technical approach → Error monitoring |
| C10 | E2E harness | Playwright config and the smoke spec | Testing strategy |
| C11 | CI | GitHub Actions PR job and merge-to-`main` migration job | Technical approach → Migration flow |
| C12 | Documentation | `AGENTS.md`, `README.md`, finalized `.env.example` | Scope (final bullet) |
| C13 | Hosting | Vercel project linked, production tracking `main` | Success criteria 11 |

## Dependencies

```
C1 ──┬─→ C2 ──┬─→ C6 ──→ C7 ──┐
     │        ├─→ C8          ├─→ C10 ──→ C11 ──→ C13
     │        └─→ C9          │
     ├─→ C3 ──────────────────┤
     └─→ C4 ──→ C5 ───────────┘

C12 draws on all of the above; written last, verified against reality.
```

- **C1 blocks everything** — there is no package.json until it lands.
- **C2 blocks C6, C8, C9** — each needs validated configuration rather than raw `process.env` reads.
- **C3 blocks every unit test**, so it lands with the first test rather than as its own step.
- **C4 before C5** — next-intl restructures `app/` into `app/[locale]/`; building the layout first means rebuilding it. Ordering this way avoids churn.
- **C6 blocks C7** — the health route reports on the seeded table.
- **C10 depends on C4, C5, C7** — the smoke spec asserts locale routing, a rendered component, and the health payload together.
- **C11 depends on C3 and C6** — the PR job runs the unit suite; the migration job needs committed migrations.
- **C13 and the migration half of C11 depend on user-provisioned credentials**, which is why they sit last.

## Implementation order

Sequenced so that every step ends at a runnable checkpoint, and every step needing your credentials sits at the end.

1. **Repo baseline (C1).** Scaffold Next.js into the existing repository without disturbing `PRD.md`, `specs/`, and the other tracked files. Establish `dev`, `build`, `typecheck`, `lint`, `test` scripts.
2. **Environment module + first test (C2, C3).** Zod schema, `.env.example`, Vitest wired, `tests/unit/env.test.ts` green. Doing C3 here means the harness is proven by a real assertion at the earliest possible moment.
3. **i18n skeleton (C4).** `[locale]` segment, `ja` default, `ko` second, both message files, `tests/unit/i18n.test.ts` enforcing key parity from the first commit.
4. **UI baseline (C5).** shadcn/ui initialized into the locale layout; one component actually used.
5. **Data layer (C6).** Docker Postgres, Prisma schema and client singleton, `journey_stage` migration with the RLS statement, idempotent eight-stage seed.
6. **Health route (C7).** Ties C2 and C6 together and gives the e2e spec something to assert.
7. **Background jobs (C8).** Inngest client, route handler, hello function, its unit test.
8. **Monitoring (C9).** Sentry across the three runtimes, source-map upload guarded on token presence.
9. **E2E harness (C10).** Playwright config and the smoke spec, run against local Docker.
10. **CI (C11).** PR job first and verified green on this branch; the migration job authored alongside it but only exercised on merge.
11. **Documentation (C12).** `AGENTS.md` written against what actually shipped, not against intent.
12. **Hosting (C13).** Vercel linked and deployed. Verified post-merge.

Rationale for the two non-obvious placements: i18n precedes the UI work because it rewrites the layout's location, and CI lands after the tests exist so the first pipeline run is meaningful rather than a placeholder.

## Parallelizable vs sequential

**Sequential spine:** 1 → 2 → 3 → 4, and 5 → 6, and 9 → 10 → 12.

**Parallel candidates**, all unblocked once step 2 lands:
- Steps 5–6 (data layer and health route) are independent of steps 7 and 8.
- Step 7 (Inngest) and step 8 (Sentry) touch disjoint files and depend only on the env module.
- Step 11's documentation can be drafted in parallel but must be re-verified against the finished state.

**Independently shippable slice:** steps 1–4 alone produce a deployable, typechecked, localized, tested app with no database. That is the natural fallback if provisioning stalls.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `create-next-app` refuses to run in, or clobbers, a non-empty repository | Scaffold into a temporary directory and move the generated files in; verify with `git status` that only additions appear and no tracked file changed |
| next-intl's routing API differs across major versions, and the wrong shape fails silently at the routing layer | Pin the version at install; follow the installed version's own documentation rather than recalled APIs; `tests/unit/i18n.test.ts` fails loudly on a config mismatch |
| Prisma cannot run migrations through a transaction pooler | Already decided in spec → Database connectivity: separate `DIRECT_URL`. Local Docker is unaffected; the constraint only binds CI |
| Supabase's direct host is IPv6-only and the GitHub runner is IPv4-only, so the migration job fails on first real use | Use the session-mode pooler host per spec; keep the migration job separate from the test job so failure is isolated and diagnosable; document the manual `prisma migrate deploy` fallback in `AGENTS.md` |
| Prisma has no declarative RLS support, so a generated migration will not enable it | Hand-extend the generated migration with the RLS statement; verify by querying Postgres catalog state, which is success criterion 4 — not by assuming |
| shadcn/ui and the installed Tailwind major version disagree | Initialize via the shadcn CLI so it detects the installed version; resolve on the spot if it reports a mismatch |
| Docker absent, or host port 5432 already in use | Map a non-default host port in the compose file; document the prerequisite and the port in `AGENTS.md` |
| Sentry source-map upload fails the Vercel build when the auth token is missing | Guard the upload on token presence so a tokenless build still succeeds |
| Work stalls waiting on credentials you have not yet supplied | Every credential-dependent step is ordered last; steps 1–9 complete against local values and placeholders |
| Scaffold scope creeps into auth, audit, or domain models | Spec → Boundaries lists these as "Never"; each is attributed to its owning roadmap item |

## Verification checkpoints

Each gate must pass before the next step begins. Gate numbers map to `spec.md` → Success criteria.

| After step | Must pass | Criterion |
|---|---|---|
| 1 | `pnpm dev` boots; `pnpm typecheck` and `pnpm lint` clean; `git status` shows no modification to pre-existing tracked files | 1, 2 |
| 2 | `pnpm test` green; app fails fast with a named variable when a required one is blank | 2 |
| 3 | `/` → `/ja`; `/ko` renders Korean; `/fr` 404s; key-parity test green | 1 |
| 4 | Both locales render the shadcn component in the mobile-first layout | 1 |
| 5 | `prisma migrate dev` creates the table; seed inserts eight stages and re-runs without duplication; catalog query confirms RLS enabled with no policy | 3, 4 |
| 6 | `/api/health` returns 200 with eight stages; returns non-200 without a stack trace when the database is stopped | 7 |
| 7 | Inngest dev server discovers `/api/inngest`; the function runs on a sent event; its unit test is green | 5 |
| 8 | A deliberate server error and a deliberate client error both reach Sentry | 6 |
| 9 | `pnpm exec playwright test` green locally | 8 |
| 10 | The PR job passes on this branch's pull request | 9 |
| 11 | `AGENTS.md` commands all execute as documented; `.env.example` covers every variable the env module requires | 12 |
| 12 | Production deploy serves the app; `/api/health` returns 200 with eight stages; the merge job applied the migration to Supabase | 10, 11 |

**Full gate before the pull request:** `pnpm typecheck && pnpm lint && pnpm test` clean, Playwright green locally, and no secret present in any tracked file.

Checkpoint 12 — which covers both the production deploy and the merge-time migration — is the only one verified after merge, per `spec.md` → Success criteria. Checkpoint 10 is fully verifiable on this branch, because the PR job runs on the pull request itself.
