import { test, expect } from '@playwright/test';

test.describe('Visual Flow Demo - Simulated', () => {
  test('should demonstrate the complete user flow visually', async ({ page }) => {
    // Configurar timeout largo y modo lento para ver mejor
    test.setTimeout(90000);
    test.slow();
    
    console.log('🚀 Starting visual flow demo...');
    
    // 1. LOGIN PAGE
    console.log('\n📍 Step 1: Login Page');
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Llenar formulario de login
    await page.getByPlaceholder(/correo|email/i).fill('usuario@ejemplo.com');
    await page.waitForTimeout(500);
    
    await page.getByPlaceholder(/contraseña|password/i).fill('MiContraseña123!');
    await page.waitForTimeout(500);
    
    // Tomar screenshot del login
    await page.screenshot({ 
      path: 'test-results/flow-1-login.png', 
      fullPage: true 
    });
    
    // Simular click en login (sin enviar realmente)
    await page.getByRole('button', { name: /iniciar sesión/i }).hover();
    await page.waitForTimeout(1000);
    
    // 2. ONBOARDING - SELECT USAGE
    console.log('\n📍 Step 2: Onboarding - Select Usage');
    await page.goto('http://localhost:3000/onboarding/select-usage');
    await page.waitForTimeout(2000);
    
    // Hover sobre opción de empresa
    const companyOption = page.locator('text=/empresa|company|equipo/i').first();
    if (await companyOption.isVisible()) {
      await companyOption.hover();
      await page.waitForTimeout(1000);
    }
    
    await page.screenshot({ 
      path: 'test-results/flow-2-select-usage.png', 
      fullPage: true 
    });
    
    // 3. ONBOARDING - CREATE COMPANY
    console.log('\n📍 Step 3: Onboarding - Create Company');
    await page.goto('http://localhost:3000/onboarding/create-company');
    await page.waitForTimeout(2000);
    
    // Simular llenado de formulario de empresa
    const companyNameInput = page.getByPlaceholder(/nombre.*empresa|company name/i).first();
    if (await companyNameInput.isVisible()) {
      await companyNameInput.fill('Mi Empresa Demo S.A.');
      await page.waitForTimeout(500);
    }
    
    // Buscar otros campos posibles
    const industrySelect = page.getByLabel(/industria|industry|sector/i).first();
    if (await industrySelect.isVisible()) {
      await industrySelect.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'test-results/flow-3-create-company.png', 
      fullPage: true 
    });
    
    // 4. DASHBOARD
    console.log('\n📍 Step 4: Dashboard');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'test-results/flow-4-dashboard.png', 
      fullPage: true 
    });
    
    // Si el dashboard redirige al login, intentar con /company
    if (page.url().includes('/login')) {
      console.log('📍 Trying alternative dashboard URL...');
      await page.goto('http://localhost:3000/company/dashboard');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: 'test-results/flow-4-dashboard-alt.png', 
        fullPage: true 
      });
    }
    
    // 5. REGISTER PAGE (bonus)
    console.log('\n📍 Bonus: Register Page');
    await page.goto('http://localhost:3000/register');
    await page.waitForTimeout(2000);
    
    // Llenar algunos campos
    const nameInput = page.getByPlaceholder(/nombre completo|full name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Juan Pérez');
      await page.waitForTimeout(500);
    }
    
    const emailInput = page.getByPlaceholder(/correo|email/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('juan.perez@ejemplo.com');
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'test-results/flow-5-register.png', 
      fullPage: true 
    });
    
    console.log('\n✅ Visual flow demo completed!');
    console.log('📸 Screenshots saved in test-results/');
  });

  test('should show actual navigation if possible', async ({ page }) => {
    test.setTimeout(60000);
    
    // Intentar con un usuario real si existe
    console.log('🔐 Attempting real login flow...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Usar credenciales que podrían existir
    await page.getByPlaceholder(/correo|email/i).fill('test@infraux.com');
    await page.getByPlaceholder(/contraseña|password/i).fill('Test123!');
    
    // Click real en login
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar navegación
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    if (!currentUrl.includes('/login')) {
      console.log('✅ Login successful! Navigated to:', currentUrl);
      await page.screenshot({ 
        path: 'test-results/real-flow-after-login.png', 
        fullPage: true 
      });
      
      // Si estamos en onboarding, continuar
      if (currentUrl.includes('/onboarding')) {
        console.log('📍 In onboarding flow');
        await page.waitForTimeout(3000);
        
        // Intentar continuar el flujo
        const continueButton = page.getByRole('button', { name: /continuar|siguiente|next/i }).first();
        if (await continueButton.isVisible()) {
          await continueButton.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ 
            path: 'test-results/real-flow-onboarding-next.png', 
            fullPage: true 
          });
        }
      }
    } else {
      console.log('❌ Login failed or no test user exists');
    }
  });
});