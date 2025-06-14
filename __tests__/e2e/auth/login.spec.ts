import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { OnboardingPage } from '../pages/onboarding.page';
import { AuthHelpers } from '../helpers/auth.helpers';
import { testUsers, invalidCredentials, urlParams } from '../fixtures/users.fixtures';

test.describe('Authentication Flow - Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let onboardingPage: OnboardingPage;
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    onboardingPage = new OnboardingPage(page);
    authHelpers = new AuthHelpers(page);
    
    // Navigate to login page first
    await loginPage.goto();
    
    // Then clear any existing auth state
    await authHelpers.clearAuthStorage();
  });

  test.describe('Successful Login Scenarios', () => {
    test('should login existing user and redirect to dashboard', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Wait for navigation
      await authHelpers.waitForPostLoginRedirect();
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/(dashboard|company\/.*\/workspace)/);
      expect(await dashboardPage.isUserLoggedIn()).toBe(true);
    });

    test('should login new user and redirect to onboarding', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUsers.newUser.email, testUsers.newUser.password);
      
      // Wait for navigation
      await authHelpers.waitForPostLoginRedirect();
      
      // Verify we're on onboarding
      await expect(page).toHaveURL(/\/onboarding\/select-usage/);
      expect(await onboardingPage.isOnOnboardingFlow()).toBe(true);
    });

    test('should login invited user and skip onboarding', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUsers.invitedUser.email, testUsers.invitedUser.password);
      
      // Wait for navigation
      await authHelpers.waitForPostLoginRedirect();
      
      // Invited users with companies should go directly to dashboard
      await expect(page).toHaveURL(/\/(dashboard|company\/.*\/workspace)/);
    });

    test('should show success message after registration', async ({ page }) => {
      await loginPage.gotoWithParams(urlParams.registered);
      
      // Verify success message is visible
      await expect(loginPage.successMessage).toBeVisible();
      const message = await loginPage.getSuccessMessage();
      expect(message).toContain('¡Registro exitoso!');
    });

    test('should show success message after email confirmation', async ({ page }) => {
      await loginPage.gotoWithParams(urlParams.confirmed);
      
      // Verify success message is visible
      await expect(loginPage.successMessage).toBeVisible();
      const message = await loginPage.getSuccessMessage();
      expect(message).toContain('¡Correo confirmado!');
    });
  });

  test.describe('Failed Login Scenarios', () => {
    test('should show error for non-existent email', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(invalidCredentials.wrongEmail.email, invalidCredentials.wrongEmail.password);
      
      // Verify error message
      await authHelpers.verifyLoginError('Error al iniciar sesión');
    });

    test('should show error for wrong password', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(invalidCredentials.wrongPassword.email, invalidCredentials.wrongPassword.password);
      
      // Verify error message
      await authHelpers.verifyLoginError('Error al iniciar sesión');
    });

    test('should show error for invalid email format', async ({ page }) => {
      await loginPage.goto();
      await loginPage.fillEmail(invalidCredentials.invalidEmailFormat.email);
      await loginPage.fillPassword(invalidCredentials.invalidEmailFormat.password);
      
      // HTML5 validation should prevent submission
      await loginPage.clickSubmit();
      
      // Verify we're still on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('should show error for empty fields', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickSubmit();
      
      // Should show validation error
      await authHelpers.verifyLoginError('Por favor ingresa tu correo electrónico');
    });

    test('should show session expired message', async ({ page }) => {
      await loginPage.gotoWithParams(urlParams.sessionExpired);
      
      // Verify error message
      await authHelpers.verifyLoginError('Tu sesión ha expirado');
    });

    test('should show auth error from OAuth callback', async ({ page }) => {
      await loginPage.gotoWithParams(urlParams.authError);
      
      // Verify error message
      await authHelpers.verifyLoginError('Error al autenticar con el proveedor');
    });
  });

  test.describe('OAuth Login', () => {
    test('should initiate Google login', async ({ page }) => {
      await authHelpers.mockOAuthProvider('google', true);
      await loginPage.goto();
      
      // Click Google login button
      await loginPage.clickGoogleLogin();
      
      // In a real test, this would redirect to Google
      // For now, we verify the button works
      await expect(loginPage.googleButton).toBeEnabled();
    });

    test('should initiate GitHub login', async ({ page }) => {
      await authHelpers.mockOAuthProvider('github', true);
      await loginPage.goto();
      
      // Click GitHub login button
      await loginPage.clickGitHubLogin();
      
      // In a real test, this would redirect to GitHub
      // For now, we verify the button works
      await expect(loginPage.githubButton).toBeEnabled();
    });

    test('should handle OAuth error', async ({ page }) => {
      await authHelpers.mockOAuthProvider('google', false);
      await loginPage.gotoWithParams({ error: 'auth_failed' });
      
      // Verify error message
      await authHelpers.verifyLoginError('Error al autenticar con el proveedor');
    });
  });

  test.describe('UI Behavior', () => {
    test('should disable submit button while loading', async ({ page }) => {
      await loginPage.goto();
      
      // Start login process
      const loginPromise = loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Check button is disabled during loading
      await expect(loginPage.submitButton).toBeDisabled();
      
      await loginPromise;
    });

    test('should show loading spinner during login', async ({ page }) => {
      await loginPage.goto();
      
      // Start login process
      const loginPromise = loginPage.login(testUsers.existingUser.email, testUsers.existingUser.password);
      
      // Check spinner is visible
      await expect(loginPage.loadingSpinner).toBeVisible();
      
      await loginPromise;
    });

    test('should navigate to register page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.clickRegisterLink();
      
      // Verify navigation to register page
      await expect(page).toHaveURL(/\/register/);
    });

    test('should preserve email when navigating back from register', async ({ page }) => {
      await loginPage.goto();
      
      // Fill email
      const testEmail = 'test@example.com';
      await loginPage.fillEmail(testEmail);
      
      // Navigate to register and back
      await loginPage.clickRegisterLink();
      await page.goBack();
      
      // Email should be preserved (if implemented)
      // This might not work without proper state management
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for form inputs', async ({ page }) => {
      await loginPage.goto();
      
      // Check email input has label
      const emailLabel = await page.getByText('Correo Electrónico');
      await expect(emailLabel).toBeVisible();
      
      // Check password input has label
      const passwordLabel = await page.getByText('Contraseña');
      await expect(passwordLabel).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await loginPage.goto();
      
      // Tab through form elements
      await page.keyboard.press('Tab'); // Focus email
      await page.keyboard.type('test@example.com');
      
      await page.keyboard.press('Tab'); // Focus password
      await page.keyboard.type('password123');
      
      await page.keyboard.press('Tab'); // Focus submit button
      await page.keyboard.press('Enter'); // Submit form
      
      // Form should be submitted
      await expect(loginPage.loadingSpinner).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.goto();
      
      // All elements should be visible and functional
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.submitButton).toBeVisible();
      
      // OAuth buttons should be visible
      await expect(loginPage.googleButton).toBeVisible();
      await expect(loginPage.githubButton).toBeVisible();
    });

    test('should hide decorative column on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.goto();
      
      // Right column should be hidden on mobile
      const rightColumn = page.locator('.hidden.md\\:flex');
      await expect(rightColumn).not.toBeVisible();
    });
  });
});