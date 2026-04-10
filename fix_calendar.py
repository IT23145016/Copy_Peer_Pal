f = open(r'c:\Users\mitho\OneDrive\Desktop\Copy_Peer_Pal\frontend\src\styles.css', 'r', encoding='utf-8')
c = f.read()
f.close()

addition = """
/* -- Fix collapsed sidebar: proper width, padding, no clipping -- */
.pp-sidebar-collapsed {
  width: 72px !important;
  min-width: 72px !important;
  padding: 1.4rem 0.5rem !important;
  overflow: visible !important;
}

.pp-sidebar-collapsed .pp-nav-item {
  justify-content: center !important;
  padding: 0.65rem 0 !important;
  width: 100% !important;
}

.pp-sidebar-collapsed .pp-sidebar-nav {
  width: 100% !important;
  align-items: center !important;
}

.pp-sidebar-collapsed .pp-sidebar-brand {
  justify-content: center !important;
  gap: 0 !important;
}

.pp-sidebar-collapsed .pp-sidebar-toggle {
  margin-left: 0 !important;
}
"""

c = c + addition

f = open(r'c:\Users\mitho\OneDrive\Desktop\Copy_Peer_Pal\frontend\src\styles.css', 'w', encoding='utf-8')
f.write(c)
f.close()
print('done')
