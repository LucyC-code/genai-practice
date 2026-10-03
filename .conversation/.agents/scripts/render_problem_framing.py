import fitz
from pathlib import Path
source = Path('attached_assets/Project_Problem_Framing_-_Lucy_Crowe_1791053968643.pdf')
out = Path('.agents/outputs/problem-framing')
out.mkdir(parents=True, exist_ok=True)
doc = fitz.open(source)
print(f'pages={doc.page_count}')
for i, page in enumerate(doc):
    pix = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    path = out / f'page-{i+1:02d}.png'
    pix.save(path)
    print(path)
