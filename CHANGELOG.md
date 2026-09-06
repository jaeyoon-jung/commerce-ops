# Changelog

## 2026-09-06

- Scaffolded the application: Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4, on pnpm.
- Added Japanese-default and Korean locale routing with next-intl, enforcing message-key parity by test.
- Added the shadcn/ui baseline with a mobile-first layout, sized for operators working from phones.
- Added the `journey_stage` lookup table with an idempotent seed of the eight customer journey stages.
- Enabled row-level security with no permissive policy on every table, ahead of the auth work.
- Added `/api/health`, reporting database reachability and seeded-stage count so a bad deploy reads as wrong rather than merely up.
- Added the Inngest background-job layer with a typed, Zod-validated event and a directly testable handler.
- Wired Sentry across server, edge, and client runtimes, with source-map upload guarded on credentials.
- Added a Vitest unit suite and a mobile-first Playwright smoke covering locale routing and the health check.
- Added CI running typecheck, lint, formatting, unit tests, and build, plus a separate job applying migrations to Supabase after `main` passes.
- Added `AGENTS.md` and a README documenting commands, layout, conventions, and the two-database setup.
- Recorded the stack-scaffold specification, plan, and task breakdown under `specs/`.

## 2026-09-05

- Drafted the product requirements: consultation-gated trial process, three trial types, and the customer, device, and payment status models.
- Scoped the technology stack with rationale, and sequenced the roadmap from CRM through rollout.

## 2026-08-22

- Initialized the repository.
