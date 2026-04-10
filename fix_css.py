with open(r'C:\Users\mitho\OneDrive\Desktop\Copy_Peer_Pal\frontend\src\styles.css', 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# The three bad blocks we want to remove start after the near-black block ends
# The near-black block ends with this exact text
cut_marker = "body.theme-dark input,\nbody.theme-dark select,\nbody.theme-dark textarea {\n  background: #111114 !important;\n  border-color: #2a2a32 !important;\n}\n"

idx = content.find(cut_marker)
if idx == -1:
    # Try with \r\n
    cut_marker = cut_marker.replace('\n', '\r\n')
    idx = content.find(cut_marker)

print(f"Cut marker found at: {idx}")

if idx != -1:
    cut_point = idx + len(cut_marker)
    new_content = content[:cut_point]
    with open(r'C:\Users\mitho\OneDrive\Desktop\Copy_Peer_Pal\frontend\src\styles.css', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"File truncated. New length: {len(new_content)}")
else:
    print("Marker not found, trying alternative...")
    # Find by the landing-student block start
    bad_marker = "/* -- Landing page: navy blue light theme --"
    idx2 = content.find(bad_marker)
    print(f"Landing marker at: {idx2}")
    
    # Find the first bad block
    bad_marker2 = "/* -- Light mode dashboard: clean white + navy theme --"
    idx3 = content.find(bad_marker2)
    print(f"Dashboard marker at: {idx3}")
    
    # Show content around position 130000
    print(repr(content[130000:130200]))
