# Problemas con Endpoints del Backend

## 1. Error 400: `/api/v1/companies/create-personal-space`

### Problema
Cuando un usuario selecciona "Uso Personal" en el onboarding, el frontend intenta crear automáticamente un espacio personal llamando a este endpoint, pero recibe un error 400 (Bad Request).

### Solución Temporal
Se comentó el código que hace esta llamada en `app/(app)/onboarding/select-usage/page.tsx` (líneas 199-225) para permitir que los usuarios continúen al dashboard sin bloqueos.

### Acción Requerida
- Verificar en el backend por qué este endpoint está fallando
- Posibles causas:
  - El endpoint no existe
  - Requiere parámetros adicionales
  - Validaciones del lado del servidor están fallando

## 2. Error 404: `/api/v1/dashboard/initial-load`

### Problema
El dashboard intenta cargar datos iniciales desde este endpoint pero recibe un error 404 (Not Found).

### Ubicación del Error
- `services/dashboardService.ts` - línea 56
- Se llama desde `stores/useNavigationStore.ts` cuando se inicializa la aplicación

### Impacto
- El dashboard no puede cargar los datos iniciales
- Los usuarios ven errores en la consola
- La experiencia de usuario se ve afectada

### Acción Requerida
- Implementar este endpoint en el backend
- Debe devolver los datos necesarios para inicializar el dashboard:
  - Información del usuario
  - Compañías/workspaces disponibles
  - Datos de navegación
  - Configuraciones iniciales

## 3. Flujo de Usuarios Personales

### Estado Actual
Los usuarios que seleccionan "Uso Personal" deberían:
1. Completar el onboarding
2. Tener un espacio personal creado automáticamente
3. Ser redirigidos al dashboard

### Problema
Sin el endpoint `create-personal-space`, los usuarios personales:
- Completan el onboarding
- NO tienen un espacio personal creado
- Son redirigidos al dashboard pero sin datos

### Solución Temporal
Los usuarios pueden continuar, pero necesitarán crear manualmente su espacio/compañía más tarde.

## Resumen de Cambios Realizados

1. **Comentado código de creación de espacio personal** en `onboarding/select-usage/page.tsx`
2. **Documentados los errores** para el equipo de backend

## Próximos Pasos

1. El equipo de backend debe:
   - Implementar o corregir `/api/v1/companies/create-personal-space`
   - Implementar `/api/v1/dashboard/initial-load`
   
2. Una vez corregidos los endpoints:
   - Descomentar el código en `onboarding/select-usage/page.tsx`
   - Verificar que el flujo completo funcione correctamente

## Notas Adicionales

- Los usuarios tipo "company" no se ven afectados por el primer error
- Ambos tipos de usuarios (personal y company) se ven afectados por el error del dashboard
- La autenticación y el guardado de preferencias funcionan correctamente