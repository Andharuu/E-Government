import re

path = 'backend/app/api/v1/routers/public_services.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = {
    'LTMPT (Kementerian Pendidikan)': '/logos/ltmpt.svg',
    'BKN (Badan Kepegawaian Negara)': '/logos/bkn.svg',
    'Kementerian Pendidikan & Budaya': '/logos/kemendikbud.svg',
    'LPDP Kemendikbud': '/logos/lpdp.svg',
    'DJP (Direktorat Jenderal Pajak)': '/logos/pajak.svg',
    'BKPM / Lembaga OSS': '/logos/bkpm.svg',
    'Kemkeu / DJPK': '/logos/kemenkeu.svg',
    'Ditjen Dukcapil Kemendagri': '/logos/dukcapil.svg',
    'Ditjen Imigrasi': '/logos/imigrasi.svg',
    'BPJS Kesehatan': '/logos/bpjs-kes.svg',
    'BPJS Ketenagakerjaan': '/logos/bpjs-ker.svg',
    'Dinas Kesehatan Daerah': '/logos/kemenkes.svg',
    'Dinas PU / Cipta Karya Daerah': '/logos/pupr.svg',
    'DPMPTSP / OSS': '/logos/bkpm.svg',
    'Korlantas POLRI': '/logos/polri.svg',
    'Kepolisian RI (POLRI)': '/logos/polri.svg',
    'Kemensos RI': '/logos/kemensos.svg',
    'Kemensos / Manajemen Pelaksana KIP': '/logos/kemensos.svg',
}

for agency, logo in mapping.items():
    pattern = re.escape(f'"agency": "{agency}",')
    content = re.sub(pattern, f'"agency": "{agency}",\n            "logo_url": "{logo}",', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated successfully')
