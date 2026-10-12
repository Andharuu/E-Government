import os
import pathlib

logos_dir = pathlib.Path("frontend/public/logos")
logos_dir.mkdir(parents=True, exist_ok=True)

# Indonesian government agency logos - simplified branded SVGs
logos = {
    # LTMPT - blue badge
    "ltmpt": {
        "bg": "#1E3A5F",
        "text": "LTMPT",
        "text_color": "#FFFFFF",
        "font_size": 15,
    },
    # BKN - red with white logo
    "bkn": {
        "bg": "#C41E3A",
        "text": "BKN",
        "text_color": "#FFD700",
        "font_size": 22,
    },
    # Kemendikbud - green with budaya
    "kemendikbud": {
        "bg": "#0B6E4F",
        "text": "KEMENDIKBUD",
        "text_color": "#FFFFFF",
        "font_size": 11,
    },
    # LPDP - dark blue
    "lpdp": {
        "bg": "#0B3C5D",
        "text": "LPDP",
        "text_color": "#FFD700",
        "font_size": 20,
    },
    # Pajak DJP - gold/yellow
    "pajak": {
        "bg": "#B8860B",
        "text": "DJP",
        "text_color": "#1A1A1A",
        "font_size": 24,
    },
    # BKPM/OSS
    "bkpm": {
        "bg": "#E31937",
        "text": "OSS",
        "text_color": "#FFFFFF",
        "font_size": 22,
    },
    # Kemenkeu
    "kemenkeu": {
        "bg": "#003366",
        "text": "Kemenkeu",
        "text_color": "#FFD700",
        "font_size": 14,
    },
    # Dukcapil
    "dukcapil": {
        "bg": "#1B4D72",
        "text": "Dukcapil",
        "text_color": "#FFFFFF",
        "font_size": 14,
    },
    # Imigrasi
    "imigrasi": {
        "bg": "#003366",
        "text": "Imigrasi",
        "text_color": "#FFFFFF",
        "font_size": 15,
    },
    # BPJS Kesehatan
    "bpjs-kes": {
        "bg": "#0072CE",
        "text": "BPJS",
        "text_color": "#FFFFFF",
        "font_size": 18,
        "subtitle": "Kesehatan",
        "subtitle_size": 10,
    },
    # BPJS Ketenagakerjaan
    "bpjs-ker": {
        "bg": "#E30613",
        "text": "BPJS",
        "text_color": "#FFFFFF",
        "font_size": 18,
        "subtitle": "Ketenagakerjaan",
        "subtitle_size": 9,
    },
    # Kemenkes
    "kemenkes": {
        "bg": "#0E7C66",
        "text": "Kemenkes",
        "text_color": "#FFFFFF",
        "font_size": 13,
    },
    # PUPR
    "pupr": {
        "bg": "#F97316",
        "text": "PUPR",
        "text_color": "#FFFFFF",
        "font_size": 18,
    },
    # POLRI
    "polri": {
        "bg": "#0D1B4C",
        "text": "POLRI",
        "text_color": "#FFD700",
        "font_size": 18,
    },
    # Kemensos
    "kemensos": {
        "bg": "#B91C1C",
        "text": "Kemensos",
        "text_color": "#FFFFFF",
        "font_size": 13,
    },
}

svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g_{name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_light}"/>
      <stop offset="100%" stop-color="{bg}"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="20" fill="url(#g_{name})"/>
  <text x="60" y="{y}" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="{font_size}" font-weight="800" fill="{text_color}" letter-spacing="0.5">{text}</text>{subtitle}
</svg>'''

subtitle_template = '\n  <text x="60" y="{y2}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="{font_size}" font-weight="600" fill="{text_color}" opacity="0.9">{sub}</text>'

def lighten(hex_color, amount=0.15):
    """Lighten a hex color by mixing with white."""
    h = hex_color.lstrip('#')
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    r = int(r + (255 - r) * amount)
    g = int(g + (255 - g) * amount)
    b = int(b + (255 - b) * amount)
    return f'#{r:02x}{g:02x}{b:02x}'

count = 0
for name, spec in logos.items():
    has_sub = 'subtitle' in spec
    y = 56 if has_sub else 70
    sub = ''
    if has_sub:
        sub = subtitle_template.format(
            y2=84,
            font_size=spec.get('subtitle_size', 10),
            text_color=spec['text_color'],
            sub=spec['subtitle'],
        )
    svg = svg_template.format(
        name=name,
        bg=spec['bg'],
        bg_light=lighten(spec['bg'], 0.2),
        font_size=spec['font_size'],
        text=spec['text'],
        text_color=spec['text_color'],
        y=y,
        subtitle=sub,
    )
    (logos_dir / f"{name}.svg").write_text(svg, encoding='utf-8')
    count += 1

print(f"Created {count} branded logo SVGs")
