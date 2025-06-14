import { Page, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { DashboardPage } from '../pages/dashboard.page';
import { TestUser } from '../fixtures/users.fixtures';

export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Login a user and wait for navigation
   */
  async loginUser(user: TestUser): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await loginPage.waitForNavigation();
  }

  /**
   * Login and verify successful navigation
   */
  async loginAndVerifySuccess(user: TestUser): Promise<void> {
    await this.loginUser(user);
    
    // Check where the user was redirected based on their type
    const url = this.page.url();
    
    if (user.onboardingCompleted && user.firstCompanyCreated) {
      // Should be on dashboard
      expect(url).toMatch(/\/(dashboard|company\/.*\/workspace)/);
    } else if (!user.onboardingCompleted || !user.firstCompanyCreated) {
      // Should be on onboarding
      expect(url).toContain('/onboarding/');
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const dashboardPage = new DashboardPage(this.page);
    await dashboardPage.logout();
    await this.page.waitForURL('/login');
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      // Try to access a protected route
      await this.page.goto('/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // If we're still on dashboard, we're logged in
      return this.page.url().includes('dashboard') || this.page.url().includes('company');
    } catch {
      return false;
    }
  }

  /**
   * Clear all auth-related storage
   */
  async clearAuthStorage(): Promise<void> {
    // Clear cookies
    await this.page.context().clearCookies();
    
    // Try to clear storage, but handle security errors gracefully
    try {
      await this.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore security errors in test environment
          console.log('Could not clear storage:', e);
        }
      });
    } catch (error) {
      // If we can't access the page yet, that's okay
      console.log('Page not ready for storage clearing');
    }
  }

  /**
   * Set up authenticated state for a user
   */
  async setupAuthenticatedUser(user: TestUser): Promise<void> {
    // This would typically involve:
    // 1. Setting auth tokens in localStorage
    // 2. Setting cookies
    // 3. Or using Playwright's storageState feature
    
    // For now, we'll use the login flow
    await this.loginUser(user);
  }

  /**
   * Wait for redirect after login
   */
  async waitForPostLoginRedirect(): Promise<string> {
    // Wait for navigation away from login page
    await this.page.waitForFunction(
      () => !window.location.pathname.includes('/login'),
      { timeout: 10000 }
    );
    
    await this.page.waitForLoadState('networkidle');
    return this.page.url();
  }

  /**
   * Verify error message on login page
   */
  async verifyLoginError(expectedError: string): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await expect(loginPage.errorMessage).toBeVisible();
    const errorText = await loginPage.getErrorMessage();
    expect(errorText).toContain(expectedError);
  }

  /**
   * Verify success message on login page
   */
  async verifyLoginSuccess(expectedMessage: string): Promise<void> {
    const loginPage = new LoginPage(this.page);
    await expect(loginPage.successMessage).toBeVisible();
    const successText = await loginPage.getSuccessMessage();
    expect(successText).toContain(expectedMessage);
  }

  /**
   * Mock OAuth provider response
   */
  async mockOAuthProvider(provider: 'google' | 'github', success: boolean = true): Promise<void> {
    // Intercept OAuth requests and mock responses
    await this.page.route(`**/auth/${provider}/**`, async (route) => {
      if (success) {
        // Redirect to callback with success
        await route.fulfill({
          status: 302,
          headers: {
            'Location': `/auth/callback?code=mock-auth-code&provider=${provider}`
          }
        });
      } else {
        // Redirect to login with error
        await route.fulfill({
          status: 302,
          headers: {
            'Location': '/login?error=auth_failed'
          }
        });
      }
    });
  }
}