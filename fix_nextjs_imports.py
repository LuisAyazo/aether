#!/usr/bin/env python3
"""
Script para corregir los imports incorrectos en archivos Next.js
Cambia @/app/* a @/* ya que el alias @ ya apunta a la carpeta app/
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
        
        # Patrones para corregir
        patterns = [
            # import { something } from "@/app/..."
            (r'from\s+["\']@/app/([^"\']+)["\']', r'from "@/\1"'),
            # import something from "@/app/..."
            (r'import\s+.*?\s+from\s+["\']@/app/([^"\']+)["\']', lambda m: m.group(0).replace('@/app/', '@/')),
            # require("@/app/...")
            (r'require\(["\']@/app/([^"\']+)["\']\)', r'require("@/\1")'),
            # También corregir imports de @/components que deberían ser @/app/components
            (r'from\s+["\']@/components/([^"\']+)["\']', r'from "@/app/components/\1"'),
            # import something from "@/components/..."
            (r'import\s+.*?\s+from\s+["\']@/components/([^"\']+)["\']', lambda m: m.group(0).replace('@/components/', '@/app/components/')),
            # Corregir imports de @/lib que deberían ser @/app/lib
            (r'from\s+["\']@/lib/([^"\']+)["\']', r'from "@/app/lib/\1"'),
            # Corregir imports de @/stores que deberían ser @/app/stores
            (r'from\s+["\']@/stores/([^"\']+)["\']', r'from "@/app/stores/\1"'),
            # Corregir imports de @/services que deberían ser @/app/services
            (r'from\s+["\']@/services/([^"\']+)["\']', r'from "@/app/services/\1"'),
            # Corregir imports de @/hooks que deberían ser @/app/hooks
            (r'from\s+["\']@/hooks/([^"\']+)["\']', r'from "@/app/hooks/\1"'),
            # Corregir imports de @/utils que deberían ser @/app/utils
            (r'from\s+["\']@/utils/([^"\']+)["\']', r'from "@/app/utils/\1"'),
        ]
        
        for pattern, replacement in patterns:
            if callable(replacement):
                content = re.sub(pattern, replacement, content)
            else:
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
    
    # Archivos a procesar
    files_to_process = []
    
    # Buscar archivos en el directorio app
    for ext in extensions:
        files_to_process.extend(base_dir.glob(f'app/**/*{ext}'))
    
    # También buscar en el directorio de páginas si existe
    if (base_dir / 'pages').exists():
        for ext in extensions:
            files_to_process.extend(base_dir.glob(f'pages/**/*{ext}'))
    
    # Procesar archivos
    fixed_count = 0
    for file_path in files_to_process:
        if fix_imports_in_file(file_path):
            print(f"✓ Corregido: {file_path}")
            fixed_count += 1
    
    print(f"\n✅ Total de archivos corregidos: {fixed_count}")

if __name__ == "__main__":
    main()