import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test('navigate to users list and open first user', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'E2E credentials not set');

  await signIn(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);

  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.locator('text=All users')).toBeVisible();

  const firstRow = page.locator('table tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await expect(page.locator('text=User information').first()).toBeVisible();
  }
});
