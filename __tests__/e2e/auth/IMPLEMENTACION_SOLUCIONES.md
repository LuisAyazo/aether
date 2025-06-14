# 🛠️ Implementación de Soluciones para Tests E2E

## 1. Archivo de Selectores Centralizados

Crear el archivo `infraux/__tests__/e2e/helpers/selectors.ts`:

```typescript
/**
 * Selectores centralizados para tests E2E
 * Usa múltiples estrategias para mayor robustez
 */
export const selectors = {
  login: {
    // Inputs
    emailInput: [
      '[data-testid="login-email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="correo" i]',
      'input[name="email"]',
      '#email'
    ].join(', '),
    
    passwordInput: [
      '[data-testid="login-password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]',
      'input[placeholder*="contraseña" i]',
      'input[name="password"]',
      '#password'
    ].join(', '),
    
    // Buttons
    submitButton: [
      '[data-testid="login-submit"]',
      'button[type="submit"]',
      'button:has-text("Iniciar Sesión")',
      'button:has-text("Login")',
      'button:has-text("Entrar")'
    ].join(', '),
    
    googleButton: [
      '[data-testid="login-google"]',
      'button:has-text("Google")',
      'button:has-text("Iniciar sesión con Google")'
    ].join(', '),
    
    githubButton: [
      '[data-testid="login-github"]',
      'button:has-text("GitHub")',
      'button:has-text("Iniciar sesión con GitHub")'
    ].join(', '),
    
    // Links
    registerLink: [
      '[data-testid="login-register-link"]',
      'a:has-text("Regístrate")',
      'a:has-text("Crear cuenta")',
      'a:has-text("Sign up")',
      'a[href*="register"]'
    ].join(', '),
    
    forgotPasswordLink: [
      '[data-testid="login-forgot-password"]',
      'a:has-text("Olvidaste")',
      'a:has-text("Forgot")',
      'a[href*="forgot"]',
      'a[href*="reset"]'
    ].join(', '),
    
    // Messages
    errorMessage: [
      '[data-testid="login-error"]',
      '.error-message',
      '[role="alert"]',
      '.text-red-500',
      '.text-danger'
    ].join(', ')
  },
  
  register: {
    nameInput: [
      '[data-testid="register-name"]',
      'input[placeholder*="nombre" i]',
      'input[placeholder*="name" i]',
      'input[name="name"]',
      'input[name="fullName"]'
    ].join(', '),
    
    emailInput: [
      '[data-testid="register-email"]',
      'input[type="email"]',
      'input[name="email"]'
    ].join(', '),
    
    passwordInput: [
      '[data-testid="register-password"]',
      'input[type="password"]',
      'input[name="password"]'
    ].join(', '),
    
    submitButton: [
      '[data-testid="register-submit"]',
      'button[type="submit"]',
      'button:has-text("Crear Cuenta")',
      'button:has-text("Registrar")',
      'button:has-text("Sign up")'
    ].join(', ')
  },
  
  dashboard: {
    welcomeMessage: [
      '[data-testid="dashboard-welcome"]',
      'h1:has-text("Bienvenido")',
      'h1:has-text("Welcome")',
      'h1:has-text("Dashboard")'
    ].join(', '),
    
    logoutButton: [
      '[data-testid="logout-button"]',
      'button:has-text("Cerrar sesión")',
      'button:has-text("Logout")',
      'button:has-text("Salir")'
    ].join(', ')
  },
  
  onboarding: {
    personalOption: [
      '[data-testid="usage-personal"]',
      'button:has-text("Personal")',
      'button:has-text("Individual")',
      '[value="personal"]'
    ].join(', '),
    
    companyOption: [
      '[data-testid="usage-company"]',
      'button:has-text("Empresa")',
      'button:has-text("Company")',
      'button:has-text("Equipo")',
      '[value="company"]'
    ].join(', '),
    
    continueButton: [
      '[data-testid="onboarding-continue"]',
      'button:has-text("Continuar")',
      'button:has-text("Siguiente")',
      'button:has-text("Next")'
    ].join(', ')
  }
};
```

## 2. Mock de Autenticación

Crear el archivo `infraux/__tests__/e2e/helpers/mock-auth.ts`:

```typescript
import { Page } from '@playwright/test';

export interface MockUser {
  id: string;
  email: string;
  name: string;
  usage_type?: 'personal' | 'company';
  company_id?: string;
}

/**
 * Mockea la autenticación de Supabase en el navegador
 */
export async function mockAuthentication(page: Page, user?: MockUser) {
  const defaultUser: MockUser = {
    id: 'test-user-123',
    email: 'e2e-test@infraux.com',
    name: 'E2E Test User',
    usage_type: 'company',
    company_id: 'test-company-123'
  };
  
  const mockUser = user || defaultUser;
  
  // Inyectar datos de autenticación en localStorage
  await page.addInitScript((user) => {
    // Mock de Supabase auth token
    const mockSession = {
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: user.id,
        aud: 'authenticated',
        role: 'authenticated',
        email: user.email,
        email_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_metadata: {
          name: user.name
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
        }
      }
    };
    
    // Guardar en localStorage como lo haría Supabase
    const supabaseKey = `sb-${window.location.hostname}-auth-token`;
    localStorage.setItem(supabaseKey, JSON.stringify(mockSession));
    
    // También guardar datos del usuario para la app
    localStorage.setItem('infraux_user', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      usage_type: user.usage_type,
      company_id: user.company_id
    }));
  }, mockUser);
}

/**
 * Limpia todos los datos de autenticación
 */
export async function clearAuthentication(page: Page) {
  await page.evaluate(() => {
    // Limpiar todo el localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });
}
```

## 3. Interceptores de API

Crear el archivo `infraux/__tests__/e2e/helpers/api-mock.ts`:

```typescript
import { Page, Route } from '@playwright/test';

export interface APIConfig {
  baseURL: string;
  mockUser?: any;
  mockCompany?: any;
}

/**
 * Configura interceptores para las APIs
 */
export async function setupAPIMocks(page: Page, config?: Partial<APIConfig>) {
  const defaultConfig: APIConfig = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    mockUser: {
      id: 'test-user-123',
      email: 'e2e-test@infraux.com',
      name: 'E2E Test User',
      usage_type: 'company'
    },
    mockCompany: {
      id: 'test-company-123',
      name: 'Test Company',
      created_by: 'test-user-123'
    }
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  // Mock login endpoint
  await page.route('**/api/v1/auth/login', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        user: finalConfig.mockUser
      })
    });
  });
  
  // Mock /me endpoint
  await page.route('**/api/v1/auth/me', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(finalConfig.mockUser)
    });
  });
  
  // Mock companies endpoint
  await page.route('**/api/v1/auth/me/companies', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([finalConfig.mockCompany])
    });
  });
  
  // Mock create company
  await page.route('**/api/v1/companies', (route: Route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(finalConfig.mockCompany)
      });
    } else {
      route.continue();
    }
  });
}
```

## 4. Test con Flujo Mockeado Completo

Crear el archivo `infraux/__tests__/e2e/auth/mocked-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { mockAuthentication, clearAuthentication } from '../helpers/mock-auth';
import { setupAPIMocks } from '../helpers/api-mock';
import { selectors } from '../helpers/selectors';

test.describe('Flujo de Autenticación con Mocks', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar cualquier autenticación previa
    await clearAuthentication(page);
    
    // Configurar mocks de API
    await setupAPIMocks(page);
  });
  
  test('flujo completo con autenticación mockeada', async ({ page }) => {
    // 1. Mockear autenticación
    await mockAuthentication(page, {
      id: 'test-123',
      email: 'test@infraux.com',
      name: 'Test User',
      usage_type: 'company',
      company_id: 'company-123'
    });
    
    // 2. Ir al dashboard (no debería redirigir al login)
    await page.goto('http://localhost:3000/dashboard');
    await expect(page).not.toHaveURL(/.*login/);
    
    // 3. Verificar que el dashboard se carga
    const welcomeMessage = page.locator(selectors.dashboard.welcomeMessage);
    await expect(welcomeMessage).toBeVisible({ timeout: 10000 });
    
    // 4. Verificar datos del usuario
    const userInfo = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('infraux_user') || '{}');
    });
    expect(userInfo.email).toBe('test@infraux.com');
    
    // 5. Navegar a otras páginas protegidas
    await page.goto('http://localhost:3000/company/settings');
    await expect(page).not.toHaveURL(/.*login/);
  });
  
  test('login flow con API mockeada', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Llenar formulario
    await page.locator(selectors.login.emailInput).first().fill('test@infraux.com');
    await page.locator(selectors.login.passwordInput).first().fill('password123');
    
    // Click en login
    await page.locator(selectors.login.submitButton).first().click();
    
    // Debería redirigir al dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });
});
```

## 5. Configuración de Playwright para Mocks

Actualizar `infraux/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // ... configuración existente ...
  
  projects: [
    // Proyecto normal
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Proyecto con mocks
    {
      name: 'chromium-mocked',
      use: {
        ...devices['Desktop Chrome'],
        // Inyectar variable de entorno para activar mocks
        launchOptions: {
          env: {
            ...process.env,
            NEXT_PUBLIC_MOCK_AUTH: 'true',
            E2E_TEST_MODE: 'mocked'
          },
        },
      },
    },
  ],
});
```

## 6. Scripts de NPM Actualizados

Agregar a `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:mocked": "playwright test --project=chromium-mocked",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:setup": "tsx __tests__/e2e/scripts/setup-test-users.ts"
  }
}
```

## 7. Instrucciones de Uso

### Para ejecutar con usuarios reales:
```bash
# 1. Configurar usuarios de prueba
npm run test:e2e:setup

# 2. Ejecutar tests
npm run test:e2e
```

### Para ejecutar con mocks:
```bash
# Ejecutar tests con datos mockeados
npm run test:e2e:mocked
```

### Para debug visual:
```bash
# Ver ejecución en navegador
npm run test:e2e:headed

# Modo debug interactivo
npm run test:e2e:debug
```

## 🎯 Beneficios de esta Implementación

1. **Selectores Robustos**: Múltiples estrategias de selección previenen fallos por cambios menores
2. **Tests Sin Dependencias**: Los mocks permiten ejecutar tests sin base de datos
3. **Flexibilidad**: Puedes elegir entre tests reales o mockeados
4. **Mantenibilidad**: Código centralizado y reutilizable
5. **CI/CD Ready**: Los tests mockeados pueden correr en cualquier ambiente