import { test, expect } from '@playwright/test';
import { signIn } from './helpers';

test('open request actions from Requests page', async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, 'E2E credentials not set');

  await signIn(page, process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('link', { name: 'Requests' }).click();
  await expect(page.locator('text=All Requests')).toBeVisible();

  const actionButton = page.locator('button[aria-label^="Open request actions for"]').first();
  await expect(actionButton).toBeVisible();
  await actionButton.click();

  const viewRequest = page.getByRole('menuitem', { name: 'View request' });
  await expect(viewRequest).toBeVisible();
  await viewRequest.click();

  await expect(page.locator('text=Request details')).toBeVisible();
});
