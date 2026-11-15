# Shared domain logic (web + mobile)

Business rules that must behave the same on the web app and the React Native app:
enums, money (MinorUnits), input schemas, label resolvers.

Rules:
- Pure TypeScript + `zod` only. No mongoose, Next, React, `@/` imports — relative imports only.
- The web app imports from `@contracts/shared` (old paths like `@/lib/money`,
  `@/features/*/schemas`, `@/models/*` re-export from here, so nothing else changed).
- The mobile app copies this folder with `npm run sync:contract` (in `sanadat-mobile`).
  Change it here, never in the mobile copy.
- Validation messages live in the web i18n (`validation.*`). Schemas take `t(key)`;
  mobile syncs the same message files, so errors read the same on both.
