#!/usr/bin/env python3
import os
import re

def fix_utils_import(file_path):
    """Fix @/lib/utils imports to @/app/lib/utils"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the import
    original_content = content
    content = re.sub(r'from "@/lib/utils"', 'from "@/app/lib/utils"', content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
        return True
    return False

def main():
    # UI components directory
    ui_dir = 'app/components/ui'
    
    if not os.path.exists(ui_dir):
        print(f"Directory {ui_dir} not found")
        return
    
    fixed_count = 0
    
    # Process all TypeScript/JavaScript files
    for filename in os.listdir(ui_dir):
        if filename.endswith(('.ts', '.tsx', '.js', '.jsx')):
            file_path = os.path.join(ui_dir, filename)
            if fix_utils_import(file_path):
                fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == "__main__":
    main()