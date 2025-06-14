# Análisis de Problemas de Autenticación y Onboarding

## 🔍 Análisis del Código

### Frontend - Login Page (`infraux/app/(auth)/login/page.tsx`)

#### Lógica de Redirección (líneas 78-141)
```javascript
// La lógica verifica en este orden:
1. Si el usuario tiene compañías (invited user)
2. Si onboarding_completed = false → redirige a /onboarding/select-usage
3. Si first_company_created = false → redirige a /onboarding/select-usage
4. Si todo está bien → redirige a /dashboard
```

**Problema Identificado**: La lógica usa dos campos diferentes:
- `onboarding_completed`
- `first_company_created`

Esto puede causar confusión y estados inconsistentes.

### Backend - Auth Routes (`backend/app/routes/auth.py`)

#### Endpoint `/me/usage-settings` (líneas 226-261)
```python
update_data = UserProfileUpdate(
    usage_type=usage_data.usage_type,
    onboarding_completed=True  # Siempre marca como completado
)
```

**Observación**: El endpoint marca `onboarding_completed=True` cuando se actualiza el `usage_type`.

### Base de Datos - Estado del Usuario

El script SQL revela que necesitamos verificar:
1. Si el usuario `new-user@infraux.com` existe en `auth.users`
2. Si tiene un perfil en `user_profiles`
3. El valor de `usage_type` (NULL significa que necesita onboarding)
4. El valor de `onboarding_completed`

## 🐛 Problemas Principales Identificados

### 1. **Pérdida de Sesión Post-Onboarding**
**Síntoma**: Después de completar el onboarding, el usuario es redirigido a `/login`

**Posibles Causas**:
- La sesión de Supabase se pierde al actualizar el perfil
- El token no se está refrescando correctamente
- El frontend no está actualizando el usuario en localStorage

### 2. **Usuario No Redirigido al Onboarding**
**Síntoma**: `new-user@infraux.com` se queda en `/login` después de autenticarse

**Posibles Causas**:
- El usuario ya tiene `usage_type` configurado en la BD
- El campo `onboarding_completed` está en `true`
- Error al obtener el perfil del usuario desde el backend

### 3. **Inconsistencia de Campos**
El sistema usa múltiples campos para determinar el estado:
- `usage_type`: "personal" | "company" | NULL
- `onboarding_completed`: boolean
- `first_company_created`: boolean (no existe en el tipo User actual)

## 🛠️ Soluciones Propuestas

### 1. **Verificar Estado en Base de Datos**
Ejecutar el script SQL para verificar el estado actual:
```sql
-- En Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'new-user@infraux.com';
SELECT * FROM user_profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'new-user@infraux.com');
```

### 2. **Simplificar Lógica de Redirección**
Usar solo `usage_type` para determinar si necesita onboarding:
```javascript
// En login/page.tsx
if (!data.user.usage_type) {
  // Usuario nuevo, necesita onboarding
  router.push('/onboarding/select-usage');
} else {
  // Usuario con onboarding completado
  router.push('/dashboard');
}
```

### 3. **Mantener Sesión en Onboarding**
En `select-usage/page.tsx`, después de actualizar el `usage_type`:
```javascript
// Refrescar el token
const { data: { session } } = await supabase.auth.refreshSession();
if (session) {
  // Actualizar localStorage con el nuevo usuario
  const updatedUser = await fetchAndUpdateCurrentUser();
  // Continuar con la redirección
}
```

### 4. **Agregar Logging Detallado**
Para debugging, agregar más logs en puntos críticos:
```javascript
console.log('[AUTH] User state:', {
  id: user.id,
  email: user.email,
  usage_type: user.usage_type,
  onboarding_completed: user.onboarding_completed,
  hasSession: !!session
});
```

## 📋 Plan de Acción

1. **Inmediato**:
   - Verificar estado del usuario en Supabase
   - Agregar logs en el flujo de autenticación
   - Simplificar la lógica de redirección

2. **Corto Plazo**:
   - Implementar refresh de sesión después de actualizar perfil
   - Unificar el uso de campos (solo `usage_type`)
   - Agregar tests específicos para estos escenarios

3. **Largo Plazo**:
   - Migrar a un estado de onboarding más robusto
   - Implementar retry logic para llamadas a la API
   - Mejorar manejo de errores y feedback al usuario

## 🎯 Conclusión

Los problemas principales son:
1. **Inconsistencia en el manejo de estado del usuario**
2. **Pérdida de sesión durante el flujo de onboarding**
3. **Lógica compleja de redirección con múltiples campos**

La solución requiere:
- Simplificar la lógica usando solo `usage_type`
- Mantener la sesión activa durante todo el flujo
- Verificar y limpiar el estado en la base de datos