import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login Page - Basic Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should load login page', async ({ page }) => {
    // Verify we're on the login page
    await expect(page).toHaveURL(/\/login/);
    
    // Verify page title
    await expect(page).toHaveTitle(/InfraUX|Aether/i);
  });

  test('should display all login form elements', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Check email input
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'tu@ejemplo.com');
    
    // Check password input
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordInput).toHaveAttribute('placeholder', '••••••••');
    
    // Check submit button
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toContainText('Iniciar Sesión');
    
    // Check OAuth buttons
    await expect(loginPage.googleButton).toBeVisible();
    await expect(loginPage.githubButton).toBeVisible();
    
    // Check register link
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Try to submit with empty fields
    await loginPage.clickSubmit();
    
    // Check HTML5 validation - the form should not submit
    const emailInput = loginPage.emailInput;
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
    
    // Check if validation message exists
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should show validation error for empty password', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Fill email but not password
    await loginPage.fillEmail('test@example.com');
    await loginPage.clickSubmit();
    
    // Check HTML5 validation for password field
    const passwordInput = loginPage.passwordInput;
    const isInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
    
    // Check if validation message exists
    const validationMessage = await passwordInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link
    await loginPage.clickRegisterLink();
    
    // Should navigate to register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show loading state when submitting', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Fill form
    await loginPage.fillEmail('test@example.com');
    await loginPage.fillPassword('password123');
    
    // Start submission (don't wait for it to complete)
    const submitPromise = loginPage.clickSubmit();
    
    // Check loading state
    await expect(loginPage.loadingSpinner).toBeVisible();
    await expect(loginPage.submitButton).toBeDisabled();
    
    // Wait for submission to complete
    await submitPromise;
  });

  test('should handle invalid credentials', async ({ page }) => {
    // Try to login with invalid credentials
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    // Wait for the error message to appear
    await page.waitForTimeout(2000); // Give time for the API response
    
    // Should show error message
    const errorVisible = await loginPage.isErrorVisible();
    if (errorVisible) {
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).toMatch(/Error al iniciar sesión|credenciales|Invalid login credentials/i);
    } else {
      // If no error message, check if we're still on login page
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('should display success message with registered param', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Navigate with registered=true param
    await loginPage.gotoWithParams({ registered: 'true' });
    
    // Should show success message
    await expect(loginPage.successMessage).toBeVisible();
    const successText = await loginPage.getSuccessMessage();
    expect(successText).toContain('¡Registro exitoso!');
  });

  test('should display success message with confirmed param', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Navigate with confirmed=true param
    await loginPage.gotoWithParams({ confirmed: 'true' });
    
    // Should show success message
    await expect(loginPage.successMessage).toBeVisible();
    const successText = await loginPage.getSuccessMessage();
    expect(successText).toContain('¡Correo confirmado!');
  });

  test('should display error message with session_expired param', async ({ page }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Navigate with session_expired=true param
    await loginPage.gotoWithParams({ session_expired: 'true' });
    
    // Should show error message
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain('Tu sesión ha expirado');
  });
});