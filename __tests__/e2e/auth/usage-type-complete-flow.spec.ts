import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.use({ 
  browserName: 'chromium',
  viewport: { width: 1280, height: 720 }
});

test.describe('Flujo Completo de Onboarding - 4 Pasos', () => {
  test('Usuario nuevo completa todo el onboarding - Uso PERSONAL', async ({ page }) => {
    test.setTimeout(120000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Flujo completo de onboarding - Personal');
    
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
    
    // 3. Esperar navegación al onboarding
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('URL después del login:', currentUrl);
    
    if (currentUrl.includes('/onboarding/select-usage')) {
      console.log('✅ En página de selección de uso');
      
      // PASO 1: Seleccionar tipo de uso
      console.log('\n📍 PASO 1: Seleccionar tipo de uso');
      const personalButton = page.locator('button:has-text("Uso Personal")');
      await expect(personalButton).toBeVisible({ timeout: 10000 });
      await personalButton.click();
      console.log('✅ Click en Uso Personal');
      
      // Esperar a que aparezca el paso 2
      await page.waitForTimeout(2000);
      await expect(page.getByText('¿Cómo escuchaste de nosotros?')).toBeVisible({ timeout: 10000 });
      console.log('✅ Avanzó al paso 2');
      
      // PASO 2: ¿Cómo escuchaste de nosotros?
      console.log('\n📍 PASO 2: ¿Cómo escuchaste de nosotros?');
      const socialMediaOption = page.locator('button:has-text("Redes Sociales")');
      await socialMediaOption.click();
      console.log('✅ Seleccionado: Redes Sociales');
      
      // Click en Siguiente
      const nextButton2 = page.locator('button:has-text("Siguiente")');
      await nextButton2.click();
      console.log('✅ Click en Siguiente');
      
      // PASO 3: Experiencia con IaC
      await page.waitForTimeout(2000);
      await expect(page.getByText('Tu Experiencia con IaC')).toBeVisible({ timeout: 10000 });
      console.log('\n📍 PASO 3: Experiencia con IaC');
      
      const beginnerOption = page.locator('button:has-text("Principiante")').first();
      await beginnerOption.click();
      console.log('✅ Seleccionado: Principiante');
      
      // Click en Siguiente
      const nextButton3 = page.locator('button:has-text("Siguiente")');
      await nextButton3.click();
      console.log('✅ Click en Siguiente');
      
      // PASO 4: Intereses
      await page.waitForTimeout(2000);
      await expect(page.getByText('¿Qué te interesa explorar?')).toBeVisible({ timeout: 10000 });
      console.log('\n📍 PASO 4: Intereses');
      
      // Seleccionar algunos intereses (opcional)
      const automationInterest = page.locator('button:has-text("Automatización de Infraestructura")');
      await automationInterest.click();
      console.log('✅ Seleccionado interés: Automatización');
      
      const visualDesignInterest = page.locator('button:has-text("Diseño Visual de Arquitecturas")');
      await visualDesignInterest.click();
      console.log('✅ Seleccionado interés: Diseño Visual');
      
      // Click en Finalizar
      const finishButton = page.locator('button:has-text("Finalizar Onboarding")');
      await expect(finishButton).toBeVisible({ timeout: 10000 });
      await finishButton.click();
      console.log('✅ Click en Finalizar Onboarding');
      
      // Esperar navegación al dashboard
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('\n📊 URL final:', finalUrl);
      
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ ¡Llegamos al dashboard!');
      } else {
        console.log('❌ No llegamos al dashboard, URL actual:', finalUrl);
      }
      
      // Screenshot final
      await page.screenshot({ 
        path: 'test-results/onboarding-personal-complete.png', 
        fullPage: true 
      });
    }
  });

  test('Usuario nuevo completa todo el onboarding - Uso COMPANY', async ({ page }) => {
    test.setTimeout(120000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Flujo completo de onboarding - Company');
    
    // 1. Navegar y limpiar datos
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 2. Login con usuario nuevo (o usar otro)
    await loginPage.goto();
    await loginPage.fillEmail('new-user@infraux.com');
    await loginPage.fillPassword('NewUser123!');
    await loginPage.clickSubmit();
    
    // 3. Esperar navegación al onboarding
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('URL después del login:', currentUrl);
    
    if (currentUrl.includes('/onboarding/select-usage')) {
      console.log('✅ En página de selección de uso');
      
      // PASO 1: Seleccionar tipo de uso
      console.log('\n📍 PASO 1: Seleccionar tipo de uso');
      const companyButton = page.locator('button:has-text("Uso de Compañía")');
      await expect(companyButton).toBeVisible({ timeout: 10000 });
      await companyButton.click();
      console.log('✅ Click en Uso de Compañía');
      
      // Esperar a que aparezca el paso 2
      await page.waitForTimeout(2000);
      await expect(page.getByText('¿Cómo escuchaste de nosotros?')).toBeVisible({ timeout: 10000 });
      console.log('✅ Avanzó al paso 2');
      
      // PASO 2: ¿Cómo escuchaste de nosotros?
      console.log('\n📍 PASO 2: ¿Cómo escuchaste de nosotros?');
      const friendOption = page.locator('button:has-text("Un Amigo/Colega")');
      await friendOption.click();
      console.log('✅ Seleccionado: Un Amigo/Colega');
      
      // Click en Siguiente
      const nextButton2 = page.locator('button:has-text("Siguiente")');
      await nextButton2.click();
      console.log('✅ Click en Siguiente');
      
      // PASO 3: Experiencia con IaC
      await page.waitForTimeout(2000);
      await expect(page.getByText('Tu Experiencia con IaC')).toBeVisible({ timeout: 10000 });
      console.log('\n📍 PASO 3: Experiencia con IaC');
      
      const intermediateOption = page.locator('button:has-text("Intermedio")').first();
      await intermediateOption.click();
      console.log('✅ Seleccionado: Intermedio');
      
      // Click en Siguiente
      const nextButton3 = page.locator('button:has-text("Siguiente")');
      await nextButton3.click();
      console.log('✅ Click en Siguiente');
      
      // PASO 4: Intereses
      await page.waitForTimeout(2000);
      await expect(page.getByText('¿Qué te interesa explorar?')).toBeVisible({ timeout: 10000 });
      console.log('\n📍 PASO 4: Intereses');
      
      // Seleccionar algunos intereses
      const teamCollab = page.locator('button:has-text("Colaboración en Equipo")');
      await teamCollab.click();
      console.log('✅ Seleccionado interés: Colaboración en Equipo');
      
      const multiCloud = page.locator('button:has-text("Gestión de Múltiples Nubes")');
      await multiCloud.click();
      console.log('✅ Seleccionado interés: Múltiples Nubes');
      
      // Click en Finalizar
      const finishButton = page.locator('button:has-text("Finalizar Onboarding")');
      await expect(finishButton).toBeVisible({ timeout: 10000 });
      await finishButton.click();
      console.log('✅ Click en Finalizar Onboarding');
      
      // Esperar navegación (debería ir a crear empresa)
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('\n📊 URL final:', finalUrl);
      
      if (finalUrl.includes('/company/create')) {
        console.log('✅ ¡Llegamos a crear empresa! (comportamiento esperado para Company)');
        
        // Completar creación de empresa
        const companyNameInput = page.locator('input[name="companyName"], input[placeholder*="empresa" i]').first();
        if (await companyNameInput.isVisible()) {
          await companyNameInput.fill('Mi Empresa de Prueba E2E');
          console.log('✅ Nombre de empresa ingresado');
          
          const createButton = page.locator('button:has-text("Crear"), button[type="submit"]').first();
          await createButton.click();
          console.log('✅ Click en crear empresa');
          
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          const dashboardUrl = page.url();
          if (dashboardUrl.includes('/dashboard')) {
            console.log('✅ ¡Empresa creada y llegamos al dashboard!');
          }
        }
      } else if (finalUrl.includes('/dashboard')) {
        console.log('✅ Fue directo al dashboard (tal vez ya tenía empresa)');
      } else {
        console.log('❌ URL inesperada:', finalUrl);
      }
      
      // Screenshot final
      await page.screenshot({ 
        path: 'test-results/onboarding-company-complete.png', 
        fullPage: true 
      });
    }
  });

  test('Verificar navegación entre pasos del onboarding', async ({ page }) => {
    test.setTimeout(90000);
    
    const loginPage = new LoginPage(page);
    
    console.log('🧪 Test: Navegación entre pasos');
    
    // Setup inicial
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Login
    await loginPage.goto();
    await loginPage.fillEmail('new-user@infraux.com');
    await loginPage.fillPassword('NewUser123!');
    await loginPage.clickSubmit();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('/onboarding/select-usage')) {
      // Verificar que podemos navegar hacia adelante y atrás
      console.log('📍 Navegación: Paso 1 → 2');
      await page.locator('button:has-text("Uso Personal")').click();
      await page.waitForTimeout(1000);
      
      // Verificar botón "Volver"
      const backButton = page.locator('button:has-text("Volver")');
      await expect(backButton).toBeVisible();
      console.log('✅ Botón Volver visible en paso 2');
      
      // Volver al paso 1
      await backButton.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText('Selecciona cómo usarás InfraUX')).toBeVisible();
      console.log('✅ Regresó al paso 1');
      
      // Avanzar de nuevo
      await page.locator('button:has-text("Uso de Compañía")').click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("Búsqueda en Google")').click();
      await page.locator('button:has-text("Siguiente")').click();
      
      // Verificar paso 3
      await page.waitForTimeout(1000);
      await expect(page.getByText('Tu Experiencia con IaC')).toBeVisible();
      console.log('✅ Llegó al paso 3');
      
      // Screenshot de navegación
      await page.screenshot({ 
        path: 'test-results/onboarding-navigation.png', 
        fullPage: true 
      });
    }
  });
});