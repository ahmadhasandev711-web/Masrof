# Sanadat Mobile API Contract

Zod + TypeScript is the source of truth for `/api/mobile` request/response shapes.

- Import types/schemas: `@contracts/mobile` (app) or relative `./` from this folder (React Native later).
- OpenAPI doc: [`openapi.yaml`](./openapi.yaml) — generate with `npm run mobile:openapi`.
- Server serializers: `src/lib/mobile/serialize`.

Do not hand-edit `openapi.yaml`.
