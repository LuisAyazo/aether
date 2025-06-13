#!/usr/bin/env python3
import os
import re
from pathlib import Path

def get_relative_path(from_file, to_file):
    """Calculate relative path from one file to another"""
    from_path = Path(from_file).parent
    to_path = Path(to_file)
    
    try:
        # Get relative path
        relative = os.path.relpath(to_path, from_path)
        # Convert to forward slashes and ensure it starts with ./
        relative = relative.replace('\\', '/')
        if not relative.startswith('.'):
            relative = './' + relative
        return relative
    except ValueError:
        # If paths are on different drives on Windows
        return to_file

def find_target_file(alias_path, base_dir):
    """Find the actual file path from an alias path"""
    # Remove @/ prefix
    if alias_path.startswith('@/'):
        alias_path = alias_path[2:]
    
    # Check if it's pointing to app directory
    if alias_path.startswith('app/'):
        target = os.path.join(base_dir, alias_path)
    else:
        # Try with app prefix
        target = os.path.join(base_dir, 'app', alias_path)
    
    # Check with various extensions if no extension provided
    if not os.path.exists(target):
        for ext in ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']:
            test_path = target + ext
            if os.path.exists(test_path):
                return test_path
    
    return target if os.path.exists(target) else None

def fix_imports_in_file(file_path, base_dir):
    """Fix all @/ imports in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Find all imports with @/
    import_pattern = r'(from\s+["\'])(@/[^"\']+)(["\'])'
    
    def replace_import(match):
        prefix = match.group(1)
        alias_path = match.group(2)
        suffix = match.group(3)
        
        # Find the target file
        target_file = find_target_file(alias_path, base_dir)
        
        if target_file:
            # Calculate relative path
            relative_path = get_relative_path(file_path, target_file)
            # Remove file extension for imports
            relative_path = re.sub(r'\.(tsx?|jsx?)$', '', relative_path)
            return f"{prefix}{relative_path}{suffix}"
        else:
            print(f"  Warning: Could not resolve {alias_path} in {file_path}")
            return match.group(0)
    
    content = re.sub(import_pattern, replace_import, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
        return True
    return False

def process_directory(directory, base_dir):
    """Process all TypeScript/JavaScript files in a directory"""
    fixed_count = 0
    
    for root, dirs, files in os.walk(directory):
        # Skip node_modules and other build directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.next', 'dist', 'build']]
        
        for filename in files:
            if filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = os.path.join(root, filename)
                if fix_imports_in_file(file_path, base_dir):
                    fixed_count += 1
    
    return fixed_count

def main():
    # Base directory (infraux)
    base_dir = os.getcwd()
    
    print("Removing all @/ aliases and converting to relative imports...")
    print(f"Base directory: {base_dir}")
    print()
    
    # Process app directory
    app_dir = os.path.join(base_dir, 'app')
    if os.path.exists(app_dir):
        print("Processing app directory...")
        app_count = process_directory(app_dir, base_dir)
        print(f"Fixed {app_count} files in app directory")
    
    # Process __tests__ directory
    tests_dir = os.path.join(base_dir, '__tests__')
    if os.path.exists(tests_dir):
        print("\nProcessing __tests__ directory...")
        tests_count = process_directory(tests_dir, base_dir)
        print(f"Fixed {tests_count} files in __tests__ directory")
    
    print("\nDone! All @/ aliases have been converted to relative imports.")

if __name__ == "__main__":
    main()