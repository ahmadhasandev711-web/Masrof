<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Masrofaty execution contract

- Do not implement a feature or refactor without a written, user-approved task plan. If approval is unclear, stop at analysis.
- Read `docs/architecture/GOLDEN_RULES.md` and the approved task before implementation. Stay within its scope; do not add speculative routes, models, abstractions, or dependencies.
- Inspect existing code and uncommitted changes first. Preserve unrelated user work.
- Financial changes require integer minor units, workspace authorization, atomic writes, idempotency where requests can repeat, and tests for retries and failure cases.
- Every workspace-scoped read/write must be explicitly tenant-bound. Never trust a client-provided `workspaceId` without membership verification.
- Avoid N+1 queries, unbounded lists, unnecessary network round trips, and caches without an invalidation plan.
- Report the changed files, verification results, and any deviations from the approved plan. Do not silently decide product or migration policy.
