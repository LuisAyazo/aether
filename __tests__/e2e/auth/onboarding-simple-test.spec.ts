import { test, expect } from '@playwright/test';

test.describe('Test Simple de Onboarding', () => {
  test('Completar onboarding paso a paso', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🚀 Iniciando test simple de onboarding');
    
    // 1. Limpiar datos y navegar
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // 2. Ir a login
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 3. Login
    console.log('📝 Haciendo login...');
    await page.fill('input[type="email"]', 'new-user@infraux.com');
    await page.fill('input[type="password"]', 'NewUser123!');
    await page.click('button[type="submit"]');
    
    // 4. Esperar redirección
    await page.waitForTimeout(5000);
    console.log('📍 URL actual:', page.url());
    
    // 5. Si estamos en onboarding
    if (page.url().includes('/onboarding/select-usage')) {
      console.log('✅ En onboarding');
      
      // PASO 1: Click en Uso Personal
      console.log('\n🔹 PASO 1: Seleccionar tipo de uso');
      await page.waitForSelector('button:has-text("Uso Personal")', { timeout: 10000 });
      await page.click('button:has-text("Uso Personal")');
      console.log('✅ Click en Uso Personal');
      
      // Esperar transición
      await page.waitForTimeout(2000);
      
      // PASO 2: Seleccionar cómo escuchaste
      console.log('\n🔹 PASO 2: ¿Cómo escuchaste de nosotros?');
      await page.waitForSelector('button:has-text("Redes Sociales")', { timeout: 10000 });
      await page.click('button:has-text("Redes Sociales")');
      console.log('✅ Seleccionado: Redes Sociales');
      
      // Click en Siguiente
      await page.click('button:has-text("Siguiente")');
      console.log('✅ Click en Siguiente');
      
      // Esperar transición
      await page.waitForTimeout(2000);
      
      // PASO 3: Experiencia con IaC
      console.log('\n🔹 PASO 3: Experiencia con IaC');
      await page.waitForSelector('text=Tu Experiencia con IaC', { timeout: 10000 });
      
      // Buscar y hacer click en la primera opción que contenga "Principiante"
      const principianteButton = page.locator('button').filter({ hasText: /Principiante/ }).first();
      await principianteButton.click();
      console.log('✅ Seleccionado: Principiante');
      
      // Click en Siguiente
      await page.click('button:has-text("Siguiente")');
      console.log('✅ Click en Siguiente');
      
      // Esperar transición
      await page.waitForTimeout(2000);
      
      // PASO 4: Intereses (opcional)
      console.log('\n🔹 PASO 4: Intereses');
      await page.waitForSelector('text=¿Qué te interesa explorar?', { timeout: 10000 });
      
      // Seleccionar un interés
      await page.click('button:has-text("Automatización de Infraestructura")');
      console.log('✅ Seleccionado interés: Automatización');
      
      // Click en Finalizar
      const finalizarButton = page.locator('button').filter({ hasText: /Finalizar Onboarding/ });
      await finalizarButton.click();
      console.log('✅ Click en Finalizar Onboarding');
      
      // Esperar resultado
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('\n📊 Resultado final:');
      console.log('URL final:', finalUrl);
      
      // Tomar screenshot
      await page.screenshot({ 
        path: 'test-results/onboarding-simple-result.png', 
        fullPage: true 
      });
      
      if (finalUrl.includes('/dashboard')) {
        console.log('✅ ¡ÉXITO! Llegamos al dashboard');
      } else {
        console.log('❌ No llegamos al dashboard');
      }
    } else {
      console.log('❌ No se redirigió a onboarding');
      console.log('URL actual:', page.url());
    }
  });
});