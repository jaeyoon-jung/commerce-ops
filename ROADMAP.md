# Roadmap

Forward-looking plan for the internal sales & rental operations app, sequenced to follow `PRD.md`'s priority order: CRM (Highest) → Device & payments and Communication (Medium) → AI ingestion (Low) → Rollout. Each checklist item is feature-sized — meant to break into a handful of implementation tasks when picked up. Status is updated as work lands; shipped history belongs in `CHANGELOG.md`.

---

**Goal:** Platform foundation
Why: Every later goal assumes a deployed app with login, locales, and the audit guarantees the PRD makes non-negotiable.

- [ ] Scaffold the stack per `tech-stack.md`: Next.js (App Router) + Prisma + Supabase (Tokyo) + Inngest, deployed to Vercel with CI running typecheck/lint/tests
- [ ] Operator authentication and role-based access with Supabase Auth
- [ ] i18n foundation with next-intl: ja (default) / ko locales, per-operator switch, all strings in message files from day one
- [ ] Audit and integrity plumbing: append-only audit_log via Postgres triggers, soft-delete (`deactivated_at`) conventions, edits stamped with user and timestamp

---

**Goal:** Core CRM & journey model
Why: Operators need full customer context — stage, history, timeline — retrievable from a phone before any automation is worth building on top.

- [ ] Customer profiles with B2C/B2B type, source, preferred contact channel, and configurable journey-stage model (stages as data, not enums)
- [ ] Per-customer timeline of interactions, notes, status changes, and system updates
- [ ] Mobile-first search across name, phone, email, and device serial
- [ ] Single open next step per customer — action type, owner, due date, status, detail — where completing one requires logging the outcome and setting the following one (no per-customer task lists)
- [ ] One-screen logging: capture a touchpoint outcome plus the customer's next step with minimal required fields, including on-the-spot status updates and voice-memo capture with Whisper transcription

---

**Goal:** Trial-process automation & operator dashboard
Why: The consultation gate and decision-timing rules are the business process — encoding them is what makes sure no trial goes unfollowed and no device goes unrecovered.

- [ ] Next-step rule engine: new inquiries and website bookings set a consultation-required next step before any trial can be confirmed; non-supervised trial end sets a decision follow-up; a no-rental decision sets a device recovery next step — with a configurable precedence order resolving competing proposals and superseded ones logged to the timeline
- [ ] Trial records covering all three trial types (onsite supervised, at-home supervised, at-home non-supervised) with the consultation gate enforced at booking
- [ ] Cross-customer dashboard, one row per customer, ordered by next-step due date and journey stage, with at-risk surfacing: stalled consultations, trials nearing decision date, overdue recoveries, active customers missing a next step, with urgency cues

---

**Goal:** Device inventory & logistics
Why: Serial-level device visibility is what makes "zero devices unaccounted for" achievable after trials and rentals end.

- [ ] Serial-level device registry with the full status lifecycle (new/used, inventory, assigned, shipping, in use, repair, awaiting collection, returned)
- [ ] Assignment, shipping, recovery, and return flows linked to customer and trial/order records, with next steps proposed from device and customer status changes
- [ ] Exception handling: duplicate assignment, address conflicts, inventory mismatch

---

**Goal:** Payment tracking
Why: Trial fees, rental billing, and purchases currently reconcile by hand across sheets; payment status must update itself.

- [ ] Payment records for trial fees, rental billing, and purchases with the PRD status model (billed → partially paid → paid → overdue → refunded)
- [ ] Automated status updates from Square webhooks plus bank CSV import, with manual override
- [ ] Partial/combo/refund handling and overdue logic that proposes a payment-reminder next step

---

**Goal:** Communication management
Why: Operators should reach customers on their preferred channel from one interface, with every touch auto-logged to the timeline.

- [ ] Channel integrations for outbound and auto-logged inbound: LINE Messaging API, business mailbox email, Rakuten CPaaS SMS
- [ ] Quick actions on the customer record — call (click-to-call with post-call outcome prompt), email, SMS, LINE — driven by preferred-channel tracking
- [ ] Templated sends for routine messages (trial confirmations, payment reminders) and AI-drafted consultative messages, both behind operator review-before-send approval

---

**Goal:** AI ingestion & review queue
Why: Half of routine record updates must come from AI (PRD M5 target), but ambiguous writes must never silently corrupt customer records.

- [ ] Ingestion pipeline (Inngest): Wix/FormRun webhooks, email, and LINE submissions create or update customer records and set the required follow-on next step via GLM structured extraction
- [ ] Deduplication on phone/email plus contextual signals, with ambiguous matches routed to a review queue instead of auto-written
- [ ] Japanese extraction-quality evaluation on real consultation notes, gating how much ingestion runs unreviewed (model swap via OpenRouter config if GLM underperforms)
- [ ] Takeover-ready AI customer summaries and a suggested next step on the customer record
- [ ] AI-powered search and analysis via chat interface over read-only query tools

---

**Goal:** Rollout & sheet retirement
Why: The app only wins when all 7 legacy Excel sheets are gone and operators trust it as the single source of truth.

- [ ] Bulk import for legacy sheet data with validation and a phased per-sheet migration path
- [ ] Guided operator onboarding: mobile-first walkthrough of create-customer → consultation → trial → log-outcome
- [ ] Metrics instrumentation per the PRD tracking plan: searches, log-flow completions, AI-assisted edits and overrides, stage-transition timestamps, next-step set/completed/superseded events, sheet retirement events
- [ ] Final sheet deprecation: reconciliation checks against legacy data, then retire all 7 sheets
