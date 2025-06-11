import { test, expect } from '@playwright/test';

test.describe('Critical Path Smoke Tests', () => {
  test('health check - all critical services respond', async ({ request }) => {
    // Backend API health check
    const apiHealth = await request.get('/api/v1/health');
    expect(apiHealth.ok()).toBeTruthy();
    expect(await apiHealth.json()).toMatchObject({ 
      status: 'healthy',
      database: 'connected' 
    });
    
    // Frontend responds
    const frontendResponse = await request.get('/');
    expect(frontendResponse.ok()).toBeTruthy();
  });

  test('user can login and access dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@infraux.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Diagramas')).toBeVisible({ timeout: 10000 });
    
    // Verify user menu is visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('can navigate between main sections', async ({ page }) => {
    // Assume already logged in
    await page.goto('/dashboard');
    
    // Navigate to Credentials
    await page.click('text=Credenciales');
    await expect(page.locator('h1:has-text("Credenciales")')).toBeVisible();
    
    // Navigate to Environments
    await page.click('text=Ambientes');
    await expect(page.locator('h1:has-text("Ambientes")')).toBeVisible();
    
    // Navigate back to Diagrams
    await page.click('text=Diagramas');
    await expect(page.locator('.react-flow')).toBeVisible();
  });
});
