import { Page, Locator } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly personalUseButton: Locator;
  readonly companyUseButton: Locator;
  readonly continueButton: Locator;
  readonly skipButton: Locator;
  readonly backButton: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page elements
    this.pageTitle = page.locator('h1, h2').first();
    
    // Usage selection
    this.personalUseButton = page.getByRole('button', { name: /personal/i });
    this.companyUseButton = page.getByRole('button', { name: /empresa|equipo/i });
    
    // Navigation
    this.continueButton = page.getByRole('button', { name: /continuar|siguiente/i });
    this.skipButton = page.getByRole('button', { name: /omitir|saltar/i });
    this.backButton = page.getByRole('button', { name: /atrás|volver/i });
    
    // Progress
    this.progressIndicator = page.locator('[data-testid="onboarding-progress"]');
  }

  async goto() {
    await this.page.goto('/onboarding/select-usage');
  }

  async selectPersonalUse() {
    await this.personalUseButton.click();
  }

  async selectCompanyUse() {
    await this.companyUseButton.click();
  }

  async clickContinue() {
    await this.continueButton.click();
  }

  async clickSkip() {
    await this.skipButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentStep(): Promise<string> {
    const url = this.page.url();
    if (url.includes('select-usage')) return 'select-usage';
    if (url.includes('create-company')) return 'create-company';
    if (url.includes('complete')) return 'complete';
    return 'unknown';
  }

  async isOnOnboardingFlow(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/onboarding/');
  }

  async getPageTitle(): Promise<string> {
    return await this.pageTitle.textContent() || '';
  }
}