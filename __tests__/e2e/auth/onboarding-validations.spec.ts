import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users.fixtures';

test.describe('Onboarding Validations - Required Fields', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar sesión
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Complete onboarding flow with all validations', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🎯 Testing onboarding with required field validations...');
    
    // 1. Login con usuario nuevo
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/correo|email/i).fill(testUsers.newUser.email);
    await page.getByPlaceholder(/contraseña|password/i).fill(testUsers.newUser.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar redirección al onboarding
    await page.waitForURL('**/onboarding/select-usage', { timeout: 10000 });
    console.log('✅ Redirected to onboarding');
    
    // PASO 1: Selección de tipo de uso (REQUERIDO)
    await expect(page.locator('text=Selecciona cómo usarás InfraUX')).toBeVisible();
    
    // Seleccionar uso personal
    await page.getByRole('button', { name: 'Uso Personal' }).click();
    console.log('✅ Selected personal usage');
    
    // PASO 2: ¿Cómo escuchaste de nosotros? (REQUERIDO)
    await expect(page.locator('h2')).toContainText('¿Cómo escuchaste de nosotros?');
    
    // Intentar continuar sin seleccionar - debe mostrar error
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.locator('.bg-red-100')).toContainText('Por favor, selecciona una opción');
    console.log('✅ Validation working for "How did you hear about us"');
    
    // Seleccionar una opción
    await page.getByRole('button', { name: 'Búsqueda en Google' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // PASO 3: Experiencia con IaC (REQUERIDO)
    await expect(page.locator('h2')).toContainText('Tu Experiencia con IaC');
    
    // Intentar continuar sin seleccionar - debe mostrar error
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await expect(page.locator('.bg-red-100')).toContainText('Por favor, selecciona tu nivel de conocimiento');
    console.log('✅ Validation working for "IaC Experience"');
    
    // Seleccionar una opción
    await page.getByRole('button', { name: 'Principiante' }).first().click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // PASO 4: Intereses principales (AHORA REQUERIDO - al menos uno)
    await expect(page.locator('h2')).toContainText('¿Qué te interesa explorar?');
    await expect(page.locator('p')).toContainText('Selecciona al menos un área que te gustaría conocer');
    
    // Verificar que el botón está deshabilitado sin selección
    const submitButton = page.getByRole('button', { name: 'Finalizar Onboarding' });
    await expect(submitButton).toBeDisabled();
    console.log('✅ Submit button disabled without interests selection');
    
    // Seleccionar al menos un interés
    await page.getByRole('button', { name: 'Automatización de Infraestructura' }).click();
    
    // Ahora el botón debe estar habilitado
    await expect(submitButton).toBeEnabled();
    console.log('✅ Submit button enabled after selecting interest');
    
    // Seleccionar otro interés más
    await page.getByRole('button', { name: 'Diseño Visual de Arquitecturas' }).click();
    
    // Finalizar onboarding
    await submitButton.click();
    console.log('🚀 Submitting onboarding...');
    
    // Verificar que se muestra la pantalla de carga
    await expect(page.locator('text=Creando tu espacio personal...')).toBeVisible({ timeout: 5000 });
    console.log('✅ Loading screen shown with personal space message');
    
    // Verificar que los mensajes de carga cambian
    await page.waitForTimeout(2500);
    
    // Verificar al menos uno de los mensajes posteriores
    const hasProgressMessage = await page.locator('text=/Configurando tu dashboard|Preparando tus herramientas/').isVisible();
    if (hasProgressMessage) {
      console.log('✅ Loading messages are progressing');
    }
    
    // Esperar creación del espacio personal y redirección
    await page.waitForTimeout(5000);
    
    // Verificar que se redirigió al dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    console.log('✅ Successfully redirected to dashboard');
    
    // Tomar screenshot final
    await page.screenshot({ path: 'test-results/onboarding-complete-with-validations.png' });
  });

  test('Company user onboarding flow', async ({ page }) => {
    test.setTimeout(120000);
    
    console.log('🏢 Testing company user onboarding...');
    
    // Login con usuario company
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/correo|email/i).fill(testUsers.companyUser.email);
    await page.getByPlaceholder(/contraseña|password/i).fill(testUsers.companyUser.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Debe redirigir a crear compañía
    await page.waitForURL('**/company/create', { timeout: 10000 });
    console.log('✅ Company user redirected to create company');
    
    await page.screenshot({ path: 'test-results/company-user-create.png' });
  });

  test('Personal user with existing space', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('👤 Testing personal user with existing space...');
    
    // Login con usuario personal existente
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/correo|email/i).fill(testUsers.personalUser.email);
    await page.getByPlaceholder(/contraseña|password/i).fill(testUsers.personalUser.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Debe ir directo al dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Personal user went directly to dashboard');
    
    await page.screenshot({ path: 'test-results/personal-user-dashboard.png' });
  });

  test('Navigation between onboarding steps', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('🔄 Testing navigation between steps...');
    
    // Login y llegar al onboarding
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/correo|email/i).fill(testUsers.newUser.email);
    await page.getByPlaceholder(/contraseña|password/i).fill(testUsers.newUser.password);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    await page.waitForURL('**/onboarding/select-usage', { timeout: 10000 });
    
    // Paso 1 → Paso 2
    await page.getByRole('button', { name: 'Uso de Compañía' }).click();
    
    // Paso 2
    await page.getByRole('button', { name: 'Un Amigo/Colega' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 3 - Volver al paso 2
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.locator('h2')).toContainText('¿Cómo escuchaste de nosotros?');
    console.log('✅ Back navigation working (Step 3 → 2)');
    
    // Volver al paso 1
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.locator('text=Selecciona cómo usarás InfraUX')).toBeVisible();
    console.log('✅ Back navigation working (Step 2 → 1)');
    
    // Avanzar de nuevo
    await page.getByRole('button', { name: 'Uso Personal' }).click();
    await page.getByRole('button', { name: 'Redes Sociales' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    await page.getByRole('button', { name: 'Intermedio' }).click();
    await page.getByRole('button', { name: 'Siguiente' }).click();
    
    // Paso 4 - Volver al paso 3
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.locator('h2')).toContainText('Tu Experiencia con IaC');
    console.log('✅ Back navigation working (Step 4 → 3)');
    
    await page.screenshot({ path: 'test-results/onboarding-navigation.png' });
  });
});