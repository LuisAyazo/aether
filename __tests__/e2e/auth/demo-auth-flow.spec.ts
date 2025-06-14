import { test, expect, chromium } from '@playwright/test';

// Ejecutar solo en Chrome para la demo visual
test.use({ 
  browserName: 'chromium',
  viewport: { width: 1280, height: 720 },
  video: 'on'
});

test.describe('Demo Visual - Flujo de Autenticación', () => {
  test('Demo completa del flujo de autenticación', async ({ page }) => {
    test.setTimeout(120000); // 2 minutos
    test.slow(); // Marcar como test lento
    
    console.log('🚀 Iniciando demo visual del flujo de autenticación...\n');
    
    // ========== 1. PÁGINA DE LOGIN ==========
    console.log('📍 PASO 1: Página de Login');
    console.log('   Navegando a /login...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar que estamos en login
    const loginUrl = page.url();
    console.log(`   URL actual: ${loginUrl}`);
    
    // Buscar elementos visibles en la página
    const visibleElements = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.textContent);
      const buttons = Array.from(document.querySelectorAll('button')).map(el => el.textContent);
      const links = Array.from(document.querySelectorAll('a')).map(el => el.textContent);
      return { headings, buttons, links };
    });
    
    console.log('   Elementos encontrados:');
    console.log('   - Títulos:', visibleElements.headings);
    console.log('   - Botones:', visibleElements.buttons);
    console.log('   - Enlaces:', visibleElements.links);
    
    // Interactuar con el formulario
    console.log('\n   📝 Llenando formulario de login...');
    
    // Buscar campos por diferentes métodos
    const emailField = await page.locator('input[type="email"], input[placeholder*="correo" i], input[placeholder*="email" i]').first();
    const passwordField = await page.locator('input[type="password"], input[placeholder*="contraseña" i], input[placeholder*="password" i]').first();
    
    if (await emailField.isVisible()) {
      await emailField.fill('demo@infraux.com');
      console.log('   ✓ Email ingresado');
      await page.waitForTimeout(500);
    }
    
    if (await passwordField.isVisible()) {
      await passwordField.fill('DemoPassword123!');
      console.log('   ✓ Contraseña ingresada');
      await page.waitForTimeout(500);
    }
    
    // Tomar screenshot del login
    await page.screenshot({ 
      path: 'test-results/demo-1-login-form.png', 
      fullPage: true 
    });
    console.log('   📸 Screenshot: demo-1-login-form.png');
    
    // Buscar botón de login
    const loginButton = await page.locator('button[type="submit"], button:has-text("Iniciar"), button:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      console.log('   🔘 Botón de login encontrado');
      await loginButton.hover();
      await page.waitForTimeout(1000);
    }
    
    // ========== 2. REGISTRO ==========
    console.log('\n📍 PASO 2: Página de Registro');
    console.log('   Buscando enlace de registro...');
    
    const registerLink = await page.locator('a:has-text("Regístrate"), a:has-text("Crear cuenta"), a:has-text("Sign up")').first();
    if (await registerLink.isVisible()) {
      console.log('   ✓ Enlace de registro encontrado');
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log(`   URL actual: ${page.url()}`);
      
      // Screenshot del registro
      await page.screenshot({ 
        path: 'test-results/demo-2-register-page.png', 
        fullPage: true 
      });
      console.log('   📸 Screenshot: demo-2-register-page.png');
      
      // Volver al login
      await page.goBack();
      await page.waitForTimeout(1000);
    }
    
    // ========== 3. OAUTH ==========
    console.log('\n📍 PASO 3: Opciones de OAuth');
    console.log('   Buscando botones de OAuth...');
    
    const googleButton = await page.locator('button:has-text("Google")').first();
    const githubButton = await page.locator('button:has-text("GitHub")').first();
    
    if (await googleButton.isVisible()) {
      console.log('   ✓ Botón de Google encontrado');
      await googleButton.hover();
      await page.waitForTimeout(500);
    }
    
    if (await githubButton.isVisible()) {
      console.log('   ✓ Botón de GitHub encontrado');
      await githubButton.hover();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'test-results/demo-3-oauth-options.png', 
      fullPage: true 
    });
    console.log('   📸 Screenshot: demo-3-oauth-options.png');
    
    // ========== 4. INTENTAR ACCEDER A PÁGINAS PROTEGIDAS ==========
    console.log('\n📍 PASO 4: Páginas Protegidas (sin autenticación)');
    
    // Dashboard
    console.log('\n   🔒 Intentando acceder al Dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(2000);
    console.log(`   Redirigido a: ${page.url()}`);
    
    if (page.url().includes('login')) {
      console.log('   ✓ Correctamente redirigido al login (requiere autenticación)');
    }
    
    // Onboarding
    console.log('\n   🔒 Intentando acceder al Onboarding...');
    await page.goto('http://localhost:3000/onboarding/select-usage');
    await page.waitForTimeout(2000);
    console.log(`   Redirigido a: ${page.url()}`);
    
    // Company creation
    console.log('\n   🔒 Intentando acceder a Crear Empresa...');
    await page.goto('http://localhost:3000/create-company');
    await page.waitForTimeout(2000);
    console.log(`   Redirigido a: ${page.url()}`);
    
    // ========== 5. SIMULAR FLUJO COMPLETO (SIN LOGIN REAL) ==========
    console.log('\n📍 PASO 5: Simulación Visual del Flujo Completo');
    console.log('   (Navegación directa a cada página para mostrar cómo se vería)');
    
    // Crear un contexto con cookies falsas para simular autenticación
    const context = await chromium.launchPersistentContext('test-user-data-dir', {
      headless: false,
      viewport: { width: 1280, height: 720 }
    });
    
    const authenticatedPage = await context.newPage();
    
    // Simular datos de sesión
    await authenticatedPage.addInitScript(() => {
      localStorage.setItem('infraux_user', JSON.stringify({
        id: 'demo-user',
        email: 'demo@infraux.com',
        name: 'Usuario Demo'
      }));
    });
    
    console.log('\n   📱 Onboarding - Selección de Uso');
    await authenticatedPage.goto('http://localhost:3000/onboarding/select-usage');
    await authenticatedPage.waitForTimeout(2000);
    
    // Si no se redirige al login, tomar screenshot
    if (!authenticatedPage.url().includes('login')) {
      await authenticatedPage.screenshot({ 
        path: 'test-results/demo-5-onboarding.png', 
        fullPage: true 
      });
      console.log('   📸 Screenshot: demo-5-onboarding.png');
    }
    
    console.log('\n   🏢 Creación de Empresa');
    await authenticatedPage.goto('http://localhost:3000/create-company');
    await authenticatedPage.waitForTimeout(2000);
    
    if (!authenticatedPage.url().includes('login')) {
      await authenticatedPage.screenshot({ 
        path: 'test-results/demo-6-create-company.png', 
        fullPage: true 
      });
      console.log('   📸 Screenshot: demo-6-create-company.png');
    }
    
    console.log('\n   📊 Dashboard');
    await authenticatedPage.goto('http://localhost:3000/dashboard');
    await authenticatedPage.waitForTimeout(2000);
    
    if (!authenticatedPage.url().includes('login')) {
      await authenticatedPage.screenshot({ 
        path: 'test-results/demo-7-dashboard.png', 
        fullPage: true 
      });
      console.log('   📸 Screenshot: demo-7-dashboard.png');
    }
    
    await context.close();
    
    // ========== RESUMEN ==========
    console.log('\n' + '='.repeat(50));
    console.log('✅ DEMO COMPLETADA');
    console.log('='.repeat(50));
    console.log('\n📁 Screenshots guardados en test-results/');
    console.log('   - demo-1-login-form.png');
    console.log('   - demo-2-register-page.png');
    console.log('   - demo-3-oauth-options.png');
    console.log('   - demo-5-onboarding.png (si accesible)');
    console.log('   - demo-6-create-company.png (si accesible)');
    console.log('   - demo-7-dashboard.png (si accesible)');
    console.log('\n💡 Nota: Las páginas protegidas requieren autenticación real para acceder.');
  });

  test('Intentar login real con usuario de prueba', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('\n🔐 Intentando login con usuario de prueba...');
    
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Credenciales de prueba comunes
    const testCredentials = [
      { email: 'test@infraux.com', password: 'Test123!' },
      { email: 'demo@infraux.com', password: 'Demo123!' },
      { email: 'admin@infraux.com', password: 'Admin123!' }
    ];
    
    for (const creds of testCredentials) {
      console.log(`\n   Probando con: ${creds.email}`);
      
      const emailField = await page.locator('input[type="email"]').first();
      const passwordField = await page.locator('input[type="password"]').first();
      
      await emailField.fill(creds.email);
      await passwordField.fill(creds.password);
      
      const loginButton = await page.locator('button[type="submit"]').first();
      await loginButton.click();
      
      // Esperar respuesta
      await page.waitForTimeout(3000);
      
      // Verificar si el login fue exitoso
      if (!page.url().includes('login')) {
        console.log(`   ✅ Login exitoso! Redirigido a: ${page.url()}`);
        
        // Tomar screenshots del flujo real
        await page.screenshot({ 
          path: `test-results/real-flow-after-login.png`, 
          fullPage: true 
        });
        
        // Si estamos en onboarding, continuar
        if (page.url().includes('onboarding')) {
          console.log('   📱 En proceso de onboarding...');
          await page.waitForTimeout(2000);
          await page.screenshot({ 
            path: 'test-results/real-flow-onboarding.png', 
            fullPage: true 
          });
        }
        
        break;
      } else {
        console.log('   ❌ Login fallido');
      }
    }
  });
});