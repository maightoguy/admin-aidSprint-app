import { test } from '@playwright/test';
import { signIn } from './helpers';

test('admin can sign in (configurable credentials)', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'E2E credentials not set');

  await signIn(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
});
