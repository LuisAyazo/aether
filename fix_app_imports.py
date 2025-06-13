#!/usr/bin/env python3
import os
import re
import glob

def fix_imports_in_file(filepath):
    """Fix imports that include /app/ prefix"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern to match imports with @/app/
    patterns = [
        (r'from\s+[\'"]@/app/([^\'"]*)[\'"](.*)', r'from "@/\1"\2'),
        (r'import\s+(.+?)\s+from\s+[\'"]@/app/([^\'"]*)[\'"](.*)', r'import \1 from "@/\2"\3'),
        (r'}\s+from\s+[\'"]@/app/([^\'"]*)[\'"](.*)', r'} from "@/\1"\2'),
    ]
    
    modified = False
    original_content = content
    
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            modified = True
            content = new_content
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed imports in: {filepath}")
        return True
    return False

def main():
    # Find all TypeScript and JavaScript files
    extensions = ['*.ts', '*.tsx', '*.js', '*.jsx']
    files_to_check = []
    
    for ext in extensions:
        files_to_check.extend(glob.glob(f'**/{ext}', recursive=True))
    
    fixed_count = 0
    checked_count = 0
    
    for filepath in files_to_check:
        # Skip node_modules and .next directories
        if 'node_modules' in filepath or '.next' in filepath:
            continue
            
        checked_count += 1
        if fix_imports_in_file(filepath):
            fixed_count += 1
    
    print(f"\nChecked {checked_count} files")
    print(f"Fixed imports in {fixed_count} files")

if __name__ == "__main__":
    main()
