import urllib.request
import re
import os

HEADERS = {
    'User-Agent': 'GovConnectEducationBot/1.0 (https://govconnect.id; contact@govconnect.id)'
}

def download_from_commons(file_title, output_filename):
    page_url = f"https://commons.wikimedia.org/wiki/File:{file_title}"
    print(f"Checking {page_url}...")
    req = urllib.request.Request(page_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8')
            # Look for direct upload url
            matches = re.findall(r'https://upload\.wikimedia\.org/wikipedia/commons/[a-f0-9]/[a-f0-9]{2}/[^\"\'\s]+\.(?:svg|png)', html)
            if matches:
                # filter out thumbnails
                direct_urls = [u for u in matches if '/thumb/' not in u]
                target_url = direct_urls[0] if direct_urls else matches[0]
                print(f"Downloading from {target_url} -> {output_filename}")
                req2 = urllib.request.Request(target_url, headers=HEADERS)
                with urllib.request.urlopen(req2) as resp2:
                    data = resp2.read()
                    out_path = os.path.join('frontend/public/logos', output_filename)
                    with open(out_path, 'wb') as f:
                        f.write(data)
                    print(f"Successfully saved {output_filename} ({len(data)} bytes)")
                    return True
    except Exception as e:
        print(f"Failed {file_title}: {e}")
    return False

# Download PUPR
download_from_commons('Logo_Kementerian_Pekerjaan_Umum_Republik_Indonesia.svg', 'pupr.svg')
# Download Kemenkeu official vector
download_from_commons('Logo_of_the_Ministry_of_Finance_of_the_Republic_of_Indonesia.svg', 'kemenkeu.svg')
# Download BPJS Kesehatan official vector
download_from_commons('BPJS_Kesehatan_logo.svg', 'bpjs.svg')
# Download BPJS Ketenagakerjaan official vector
download_from_commons('BPJS_Ketenagakerjaan_logo.svg', 'bpjs-ketenagakerjaan.svg')
# Download Ditjen Pajak official vector if available
download_from_commons('Logo_Direktorat_Jenderal_Pajak.svg', 'djp_official.svg')
# Download Kemensos official vector if available
download_from_commons('Lambang_Kementerian_Sosial_Republik_Indonesia.svg', 'kemensos.svg')

print("All tasks finished.")
