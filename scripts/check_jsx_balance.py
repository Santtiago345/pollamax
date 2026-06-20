from pathlib import Path
import re
import sys
path = Path(sys.argv[1])
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
open_div = sum(1 for line in lines if '<div' in line)
close_div = sum(1 for line in lines if '</div>' in line)
open_frag = sum(1 for line in lines if '<>' in line)
close_frag = sum(1 for line in lines if '</>' in line)
print(path)
print('open <div>', open_div, 'close </div>', close_div)
print('open <>', open_frag, 'close </>', close_frag)
for i, line in enumerate(lines, start=1):
    if line.count('<div') != line.count('</div>') and (line.count('<div') or line.count('</div>')):
        print(i, line)
