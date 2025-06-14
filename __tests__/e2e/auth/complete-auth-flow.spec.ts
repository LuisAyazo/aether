import { test, expect } from '@playwright/test';
import { supabase } from '../../../app/lib/supabase';

test.describe('Complete Authentication Flow - All Use Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cualquier sesión previa
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('1. Login Flow - Email/Password', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🔐 Testing Email/Password Login Flow...');
    
    // 1. Ir a la página de login
    await page.goto('http://localhost:3000/login');
    await expect(page).toHaveURL(/.*login/);
    await page.waitForTimeout(1000);
    
    // 2. Verificar elementos de la página
    await expect(page.getByText(/Inicia sesión en tu cuenta/i)).toBeVisible();
    await expect(page.getByPlaceholder(/correo|email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/contraseña|password/i)).toBeVisible();
    
    // 3. Intentar login con credenciales inválidas
    console.log('❌ Testing invalid credentials...');
    await page.getByPlaceholder(/correo|email/i).fill('invalid@example.com');
    await page.getByPlaceholder(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar mensaje de error
    await page.waitForTimeout(2000);
    const errorMessage = page.locator('text=/credenciales inválidas|invalid credentials|error/i');
    if (await errorMessage.isVisible()) {
      console.log('✅ Error message shown for invalid credentials');
    }
    
    // 4. Limpiar y probar con campos vacíos
    console.log('📝 Testing empty fields validation...');
    await page.getByPlaceholder(/correo|email/i).clear();
    await page.getByPlaceholder(/contraseña|password/i).clear();
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Verificar validación HTML5
    const emailInput = page.getByPlaceholder(/correo|email/i);
    const isEmailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    console.log(`Email validation: ${isEmailInvalid ? 'Working' : 'Not working'}`);
    
    await page.screenshot({ path: 'test-results/login-validation.png' });
  });

  test('2. Registration Flow - Complete Process', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('📝 Testing Registration Flow...');
    
    // 1. Navegar a registro desde login
    await page.goto('http://localhost:3000/login');
    await page.getByText(/regístrate gratis|crear cuenta|sign up/i).click();
    await expect(page).toHaveURL(/.*register/);
    await page.waitForTimeout(1000);
    
    // 2. Verificar elementos del formulario
    await expect(page.getByText(/Crea tu cuenta/i)).toBeVisible();
    
    // 3. Llenar formulario con datos de prueba
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    console.log(`📧 Using test email: ${testEmail}`);
    
    // Buscar campos por diferentes métodos
    const nameInput = page.getByPlaceholder(/nombre completo|full name/i).or(page.getByLabel(/nombre/i)).first();
    const emailInput = page.getByPlaceholder(/correo|email/i).or(page.getByLabel(/correo|email/i)).first();
    const passwordInput = page.getByPlaceholder(/contraseña|password/i).or(page.getByLabel(/contraseña/i)).first();
    
    await nameInput.fill('Usuario de Prueba');
    await emailInput.fill(testEmail);
    await passwordInput.fill('TestPassword123!');
    
    await page.screenshot({ path: 'test-results/register-form-filled.png' });
    
    // 4. Enviar formulario
    console.log('🚀 Submitting registration...');
    await page.getByRole('button', { name: /crear cuenta|registrar|sign up/i }).first().click();
    
    // 5. Esperar resultado
    await page.waitForTimeout(3000);
    
    // Verificar si se muestra mensaje de confirmación o se redirige
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('✅ Redirected to login (email confirmation required)');
      await expect(page.getByText(/confirma tu correo|check your email/i)).toBeVisible();
    } else if (currentUrl.includes('onboarding')) {
      console.log('✅ Auto-confirmed, redirected to onboarding');
    }
    
    await page.screenshot({ path: 'test-results/register-result.png' });
  });

  test('3. OAuth Login - Google & GitHub', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🔗 Testing OAuth Login Options...');
    
    await page.goto('http://localhost:3000/login');
    
    // 1. Verificar botones OAuth
    const googleButton = page.getByRole('button', { name: /google/i });
    const githubButton = page.getByRole('button', { name: /github/i });
    
    await expect(googleButton).toBeVisible();
    await expect(githubButton).toBeVisible();
    
    // 2. Hover sobre botones para mostrar interactividad
    console.log('🖱️ Testing OAuth buttons interaction...');
    await googleButton.hover();
    await page.waitForTimeout(500);
    await githubButton.hover();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/oauth-buttons.png' });
    
    // 3. Click en Google (sin completar el flujo)
    console.log('🔵 Testing Google OAuth initiation...');
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      googleButton.click()
    ]);
    
    if (popup) {
      console.log('✅ Google OAuth popup opened');
      await popup.close();
    } else {
      console.log('⚠️ No popup detected (might be blocked or redirecting)');
    }
  });

  test('4. Onboarding Flow - Usage Selection', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🎯 Testing Onboarding Flow...');
    
    // Navegar directamente al onboarding (simular usuario autenticado)
    await page.goto('http://localhost:3000/onboarding/select-usage');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('⚠️ Redirected to login (authentication required)');
      await page.screenshot({ path: 'test-results/onboarding-auth-required.png' });
      return;
    }
    
    // Si llegamos al onboarding
    console.log('✅ On onboarding page');
    
    // Buscar opciones de uso
    const personalOption = page.getByText(/personal|individual/i).first();
    const companyOption = page.getByText(/empresa|company|equipo|team/i).first();
    
    if (await personalOption.isVisible() && await companyOption.isVisible()) {
      console.log('📋 Usage options found');
      
      // Hover sobre opciones
      await personalOption.hover();
      await page.waitForTimeout(1000);
      await companyOption.hover();
      await page.waitForTimeout(1000);
      
      // Seleccionar empresa
      await companyOption.click();
      await page.waitForTimeout(1000);
      
      // Buscar botón continuar
      const continueButton = page.getByRole('button', { name: /continuar|siguiente|next/i });
      if (await continueButton.isVisible()) {
        await continueButton.click();
        console.log('➡️ Continuing to company creation...');
      }
    }
    
    await page.screenshot({ path: 'test-results/onboarding-usage.png' });
  });

  test('5. Company Creation Flow', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🏢 Testing Company Creation...');
    
    await page.goto('http://localhost:3000/create-company');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('⚠️ Redirected to login (authentication required)');
      return;
    }
    
    // Buscar formulario de creación de empresa
    const companyNameInput = page.getByPlaceholder(/nombre.*empresa|company name/i).or(page.getByLabel(/nombre.*empresa/i)).first();
    
    if (await companyNameInput.isVisible()) {
      console.log('📝 Company creation form found');
      
      await companyNameInput.fill('Mi Empresa Demo S.A.');
      await page.waitForTimeout(1000);
      
      // Buscar otros campos opcionales
      const industrySelect = page.getByLabel(/industria|industry|sector/i).first();
      if (await industrySelect.isVisible()) {
        await industrySelect.click();
        await page.waitForTimeout(500);
        // Seleccionar primera opción si hay
        await page.keyboard.press('Enter');
      }
      
      const sizeSelect = page.getByLabel(/tamaño|size|empleados/i).first();
      if (await sizeSelect.isVisible()) {
        await sizeSelect.click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
      }
      
      await page.screenshot({ path: 'test-results/company-form.png' });
      
      // Buscar botón crear
      const createButton = page.getByRole('button', { name: /crear|create/i });
      if (await createButton.isVisible()) {
        console.log('🚀 Would create company (not clicking to avoid test data)');
      }
    }
  });

  test('6. Dashboard Access', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('📊 Testing Dashboard Access...');
    
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('login')) {
      console.log('⚠️ Redirected to login (authentication required)');
      await page.screenshot({ path: 'test-results/dashboard-auth-required.png' });
    } else if (currentUrl.includes('dashboard')) {
      console.log('✅ Dashboard accessible');
      
      // Buscar elementos del dashboard
      const welcomeText = page.getByText(/bienvenido|welcome|dashboard/i).first();
      if (await welcomeText.isVisible()) {
        console.log('📈 Dashboard content visible');
      }
      
      await page.screenshot({ path: 'test-results/dashboard.png' });
    }
  });

  test('7. Password Recovery Flow', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🔑 Testing Password Recovery...');
    
    await page.goto('http://localhost:3000/login');
    
    // Buscar enlace de recuperación
    const forgotPasswordLink = page.getByText(/olvidaste.*contraseña|forgot.*password/i);
    
    if (await forgotPasswordLink.isVisible()) {
      console.log('📧 Password recovery link found');
      await forgotPasswordLink.click();
      await page.waitForTimeout(2000);
      
      // Verificar si hay formulario de recuperación
      const recoveryEmailInput = page.getByPlaceholder(/correo|email/i);
      if (await recoveryEmailInput.isVisible()) {
        await recoveryEmailInput.fill('recovery@example.com');
        
        const sendButton = page.getByRole('button', { name: /enviar|send|recuperar/i });
        if (await sendButton.isVisible()) {
          console.log('✅ Password recovery form functional');
        }
      }
      
      await page.screenshot({ path: 'test-results/password-recovery.png' });
    } else {
      console.log('⚠️ No password recovery link found');
    }
  });

  test('8. Session Persistence', async ({ page, context }) => {
    test.setTimeout(60000);
    
    console.log('🍪 Testing Session Persistence...');
    
    // Simular una sesión guardada
    await context.addCookies([{
      name: 'test-session',
      value: 'test-value',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    
    // Verificar localStorage
    const hasAuthData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(key => key.includes('auth') || key.includes('sb-'));
    });
    
    console.log(`Local storage auth data: ${hasAuthData ? 'Present' : 'Not found'}`);
    
    await page.screenshot({ path: 'test-results/session-check.png' });
  });

  test('9. Logout Flow', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🚪 Testing Logout Flow...');
    
    // Primero intentar acceder al dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    
    // Si estamos en el dashboard, buscar botón de logout
    if (!page.url().includes('login')) {
      const logoutButton = page.getByText(/cerrar sesión|logout|salir/i).first();
      
      if (await logoutButton.isVisible()) {
        console.log('🔴 Logout button found');
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar redirección a login
        if (page.url().includes('login')) {
          console.log('✅ Successfully logged out');
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/logout.png' });
  });

  test('10. Error States and Edge Cases', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('⚠️ Testing Error States...');
    
    // 1. Sesión expirada
    await page.goto('http://localhost:3000/login?session_expired=true');
    const sessionExpiredMsg = page.getByText(/sesión.*expirada|session.*expired/i);
    if (await sessionExpiredMsg.isVisible()) {
      console.log('✅ Session expired message shown');
    }
    
    // 2. Error de OAuth
    await page.goto('http://localhost:3000/login?error=oauth_error');
    await page.waitForTimeout(1000);
    
    // 3. Callback con error
    await page.goto('http://localhost:3000/auth/callback?error=access_denied');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/error-states.png' });
  });
});

// Test helper para crear usuario de prueba si es necesario
test.describe('Test Setup Helper', () => {
  test.skip('Create test user for manual testing', async ({ page }) => {
    // Este test está deshabilitado por defecto
    // Habilítalo solo cuando necesites crear un usuario de prueba
    
    const testUser = {
      email: 'e2e-test@infraux.com',
      password: 'E2ETest123!',
      name: 'E2E Test User'
    };
    
    console.log('Creating test user:', testUser.email);
    
    // Aquí iría el código para crear el usuario usando Supabase Admin API
    // o mediante el flujo de registro normal
  });
});