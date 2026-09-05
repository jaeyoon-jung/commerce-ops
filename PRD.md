# Internal Operations App — Walking Assistance Device Sales & Rental


### TL;DR


We rent and sell walking assistance devices to elderly customers. Every customer moves through a consultation-gated trial process before a purchase or rental decision, and today that journey is tracked across scattered spreadsheets. This app unifies customer, trial, device, shipping, and payment data into one system; automates data ingestion and routine tasks with AI; and gives sales operators full customer context on any device. Goals: significantly reduce manual data entry, make customer context instantly retrievable, and retire all legacy Excel sheets.


---






## Business Context


The core product is a **rental/purchase of walking assistance devices for elders**, sold through a trial-first process. The two conversion events are **rental** and **purchase** — and today, every conversion requires a pre-trial consultation followed by a trial (one of the three types below). There is no path to rental or purchase that skips this sequence.


Customers may be **B2C** (elders or their families) or **B2B** (e.g., care facilities, institutions). The funnel is identical for both — consultation → trial → decision — so customer type is a profile attribute, not a separate workflow.


**Trial types**


1. **Onsite trial (supervised)** — customer visits; operator supervises.
2. **At-home trial (supervised)** — operator travels to the customer's home; paid by the customer.
3. **At-home trial (non-supervised)** — offered only when the customer lives too far for supervision; paid by the customer; device is shipped and later recovered.


**Process rules the app must encode**


- **Consultation gate:** every trial — including appointments booked directly on the website — requires a prior consultation via phone, email, LINE, or SMS, on whichever channel the customer responds to. No trial booking may be confirmed without a completed consultation record.
- **Decision timing:** for supervised trials, the purchase/rental decision is made on the spot at the trial. For non-supervised trials, the decision is made after the trial period ends — requiring a scheduled follow-up.
- **Trial payment:** at-home trials (both types) are paid; the app must invoice and track trial fees.
- **Post-trial follow-up = customer support**, conducted via email, LINE, and phone.


**Customer journey stages**
1. New Inquiry
2. Consultation
3. Booking confirmed
4. Self-trial in progress (only for unsupervised at-home trial)
5. Post-trial follow up
6. Closed Won / On Hold / Closed Lost




**Device Status**
1. New / Used
2. In Office Inventory
3. Assigned to Trial
4. Assigned to Rental / Sold (only New device qualifies)
5. Preparing Shipment
6. In Transit
7. In Used
8. Repair / Inspection
9. Awaiting Collection
10. Returned


**Payment Status**
1. Billed
2. Partially Paid
3. Paid in Full
4. Overdue
5. Refunded


---






## Goals






### Business Goals


- Retire all 7 legacy Excel sheets within 1 month.
- Automate at least 50% of customer record updates and routine tasks through AI by milestone M5 (AI Ingestion).
- Reduce inconsistencies between CRM, device inventory, and sales records by 80% within 3 months.
- Cut operator time on manual data entry and cross-sheet reconciliation by 60% within 2 months.
- Reach 95% on-time completion of operational tasks (consultation callbacks, trial follow-ups, device recovery, payment reminders) by milestone M4 (Communication Management).






### User Goals


- Retrieve full customer context — journey stage, trial history, device assignment, interaction log — from any device, especially mobile during home visits.
- Minimize manual logging; capture consultation and trial outcomes in one screen.
- See a real-time view of each customer's journey stage and pending tasks.
- Surface customers at risk of neglect: stalled consultations, non-supervised trials nearing decision date, overdue device recoveries.
- Full mobile access during field operations (in transit or at the customer's home).
- Communicate with customers all from a single interface, regardless of channels, without switching to different apps like Line, Gmail, and SMS.






### Non-Goals


- No customer-facing portal/app in this release (website booking forms remain the existing intake channel).
- No predictive inventory or demand forecasting.
- No direct accounting integration or medical/insurance claims automation.


---






## User Stories


**Persona: Sales Operator**


- As a sales operator, I want to search for a customer by name, phone, email, or device serial number from my phone, so that I have full context in transit or at the customer's home.
- As a sales operator, I want a timeline of all interactions, trial events, notes, and status changes per customer, so that I can pick up seamlessly from teammates.
- As a sales operator, I want to log notes and outcomes quickly by text or voice memo, so that documentation doesn't fall behind on busy days.
- As a sales operator, I want leads from web forms, email, and LINE auto-ingested into customer records, so that I spend less time on manual entry.
- As a sales operator, I want a dashboard of tasks by due date and journey stage, so that urgent actions — consultations owed, decisions pending, devices to recover — surface first.
- As a sales operator, I want quick actions (call, email, send SMS, send LINE) on the customer record, so that I can reach the customer on their preferred channel instantly.
- As a sales operator, I want edits tracked with user and timestamp, and records deactivated rather than deleted, for compliance and auditability.


---






## Functional Requirements


- Language: application UI must support Japanese (default) and Korean, switchable per operator.
- **Customer & CRM (Priority: Highest)**
 - Customer profile with basic info, customer type (B2C / B2B), source, preferred contact channel, and full journey-stage model. Customer type does not change the workflow — same funnel for both.
 - Customer journey stage model can be defined and configured.
 - Timeline of all interactions, actions, status changes, and system updates per customer.
 - Mobile-friendly search across all primary fields (name, phone, email, device serial).
 - Task and next-step management with owner, due date, and status. Task-generation rules encode the trial process: website bookings and new inquiries create a "consultation required" task before a trial can be scheduled; non-supervised trial-period end creates a decision-follow-up task; a no-rental decision creates a device recovery task.


- **AI-Powered Data Ingestion (Priority: Low)**
 - Auto-creation and updates of customer records from web forms (Wix, FormRun), email, and LINE/API submissions.
 - Deduplication on phone/email plus contextual signals; ambiguous matches routed to a review queue.
 - AI-generated, takeover-ready customer summaries and suggested next actions (e.g., "consultation not yet done — call via LINE, customer's responsive channel").
- **Communication Management (Priority: Medium)**
 - Integrated call, email, SMS, and LINE channels with auto-logging and quick actions; per-customer preferred-channel tracking.
 - Templated/autonomous sends for routine messages (trial confirmations, payment reminders); review-before-send for consultative messaging.
 - AI drafts customer responses and outreach and sends them with operators’ approval.
 
- **Device Inventory & Order Management (Priority: Medium)**
 - Serial-level device tracking across device status
 - Assignment, shipping, recovery, and returns linked to customer and trial/order records; tasks auto-created based on device and customer statuses
 - Exception handling (duplicate assignment, address conflicts, inventory mismatch).
- **Payment Tracking (Priority: Medium)**
 - Automated payment updates to reflect payment status from payment systems (Square, bank, etc.) with manual override; covers trial fees, rental billing, and purchases.
 - Partial/combo/refund handling and overdue logic with reminder tasks.


---






## User Experience


**Entry Point & First-Time Experience**


- Operators receive credentials and mobile-first onboarding.
- Guided walkthrough: create a customer, run the consultation → trial flow, log an interaction.
- Demo of one-screen logging and real-time updates.


**Core Experience**


1. Operator opens the app (web app) and lands on a dashboard of active tasks and at-risk customers — overdue consultations,  trials awaiting decisions, devices pending recovery — with visual urgency cues.
2. Operator searches for a customer by any identifier and instantly sees the journey stage, trial history, device assignment, and full timeline. Mobile UI is optimized for reading in transit
3. Operator logs the outcome of a touchpoint (call, consultation, trial visit) via quick note and attaches the next action in one screen with minimal required fields. This includes the on-the-spot status updates.
4. For new inquiries — including direct website bookings — the AI agent creates the customer record, fills in source/context, and creates the required consultation task.
5. For existing leads., the AI agent identifies the relevant customer record and updates it, and created the required subsequent task.
6. Communication (call, SMS, LINE) is initiated via quick action via CRM


**Advanced Features & Edge Cases**


- Review queue for ambiguous AI matches and exceptions.
- Bulk import for legacy data and phased sheet retirement.
- AI-powered search and analysis via chat interface


**UI/UX Highlights**


- Mobile-first, responsive layouts with large touch areas.
- Fast, minimal-friction entry (text and voice).
- Accessibility: high-contrast themes, screen-reader support, keyboard navigation.
- Every action logged and traceable.


---






## Narrative


Jin, a sales operator, starts her day en route to an at-home supervised trial. Previously she'd dig through spreadsheet tabs on her phone, often finding outdated or missing context. Now one search shows the customer's full picture: the original website inquiry, the consultation call two weeks ago, customers' questions on LINE (the customer's preferred channel), the paid trial booking, the device serial assigned, and the note that the customer's daughter will be present.


The trial goes well and the customer decides on the spot to rent. Jin taps "log notes," dumps raw notes, which is turned into timeline, and confirms the new sales outcomes — which triggers the contract and first-payment tasks automatically. Back on her dashboard she sees a trial ending Thursday; the app has already queued the decision follow-up call. With context a tap away and repetitive entry automated, Jin's team spends less time reconciling sheets and more time with customers, no trial goes unfollowed, and no rental device goes unrecovered.


---






## Success Metrics


- Legacy sheets retired (target: all 7 by month 5).
- % of customer record and task updates performed by AI (target: ≥50% by M5).
- Operator time on data entry and context search (target: −60%).
- On-time task completion, including consultation callbacks and post-trial decision follow-ups (target: ≥95% by M4).
- % reduction in inconsistencies between CRM, device inventory, and sales ledger (target: −80%).
- Device recovery: zero devices unaccounted for after trial or rental end.






### User-Centric Metrics


- Operator satisfaction with context retrieval (biweekly survey).
- Reduction in "context lost / contact missed" incidents.
- Time to onboard new operators.






### Business Metrics


- Legacy tool deprecation complete by M6 (Rollout).
- Task SLA compliance (>95% on-time).
- Customers handled per operator per week.
- Visibility into trial-to-rental/purchase conversion by trial type (reporting, not a conversion target for the app itself).






### Technical Metrics


- AI update success rate without operator edit.
- App uptime (target: 99.9%).
- Data sync and reconciliation error rates.






### Tracking Plan


- User actions: searches, log-flow completions, AI-assisted edits, manual overrides.
- Journey-stage transitions and timestamps (consultation done, trial scheduled/completed, decision recorded, device recovered).
- Sheet upload/removal events.


---






## Technical Considerations






### Technical Needs


- Modular, API-driven architecture: customer/CRM, trial, device inventory, payment, and communication modules.
- Secure, auditable data store with role-based access and full edit history.
- Mobile-optimized front end (responsive web).
- AI/ML services for ingestion, deduplication, transcription, and summarization.






### Integration Points


- Web forms (Wix, FormRun) via API or webhook — including website trial-booking submissions, which must route through the consultation gate.
- Email, LINE, SMS (existing business channels).
- Payment processors (Square API, bank data exports).
- Out of scope: accounting/ERP integration, end-customer portal.


---






## Milestones & Sequencing






Milestones follow the functional-requirement priority order: CRM (Highest) first, then the Medium-priority modules, with AI-powered ingestion (Low) sequenced last before rollout.


**M1 — Foundation (CRM, Highest)**


- CRM structure, journey-stage data model (including the three trial types and consultation gate), core UI, mobile onboarding.
- Dependencies: operator input on data model and stage definitions.


**M2 — Trial-Process Task Automation & Dashboard (CRM, Highest)**


- Trial-process task-generation rules (consultation gate, decision follow-ups, device recovery); task dashboard with at-risk surfacing.
- Dependencies: stable data model from Foundation.




**M3 — Device Inventory & Payment Modules (Medium)**


- Serial-level device tracking, shipping/recovery flows, trial-fee and rental payment tracking.
- Dependencies: operator testing of core modules.


**M4 — Communication Management (Medium)**


- Integrated communication channels (call, email, SMS, LINE), preferred-channel logic, quick actions with auto-logging.
- AI-powered communication draft and operator approval for sends.
- Dependencies: trial workflow and core CRM live.


**M5 — AI Ingestion & Review Queue (Low)**


- AI ingestion pipeline from web forms, email, and LINE; deduplication with review queue; takeover-ready summaries and suggested next actions; AI chat search.
- Dependencies: stable CRM data model and task rules; communication channels connected for auto-logging.


**M6 — Rollout, Training & Sheet Retirement**


- Phased migration, training, feedback analysis, final sheet deprecation.
- Dependencies: all core modules stable, legacy data imported.





