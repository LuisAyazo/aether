import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly githubButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form inputs
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    
    // OAuth buttons
    this.googleButton = page.getByText('Iniciar sesión con Google');
    this.githubButton = page.getByText('Iniciar sesión con GitHub');
    
    // Navigation
    this.registerLink = page.getByRole('link', { name: 'Regístrate gratis' });
    
    // Messages - Using the actual div structure from the login page
    this.errorMessage = page.locator('div.bg-red-100.border-red-400.text-red-700, div.bg-red-100.dark\\:bg-red-900\\/50');
    this.successMessage = page.locator('div.bg-emerald-green-50.border-emerald-green-300, div.bg-emerald-green-50.dark\\:bg-emerald-green-900\\/50');
    this.loadingSpinner = page.locator('svg.animate-spin');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async gotoWithParams(params: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    await this.page.goto(`/login?${searchParams.toString()}`);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  async clickGoogleLogin() {
    await this.googleButton.click();
  }

  async clickGitHubLogin() {
    await this.githubButton.click();
  }

  async clickRegisterLink() {
    await this.registerLink.click();
  }

  async waitForLoadingToFinish() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async getSuccessMessage(): Promise<string> {
    return await this.successMessage.textContent() || '';
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async isSuccessVisible(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }
}