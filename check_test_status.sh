#!/bin/bash

# Script para verificar el estado de los tests rápidamente

echo "🧪 Verificando estado de tests en InfraUX..."
echo "============================================"

# Backend tests
echo -e "\n📦 Backend Tests (Python/FastAPI):"
cd ../backend
if command -v pytest &> /dev/null; then
    pytest --tb=short -q 2>/dev/null | tail -n 5
else
    echo "pytest no está instalado"
fi

# Frontend tests
echo -e "\n📦 Frontend Tests (TypeScript/React):"
cd ../infraux
if [ -f "node_modules/.bin/vitest" ]; then
    # Ejecutar tests sin UI y mostrar solo resumen
    npm run test -- --run --reporter=verbose 2>/dev/null | grep -E "(✓|×|PASS|FAIL|Test Files|Tests)" | tail -n 10
else
    echo "Vitest no está instalado"
fi

echo -e "\n============================================"
echo "Para más detalles:"
echo "  Backend:  cd backend && pytest -v"
echo "  Frontend: cd infraux && npm run test:ui"