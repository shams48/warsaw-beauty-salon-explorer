"""
Warsaw Beauty Salon Scraper — Google Places API
------------------------------------------------
Collects 100+ real Warsaw hair/beauty salons using Google Places Nearby Search
+ Place Details for full data (phone, website, opening hours, etc.)

Setup:
    pip install requests python-dotenv
    Create a .env file with: GOOGLE_API_KEY=your_key_here

Run:
    python scrape_google_places.py

Output: ../data/salons.json
"""

import json
import time
import os
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")
if not API_KEY:
    raise ValueError("GOOGLE_API_KEY not set in .env file")

NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# Warsaw center + search config
WARSAW_LAT  = 52.2297
WARSAW_LON  = 21.0122
RADIUS      = 15000  # 15km covers central Warsaw well
KEYWORDS    = ["hair salon", "beauty salon", "fryzjer", "salon urody", "barber"]

# Warsaw district lookup by area name from Google
DISTRICT_HINTS = {
    "śródmieście": "Śródmieście", "mokotów": "Mokotów", "wola": "Wola",
    "praga": "Praga-Południe", "ursynów": "Ursynów", "bemowo": "Bemowo",
    "białołęka": "Białołęka", "bielany": "Bielany", "ochota": "Ochota",
    "targówek": "Targówek", "ursus": "Ursus", "wilanów": "Wilanów",
    "włochy": "Włochy", "żoliborz": "Żoliborz", "wawer": "Wawer",
    "rembertów": "Rembertów", "wesoła": "Wesoła",
}

PRICE_MAP = {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}


def guess_district(address: str) -> str:
    addr_lower = address.lower()
    for key, district in DISTRICT_HINTS.items():
        if key in addr_lower:
            return district
    return "Warszawa"


def nearby_search(keyword: str, page_token: str = None) -> dict:
    params = {
        "location": f"{WARSAW_LAT},{WARSAW_LON}",
        "radius": RADIUS,
        "keyword": keyword,
        "key": API_KEY,
    }
    if page_token:
        params = {"pagetoken": page_token, "key": API_KEY}
    r = requests.get(NEARBY_URL, params=params, timeout=15)
    r.raise_for_status()
    return r.json()


def get_details(place_id: str) -> dict:
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,types,geometry",
        "key": API_KEY,
    }
    r = requests.get(DETAILS_URL, params=params, timeout=15)
    r.raise_for_status()
    return r.json().get("result", {})


def normalize(detail: dict, address_hint: str = "") -> dict:
    address = detail.get("formatted_address", address_hint)
    # Remove ", Poland" suffix if present
    address = address.replace(", Poland", "").replace(", Polska", "").strip()

    # Extract services from place types
    type_to_service = {
        "hair_care": "Haircut", "beauty_salon": "Beauty Treatments",
        "spa": "Spa", "nail_salon": "Manicure & Pedicure",
        "gym": "Fitness", "barber": "Barbering",
    }
    services = [type_to_service[t] for t in detail.get("types", []) if t in type_to_service]

    return {
        "name":       detail.get("name", "").strip(),
        "address":    address,
        "district":   guess_district(address),
        "zipcode":    None,
        "city":       "Warszawa",
        "phone":      detail.get("formatted_phone_number"),
        "website":    detail.get("website"),
        "booksyUrl":  None,
        "services":   services,
        "priceRange": PRICE_MAP.get(detail.get("price_level")),
        "rating":     detail.get("rating"),
        "reviews":    detail.get("user_ratings_total", 0),
        "lat":        detail.get("geometry", {}).get("location", {}).get("lat"),
        "lon":        detail.get("geometry", {}).get("location", {}).get("lng"),
    }


def scrape() -> list[dict]:
    seen_ids: set[str] = set()
    place_ids: list[str] = []

    # Phase 1: collect place IDs via Nearby Search
    for keyword in KEYWORDS:
        print(f"\n🔍 Searching: '{keyword}'...")
        page_token = None
        pages = 0

        while pages < 3:  # max 3 pages × 20 results = 60 per keyword
            try:
                if page_token:
                    time.sleep(2)  # Google requires delay before using next_page_token
                data = nearby_search(keyword, page_token)
            except Exception as e:
                print(f"  ⚠ Request failed: {e}")
                break

            results = data.get("results", [])
            new = 0
            for r in results:
                pid = r.get("place_id")
                if pid and pid not in seen_ids:
                    seen_ids.add(pid)
                    place_ids.append(pid)
                    new += 1

            print(f"  page {pages+1}: {new} new places ({len(place_ids)} total)")
            page_token = data.get("next_page_token")
            pages += 1
            if not page_token:
                break

    print(f"\n📋 Fetching details for {len(place_ids)} places...")

    # Phase 2: fetch full details for each place
    salons: list[dict] = []
    for i, pid in enumerate(place_ids):
        try:
            detail = get_details(pid)
            salon = normalize(detail)
            if salon["name"]:
                salon["id"] = i + 1
                salons.append(salon)
            if (i + 1) % 10 == 0:
                print(f"  {i+1}/{len(place_ids)} fetched...")
            time.sleep(0.1)  # be polite
        except Exception as e:
            print(f"  ⚠ Details failed for {pid}: {e}")

    # Sort by reviews descending
    salons.sort(key=lambda s: s.get("reviews") or 0, reverse=True)
    return salons


if __name__ == "__main__":
    print("🌸 Warsaw Beauty Salon Scraper — Google Places API")
    salons = scrape()

    out = Path("../data/salons.json")
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(salons, ensure_ascii=False, indent=2))
    print(f"\n✅ Saved {len(salons)} salons → {out}")
