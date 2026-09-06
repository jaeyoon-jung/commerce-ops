# Tech Stack

Internal operations app for walking-assistance-device sales & rental (see `PRD.md`). Built and maintained by a solo developer working with AI coding agents, so every choice below optimizes for one thing: a boring, heavily documented, single-deployable stack that agents generate correctly on the first try. UI in Japanese (default) and Korean; operators access it from phones in the field.

## Shape of the system

One full-stack web application, one Postgres database, one background-job layer. Mobile-first responsive web (installable PWA), **online-only** — offline sync was evaluated and scrapped (see Deferred). No native apps, no microservices: the PRD's "modular, API-driven architecture" is satisfied by module boundaries in code (crm / trials / devices / payments / comms / ingestion), not by separate services a solo dev would have to operate.

## Core stack

| Layer | Choice |
|---|---|
| Language | TypeScript end-to-end, strict mode |
| Framework | Next.js (App Router) — UI, server actions, and webhook/API routes in one deployable |
| UI | React + Tailwind CSS + shadcn/ui (Radix primitives give the PRD's accessibility bar — contrast, screen reader, keyboard — for free) |
| Database | PostgreSQL on Supabase, Tokyo region (`ap-northeast-1`) |
| ORM | Prisma (schema-first; the most AI-agent-legible ORM) |
| Validation | Zod schemas shared between forms, server actions, and webhook parsers |
| Auth | Supabase Auth — email/password for a small operator team, role claims for RBAC |
| File/voice storage | Supabase Storage (voice memos, contracts, bulk-import files) |
| Background jobs | Inngest — webhook ingestion pipelines, scheduled next-step generation (decision follow-ups, device recovery, payment reminders), retries with dead-lettering |
| Hosting | Vercel (app) + Supabase (data). No infra constraint was given; this pair is the fastest path to the PRD's 99.9% uptime without anyone on call |
| Testing | Vitest (unit, next-step rules and their precedence resolution especially) + Playwright (core flows: consultation gate, one-screen logging) |
| Monitoring | Sentry + Vercel/Supabase built-ins |

**Why not Python/Django:** no team skill constraint favored it, and a single TypeScript codebase means one language across UI, server, jobs, and webhook handlers — fewer seams for a solo dev.

**i18n: next-intl.** The UI ships in Japanese (default) and Korean, switchable per operator. next-intl is the App Router-native choice: locale-scoped layouts, ICU MessageFormat for pluralization, and type-safe message keys. All UI strings live in `messages/ja.json` / `messages/ko.json` from day one — retrofitting i18n is the expensive path, so no hard-coded strings in components. Dates/numbers format via the standard `Intl` API per locale. Customer-facing content (SMS/LINE/email templates, AI drafts) stays Japanese — the locale switch is operator UI only.

## AI layer

| Concern | Choice |
|---|---|
| Gateway | OpenRouter, called through the OpenAI-compatible Chat Completions API (`openai` SDK with `baseURL: https://openrouter.ai/api/v1`). Model IDs are env config, not code — any open-weight or hosted model swaps in without touching call sites |
| Models | GLM family (open-weight): a light GLM variant (e.g., `z-ai/glm-4.5-air`) for high-volume structured extraction, dedup assist, and classification; the flagship (e.g., `z-ai/glm-4.6`) for takeover-ready summaries, suggested next steps, and review-before-send drafts. Verify Japanese output quality on real consultation notes before M2; the OpenRouter abstraction makes falling back to another model a config change |
| Structured output | OpenAI-style tool calling / JSON mode + Zod schema validation on every response — malformed outputs are retried or routed to the review queue, never written to records |
| Voice memo transcription | Whisper (open-weight; via API or self-hosted `large-v3`) for Japanese STT. Google Speech-to-Text is the fallback if accuracy on field audio disappoints |
| Chat search/analysis interface | Tool calling over internal read-only query tools, same gateway; built after core CRM ships |

All AI writes are constrained: high-confidence updates apply directly (counted toward the ≥50% automation metric), ambiguous matches go to the review queue, and outbound consultative messages always require operator approval — per PRD.

## Integrations

| Channel | Mechanism |
|---|---|
| LINE | LINE Messaging API (Official Account): inbound webhooks → ingestion pipeline; outbound push messages for templated/approved sends |
| Email | Connect the business mailbox (Gmail API if on Google Workspace, else IMAP/SMTP) so ingestion and sends use the existing address — deliverability and thread continuity beat a transactional-email vendor here |
| Phone | Click-to-call: `tel:` links open the operator's dialer; the app prompts for an outcome log afterward. No CPaaS (decided — see Deferred) |
| SMS | CPaaS — Rakuten CPaaS SMS API: ¥8/msg send *and* receive, no monthly fee or minimums, domestic carrier route to Japanese mobiles (vs ~¥12–17/msg on Twilio, whose deliverability/sender-ID behavior we'd have had to verify). Outbound sends (templated reminders, approved drafts) and inbound webhooks auto-logged to the customer timeline through the same ingestion pipeline as LINE. Before the comms milestone: confirm inbound webhook ergonomics and per-segment billing on long Japanese messages (>70 chars multiplies cost on any vendor). Twilio is the fallback — and the vendor if app-routed voice ever gets built |
| Web forms | Wix / FormRun webhooks → ingestion pipeline → consultation-gate next step set on the customer |
| Payments | Square Webhooks for automatic payment-status updates; bank data via CSV import with manual override |

## Audit & data integrity

- Append-only `audit_log` table written by Postgres triggers on every mutating table — user, timestamp, before/after. App code can't forget to log.
- Soft delete everywhere (`deactivated_at`); no destructive deletes, per PRD compliance requirement.
- Journey stages, device statuses, payment statuses, and next-step types are lookup tables, not enums — the PRD requires stages to be operator-configurable, and next-step precedence is configured over the same table.
- The PRD's one-open-next-step-per-customer rule is enforced in the database, not just in app code: a partial unique index on `(customer_id)` where the next step is open. Superseded and completed next steps stay as history rows, so the timeline keeps the full trail.

## Deferred / rejected

- **Offline sync** — scrapped from the PRD (2026-09). A local-first sync engine is the most expensive line item in the original spec; mobile connectivity in the field makes read-mostly PWA caching sufficient if it ever comes back.
- **CPaaS voice telephony** (call routing/recording through the app) — rejected in favor of click-to-call; SMS *does* go through CPaaS (Rakuten, above), but Rakuten's SMS API has no voice path. Revisit only if call-outcome logging compliance proves unreliable — that's when Twilio enters the stack.
- **Native iOS/Android apps** — responsive PWA covers field use.
- Customer-facing portal, accounting/ERP integration, demand forecasting — PRD non-goals.

Nothing is scaffolded yet; this repo is greenfield (PRD only) as of this writing.
