# P1.1 / P1.2 — design plan for review

Status: **proposed, not approved for feature-code implementation**. This plan records current behavior and decisions to approve before an Antigravity execution prompt is produced.

## Existing system findings

- Invoices already have a required `clientId`, line-item amounts stored as integer minor units, issue/due dates, and `draft | sent | paid | cancelled` status. No invoice-to-project link or payment entity exists (`src/models/invoice.ts`).
- `updateInvoiceStatus` currently sets `paidAt` when a user chooses `paid`, but creates neither a payment record nor an income transaction (`src/features/invoices/data.ts`). Thus legacy `paid` means only “manually marked paid.”
- Projects already have `clientId`, `expectedAmount`, and `dueDate`; transactions already have optional `clientId` and `projectId` (`src/models/project.ts`, `src/models/transaction.ts`).
- Invoice numbers currently use `countDocuments + 1`; concurrent creations may collide with the unique invoice-number index. This is a separate integrity issue that must be addressed before high-volume or automated invoice creation, not silently bundled into P1.1.
- Invoice lists are paginated for the page, but a cached helper fetches up to 1000 rows. Any new statement/dashboard query needs explicit bounds and matching indexes.

## P1.1 — link invoice to project

**Goal:** An invoice may be linked to one project, while existing unlinked invoices continue working.

Proposed data change: optional nullable `projectId` ObjectId on `Invoice`, indexed with `workspaceId` and `isArchived` if query usage warrants it. No backfill by guessing project from client, title, or amount. Existing records remain `null`.

Rules: project must be active in the same workspace and have the same client as the invoice. Validate this in the server domain function even if the UI filters project choices. Authorization still occurs before mutation. Archiving a project does not delete its historical invoice link; display must handle an archived project safely.

Expected surface: project selector on invoice creation, only projects for the selected client, and project name on invoice list/print where appropriate. Avoid loading every project's full document or introducing N+1. Link may be omitted; no changes to invoice payment status in this slice.

Acceptance tests: no project, valid matching project, other-client project, other-workspace project, archived project, malformed ID, existing invoice compatibility, and invoice listing without N+1. Required verification: typecheck, focused tests/lint, production build.

Expected code touchpoints after approval: `src/models/invoice.ts`, invoice input schema/form/action, invoice domain data and list/print view types, focused tests, and translations for new UI text. The executor must verify the exact list before editing. Rollback is to hide/remove the optional selector and reader; old invoices remain valid because `projectId` is nullable. Dropping an index or field from production data requires a separate migration decision.

## P1.2 — payment domain foundation

**Goal:** Establish a verifiable source of truth for payments before creating payment UI or ledger writes.

Proposed model: `InvoicePayment` with `workspaceId`, `invoiceId`, amount in invoice currency minor units, payment date, account reference, idempotency key unique within workspace, `transactionId` link, and audit fields. Final field design must be decided alongside P1.3 because a payment must never be left “verified” without its ledger transaction and balance update. No standalone payment write endpoint in P1.2.

Invariant: a verified payment is created atomically with its income transaction and account-balance increment. Retrying the same request key returns the original result; different keys cannot overpay beyond the remaining amount under concurrent requests. Cancellation/correction is a separate explicit reversal policy, never a silent delete or status toggle. Currency compatibility between invoice/workspace/account must be checked; do not assume all workspaces are single-currency.

Legacy policy proposed: existing invoices marked `paid` retain a `legacyPaid`/unreconciled interpretation until the owner reconciles them. Do not auto-create historical payments or income transactions. Define how they appear in receivables and whether they can accept a new payment before implementing P1.4/P1.5.

Acceptance tests for the eventual P1.2/P1.3 implementation: repeated request, simultaneous different requests, overpayment, zero/negative amount, wrong workspace/client/account/currency, database failure between payment and ledger write, balance rollback, and legacy invoice behavior.

## Decisions requiring explicit approval before execution

1. **Currency:** Should an invoice always use workspace currency at issue time (stored snapshot), with only a same-currency account permitted for payment? Recommended: yes for the first collection release; cross-currency allocation is a later slice.
2. **Legacy paid invoices:** Recommended: show as “manually marked paid / not reconciled” and exclude from new cash totals; owner must explicitly reconcile before recording further payments.
3. **Payment correction:** Recommended: no editing or deleting verified payments. A later reversal/refund operation creates an auditable compensating entry.
4. **Slice boundary:** Recommended: approve P1.1 as an implementation task first; keep P1.2 as design-only until P1.3 atomic posting details are approved together.

After these decisions, issue a narrow P1.1 implementation prompt from the template. Review its diff and tests before approving the P1.2/P1.3 prompt.
