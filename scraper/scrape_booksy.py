"""
Warsaw Beauty Salon Scraper — Booksy Public Search API
-------------------------------------------------------
Booksy exposes an unauthenticated search endpoint used by their website.
This script pages through it to collect ≥100 Warsaw salons.

Run:
    pip install requests
    python scrape_booksy.py

Output: ../data/salons.json
"""

import json
import time
import requests
from pathlib import Path

BASE_URL = "https://booksy.com/api/2/search/user/businesses/"

# Warsaw city center coordinates
PARAMS_BASE = {
    "lat": 52.2297,
    "lon": 21.0122,
    "radius": 30000,   # 30 km covers all Warsaw districts
    "limit": 50,
    "offset": 0,
}

# Hair & beauty category IDs on Booksy PL
CATEGORY_IDS = [1, 2, 3, 4]   # hairdresser, beauty, nails, barber

HEADERS = {
    "Accept": "application/json",
    "Accept-Language": "pl-PL,pl;q=0.9,en;q=0.8",
    "X-Api-Key": "web-e2a2b0c6c8c0c0c0",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://booksy.com",
    "Referer": "https://booksy.com/pl-pl/warszawa/",
}

# Warsaw district boundaries (approximate, by postcode prefix)
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


def guess_district(zipcode: str | None) -> str:
    if zipcode and len(zipcode) >= 2:
        prefix = zipcode.replace("-", "")[:2]
        return DISTRICT_MAP.get(prefix, "Warszawa")
    return "Warszawa"


def fetch_page(category_id: int, offset: int) -> list[dict]:
    params = {**PARAMS_BASE, "category_id": category_id, "offset": offset}
    try:
        r = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return r.json().get("businesses", [])
    except Exception as e:
        print(f"  ⚠ Error (cat={category_id}, offset={offset}): {e}")
        return []


def normalize(raw: dict) -> dict:
    zipcode = raw.get("zipcode") or ""
    services = [s["name"] for s in raw.get("services", [])[:10]]
    return {
        "id": raw["id"],
        "name": raw.get("name", "").strip(),
        "address": f"{raw.get('address', '')} {raw.get('address2', '') or ''}".strip(),
        "district": guess_district(zipcode),
        "zipcode": zipcode,
        "city": raw.get("city", "Warszawa"),
        "phone": raw.get("phone"),
        "website": raw.get("website") or raw.get("facebook_link"),
        "booksy_url": f"https://booksy.com/pl-pl/business/{raw.get('subdomain', raw['id'])}",
        "services": services,
        "price_range": None,          # Booksy doesn't expose price range at list level
        "rating": raw.get("reviews_rank_avg"),
        "reviews": raw.get("reviews_count", 0),
        "lat": raw.get("latitude"),
        "lon": raw.get("longitude"),
    }


def scrape() -> list[dict]:
    seen_ids: set[int] = set()
    results: list[dict] = []

    for cat_id in CATEGORY_IDS:
        print(f"\n📂 Category {cat_id}...")
        for offset in range(0, 300, 50):
            businesses = fetch_page(cat_id, offset)
            if not businesses:
                break
            new = 0
            for b in businesses:
                bid = b.get("id")
                if bid and bid not in seen_ids:
                    seen_ids.add(bid)
                    results.append(normalize(b))
                    new += 1
            print(f"  offset={offset}: {new} new ({len(results)} total)")
            if len(businesses) < 50:
                break   # last page
            time.sleep(0.5)   # be polite

    return results


if __name__ == "__main__":
    print("🌸 Warsaw Beauty Salon Scraper — Booksy")
    salons = scrape()

    # Sort by reviews descending (most reviewed = most trustworthy)
    salons.sort(key=lambda s: s["reviews"] or 0, reverse=True)

    out = Path("../data/salons.json")
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(salons, ensure_ascii=False, indent=2))
    print(f"\n✅ Saved {len(salons)} salons → {out}")
