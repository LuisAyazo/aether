#!/usr/bin/env python3
"""
Script para corregir TODOS los imports incorrectos en archivos Next.js
Busca y reemplaza todos los patrones de @/app/* por @/*
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
        
        # Reemplazar todos los @/app/* por @/*
        # Esto captura cualquier import que tenga @/app/
        content = re.sub(r'@/app/', '@/', content)
        
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
    
    # Buscar archivos en todo el proyecto
    for ext in extensions:
        files_to_process.extend(base_dir.glob(f'**/*{ext}'))
    
    # Excluir node_modules y .next
    files_to_process = [
        f for f in files_to_process 
        if 'node_modules' not in str(f) and '.next' not in str(f)
    ]
    
    # Procesar archivos
    fixed_count = 0
    for file_path in files_to_process:
        if fix_imports_in_file(file_path):
            print(f"✓ Corregido: {file_path}")
            fixed_count += 1
    
    print(f"\n✅ Total de archivos corregidos: {fixed_count}")

if __name__ == "__main__":
    main()