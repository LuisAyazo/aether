#!/usr/bin/env python3
"""
Script para agregar /app a los imports en archivos de test
Cambia @/components, @/services, @/hooks, etc. a @/app/components, @/app/services, @/app/hooks
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """Corrige los imports en un archivo específico"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Patrones para agregar /app donde falta
        patterns_to_fix = [
            # @/components -> @/app/components
            (r'from\s+["\']@/components/', r'from "@/app/components/'),
            (r'import\s+["\']@/components/', r'import "@/app/components/'),
            
            # @/services -> @/app/services
            (r'from\s+["\']@/services/', r'from "@/app/services/'),
            (r'import\s+["\']@/services/', r'import "@/app/services/'),
            
            # @/hooks -> @/app/hooks
            (r'from\s+["\']@/hooks/', r'from "@/app/hooks/'),
            (r'import\s+["\']@/hooks/', r'import "@/app/hooks/'),
            
            # @/stores -> @/app/stores
            (r'from\s+["\']@/stores/', r'from "@/app/stores/'),
            (r'import\s+["\']@/stores/', r'import "@/app/stores/'),
            
            # @/lib -> @/app/lib
            (r'from\s+["\']@/lib/', r'from "@/app/lib/'),
            (r'import\s+["\']@/lib/', r'import "@/app/lib/'),
            
            # @/utils -> @/app/utils
            (r'from\s+["\']@/utils/', r'from "@/app/utils/'),
            (r'import\s+["\']@/utils/', r'import "@/app/utils/'),
            
            # @/config -> @/app/config
            (r'from\s+["\']@/config/', r'from "@/app/config/'),
            (r'import\s+["\']@/config/', r'import "@/app/config/'),
        ]
        
        for pattern, replacement in patterns_to_fix:
            content = re.sub(pattern, replacement, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error procesando {file_path}: {e}")
        return False

def main():
    # Directorio base del proyecto
    base_dir = Path('.')
    
    # Extensiones de archivo a procesar
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    
    # Archivos a procesar - solo en __tests__
    files_to_process = []
    
    # Buscar archivos en el directorio __tests__
    for ext in extensions:
        files_to_process.extend(base_dir.glob(f'__tests__/**/*{ext}'))
    
    # Procesar archivos
    fixed_count = 0
    for file_path in files_to_process:
        if fix_imports_in_file(file_path):
            print(f"✓ Corregido: {file_path}")
            fixed_count += 1
    
    print(f"\n✅ Total de archivos corregidos: {fixed_count}")

if __name__ == "__main__":
    main()