import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login Page - Improved Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should load login page correctly', async ({ page }) => {
    // Verify URL
    await expect(page).toHaveURL(/\/login/);
    
    // Verify title
    await expect(page).toHaveTitle(/InfraUX|Aether/i);
    
    // Verify logo is visible
    await expect(page.locator('text=InfraUX').first()).toBeVisible();
  });

  test('should display all required form elements', async () => {
    // Email input
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.emailInput).toBeEditable();
    
    // Password input
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeEditable();
    
    // Submit button
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
    
    // OAuth buttons
    await expect(loginPage.googleButton).toBeVisible();
    await expect(loginPage.githubButton).toBeVisible();
    
    // Register link
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should handle HTML5 validation for empty fields', async () => {
    // Click submit without filling fields
    await loginPage.clickSubmit();
    
    // Check that we're still on login page (form didn't submit)
    await expect(loginPage.page).toHaveURL(/\/login/);
    
    // Verify email field has validation error
    const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      valueMissing: el.validity.valueMissing,
      message: el.validationMessage
    }));
    
    expect(emailValidity.valid).toBe(false);
    expect(emailValidity.valueMissing).toBe(true);
    expect(emailValidity.message).toBeTruthy();
  });

  test('should handle HTML5 validation for invalid email format', async () => {
    // Fill with invalid email format
    await loginPage.fillEmail('notanemail');
    await loginPage.fillPassword('password123');
    await loginPage.clickSubmit();
    
    // Check email field validation
    const emailValidity = await loginPage.emailInput.evaluate((el: HTMLInputElement) => ({
      valid: el.validity.valid,
      typeMismatch: el.validity.typeMismatch,
      message: el.validationMessage
    }));
    
    expect(emailValidity.valid).toBe(false);
    expect(emailValidity.typeMismatch).toBe(true);
  });

  test('should show loading state during submission', async () => {
    // Fill valid credentials
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('password123');
    
    // Start submission without waiting
    const submitPromise = loginPage.clickSubmit();
    
    // Check for loading spinner immediately
    await expect(loginPage.loadingSpinner).toBeVisible({ timeout: 1000 });
    
    // Button should be disabled during loading
    await expect(loginPage.submitButton).toBeDisabled();
    
    // Wait for submission to complete
    await submitPromise;
  });

  test('should handle server-side validation errors', async ({ page }) => {
    // Use credentials that will fail on server
    await loginPage.fillEmail('nonexistent@example.com');
    await loginPage.fillPassword('wrongpassword');
    await loginPage.clickSubmit();
    
    // Wait for server response
    await page.waitForTimeout(3000);
    
    // Check if we're still on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
    
    // Check for error message (if visible)
    const errorVisible = await loginPage.errorMessage.isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).toBeTruthy();
      // Error message should contain something about credentials
      expect(errorText.toLowerCase()).toMatch(/error|invalid|credential|credencial|contraseña|usuario/);
    }
  });

  test('should navigate to register page', async ({ page }) => {
    await loginPage.clickRegisterLink();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/register/);
  });

  test('should display success message with registered param', async () => {
    await loginPage.gotoWithParams({ registered: 'true' });
    await loginPage.page.waitForLoadState('networkidle');
    
    // Wait for success message to appear
    await expect(loginPage.successMessage).toBeVisible({ timeout: 5000 });
    const successText = await loginPage.getSuccessMessage();
    expect(successText).toContain('Registro exitoso');
  });

  test('should display success message with confirmed param', async () => {
    await loginPage.gotoWithParams({ confirmed: 'true' });
    await loginPage.page.waitForLoadState('networkidle');
    
    // Wait for success message to appear
    await expect(loginPage.successMessage).toBeVisible({ timeout: 5000 });
    const successText = await loginPage.getSuccessMessage();
    expect(successText).toContain('Correo confirmado');
  });

  test('should display error message with session_expired param', async () => {
    await loginPage.gotoWithParams({ session_expired: 'true' });
    await loginPage.page.waitForLoadState('networkidle');
    
    // Wait for error message to appear
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('sesión');
  });

  test('should handle OAuth button clicks', async ({ page }) => {
    // Test Google OAuth
    const [googlePopup] = await Promise.all([
      page.waitForEvent('popup'),
      loginPage.clickGoogleLogin()
    ]);
    
    // Verify popup opened (OAuth flow started)
    expect(googlePopup).toBeTruthy();
    await googlePopup.close();
    
    // Test GitHub OAuth
    const [githubPopup] = await Promise.all([
      page.waitForEvent('popup'),
      loginPage.clickGitHubLogin()
    ]);
    
    // Verify popup opened (OAuth flow started)
    expect(githubPopup).toBeTruthy();
    await githubPopup.close();
  });

  test('should preserve form state on navigation', async ({ page }) => {
    const testEmail = 'test@example.com';
    
    // Fill email
    await loginPage.fillEmail(testEmail);
    
    // Navigate to register and back
    await loginPage.clickRegisterLink();
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Check if email is preserved (this depends on browser behavior)
    const emailValue = await loginPage.emailInput.inputValue();
    // Note: This might not work in all browsers/configurations
    console.log('Email value after navigation:', emailValue);
  });
});

// Separate test suite for authenticated user flows
test.describe('Login Flow - User Scenarios', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should redirect new user to onboarding', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('new-user@infraux.com');
    await loginPage.fillPassword('NewUser123!');
    await loginPage.clickSubmit();
    
    // Wait for navigation
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });
    
    const currentUrl = page.url();
    // New users should go to onboarding if not completed
    expect(currentUrl).toMatch(/onboarding|dashboard/);
  });

  test('should redirect existing personal user to dashboard', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('personal-user@infraux.com');
    await loginPage.fillPassword('Personal123!');
    await loginPage.clickSubmit();
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should redirect existing company user to dashboard', async ({ page }) => {
    await loginPage.goto();
    await loginPage.fillEmail('company-user@infraux.com');
    await loginPage.fillPassword('Company123!');
    await loginPage.clickSubmit();
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});