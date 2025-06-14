#!/bin/bash

echo "🧪 Ejecutando solo los tests de login básicos..."
echo "================================================"

# Ejecutar solo los tests de login-basic.spec.ts con más información de debug
npm run test:e2e -- __tests__/e2e/auth/login-basic.spec.ts --headed --debug

echo ""
echo "✅ Tests completados"
echo ""
echo "💡 Si los tests siguen fallando, intenta:"
echo "   1. Ejecutar el script de reset de usuarios en Supabase"
echo "   2. Verificar que el servidor de desarrollo esté corriendo"
echo "   3. Revisar los selectores en login.page.ts"