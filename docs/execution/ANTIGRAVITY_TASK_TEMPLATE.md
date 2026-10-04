# Antigravity implementation prompt template

Use only after the user approves a specific slice plan. Replace every placeholder with a concrete decision; leave no ambiguous product choice for the implementer.

```text
You are the implementation agent for Masrofaty. Execute only [SLICE ID/TITLE].

Read AGENTS.md, docs/architecture/GOLDEN_RULES.md, the relevant approved plan, and relevant Next.js 16 docs in node_modules/next/dist/docs before editing.

Approved outcome: [EXACT USER-VISIBLE RESULT]
In scope: [EXACT BEHAVIOR AND FILE/DOMAIN BOUNDARIES]
Out of scope: [EXPLICIT EXCLUSIONS]
Existing code to reuse: [FILES/FUNCTIONS]
Data contract and migration: [FIELDS, INDEXES, BACKFILL, ROLLBACK]
Security/tenant rules: [AUTHORIZATION, RECORD OWNERSHIP]
Financial/idempotency rules: [ATOMICITY, RETRY KEY, CURRENCY, LEGACY POLICY]
Performance/cache rules: [QUERY SHAPE, LIMITS, INVALIDATION]
Acceptance criteria: [OBSERVABLE CHECKLIST]
Required tests and commands: [EXACT TEST CASES/CHECKS]

Do not add dependencies, routes, abstractions, or features outside this scope. Preserve pre-existing uncommitted changes. If the codebase contradicts the approved plan or a migration/financial policy is unresolved, stop and report the conflict; do not choose a policy yourself.

Deliver: focused diff summary, changed files, test results, migration/rollback instructions, and any unresolved risk. Do not commit or deploy unless separately instructed.
```

Reviewer checklist: does the diff match the approved slice, preserve existing work, avoid a second source of truth, enforce workspace isolation, handle retries and concurrent writes, keep amounts in minor units, avoid N+1/unbounded queries, invalidate caches, and pass the stated tests?
