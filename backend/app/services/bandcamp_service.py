from typing import List

# Bandcamp has no official public API for purchases; do not scrape.
# Accept a user-provided list of authorized download URLs (e.g., from their account).

def parse_bandcamp_links(text: str) -> List[str]:
    links: List[str] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("http") and "bandcamp.com" in line:
            links.append(line)
    return links
