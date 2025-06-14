# Error 404 en Dashboard Initial Load

## Problema Identificado

Después de completar el onboarding exitosamente, el frontend intenta cargar los datos del dashboard pero recibe un error 404:

```
GET /api/v1/dashboard/initial-load HTTP/1.1" 404 Not Found
```

## Flujo Observado

1. ✅ Usuario completa onboarding
2. ✅ Se crea espacio personal: `company_id=95e1761e-bbe6-4a71-bd8f-3a1412e3faae`
3. ✅ Se actualiza el perfil del usuario
4. ✅ Se guarda información extra del onboarding
5. ❌ Falla al cargar dashboard: `404 Not Found`

## Análisis

### Frontend (navigationStore)
El frontend está intentando llamar a `/api/v1/dashboard/initial-load` pero este endpoint no existe en el backend.

### Posibles Causas

1. **Endpoint no implementado**: El endpoint `/api/v1/dashboard/initial-load` no existe en el backend
2. **Ruta incorrecta**: Tal vez el endpoint correcto tiene otro nombre
3. **Versión de API**: Puede ser un problema de versiones entre frontend y backend

## Solución Temporal

Mientras se corrige el backend, puedes:

1. **Verificar el backend** para ver si existe el endpoint:
   ```bash
   grep -r "initial-load" backend/
   ```

2. **Revisar las rutas del API**:
   ```bash
   grep -r "dashboard" backend/app/routers/
   ```

3. **Verificar si hay otro endpoint similar**:
   - `/api/v1/dashboard/data`
   - `/api/v1/dashboard/init`
   - `/api/v1/companies/dashboard`

## Impacto en Tests E2E

Este error NO afecta los tests E2E de autenticación porque:
- Los tests verifican redirecciones, no la carga completa del dashboard
- El error ocurre después de la redirección exitosa

## Recomendación

Este es un problema del **backend**, no del frontend. El frontend está funcionando correctamente:
1. ✅ Login funciona
2. ✅ Onboarding funciona
3. ✅ Redirecciones funcionan
4. ❌ Solo falla la carga de datos del dashboard (backend issue)

Para resolver completamente:
1. Implementar el endpoint `/api/v1/dashboard/initial-load` en el backend
2. O actualizar el frontend para usar el endpoint correcto si existe con otro nombre