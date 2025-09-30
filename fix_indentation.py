#!/usr/bin/env python3
"""
Fix indentation issues in production_dashboard.py caused by our search/replace operations
"""

import re

def fix_indentation():
    with open('production_dashboard.py', 'r') as f:
        content = f.read()
    
    # Fix the specific pattern where return statements are incorrectly indented
    # Pattern: after "if not user_email:" there should be a properly indented return
    lines = content.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines):
        # If this line is "if not user_email:" and the next line is a return statement
        if line.strip() == "if not user_email:" and i + 1 < len(lines):
            next_line = lines[i + 1]
            if "return jsonify" in next_line:
                # Ensure the return statement has proper indentation (12 spaces for inside if block)
                fixed_lines.append(line)
                fixed_lines.append("            " + next_line.strip())
                # Skip the original next line
                continue
        
        # Fix any return statements that are incorrectly indented after our changes
        if "return jsonify" in line and not line.startswith("            return"):
            # Calculate proper indentation based on context
            if "user_email" in line and "not found" in line:
                fixed_lines.append("            " + line.strip())
            else:
                fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    # Write the fixed content back
    with open('production_dashboard.py', 'w') as f:
        f.write('\n'.join(fixed_lines))
    
    print("✅ Fixed indentation issues in production_dashboard.py")

if __name__ == "__main__":
    fix_indentation()
