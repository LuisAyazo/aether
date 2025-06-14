# Propuesta de Lógica Mejorada para Login

## El Problema con la Simplificación

Tienes razón, la lógica que propuse era demasiado simple:
```typescript
// Muy simple - no verifica onboarding_completed
if (!data.user.usage_type) {
  router.push('/onboarding/select-usage');
} else {
  router.push('/dashboard');
}
```

## Lógica Mejorada Propuesta

### Opción 1: Usar ambos campos correctamente
```typescript
// Verificar tanto usage_type como onboarding_completed
if (!data.user.usage_type || !data.user.onboarding_completed) {
  // Usuario necesita completar onboarding
  router.push('/onboarding/select-usage');
} else {
  // Usuario completó todo, ir al dashboard
  router.push('/dashboard');
}
```

### Opción 2: Lógica más explícita y clara
```typescript
// Casos explícitos para mayor claridad
const needsOnboarding = !data.user.usage_type || !data.user.onboarding_completed;
const isInvitedUser = companiesData?.count > 0 && !data.user.usage_type;

if (isInvitedUser) {
  // Usuario invitado - skip onboarding
  console.log('[LOGIN] Invited user, going to dashboard');
  router.push('/dashboard');
} else if (needsOnboarding) {
  // Usuario necesita onboarding
  console.log('[LOGIN] User needs onboarding');
  router.push('/onboarding/select-usage');
} else {
  // Usuario completó todo
  console.log('[LOGIN] User completed, going to dashboard');
  router.push('/dashboard');
}
```

### Opción 3: Eliminar dependencia de first_company_created
```typescript
// Reemplazar líneas 125-140 con:
if (!data.user.onboarding_completed) {
  console.log('[LOGIN PAGE] User needs onboarding');
  router.push('/onboarding/select-usage');
} else if (!data.user.usage_type) {
  // Caso edge: onboarding_completed pero sin usage_type
  console.log('[LOGIN PAGE] Incomplete profile, redirecting to onboarding');
  router.push('/onboarding/select-usage');
} else {
  // Usuario completó todo correctamente
  console.log('[LOGIN PAGE] User ready for dashboard');
  router.push('/dashboard');
}
```

## Análisis de Cada Opción

### Opción 1 - Pros:
- Simple y directa
- Fácil de entender
- No depende de `first_company_created`

### Opción 2 - Pros:
- Maneja casos especiales (usuarios invitados)
- Muy explícita con logs
- Fácil de debuggear

### Opción 3 - Pros:
- Mínimos cambios al código actual
- Elimina la dependencia problemática
- Mantiene la estructura existente

## Recomendación Final

**Recomiendo la Opción 3** porque:
1. Requiere cambios mínimos
2. Elimina el campo problemático `first_company_created`
3. Garantiza que se verifique `onboarding_completed`
4. Es clara y fácil de entender

## Campos Necesarios en la BD

Para que cualquier opción funcione correctamente, necesitamos garantizar:
1. `usage_type`: 'personal' | 'company' | null
2. `onboarding_completed`: boolean

Estos campos ya existen y funcionan correctamente según nuestros tests.

## Resultado Esperado

Con esta lógica mejorada:
- `new-user@infraux.com` (onboarding_completed: false) → `/onboarding/select-usage` ✅
- `personal-user@infraux.com` (onboarding_completed: true, usage_type: 'personal') → `/dashboard` ✅
- `company-user@infraux.com` (onboarding_completed: true, usage_type: 'company') → `/dashboard` ✅

Los tests deberían pasar correctamente sin necesidad de agregar campos adicionales a la BD.