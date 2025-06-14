# Análisis del Problema: first_company_created

## El Flujo Problemático

### 1. En el Frontend (login/page.tsx)
```typescript
// Líneas 125-140
if (!data.user.onboarding_completed) {
  if (data.user.first_company_created) {
    router.push('/dashboard');
  } else {
    router.push('/onboarding/select-usage');
  }
} else if (!data.user.first_company_created) {  // ← AQUÍ ESTÁ EL PROBLEMA
  router.push('/onboarding/select-usage');
} else {
  router.push('/dashboard');
}
```

### 2. De Dónde Viene el Campo
En `authService.ts`:
```typescript
// Línea 47
first_company_created: profile?.first_company_created || false
```

El campo viene del backend endpoint `/api/v1/auth/me`, pero si no existe, se asigna `false`.

### 3. El Problema Real
La lógica dice:
- Si `onboarding_completed = true` PERO `first_company_created = false`
- → Redirigir a `/onboarding/select-usage`

Esto significa que TODOS los usuarios con `onboarding_completed = true` pero sin el campo `first_company_created` en la BD van al onboarding.

## Por Qué Fallan los Tests

1. **personal-user@infraux.com**:
   - `onboarding_completed`: true ✅
   - `first_company_created`: false (no existe en BD) ❌
   - Resultado: Va a onboarding en vez de dashboard

2. **company-user@infraux.com**:
   - `onboarding_completed`: true ✅
   - `first_company_created`: false (no existe en BD) ❌
   - Resultado: Va a onboarding en vez de dashboard

## Soluciones Posibles

### Opción 1: Agregar el Campo en la BD (Recomendado)
```sql
-- Agregar columna si no existe
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_company_created BOOLEAN DEFAULT false;

-- Actualizar usuarios existentes
UPDATE user_profiles 
SET first_company_created = true
WHERE onboarding_completed = true;
```

### Opción 2: Simplificar la Lógica del Frontend
```typescript
// Cambiar la lógica compleja por:
if (!data.user.usage_type) {
  // Usuario nuevo sin tipo de uso
  router.push('/onboarding/select-usage');
} else {
  // Usuario con tipo de uso definido
  router.push('/dashboard');
}
```

### Opción 3: Parche Temporal en authService
```typescript
// En convertSupabaseUser, línea 47
first_company_created: profile?.first_company_created ?? 
  (profile?.onboarding_completed === true) // Si completó onboarding, asumimos que creó compañía
```

## Recomendación

La mejor solución es **simplificar la lógica del frontend** (Opción 2) porque:
1. Es más simple y menos propensa a errores
2. No requiere cambios en la BD
3. El campo `usage_type` ya indica si el usuario completó el onboarding

La lógica actual es innecesariamente compleja y causa confusión.