# Freelancer platform roadmap

Product focus: an Arabic-first flow from client and project through invoice, collection, and project profit. This is a prioritized roadmap, not blanket implementation approval. Every numbered slice needs its own approved plan and review.

## Phase 1 — Collection lifecycle

| Slice | Outcome | Depends on |
| --- | --- | --- |
| P1.1 | Optionally link an invoice to a project owned by the same client/workspace | Existing clients, projects, invoices |
| P1.2 | Approve payment data contract, legacy policy, and atomic posting design; no standalone verified-payment write | P1.1 decisions, legacy-paid policy |
| P1.3 | Persist a verified payment, linked income transaction, and account-balance increment atomically and idempotently | P1.2 |
| P1.4 | Show paid amount, remaining amount, and overdue days; support partial/full payments | P1.3 |
| P1.5 | Separate operational invoice state from derived financial state and migrate old UI safely | P1.4 |
| P1.6 | Payment entry/history UI with correction/refund policy | P1.5 |
| P1.7 | Client statement with invoices, payments, and balances | P1.6 |
| P1.8 | Dashboard receivables: amount owed, clients, and overdue buckets | P1.7 |

## Phase 2 — Sharing and follow-up

P2.1 scoped, revocable public invoice link; P2.2 secure printable/downloadable PDF; P2.3 customer payment claim requiring owner confirmation (not automatic ledger income); P2.4 email/WhatsApp sending; P2.5 idempotent reminders before/after due date; P2.6 sent/viewed/claimed/paid event history. Payment gateway integration is a separately approved later slice.

## Phase 3 — Quotes and milestones

P3.1 quote draft and immutable sent version; P3.2 secure client accept/decline; P3.3 idempotent conversion to project/invoice; P3.4 deposit; P3.5 milestone payments after real user validation.

## Phase 4 — Project profitability

Build on existing transaction `projectId`: P4.1 income/expense/net; P4.2 expected/invoiced/collected comparison; P4.3 cost or deadline warnings; P4.4 optional time tracking and effective hourly rate. Avoid a second ledger.

## Phase 5 — Expansion based on adoption

Recurring invoices, lightweight tasks/deadlines, deliverables and approvals, client portal, contracts/e-signature, then an appropriate regional payment gateway. Prioritize only after usage feedback and security/legal review where needed.

## Release gates

Each slice must state acceptance criteria, existing-code reuse, migrations/backfill/rollback, tenant and financial invariants, indexes/cache invalidation, observability, and tests. No phase is handed to an execution agent as one large prompt.
