# Masrofaty golden rules

These rules apply to the current Next.js 16, TypeScript, MongoDB/Mongoose application. They are not a Laravel/SaaS template. The user and reviewer own product and architecture decisions; an implementation agent executes only an approved task.

## Approval gate

Before feature code: inspect the existing system, write a scoped plan with data/security/performance/compatibility implications, discuss open decisions, and obtain explicit user approval. Approval of the roadmap is not approval of every implementation slice. Stop and ask if a discovered condition would materially change the plan.

## Non-negotiable engineering rules

| ID | Rule | Practical check |
| --- | --- | --- |
| GR-1 | Existing system first | Reuse or evolve existing feature modules; no duplicate source of truth. Abstract shared domain rules early, but do not create a helper merely because two lines look alike. |
| GR-2 | YAGNI and small slices | No placeholders, unused strategies, speculative schema fields, or non-working routes. Each slice must be independently testable. |
| GR-3 | Separation of concerns | Pages, Route Handlers, and Server Actions handle transport, validation, authorization, and orchestration. Put business invariants in feature-domain functions. No arbitrary line-count rule. |
| GR-4 | Financial integrity | Money is integer minor units. State which currency owns every amount. Financial writes use transactions where several records must commit together, plus idempotency for repeatable requests. Never infer payment from an invoice status label. |
| GR-5 | Tenant isolation and privacy | Authorize membership before workspace operations; scope all financial queries and mutations by `workspaceId`. Validate cross-record ownership. Minimize PII in public views and logs. |
| GR-6 | Performance | Measure hot paths, bound lists, avoid N+1 and serial independent I/O, add indexes based on query shape, and keep costly delivery work outside user-facing requests. |
| GR-7 | Cache correctness | Use request-level or cross-request cache deliberately. Record keys, TTL, and every mutation that invalidates it. Never cache user-private data without a safe identity boundary. |
| GR-8 | Stable boundaries | Use interfaces/adapters at genuinely variable external boundaries such as payment gateways, messaging, and storage—not throughout internal domain code. |
| GR-9 | Type-safe domain | Centralize statuses and transitions using TypeScript literal unions/`as const` and Zod at input boundaries. Avoid magic strings and float math. |
| GR-10 | Errors and observability | Domain errors have stable codes; user messages reveal no internals. Log timings and failures without secrets or unnecessary PII. |
| GR-11 | Next.js version compliance | Before using or changing a Next.js API, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecations. |
| GR-12 | Verification | Include unit, integration, tenant-isolation, retry, and regression tests as appropriate. Run typecheck, focused lint/tests, and build for risky changes. Report what could not be verified. |

## Financial-domain source-of-truth policy

- `Invoice` represents the claim and its issued terms; a status toggle is not cash received.
- A future `InvoicePayment` record will represent a verified payment allocation. Its linkage to a `Transaction` must be atomic and unique. The exact migration is decided per approved slice.
- `Transaction` remains the cash-ledger source of truth, with account balance updated in the same MongoDB transaction.
- Derived totals, overdue days, and financial status must come from agreed source records; do not maintain redundant mutable totals without a demonstrated need.
- Legacy `paid` invoices are ambiguous until reconciled. Do not fabricate payments or ledger entries during migration.

## Review / definition of done

The implementation agent delivers a focused diff, explains every schema/index/cache change, lists tests and results, and flags deviations. Reviewer checks authorization, tenant isolation, concurrency/idempotency, arithmetic, migrations, query count, and user-visible regressions before acceptance.
