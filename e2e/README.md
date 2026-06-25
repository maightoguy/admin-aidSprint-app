End-to-end tests (P1)

This folder contains scaffolding for end-to-end admin workflow tests using Vitest + @testing-library/react.

How to run (local dev):

1. Start the dev server:

```bash
pnpm dev
```

2. In another terminal, run tests:

```bash
pnpm test -- --config=e2e/vitest.config.ts
```

Notes:
- These tests are designed to be deterministic by mocking network responses and using seed/teardown utilities in `e2e/setup.ts`.
- Replace mocks with real integration endpoints once a test database fixture or Supabase emulator is available.
