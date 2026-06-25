import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test('resolve a dispute via UI (best-effort)', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'E2E credentials not set');

  await signIn(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('link', { name: 'Disputes' }).click();
  await expect(page.locator('text=Dispute')).toBeVisible();

  const actionButton = page.locator('button[aria-label^="Actions for dispute"]').first();
  await expect(actionButton).toBeVisible();
  await actionButton.click();

  const markResolved = page.getByRole('menuitem', { name: 'Mark resolved' });
  await expect(markResolved).toBeVisible();
  await markResolved.click();

  await expect(page.locator('text=Dispute details')).toBeVisible();
});
