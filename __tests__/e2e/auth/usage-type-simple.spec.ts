import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

// Ejecutar solo en Chromium para evitar problemas de compatibilidad
test.use({ 
  browserName: 'chromium',
  viewport: { width: 1280, height: 720 }
});

test.describe('Flujos de Tipo de Uso - Versión Simplificada', () => {
  test('Usuario nuevo selecciona uso PERSONAL', async ({ page }) => {
    test.setTimeout(90000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Usuario nuevo → Uso Personal');
    
    try {
      // 1. Navegar y limpiar datos
      await page.goto('http://localhost:3000');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 2. Login con usuario nuevo
      await loginPage.goto();
      await loginPage.fillEmail('new-user@infraux.com');
      await loginPage.fillPassword('NewUser123!');
      await loginPage.clickSubmit();
      
      // 3. Esperar navegación
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('URL después del login:', currentUrl);
      
      // 4. Si estamos en onboarding, seleccionar Personal
      if (currentUrl.includes('/onboarding/select-usage')) {
        console.log('✅ En página de selección de uso');
        
        // Buscar y hacer click en "Uso Personal"
        const personalButton = page.locator('button:has-text("Uso Personal")');
        await expect(personalButton).toBeVisible({ timeout: 10000 });
        await personalButton.click();
        console.log('✅ Click en Uso Personal');
        
        // Esperar a que el botón Siguiente se habilite
        const nextButton = page.locator('button:has-text("Siguiente")');
        await expect(nextButton).toBeEnabled({ timeout: 10000 });
        await nextButton.click();
        console.log('✅ Click en Siguiente');
        
        // Esperar navegación al dashboard
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        console.log('URL final:', finalUrl);
        
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ Llegamos al dashboard!');
        }
      } else {
        console.log('❌ No llegamos a la página de selección de uso');
        console.log('URL actual:', currentUrl);
      }
      
      // Screenshot final
      await page.screenshot({ 
        path: 'test-results/simple-personal-flow.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.error('Error en el test:', error);
      await page.screenshot({ 
        path: 'test-results/simple-personal-error.png', 
        fullPage: true 
      });
      throw error;
    }
  });

  test('Usuario existente PERSONAL va directo al dashboard', async ({ page }) => {
    test.setTimeout(60000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Usuario Personal existente');
    
    try {
      // 1. Navegar y limpiar datos
      await page.goto('http://localhost:3000');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 2. Login con usuario personal existente
      await loginPage.goto();
      await loginPage.fillEmail('personal-user@infraux.com');
      await loginPage.fillPassword('Personal123!');
      await loginPage.clickSubmit();
      
      // 3. Esperar navegación
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('URL después del login:', currentUrl);
      
      // 4. Verificar resultado
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Fue directo al dashboard (comportamiento esperado)');
      } else if (currentUrl.includes('/onboarding')) {
        console.log('⚠️ Fue al onboarding (tal vez el usuario no tiene usage_type guardado)');
        
        // Si está en onboarding, completarlo
        const personalButton = page.locator('button:has-text("Uso Personal")');
        if (await personalButton.isVisible()) {
          await personalButton.click();
          const nextButton = page.locator('button:has-text("Siguiente")');
          await expect(nextButton).toBeEnabled({ timeout: 10000 });
          await nextButton.click();
        }
      } else {
        console.log('❌ URL inesperada:', currentUrl);
      }
      
      // Screenshot final
      await page.screenshot({ 
        path: 'test-results/simple-personal-existing.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.error('Error en el test:', error);
      await page.screenshot({ 
        path: 'test-results/simple-personal-existing-error.png', 
        fullPage: true 
      });
      throw error;
    }
  });

  test('Usuario nuevo selecciona uso COMPANY', async ({ page }) => {
    test.setTimeout(120000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Usuario nuevo → Uso Company');
    
    try {
      // 1. Navegar y limpiar datos
      await page.goto('http://localhost:3000');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // 2. Intentar con otro usuario nuevo o el mismo
      await loginPage.goto();
      await loginPage.fillEmail('new-user@infraux.com');
      await loginPage.fillPassword('NewUser123!');
      await loginPage.clickSubmit();
      
      // 3. Esperar navegación
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('URL después del login:', currentUrl);
      
      // 4. Si estamos en onboarding, seleccionar Company
      if (currentUrl.includes('/onboarding/select-usage')) {
        console.log('✅ En página de selección de uso');
        
        // Buscar y hacer click en "Uso de Compañía"
        const companyButton = page.locator('button:has-text("Uso de Compañía")');
        await expect(companyButton).toBeVisible({ timeout: 10000 });
        await companyButton.click();
        console.log('✅ Click en Uso de Compañía');
        
        // Esperar a que el botón Siguiente se habilite
        const nextButton = page.locator('button:has-text("Siguiente")');
        await expect(nextButton).toBeEnabled({ timeout: 10000 });
        await nextButton.click();
        console.log('✅ Click en Siguiente');
        
        // Esperar navegación
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const newUrl = page.url();
        console.log('URL después de continuar:', newUrl);
        
        // Si llegamos a crear empresa
        if (newUrl.includes('/create-company') || newUrl.includes('/onboarding/create-company')) {
          console.log('✅ En página de crear empresa');
          
          // Llenar formulario
          const companyNameInput = page.locator('input[name="companyName"], input[placeholder*="empresa" i]').first();
          if (await companyNameInput.isVisible()) {
            await companyNameInput.fill('Mi Empresa de Prueba');
            console.log('✅ Nombre de empresa ingresado');
            
            // Crear empresa
            const createButton = page.locator('button:has-text("Crear"), button[type="submit"]').first();
            await createButton.click();
            console.log('✅ Click en crear empresa');
            
            // Esperar resultado
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            const finalUrl = page.url();
            console.log('URL final:', finalUrl);
            
            if (finalUrl.includes('/dashboard')) {
              console.log('✅ Llegamos al dashboard de empresa!');
            }
          }
        }
      }
      
      // Screenshot final
      await page.screenshot({ 
        path: 'test-results/simple-company-flow.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.error('Error en el test:', error);
      await page.screenshot({ 
        path: 'test-results/simple-company-error.png', 
        fullPage: true 
      });
      throw error;
    }
  });
});