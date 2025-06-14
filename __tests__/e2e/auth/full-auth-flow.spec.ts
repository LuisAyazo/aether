import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { OnboardingPage } from '../pages/onboarding.page';
import { DashboardPage } from '../pages/dashboard.page';

test.describe('Full Authentication Flow - Visual Demo', () => {
  test('should complete full flow: Login → Onboarding → Company Creation → Dashboard', async ({ page }) => {
    // Configurar timeouts más largos para poder ver el proceso
    test.setTimeout(60000); // 60 segundos
    
    const loginPage = new LoginPage(page);
    const onboardingPage = new OnboardingPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // 1. Navegar a la página de login
    await loginPage.goto();
    await page.waitForTimeout(2000); // Pausa para ver
    
    // 2. Intentar login con un usuario nuevo (simulado)
    console.log('📝 Filling login form...');
    await loginPage.fillEmail('demo@infraux.com');
    await page.waitForTimeout(1000);
    
    await loginPage.fillPassword('DemoPassword123!');
    await page.waitForTimeout(1000);
    
    // 3. Click en login
    console.log('🔐 Attempting login...');
    await loginPage.clickSubmit();
    
    // Esperar un poco para ver el resultado
    await page.waitForTimeout(3000);
    
    // 4. Si llegamos al onboarding, continuar
    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      console.log('✅ Redirected to onboarding!');
      
      // 5. Seleccionar tipo de uso
      if (currentUrl.includes('select-usage')) {
        console.log('🏢 Selecting company usage...');
        await page.waitForTimeout(2000);
        
        // Buscar y hacer click en el botón de uso empresarial
        const companyButton = page.getByText(/empresa|company|equipo/i).first();
        if (await companyButton.isVisible()) {
          await companyButton.click();
          await page.waitForTimeout(2000);
        }
        
        // Continuar
        const continueButton = page.getByRole('button', { name: /continuar|siguiente|next/i });
        if (await continueButton.isVisible()) {
          await continueButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // 6. Crear empresa
      if (page.url().includes('create-company')) {
        console.log('🏗️ Creating company...');
        
        // Llenar formulario de empresa
        const companyNameInput = page.getByLabel(/nombre.*empresa|company name/i);
        if (await companyNameInput.isVisible()) {
          await companyNameInput.fill('Mi Empresa Demo');
          await page.waitForTimeout(1000);
        }
        
        // Crear empresa
        const createButton = page.getByRole('button', { name: /crear|create/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForTimeout(3000);
        }
      }
    }
    
    // 7. Verificar si llegamos al dashboard
    await page.waitForTimeout(3000);
    if (page.url().includes('/dashboard') || page.url().includes('/company/')) {
      console.log('🎉 Successfully reached dashboard!');
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ Did not reach dashboard. Current URL:', page.url());
    }
    
    // Tomar screenshot final
    await page.screenshot({ path: 'test-results/full-flow-final.png', fullPage: true });
  });

  test('should show register flow visually', async ({ page }) => {
    test.setTimeout(30000);
    
    const loginPage = new LoginPage(page);
    
    // 1. Ir a login
    await loginPage.goto();
    await page.waitForTimeout(2000);
    
    // 2. Click en "Regístrate gratis"
    console.log('📝 Navigating to register...');
    await loginPage.clickRegisterLink();
    await page.waitForTimeout(2000);
    
    // 3. Llenar formulario de registro
    if (page.url().includes('/register')) {
      console.log('✅ On register page');
      
      // Buscar campos de registro
      const nameInput = page.getByLabel(/nombre|name/i).first();
      const emailInput = page.getByLabel(/correo|email/i);
      const passwordInput = page.getByLabel(/contraseña|password/i).first();
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Usuario Demo');
        await page.waitForTimeout(1000);
      }
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('nuevo@infraux.com');
        await page.waitForTimeout(1000);
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('NuevoPassword123!');
        await page.waitForTimeout(1000);
      }
      
      // Buscar botón de registro
      const registerButton = page.getByRole('button', { name: /registrar|register|crear cuenta/i });
      if (await registerButton.isVisible()) {
        console.log('🚀 Submitting registration...');
        await registerButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Tomar screenshot final
    await page.screenshot({ path: 'test-results/register-flow-final.png', fullPage: true });
  });
});