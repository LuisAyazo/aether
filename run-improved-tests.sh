#!/bin/bash

echo "🧪 Ejecutando tests mejorados de login..."
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📋 Antes de ejecutar los tests:${NC}"
echo "1. Asegúrate de haber ejecutado el script de reset en Supabase:"
echo "   backend/scripts/reset_all_test_users.sql"
echo ""
echo "2. Verifica que el servidor de desarrollo esté corriendo:"
echo "   npm run dev"
echo ""
echo "Presiona Enter para continuar..."
read

echo -e "${GREEN}▶️  Ejecutando tests mejorados...${NC}"
echo ""

# Ejecutar solo los tests mejorados
cd infraux
npm run test:e2e -- __tests__/e2e/auth/login-improved.spec.ts --headed

echo ""
echo -e "${GREEN}✅ Tests completados${NC}"
echo ""
echo -e "${YELLOW}💡 Comparación con tests originales:${NC}"
echo "- Los tests mejorados manejan mejor la validación HTML5"
echo "- Incluyen timeouts apropiados para esperar respuestas del servidor"
echo "- Son más tolerantes a cambios en los mensajes de error"
echo ""
echo "Si estos tests pasan pero los originales fallan, considera:"
echo "1. Actualizar los tests originales con las mejoras"
echo "2. O reemplazarlos con esta versión mejorada"