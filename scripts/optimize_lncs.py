# Optimization script for 7-page LNCS paper
import subprocess, pypdf, sys

def compile_tex(tex_file):
    for i in range(2):
        res = subprocess.run(['pdflatex', '-interaction=nonstopmode', tex_file], cwd='docs/iclamp/latex', capture_output=True, text=True)
    pdf_file = tex_file.replace('.tex', '.pdf')
    reader = pypdf.PdfReader('docs/iclamp/latex/' + pdf_file)
    pages = len(reader.pages)
    errors = [l for l in res.stdout.splitlines() if l.startswith('!')]
    warnings = [l for l in res.stdout.splitlines() if 'Warning' in l]
    return pages, errors, warnings, res.stdout

print('Helper ready')

