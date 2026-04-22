import os

replacements = {
    "'All Matches'": "'Match'",
    "'All Match'": "'Match'",
    "'Needs Attention'": "'Attention'",
    "All Matches": "Match",
    "All Match": "Match",
    "Needs Attention": "Attention"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            process_file(os.path.join(root, file))
