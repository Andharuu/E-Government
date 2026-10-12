import re

path = 'backend/app/api/v1/routers/public_services.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove adjacent duplicate logo_url lines
content = re.sub(r'("logo_url": "[^"]+",\n)(?:[ \t]+"logo_url": "[^"]+",\n)+', r'\1', content)

# Also fix case where logo_url is on separate line after agency_url without proper position
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Count logos and agencies
agendas = len(re.findall(r'"agency": "', content))
logos = len(re.findall(r'"logo_url": "', content))
print(f'Agencies: {agendas}, Logos after dedupe: {logos}')
