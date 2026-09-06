# commerce-ops

Internal operations app for walking-assistance-device sales and rental — one
system for customer, trial, device, shipping, and payment data, replacing seven
legacy spreadsheets.

- `PRD.md` — product requirements and the business process
- `tech-stack.md` — technology choices and why
- `ROADMAP.md` — what is built and what is next
- `AGENTS.md` — commands, layout, and conventions for working in this repo

**Status:** scaffold. The stack is wired and verified; no product feature is
implemented yet.

## Quick start

Requires Node 24, pnpm, and Docker.

```bash
pnpm install
cp .env.example .env.local && cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Then open http://localhost:3000 — it redirects to `/ja`. Korean is at `/ko`.

See `AGENTS.md` for the full command reference and conventions.
