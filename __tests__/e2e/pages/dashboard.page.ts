import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly companySelector: Locator;
  readonly workspaceSelector: Locator;
  readonly createDiagramButton: Locator;
  readonly diagramsList: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Page elements
    this.pageTitle = page.locator('h1').first();
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.logoutButton = page.getByText('Cerrar sesión');
    
    // Company/Workspace
    this.companySelector = page.locator('[role="combobox"]').first();
    this.workspaceSelector = page.locator('[data-testid="workspace-selector"]');
    
    // Diagrams
    this.createDiagramButton = page.getByRole('button', { name: /crear.*diagrama/i });
    this.diagramsList = page.locator('[data-testid="diagrams-list"]');
    
    // Welcome/Onboarding
    this.welcomeMessage = page.locator('text=/bienvenido/i');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for critical elements to be visible
    await this.page.waitForSelector('h1', { timeout: 10000 });
  }

  async isUserLoggedIn(): Promise<boolean> {
    try {
      await this.userMenu.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentCompanyName(): Promise<string> {
    return await this.companySelector.textContent() || '';
  }

  async openUserMenu() {
    await this.userMenu.click();
  }

  async logout() {
    await this.openUserMenu();
    await this.logoutButton.click();
  }

  async createNewDiagram() {
    await this.createDiagramButton.click();
  }

  async getDiagramsCount(): Promise<number> {
    const diagrams = await this.diagramsList.locator('[data-testid="diagram-item"]').all();
    return diagrams.length;
  }

  async selectCompany(companyName: string) {
    await this.companySelector.click();
    await this.page.getByText(companyName).click();
  }

  async getPageUrl(): Promise<string> {
    return this.page.url();
  }

  async isOnDashboard(): Promise<boolean> {
    const url = await this.getPageUrl();
    return url.includes('/dashboard') || url.includes('/company/') || url.includes('/workspace/');
  }
}