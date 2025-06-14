# Solución: Reset de Usuario para Tests E2E

## Problema Identificado
El usuario `new-user@infraux.com` ya había completado el onboarding, causando que los tests E2E fallaran porque esperaban que fuera un usuario nuevo.

### Estado del Usuario Antes del Reset:
```json
{
  "email": "new-user@infraux.com",
  "usage_type": "personal",
  "onboarding_completed": true,
  "how_heard": "social_media",
  "iac_knowledge": "intermediate",
  "interests": ["terraform", "kubernetes"]
}
```

## Solución Aplicada

### 1. Script de Reset Creado
Archivo: `backend/scripts/reset_new_user_for_testing.sql`

```sql
-- Reset usuario a estado inicial
UPDATE user_profiles
SET 
    usage_type = NULL,
    onboarding_completed = false,
    how_heard = NULL,
    iac_knowledge = NULL,
    interests = NULL,
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'new-user@infraux.com'
);

-- Eliminar compañías personales asociadas
DELETE FROM companies
WHERE created_by = (
    SELECT id FROM auth.users 
    WHERE email = 'new-user@infraux.com'
) AND is_personal = true;
```

### 2. Ejecución del Script
- El script fue ejecutado en Supabase SQL Editor
- Resetea el usuario a su estado inicial sin onboarding

## Resultados Esperados

### Tests que Deberían Pasar Ahora:

1. **Login → Onboarding Flow**
   - `new-user@infraux.com` debe ser redirigido al onboarding
   - Debe pasar por los 4 pasos del onboarding
   - Debe terminar en dashboard (personal) o create-company (company)

2. **Tests de Tipo de Uso**
   - `usage-type-flows.spec.ts`
   - `usage-type-simple.spec.ts`
   - `usage-type-complete-flow.spec.ts`

3. **Tests de Flujo Completo**
   - `complete-auth-flow.spec.ts`
   - `full-auth-flow.spec.ts`

## Recomendaciones para el Futuro

### 1. Automatizar Reset de Usuarios
```typescript
// Agregar en beforeEach de los tests
async function resetTestUser(email: string) {
  await supabase.rpc('reset_user_for_testing', { email });
}
```

### 2. Usar Usuarios Específicos para Tests
- `test-new-user@infraux.com` - Siempre nuevo
- `test-personal-user@infraux.com` - Siempre personal
- `test-company-user@infraux.com` - Siempre company

### 3. Agregar Verificación de Estado
```typescript
// Verificar estado antes de cada test
const { data: profile } = await supabase
  .from('user_profiles')
  .select('usage_type, onboarding_completed')
  .eq('id', userId)
  .single();

expect(profile.usage_type).toBeNull();
expect(profile.onboarding_completed).toBe(false);
```

## Estado Actual
- ✅ Script de reset creado y ejecutado
- ⏳ Tests E2E ejecutándose con usuario reseteado
- 📊 Total de tests E2E: 61 tests

## Próximos Pasos
1. Verificar que todos los tests pasen
2. Implementar reset automático antes de cada suite de tests
3. Documentar el proceso en el README de tests E2E