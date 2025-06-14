# Implementación: Fix de Lógica de Login

## Código Actual (Problemático)

En `infraux/app/(auth)/login/page.tsx` líneas 125-140:

```typescript
// Now redirect based on updated user state
if (!data.user.onboarding_completed) {
  // If user has companies, they can skip onboarding
  if (data.user.first_company_created) {
    console.log('[LOGIN PAGE] Invited user, skipping onboarding, redirecting to dashboard');
    router.push('/dashboard');
  } else {
    console.log('[LOGIN PAGE] New user needs onboarding, redirecting...');
    router.push('/onboarding/select-usage');
  }
} else if (!data.user.first_company_created) {
  console.log('[LOGIN PAGE] User needs to create first company, redirecting to onboarding...');
  router.push('/onboarding/select-usage'); // ← INCORRECTO!
} else {
  console.log('[LOGIN PAGE] User ready for dashboard, redirecting...');
  router.push('/dashboard');
}
```

## Código Corregido (Propuesto)

Reemplazar líneas 125-140 con:

```typescript
// Now redirect based on updated user state
if (!data.user.onboarding_completed) {
  // Paso 1: Onboarding
  console.log('[LOGIN PAGE] User needs onboarding, redirecting...');
  router.push('/onboarding/select-usage');
} else if (data.user.usage_type === 'company' && !data.user.first_company_created) {
  // Paso 2: Usuarios company necesitan crear su primera compañía
  console.log('[LOGIN PAGE] Company user needs to create first company, redirecting...');
  router.push('/company/create');
} else {
  // Paso 3: Todo completado, ir al dashboard
  console.log('[LOGIN PAGE] User ready for dashboard, redirecting...');
  router.push('/dashboard');
}
```

## Cambios Clave

1. **Eliminada la lógica confusa** del primer if anidado
2. **Corregida la redirección** para usuarios company sin compañía:
   - Antes: `/onboarding/select-usage` (incorrecto)
   - Ahora: `/company/create` (correcto)
3. **Verificación explícita** del `usage_type === 'company'`

## Flujos Resultantes

### Usuario Nuevo (new-user@infraux.com)
- `onboarding_completed`: false
- Resultado: → `/onboarding/select-usage` ✅

### Usuario Personal (personal-user@infraux.com)
- `onboarding_completed`: true
- `usage_type`: 'personal'
- Resultado: → `/dashboard` ✅

### Usuario Company sin compañía
- `onboarding_completed`: true
- `usage_type`: 'company'
- `first_company_created`: false
- Resultado: → `/company/create` ✅

### Usuario Company con compañía (company-user@infraux.com)
- `onboarding_completed`: true
- `usage_type`: 'company'
- `first_company_created`: true
- Resultado: → `/dashboard` ✅

## Consideración Importante

Si el campo `first_company_created` no existe en la BD, podemos usar la verificación de `companiesData` que ya se hace en las líneas 94-98:

```typescript
// Alternativa si first_company_created no existe
const hasCompanies = companiesData?.count > 0;

if (!data.user.onboarding_completed) {
  router.push('/onboarding/select-usage');
} else if (data.user.usage_type === 'company' && !hasCompanies) {
  router.push('/company/create');
} else {
  router.push('/dashboard');
}
```

## Pasos para Implementar

1. **Cambiar al modo Code** para editar el archivo
2. **Localizar** `infraux/app/(auth)/login/page.tsx`
3. **Reemplazar** líneas 125-140 con el código corregido
4. **Ejecutar** los tests E2E nuevamente

## Resultado Esperado

Con este cambio:
- Los tests de usuarios existentes pasarán
- El flujo será lógico y correcto
- Los tests E2E deberían alcanzar >90% de éxito