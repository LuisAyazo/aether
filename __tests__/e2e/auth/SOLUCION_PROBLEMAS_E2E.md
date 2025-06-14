# 🔧 Plan de Solución para Problemas de Tests E2E de Autenticación

## 1. **Autenticación Real - Usuarios de Prueba**

### Problema:
- No hay usuarios de prueba en la base de datos
- Los logins fallan con todas las credenciales probadas

### Solución Propuesta:

#### Opción A: Script de Setup Automático (Recomendado)
```bash
# 1. Ejecutar el script de setup que ya creamos
cd infraux && npx tsx __tests__/e2e/scripts/setup-test-users.ts

# 2. Si falla, verificar las variables de entorno en .env.test
SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

#### Opción B: Crear Usuario Manual en Supabase Dashboard
1. Ir a tu proyecto en Supabase Dashboard
2. Authentication → Users → Invite User
3. Crear usuario con:
   - Email: `e2e-test@infraux.com`
   - Password: `E2ETest123!`
   - Auto-confirm email: ✓

#### Opción C: Mock de Autenticación para Tests
Crear un modo de test que bypass la autenticación real:

```typescript
// infraux/__tests__/e2e/helpers/mock-auth.ts
export async function mockAuthentication(page: Page) {
  await page.addInitScript(() => {
    // Simular token de autenticación
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-token',
      user: {
        id: 'test-user-id',
        email: 'e2e-test@infraux.com',
        user_metadata: { name: 'Test User' }
      }
    }));
  });
}
```

## 2. **Textos y Selectores Flexibles**

### Problema:
- Algunos textos esperados no coinciden exactamente
- Necesidad de selectores más flexibles

### Solución Propuesta:

#### A. Agregar data-testid a elementos críticos:
```typescript
// Modificar los componentes React para incluir data-testid
// Ejemplo en login page:
<button data-testid="login-submit" type="submit">
  Iniciar Sesión
</button>

<input data-testid="login-email" type="email" />
<input data-testid="login-password" type="password" />
```

#### B. Crear selectores más robustos:
```typescript
// infraux/__tests__/e2e/helpers/selectors.ts
export const selectors = {
  login: {
    emailInput: '[data-testid="login-email"], input[type="email"], input[placeholder*="email" i], input[placeholder*="correo" i]',
    passwordInput: '[data-testid="login-password"], input[type="password"]',
    submitButton: '[data-testid="login-submit"], button[type="submit"]:has-text("Iniciar"), button:has-text("Login")',
    registerLink: 'a:has-text("Regístrate"), a:has-text("Crear cuenta"), a[href*="register"]'
  },
  register: {
    nameInput: '[data-testid="register-name"], input[placeholder*="nombre" i]',
    emailInput: '[data-testid="register-email"], input[type="email"]',
    passwordInput: '[data-testid="register-password"], input[type="password"]',
    submitButton: '[data-testid="register-submit"], button:has-text("Crear"), button:has-text("Registrar")'
  }
};
```

#### C. Actualizar Page Objects con selectores flexibles:
```typescript
// Actualizar login.page.ts
import { selectors } from '../helpers/selectors';

export class LoginPage {
  async fillEmail(email: string) {
    await this.page.locator(selectors.login.emailInput).first().fill(email);
  }
  
  async fillPassword(password: string) {
    await this.page.locator(selectors.login.passwordInput).first().fill(password);
  }
  
  async clickSubmit() {
    await this.page.locator(selectors.login.submitButton).first().click();
  }
}
```

## 3. **Flujo Post-Login Sin Usuarios Reales**

### Problema:
- No se puede verificar el flujo completo sin usuarios reales

### Solución Propuesta:

#### A. Tests con Estados Mockeados:
```typescript
// infraux/__tests__/e2e/auth/mocked-flow.spec.ts
import { test, expect } from '@playwright/test';
import { mockAuthentication } from '../helpers/mock-auth';

test.describe('Flujo Completo con Mock', () => {
  test('should navigate through complete flow with mocked auth', async ({ page }) => {
    // 1. Mockear autenticación
    await mockAuthentication(page);
    
    // 2. Ir directamente al dashboard
    await page.goto('http://localhost:3000/dashboard');
    
    // 3. Verificar que NO redirige al login
    expect(page.url()).not.toContain('/login');
    
    // 4. Continuar con el flujo
    // ...
  });
});
```

#### B. Tests de Integración con API Mock:
```typescript
// infraux/__tests__/e2e/helpers/api-mock.ts
export async function setupAPIMocks(page: Page) {
  // Interceptar llamadas a la API
  await page.route('**/api/v1/auth/login', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: 'test-id',
          email: 'test@infraux.com',
          name: 'Test User'
        }
      })
    });
  });
  
  await page.route('**/api/v1/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-id',
        email: 'test@infraux.com',
        name: 'Test User',
        usage_type: 'company'
      })
    });
  });
}
```

#### C. Ambiente de Test Dedicado:
```typescript
// infraux/playwright.config.ts - Agregar proyecto de test con mocks
{
  name: 'chromium-mocked',
  use: {
    ...devices['Desktop Chrome'],
    // Variables de entorno para modo test
    launchOptions: {
      env: {
        ...process.env,
        NEXT_PUBLIC_MOCK_AUTH: 'true',
      },
    },
  },
}
```

## 📋 Plan de Implementación

### Fase 1: Solución Inmediata (1-2 horas)
1. ✅ Ejecutar script de setup de usuarios
2. ✅ Si falla, crear usuario manual en Supabase
3. ✅ Verificar que los tests pasen con usuario real

### Fase 2: Mejoras de Selectores (2-3 horas)
1. 📝 Crear archivo de selectores centralizados
2. 📝 Actualizar Page Objects con selectores flexibles
3. 📝 Agregar data-testid a componentes críticos (requiere cambios en el código fuente)

### Fase 3: Tests con Mocks (3-4 horas)
1. 🔧 Implementar helpers de mock authentication
2. 🔧 Crear suite de tests con estados mockeados
3. 🔧 Configurar interceptores de API

### Fase 4: CI/CD Integration (2-3 horas)
1. 🚀 Configurar GitHub Actions
2. 🚀 Script de setup/teardown automático
3. 🚀 Reportes de test automáticos

## 🎯 Resultado Esperado

Con estas soluciones implementadas:
- ✅ Tests E2E funcionando con usuarios reales o mockeados
- ✅ Selectores robustos que no se rompen con cambios menores
- ✅ Flujo completo verificable incluso sin base de datos
- ✅ Suite de tests mantenible y escalable

## 🛠️ Comandos Útiles

```bash
# Ejecutar tests con usuario real
npm run test:e2e

# Ejecutar tests con mocks
npm run test:e2e -- --project=chromium-mocked

# Debug de tests
npm run test:e2e:debug

# Ver reporte de tests
npx playwright show-report