# Plan de Acción para Corregir Tests E2E

## Estado Actual
- **19 tests fallando** principalmente en flujos de autenticación
- **45 tests pasando** (68% de éxito)
- **Problema principal**: Los tests esperan comportamientos que no coinciden con la implementación actual

## Problemas Identificados

### 1. Validación de Formularios
Los tests esperan que aparezcan mensajes de error al hacer click en submit con campos vacíos, pero parece que:
- El formulario tiene `required` en los campos HTML
- La validación del navegador previene el submit
- Los mensajes de error personalizados nunca se muestran

### 2. Lógica de Redirección Compleja
El código de login tiene lógica muy compleja:
```typescript
// Líneas 125-140 en login/page.tsx
if (!data.user.onboarding_completed) {
  if (data.user.first_company_created) {
    router.push('/dashboard');
  } else {
    router.push('/onboarding/select-usage');
  }
} else if (!data.user.first_company_created) {
  router.push('/onboarding/select-usage');
} else {
  router.push('/dashboard');
}
```

Esta lógica es confusa y puede causar redirecciones inesperadas.

### 3. Estado de Usuarios de Prueba
Aunque reseteamos `new-user@infraux.com`, otros usuarios pueden tener estados incorrectos:
- `personal-user@infraux.com`
- `company-user@infraux.com`
- `existing-user@infraux.com`

## Soluciones Propuestas

### 1. Corregir Tests de Validación
Modificar los tests para manejar la validación HTML5:

```typescript
// En lugar de esperar mensajes de error personalizados
test('should show validation error for empty email', async ({ page }) => {
  await loginPage.clickSubmit();
  
  // Verificar que el formulario no se envió
  const emailInput = await loginPage.emailInput;
  const validationMessage = await emailInput.evaluate(el => el.validationMessage);
  expect(validationMessage).toBeTruthy();
});
```

### 2. Simplificar Lógica de Login
La lógica debería ser más simple:
```typescript
if (!data.user.usage_type) {
  // Usuario nuevo - necesita onboarding
  router.push('/onboarding/select-usage');
} else {
  // Usuario existente - al dashboard
  router.push('/dashboard');
}
```

### 3. Script de Reset Completo
Ya creamos `reset_all_test_users.sql` que resetea TODOS los usuarios de prueba.

## Pasos Inmediatos

### Paso 1: Ejecutar Reset Completo
```sql
-- Ejecutar en Supabase SQL Editor
-- backend/scripts/reset_all_test_users.sql
```

### Paso 2: Actualizar Tests de Validación
Modificar `login-basic.spec.ts` para manejar validación HTML5 correctamente.

### Paso 3: Ejecutar Tests Individualmente
```bash
# Test específico con debug
npm run test:e2e -- login-basic.spec.ts --debug --headed

# Solo tests de validación
npm run test:e2e -- login-basic.spec.ts -g "validation"
```

### Paso 4: Revisar Selectores
Verificar que los selectores en `login.page.ts` coincidan con el DOM actual:
- `#email` → ¿Existe este ID?
- `#password` → ¿Existe este ID?
- Los selectores de mensajes de error

## Recomendaciones a Largo Plazo

### 1. Separar Tests por Categoría
- `validation.spec.ts` - Solo validación de formularios
- `auth-flow.spec.ts` - Flujos completos de autenticación
- `oauth.spec.ts` - Tests de OAuth específicos

### 2. Usar Fixtures Consistentes
```typescript
// fixtures/test-users.ts
export const TEST_USERS = {
  NEW_USER: {
    email: 'test-new@infraux.com',
    password: 'TestNew123!',
    expectedState: { usage_type: null, onboarding_completed: false }
  },
  PERSONAL_USER: {
    email: 'test-personal@infraux.com',
    password: 'TestPersonal123!',
    expectedState: { usage_type: 'personal', onboarding_completed: true }
  }
};
```

### 3. Agregar Hooks de Setup/Teardown
```typescript
test.beforeEach(async ({ request }) => {
  // Reset user state via API
  await request.post('/api/test/reset-user', {
    data: { email: 'new-user@infraux.com' }
  });
});
```

## Conclusión

Los tests están fallando principalmente por:
1. **Expectativas incorrectas** sobre cómo funciona la validación
2. **Estados de usuarios inconsistentes** en la base de datos
3. **Lógica de redirección compleja** que confunde los tests

La solución requiere:
1. ✅ Reset completo de usuarios (script creado)
2. 🔄 Actualizar tests para manejar validación HTML5
3. 🔄 Simplificar lógica de login
4. 🔄 Mejorar organización de tests