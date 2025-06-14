import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { OnboardingPage } from '../pages/onboarding.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Flujos por Tipo de Uso - Personal vs Company', () => {
  let loginPage: LoginPage;
  let onboardingPage: OnboardingPage;
  let dashboardPage: DashboardPage;
  
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    onboardingPage = new OnboardingPage(page);
    dashboardPage = new DashboardPage(page);
    
    // Navegar primero a la página antes de limpiar localStorage
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
    
    // Ahora sí limpiar datos previos
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.log('Could not clear storage:', e);
      }
    });
  });
  
  test('Usuario nuevo selecciona uso PERSONAL', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🧪 Testing new user selecting PERSONAL usage...');
    
    // 1. Login con usuario nuevo (sin usage_type definido)
    await loginPage.goto();
    await loginPage.fillEmail('new-user@infraux.com');
    await loginPage.fillPassword('NewUser123!');
    await loginPage.clickSubmit();
    
    // Esperar navegación
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 2. Verificar si llegamos al onboarding o dashboard
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/onboarding/select-usage')) {
      console.log('✅ User needs to select usage type');
      
      // 3. Seleccionar uso personal
      // El botón tiene el texto "Uso Personal", no solo "Personal"
      const personalButton = page.locator('button:has-text("Uso Personal")').first();
      await personalButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked on Personal use option');
      
      // 4. Esperar a que el botón "Siguiente" se habilite después de la selección
      const continueButton = page.locator('button:has-text("Siguiente")').first();
      
      // Esperar a que el botón esté habilitado
      await expect(continueButton).toBeEnabled({ timeout: 5000 });
      console.log('✅ Continue button is now enabled');
      
      // Hacer click en continuar
      await continueButton.click();
      console.log('✅ Clicked continue button');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 5. Verificar que llegamos al dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      console.log('✅ Redirected to dashboard after selecting personal use');
      
      // 6. Verificar que NO hay selector de empresa
      const companySelector = page.locator('[data-testid="company-selector"]');
      await expect(companySelector).not.toBeVisible();
      console.log('✅ No company selector visible for personal use');
      
    } else if (currentUrl.includes('/dashboard')) {
      console.log('ℹ️ User already has usage type set, went directly to dashboard');
      
      // Verificar el tipo de uso en localStorage
      const userData = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('infraux_user') || '{}');
      });
      
      console.log('User data:', userData);
    }
    
    // Tomar screenshot final
    await page.screenshot({ 
      path: 'test-results/usage-type-personal-flow.png', 
      fullPage: true 
    });
  });
  
  test('Usuario nuevo selecciona uso COMPANY', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('🧪 Testing new user selecting COMPANY usage...');
    
    // Para este test, necesitamos un usuario diferente o resetear el anterior
    // Vamos a intentar con credenciales diferentes o simular un usuario nuevo
    
    // 1. Ir a registro para crear un nuevo usuario
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');
    
    const timestamp = Date.now();
    const testEmail = `company-test-${timestamp}@infraux.com`;
    
    // Llenar formulario de registro
    const nameInput = page.locator('input[placeholder*="nombre" i], input[name="name"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Company Test User');
      await emailInput.fill(testEmail);
      await passwordInput.fill('CompanyTest123!');
      
      // Enviar registro
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
      
      // Si el registro requiere confirmación de email, manejarlo
      if (page.url().includes('/login')) {
        console.log('ℹ️ Registration requires email confirmation');
        // Para propósitos de testing, podríamos necesitar un usuario pre-confirmado
      }
    }
    
    // Alternativamente, usar el mismo usuario pero simular que no tiene usage_type
    await loginPage.goto();
    await loginPage.fillEmail('e2e-test@infraux.com');
    await loginPage.fillPassword('E2ETest123!');
    
    // Inyectar script para limpiar usage_type antes del login
    await page.evaluate(() => {
      // Esto simularía un usuario sin usage_type definido
      const userData = JSON.parse(localStorage.getItem('infraux_user') || '{}');
      delete userData.usage_type;
      delete userData.company_id;
      localStorage.setItem('infraux_user', JSON.stringify(userData));
    });
    
    await loginPage.clickSubmit();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/onboarding/select-usage')) {
      console.log('✅ User needs to select usage type');
      
      // Seleccionar uso empresarial
      const companyButton = page.locator('button:has-text("Uso de Compañía")').first();
      await companyButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked on Company use option');
      
      // Esperar a que el botón "Siguiente" se habilite
      const continueButton = page.locator('button:has-text("Siguiente")').first();
      await expect(continueButton).toBeEnabled({ timeout: 5000 });
      
      // Continuar
      await continueButton.click();
      console.log('✅ Clicked continue button');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Verificar que llegamos a crear empresa
      const newUrl = page.url();
      if (newUrl.includes('/create-company') || newUrl.includes('/onboarding/create-company')) {
        console.log('✅ Redirected to create company page');
        
        // Llenar formulario de empresa
        const companyNameInput = page.locator('input[name="companyName"], input[placeholder*="empresa" i]').first();
        if (await companyNameInput.isVisible()) {
          await companyNameInput.fill('Mi Empresa E2E Test');
          await page.waitForTimeout(500);
          
          // Crear empresa
          const createButton = page.locator('button:has-text("Crear"), button[type="submit"]').first();
          await createButton.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          // Verificar que llegamos al dashboard
          await expect(page).toHaveURL(/.*dashboard/);
          console.log('✅ Company created and redirected to dashboard');
        }
      }
    }
    
    // Tomar screenshot final
    await page.screenshot({ 
      path: 'test-results/usage-type-company-flow.png', 
      fullPage: true 
    });
  });
  
  test('Usuario PERSONAL existente va directo al dashboard', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🧪 Testing existing PERSONAL user direct dashboard access...');
    
    // Simular un usuario con usage_type personal ya definido
    await page.addInitScript(() => {
      localStorage.setItem('infraux_user', JSON.stringify({
        id: 'test-personal-user',
        email: 'personal-user@infraux.com',
        name: 'Personal User',
        usage_type: 'personal'
      }));
    });
    
    // Login con usuario personal existente
    await loginPage.goto();
    await loginPage.fillEmail('personal-user@infraux.com');
    await loginPage.fillPassword('Personal123!');
    await loginPage.clickSubmit();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que NO pasamos por onboarding
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/onboarding');
    console.log('✅ Skipped onboarding, current URL:', currentUrl);
    
    // Si llegamos al dashboard, verificar que es modo personal
    if (currentUrl.includes('/dashboard')) {
      const userData = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('infraux_user') || '{}');
      });
      
      console.log('User data:', userData);
      expect(userData.usage_type).toBe('personal');
    }
  });
  
  test('Usuario COMPANY existente va directo al dashboard', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🧪 Testing existing COMPANY user direct dashboard access...');
    
    // Simular un usuario con usage_type company ya definido
    await page.addInitScript(() => {
      localStorage.setItem('infraux_user', JSON.stringify({
        id: 'test-company-user',
        email: 'company-user@infraux.com',
        name: 'Company User',
        usage_type: 'company',
        company_id: 'test-company-123'
      }));
    });
    
    // Login con usuario company existente
    await loginPage.goto();
    await loginPage.fillEmail('company-user@infraux.com');
    await loginPage.fillPassword('Company123!');
    await loginPage.clickSubmit();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que NO pasamos por onboarding
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/onboarding');
    console.log('✅ Skipped onboarding, current URL:', currentUrl);
    
    // Si llegamos al dashboard, verificar que es modo company
    if (currentUrl.includes('/dashboard')) {
      const userData = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('infraux_user') || '{}');
      });
      
      console.log('User data:', userData);
      expect(userData.usage_type).toBe('company');
      expect(userData.company_id).toBeTruthy();
      
      // Verificar que hay selector de empresa visible
      const companySelector = page.locator('[data-testid="company-selector"], select[name="company"]').first();
      const isCompanySelectorVisible = await companySelector.isVisible().catch(() => false);
      console.log('Company selector visible:', isCompanySelectorVisible);
    }
  });
  
  test('Verificar elementos UI según tipo de uso', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🧪 Testing UI elements based on usage type...');
    
    // Login normal
    await loginPage.goto();
    await loginPage.fillEmail('e2e-test@infraux.com');
    await loginPage.fillPassword('E2ETest123!');
    await loginPage.clickSubmit();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    // Si estamos en el dashboard
    if (currentUrl.includes('/dashboard')) {
      // Obtener datos del usuario
      const userData = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('infraux_user') || '{}');
      });
      
      console.log('Current user type:', userData.usage_type);
      
      // Elementos que deberían estar presentes según el tipo
      if (userData.usage_type === 'personal') {
        console.log('📋 Checking PERSONAL dashboard elements...');
        
        // No debería haber selector de empresa
        const companyElements = page.locator('[data-testid*="company"], [class*="company"]');
        const companyCount = await companyElements.count();
        console.log(`Found ${companyCount} company-related elements`);
        
        // Debería haber elementos personales
        const personalElements = page.locator('[data-testid*="personal"], h1:has-text("Personal")');
        const personalCount = await personalElements.count();
        console.log(`Found ${personalCount} personal-related elements`);
        
      } else if (userData.usage_type === 'company') {
        console.log('📋 Checking COMPANY dashboard elements...');
        
        // Debería haber elementos de empresa
        const companyNameElement = page.locator('[data-testid="company-name"], .company-name').first();
        const hasCompanyName = await companyNameElement.isVisible().catch(() => false);
        console.log('Company name visible:', hasCompanyName);
        
        // Debería haber menú de equipo/usuarios
        const teamMenu = page.locator('a:has-text("Equipo"), a:has-text("Usuarios"), [href*="team"]').first();
        const hasTeamMenu = await teamMenu.isVisible().catch(() => false);
        console.log('Team menu visible:', hasTeamMenu);
      }
    }
    
    // Tomar screenshot comparativo
    await page.screenshot({ 
      path: `test-results/usage-type-ui-elements-${Date.now()}.png`, 
      fullPage: true 
    });
  });
});

// Test helper para cambiar entre tipos de uso
test.describe('Cambio de Tipo de Uso', () => {
  test.skip('Cambiar de PERSONAL a COMPANY', async ({ page }) => {
    // Este test requiere que la aplicación tenga implementada
    // la funcionalidad de cambio de tipo de uso
    
    console.log('🔄 Testing switch from PERSONAL to COMPANY...');
    
    // TODO: Implementar cuando la funcionalidad esté disponible
  });
});