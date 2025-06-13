#!/usr/bin/env python3
"""
Script para arreglar los imports relativos en los archivos de test
Convierte imports como '../services/authService' a '@/app/services/authService'
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """Arregla los imports relativos en un archivo de test"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Patrones para encontrar imports relativos
    patterns = [
        # import { something } from "../path"
        (r'from\s+"\.\./(services|components|hooks|stores|lib)/([^"]+)"', r'from "@/app/\1/\2"'),
        # import something from "../path"
        (r'from\s+"\.\./(services|components|hooks|stores|lib)/([^"]+)"', r'from "@/app/\1/\2"'),
        # await import("../path")
        (r'import\("\.\./(services|components|hooks|stores|lib)/([^"]+)"\)', r'import("@/app/\1/\2")'),
        # from '../path'
        (r"from\s+'\.\./(services|components|hooks|stores|lib)/([^']+)'", r"from '@/app/\1/\2'"),
        # import('../path')
        (r"import\('\.\./(services|components|hooks|stores|lib)/([^']+)'\)", r"import('@/app/\1/\2')"),
    ]
    
    for pattern, replacement in patterns:
        content = re.sub(pattern, replacement, content)
    
    # Casos especiales para helpers en e2e tests
    content = re.sub(r'from\s+"\.\./(helpers)/([^"]+)"', r'from "@/__tests__/e2e/\1/\2"', content)
    content = re.sub(r"from\s+'\.\./(helpers)/([^']+)'", r"from '@/__tests__/e2e/\1/\2'", content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed imports in: {file_path}")
        return True
    return False

def main():
    """Busca y arregla todos los archivos de test"""
    test_dir = Path("__tests__")
    
    if not test_dir.exists():
        print("❌ No se encontró el directorio __tests__")
        return
    
    fixed_count = 0
    total_count = 0
    
    # Buscar todos los archivos de test
    for test_file in test_dir.rglob("*.test.ts*"):
        total_count += 1
        if fix_imports_in_file(test_file):
            fixed_count += 1
    
    # También buscar archivos .spec.ts
    for test_file in test_dir.rglob("*.spec.ts*"):
        total_count += 1
        if fix_imports_in_file(test_file):
            fixed_count += 1
    
    # Arreglar archivos de integración
    for test_file in test_dir.rglob("*.integration.test.ts*"):
        total_count += 1
        if fix_imports_in_file(test_file):
            fixed_count += 1
    
    print(f"\n📊 Resumen:")
    print(f"   Total de archivos procesados: {total_count}")
    print(f"   Archivos arreglados: {fixed_count}")
    print(f"   Archivos sin cambios: {total_count - fixed_count}")

if __name__ == "__main__":
    main()