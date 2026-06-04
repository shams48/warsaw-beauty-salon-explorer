"""
Warsaw Beauty Salon Scraper — OpenStreetMap Overpass API
---------------------------------------------------------
Completely free, no API key, no account needed.
Uses the public Overpass API to fetch real Warsaw beauty salons from OSM.

Run:
    pip install requests
    python scrape_osm.py

Output: ../data/salons.json
"""

import json
import sys
import time
import requests
from pathlib import Path

# Windows consoles default to cp1252, which can't print emoji / Polish chars.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# Multiple Overpass API mirrors for reliability
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

HEADERS = {"User-Agent": "warsaw-beauty-salon-explorer/1.0"}

# Warsaw district boundaries by postcode prefix
DISTRICT_MAP = {
    "00": "Śródmieście", "01": "Śródmieście", "02": "Mokotów",
    "03": "Praga-Południe", "04": "Mokotów", "05": "Ursynów",
    "06": "Ochota", "07": "Wola", "08": "Wola",
    "09": "Żoliborz", "10": "Bielany", "11": "Białołęka",
    "12": "Praga-Północ", "13": "Praga-Południe", "14": "Praga-Południe",
    "15": "Wawer", "16": "Rembertów", "17": "Wesoła",
    "18": "Targówek", "19": "Białołęka", "20": "Bemowo",
    "21": "Bemowo", "22": "Ursus", "23": "Włochy",
    "24": "Ursynów", "25": "Wilanów", "26": "Mokotów",
}

QUERY = """
[out:json][timeout:90];
area["name"="Warszawa"]["admin_level"="8"]->.warsaw;
(
  node["shop"="hairdresser"](area.warsaw);
  node["shop"="beauty"](area.warsaw);
  node["amenity"="beauty_salon"](area.warsaw);
  node["shop"="nail_salon"](area.warsaw);
  node["shop"="barber"](area.warsaw);
  way["shop"="hairdresser"](area.warsaw);
  way["shop"="beauty"](area.warsaw);
  way["amenity"="beauty_salon"](area.warsaw);
);
out center tags;
"""

# Tags we report coverage on (helps decide which features have real data)
COVERAGE_KEYS = [
    "opening_hours", "wheelchair", "email", "contact:email",
    "phone", "contact:phone", "website", "contact:website",
    "payment:cards", "payment:visa", "payment:contactless",
    "contact:instagram", "instagram", "contact:facebook", "facebook",
]


def guess_district(tags: dict) -> str:
    postcode = tags.get("addr:postcode", "")
    if postcode:
        prefix = postcode.replace("-", "")[:2]
        district = DISTRICT_MAP.get(prefix)
        if district:
            return district
    # fallback: check address suburb tag
    suburb = tags.get("addr:suburb", tags.get("is_in:district", ""))
    if suburb:
        for key, val in DISTRICT_MAP.items():
            if val.lower() in suburb.lower():
                return val
    return "Warszawa"


def normalize_wheelchair(value):
    """OSM uses yes / limited / no — keep only meaningful values."""
    if value in ("yes", "limited", "no"):
        return value
    return None


def fetch_from_mirror(mirror: str) -> list:
    print(f"  Trying: {mirror}")
    r = requests.post(mirror, data={"data": QUERY}, headers=HEADERS, timeout=120)
    r.raise_for_status()
    data = r.json()
    return data.get("elements", [])


def scrape() -> tuple[list[dict], dict]:
    elements = []
    for mirror in OVERPASS_MIRRORS:
        try:
            elements = fetch_from_mirror(mirror)
            if elements:
                print(f"  ✓ Got {len(elements)} elements")
                break
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            time.sleep(2)

    if not elements:
        print("❌ All mirrors failed. Check your internet connection.")
        return [], {}

    salons = []
    seen_names = set()
    coverage = {k: 0 for k in COVERAGE_KEYS}
    named = 0

    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name", "").strip()

        # Skip unnamed places
        if not name:
            continue
        named += 1
        for k in COVERAGE_KEYS:
            if tags.get(k):
                coverage[k] += 1

        # Deduplicate by name
        key = name.lower()
        if key in seen_names:
            continue
        seen_names.add(key)

        # Get coordinates
        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center", {})
            lat, lon = center.get("lat"), center.get("lon")

        # Build address
        street = tags.get("addr:street", "")
        housen = tags.get("addr:housenumber", "")
        address = f"{street} {housen}".strip() if street else ""

        # Services from OSM tags
        shop_type = tags.get("shop", tags.get("amenity", ""))
        service_map = {
            "hairdresser": ["Haircut", "Hair Coloring", "Blow Dry"],
            "beauty": ["Facial", "Makeup", "Waxing"],
            "beauty_salon": ["Facial", "Makeup", "Waxing", "Manicure"],
            "nail_salon": ["Manicure", "Pedicure", "Gel Nails"],
            "barber": ["Haircut", "Beard Trim", "Shave"],
        }
        services = service_map.get(shop_type, [])

        # Extra services from OSM tags
        if tags.get("beauty"):
            extra = [s.strip().title() for s in tags["beauty"].split(";")]
            services = list(set(services + extra))

        salons.append({
            "id": len(salons) + 1,
            "name": name,
            "address": address or "Warsaw",
            "district": guess_district(tags),
            "zipcode": tags.get("addr:postcode"),
            "city": "Warszawa",
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "website": tags.get("website") or tags.get("contact:website"),
            "booksyUrl": None,
            "services": services,
            "priceRange": None,
            "rating": None,
            "reviews": None,
            "lat": lat,
            "lon": lon,
            # Real OSM detail fields
            "openingHours": tags.get("opening_hours"),
            "wheelchair": normalize_wheelchair(tags.get("wheelchair")),
            "email": tags.get("email") or tags.get("contact:email"),
        })

    coverage["_named_total"] = named
    return salons, coverage


if __name__ == "__main__":
    print("🌸 Warsaw Beauty Salon Scraper — OpenStreetMap")
    print("Fetching data from Overpass API...")
    salons, coverage = scrape()

    if not salons:
        print("⚠ No salons scraped — keeping existing data/salons.json untouched.")
        raise SystemExit(1)

    out = Path(__file__).resolve().parent.parent / "data" / "salons.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(salons, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n✅ Saved {len(salons)} salons → {out}")

    # Real-data coverage report (over all named OSM places, before dedup)
    named = coverage.pop("_named_total", 0)
    print(f"\n📊 Tag coverage across {named} named OSM places:")
    for k in COVERAGE_KEYS:
        c = coverage.get(k, 0)
        pct = (100 * c / named) if named else 0
        print(f"   {k:<22} {c:>4}  ({pct:4.1f}%)")
