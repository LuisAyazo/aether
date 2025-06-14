import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Debug - Selección de Tipo de Uso', () => {
  test('Verificar elementos en página de selección de uso', async ({ page }) => {
    test.setTimeout(120000);
    
    const loginPage = new LoginPage(page);
    
    // Login
    await loginPage.goto();
    await loginPage.fillEmail('e2e-test@infraux.com');
    await loginPage.fillPassword('E2ETest123!');
    await loginPage.clickSubmit();
    
    // Esperar navegación
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar URL
    const currentUrl = page.url();
    console.log('URL actual:', currentUrl);
    
    if (currentUrl.includes('/onboarding/select-usage')) {
      console.log('✅ Estamos en la página de selección de uso');
      
      // Buscar todos los botones en la página
      const allButtons = await page.locator('button').all();
      console.log(`\nEncontrados ${allButtons.length} botones:`);
      
      for (let i = 0; i < allButtons.length; i++) {
        const buttonText = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`  Botón ${i + 1}: "${buttonText?.trim()}" - Visible: ${isVisible}`);
      }
      
      // Buscar elementos clickeables con texto relacionado
      console.log('\nBuscando elementos con texto "Personal" o "Empresa":');
      
      // Intentar diferentes selectores
      const selectors = [
        'button:has-text("Personal")',
        'button:has-text("personal")',
        'button:has-text("Empresa")',
        'button:has-text("empresa")',
        'div:has-text("Personal")',
        'div:has-text("Empresa")',
        '[role="button"]',
        '.cursor-pointer',
        '[onclick]'
      ];
      
      for (const selector of selectors) {
        const elements = await page.locator(selector).all();
        if (elements.length > 0) {
          console.log(`\nSelector "${selector}" encontró ${elements.length} elementos:`);
          for (let i = 0; i < Math.min(elements.length, 5); i++) {
            const text = await elements[i].textContent();
            const isVisible = await elements[i].isVisible();
            console.log(`  - "${text?.trim()}" - Visible: ${isVisible}`);
          }
        }
      }
      
      // Buscar por estructura específica
      console.log('\nBuscando por estructura de cards/opciones:');
      const cards = await page.locator('.card, .option, [class*="card"], [class*="option"], .border').all();
      console.log(`Encontradas ${cards.length} posibles cards:`);
      
      for (let i = 0; i < Math.min(cards.length, 5); i++) {
        const text = await cards[i].textContent();
        console.log(`  Card ${i + 1}: "${text?.substring(0, 50)}..."`);
      }
      
      // Tomar screenshot para análisis
      await page.screenshot({ 
        path: 'test-results/debug-usage-selection-page.png', 
        fullPage: true 
      });
      
      // Intentar hacer click en Personal de diferentes formas
      console.log('\n🔍 Intentando hacer click en opción Personal:');
      
      try {
        // Método 1: Buscar div/card que contenga "Personal" y hacer click
        const personalCard = page.locator('div').filter({ hasText: /Personal/i }).first();
        if (await personalCard.isVisible()) {
          console.log('✅ Encontrado card Personal, haciendo click...');
          await personalCard.click();
          await page.waitForTimeout(2000);
          console.log('URL después del click:', page.url());
        }
      } catch (e) {
        console.log('❌ No se pudo hacer click con método 1');
      }
      
      // Si seguimos en la misma página, intentar otro método
      if (page.url().includes('/onboarding/select-usage')) {
        try {
          // Método 2: Buscar cualquier elemento clickeable con "Personal"
          await page.click('text=/Personal/i');
          await page.waitForTimeout(2000);
          console.log('✅ Click con selector de texto funcionó');
          console.log('URL después del click:', page.url());
        } catch (e) {
          console.log('❌ No se pudo hacer click con método 2');
        }
      }
      
      // Verificar si hay un botón de continuar después de seleccionar
      const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Siguiente")').first();
      if (await continueButton.isVisible()) {
        console.log('\n✅ Botón Continuar visible, haciendo click...');
        await continueButton.click();
        await page.waitForTimeout(2000);
        console.log('URL después de continuar:', page.url());
      }
      
    } else {
      console.log('❌ No estamos en la página de selección de uso');
      console.log('URL actual:', currentUrl);
    }
    
    // Screenshot final
    await page.screenshot({ 
      path: 'test-results/debug-final-state.png', 
      fullPage: true 
    });
  });
});