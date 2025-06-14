# Flujo Completo de Usuario - Análisis Detallado

## Ahora entiendo el flujo completo!

Tienes razón - hay un paso adicional para usuarios tipo "company".

### Flujo para Usuario PERSONAL
1. Login → No tiene `usage_type`
2. Onboarding → Selecciona "personal"
3. Completa onboarding → `onboarding_completed: true`
4. **Va directo al dashboard** (no necesita crear compañía)

### Flujo para Usuario COMPANY
1. Login → No tiene `usage_type`
2. Onboarding → Selecciona "company"
3. Completa onboarding → `onboarding_completed: true`
4. **Debe crear su primera compañía** → `/company/create`
5. Después de crear compañía → Dashboard

## Por eso existe `first_company_created`

Ahora entiendo por qué el código original verifica `first_company_created`:
- Para usuarios "personal": No aplica (van directo al dashboard)
- Para usuarios "company": Necesitan crear una compañía antes del dashboard

## Lógica Correcta Debería Ser

```typescript
// Después del login exitoso
if (!data.user.onboarding_completed) {
  // Paso 1: Onboarding
  router.push('/onboarding/select-usage');
} else if (data.user.usage_type === 'company' && !data.user.first_company_created) {
  // Paso 2: Usuarios company necesitan crear su primera compañía
  router.push('/company/create');
} else {
  // Paso 3: Todo completado, ir al dashboard
  router.push('/dashboard');
}
```

## El Problema Actual

La lógica actual es confusa porque:
```typescript
// Línea problemática 134
} else if (!data.user.first_company_created) {
  router.push('/onboarding/select-usage'); // ← INCORRECTO!
}
```

Esto envía a usuarios con `onboarding_completed: true` de vuelta al onboarding, cuando deberían ir a:
- Si son "personal" → Dashboard
- Si son "company" → `/company/create`

## Solución Completa Propuesta

```typescript
// Reemplazar líneas 125-140 con:
if (!data.user.onboarding_completed) {
  console.log('[LOGIN] User needs onboarding');
  router.push('/onboarding/select-usage');
} else if (data.user.usage_type === 'company' && !data.user.first_company_created) {
  console.log('[LOGIN] Company user needs to create first company');
  router.push('/company/create');
} else if (data.user.usage_type === 'personal') {
  console.log('[LOGIN] Personal user ready for dashboard');
  router.push('/dashboard');
} else if (data.user.usage_type === 'company' && data.user.first_company_created) {
  console.log('[LOGIN] Company user ready for dashboard');
  router.push('/dashboard');
} else {
  // Caso edge: estado inconsistente
  console.log('[LOGIN] Inconsistent state, redirecting to onboarding');
  router.push('/onboarding/select-usage');
}
```

## Pero hay un problema...

Si `first_company_created` no existe en la BD (como descubrimos), necesitamos:

### Opción A: Agregar el campo a la BD
```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS first_company_created BOOLEAN DEFAULT false;
```

### Opción B: Verificar si tiene compañías
```typescript
// En lugar de verificar first_company_created, verificar companiesData
const hasCompanies = companiesData?.count > 0;

if (data.user.usage_type === 'company' && !hasCompanies) {
  router.push('/company/create');
}
```

### Opción C: Confiar en el flujo del onboarding
Si el onboarding maneja la creación de compañía para usuarios "company", entonces:
```typescript
if (!data.user.onboarding_completed || !data.user.usage_type) {
  router.push('/onboarding/select-usage');
} else {
  // Si completó onboarding, asumimos que todo está listo
  router.push('/dashboard');
}
```

## Recomendación Final

Necesitamos saber:
1. ¿El campo `first_company_created` existe en la BD?
2. ¿El onboarding incluye la creación de compañía para usuarios "company"?
3. ¿O es un paso separado después del onboarding?

Con esta información podemos implementar la solución correcta.