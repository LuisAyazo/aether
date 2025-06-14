# E2E Tests - InfraUX Authentication Flow

## 📋 Descripción

Este directorio contiene las pruebas End-to-End (E2E) para el flujo de autenticación de InfraUX usando Playwright.

## 🗂️ Estructura

```
e2e/
├── auth/
│   ├── login.spec.ts          # Tests de login
│   ├── register.spec.ts       # Tests de registro (por implementar)
│   └── logout.spec.ts         # Tests de logout (por implementar)
├── fixtures/
│   └── users.fixtures.ts      # Datos de usuarios de prueba
├── helpers/
│   └── auth.helpers.ts        # Funciones auxiliares de autenticación
├── pages/
│   ├── login.page.ts          # Page Object del login
│   ├── dashboard.page.ts      # Page Object del dashboard
│   └── onboarding.page.ts     # Page Object del onboarding
└── README.md                  # Este archivo
```

## 🚀 Ejecución de Tests

### Prerrequisitos

1. **Instalar dependencias**:
   ```bash
   cd infraux
   npm install
   npx playwright install
   ```

2. **Variables de entorno**:
   Crear archivo `.env.test` con:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=your-test-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
   ```

3. **Base de datos de prueba**:
   - Configurar una instancia de Supabase para tests
   - Poblar con usuarios de prueba (ver `fixtures/users.fixtures.ts`)

### Comandos

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar solo tests de login
npx playwright test login.spec.ts

# Ejecutar en modo UI (interactivo)
npx playwright test --ui

# Ejecutar con modo debug
npx playwright test --debug

# Ejecutar en un navegador específico
npx playwright test --project=chromium

# Generar reporte
npx playwright show-report
```

## 📝 Casos de Prueba Implementados

### Login Tests (`login.spec.ts`)

#### ✅ Escenarios Exitosos
- Login de usuario existente → Dashboard
- Login de usuario nuevo → Onboarding
- Login de usuario invitado → Dashboard
- Mensaje de éxito post-registro
- Mensaje de éxito post-confirmación email

#### ❌ Escenarios de Error
- Email no existente
- Contraseña incorrecta
- Formato de email inválido
- Campos vacíos
- Sesión expirada
- Error de autenticación OAuth

#### 🔐 OAuth
- Inicio de sesión con Google
- Inicio de sesión con GitHub
- Manejo de errores OAuth

#### 🎨 UI/UX
- Botón deshabilitado durante carga
- Spinner de carga visible
- Navegación a registro
- Accesibilidad (labels, navegación por teclado)
- Diseño responsive

## 🧪 Datos de Prueba

Los usuarios de prueba están definidos en `fixtures/users.fixtures.ts`:

- **newUser**: Usuario nuevo sin onboarding
- **existingUser**: Usuario con empresa y onboarding completo
- **invitedUser**: Usuario invitado a una empresa
- **adminUser**: Usuario administrador

## 🔧 Page Object Model

Utilizamos el patrón Page Object Model para mantener los tests mantenibles:

```typescript
// Ejemplo de uso
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(email, password);
```

## 📊 Cobertura

Los tests E2E cubren:
- ✅ Flujos críticos de autenticación
- ✅ Manejo de errores
- ✅ OAuth providers
- ✅ Redirecciones según tipo de usuario
- ✅ Mensajes de estado
- ✅ Accesibilidad básica
- ✅ Responsive design

## 🚧 Por Implementar

1. **Tests de Registro** (`register.spec.ts`)
   - Registro exitoso
   - Validaciones de formulario
   - Email duplicado
   - Confirmación de email

2. **Tests de Logout** (`logout.spec.ts`)
   - Logout desde dashboard
   - Limpieza de sesión
   - Redirección a login

3. **Tests de OAuth Completos**
   - Flujo completo con providers reales
   - Manejo de permisos
   - Vinculación de cuentas

4. **Tests de Seguridad**
   - CSRF protection
   - Rate limiting
   - Session timeout

## 🐛 Debugging

Para debuggear tests:

```bash
# Modo debug con UI
npx playwright test --debug

# Ver el navegador durante la ejecución
npx playwright test --headed

# Pausar en un punto específico
await page.pause();

# Screenshots en fallos
npx playwright test --screenshot=only-on-failure

# Videos de ejecución
npx playwright test --video=on
```

## 📚 Referencias

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Nota**: Asegúrate de tener el backend y frontend corriendo antes de ejecutar los tests E2E.