Playwright skeleton for admin-aidSprint-app

This folder contains a minimal Playwright skeleton and an example spec. It's intentionally lightweight: install Playwright locally before running the example.

Quick start

1. Install Playwright and browser binaries (one-time):

```bash
npm i -D @playwright/test
npx playwright install
```

2. Run the example (from repo root):

```bash
npx playwright test e2e/playwright/example.spec.ts
```

Notes
- The example is a placeholder showing how to wire Playwright to your dev server. Add authentication and selectors matching your app before using in CI.
