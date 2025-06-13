#!/usr/bin/env python3
"""
Script para arreglar los imports en los archivos fuente de la aplicación
Convierte imports como '@/lib/api' a '@/app/lib/api'
"""

import os
import re
from pathlib import Path

def fix_imports_in_file(file_path):
    """Arregla los imports en un archivo fuente"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Patrones para arreglar imports incorrectos
    replacements = [
        # @/lib/* -> @/app/lib/*
        (r'from\s+"@/lib/([^"]+)"', r'from "@/app/lib/\1"'),
        (r"from\s+'@/lib/([^']+)'", r"from '@/app/lib/\1'"),
        (r'import\("@/lib/([^"]+)"\)', r'import("@/app/lib/\1")'),
        (r"import\('@/lib/([^']+)'\)", r"import('@/app/lib/\1')"),
        
        # @/services/* -> @/app/services/*
        (r'from\s+"@/services/([^"]+)"', r'from "@/app/services/\1"'),
        (r"from\s+'@/services/([^']+)'", r"from '@/app/services/\1'"),
        (r'import\("@/services/([^"]+)"\)', r'import("@/app/services/\1")'),
        (r"import\('@/services/([^']+)'\)", r"import('@/app/services/\1')"),
        
        # @/hooks/* -> @/app/hooks/*
        (r'from\s+"@/hooks/([^"]+)"', r'from "@/app/hooks/\1"'),
        (r"from\s+'@/hooks/([^']+)'", r"from '@/app/hooks/\1'"),
        (r'import\("@/hooks/([^"]+)"\)', r'import("@/app/hooks/\1")'),
        (r"import\('@/hooks/([^']+)'\)", r"import('@/app/hooks/\1')"),
        
        # @/stores/* -> @/app/stores/*
        (r'from\s+"@/stores/([^"]+)"', r'from "@/app/stores/\1"'),
        (r"from\s+'@/stores/([^']+)'", r"from '@/app/stores/\1'"),
        (r'import\("@/stores/([^"]+)"\)', r'import("@/app/stores/\1")'),
        (r"import\('@/stores/([^']+)'\)", r"import('@/app/stores/\1')"),
        
        # @/components/* -> @/app/components/*
        (r'from\s+"@/components/([^"]+)"', r'from "@/app/components/\1"'),
        (r"from\s+'@/components/([^']+)'", r"from '@/app/components/\1'"),
        (r'import\("@/components/([^"]+)"\)', r'import("@/app/components/\1")'),
        (r"import\('@/components/([^']+)'\)", r"import('@/app/components/\1')"),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed imports in: {file_path}")
        return True
    return False

def main():
    """Busca y arregla todos los archivos fuente"""
    app_dir = Path("app")
    
    if not app_dir.exists():
        print("❌ No se encontró el directorio app")
        return
    
    fixed_count = 0
    total_count = 0
    
    # Extensiones de archivo a procesar
    extensions = ['.ts', '.tsx', '.js', '.jsx']
    
    # Buscar todos los archivos fuente
    for ext in extensions:
        for source_file in app_dir.rglob(f"*{ext}"):
            # Excluir archivos de test
            if '__tests__' in str(source_file) or '.test.' in str(source_file) or '.spec.' in str(source_file):
                continue
                
            total_count += 1
            if fix_imports_in_file(source_file):
                fixed_count += 1
    
    print(f"\n📊 Resumen:")
    print(f"   Total de archivos procesados: {total_count}")
    print(f"   Archivos arreglados: {fixed_count}")
    print(f"   Archivos sin cambios: {total_count - fixed_count}")

if __name__ == "__main__":
    main()