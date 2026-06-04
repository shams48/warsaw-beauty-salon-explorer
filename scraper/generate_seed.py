"""
Seed data generator — produces realistic Warsaw salon JSON.
Used as demo data when scraper hasn't been run yet.
Real data replaces this file after running scrape_booksy.py.
"""
import json, random
from pathlib import Path

random.seed(99)

DISTRICTS = [
    "Śródmieście","Mokotów","Wola","Praga-Południe","Ursynów",
    "Bemowo","Białołęka","Bielany","Ochota","Praga-Północ",
    "Targówek","Ursus","Wilanów","Włochy","Żoliborz","Wawer",
]

STREETS = [
    "ul. Marszałkowska","ul. Nowy Świat","ul. Puławska","ul. Mokotowska",
    "al. Jerozolimskie","ul. Chmielna","ul. Hoża","ul. Wilcza","ul. Złota",
    "ul. Krucza","ul. Nowogrodzka","ul. Koszykowa","ul. Piękna","ul. Polna",
    "ul. Narbutta","ul. Dworkowa","ul. Rakowiecka","ul. Wołoska","ul. Odyńca",
    "ul. Madalińskiego","ul. Chocimska","ul. Spacerowa","ul. Różana",
    "ul. Belgijska","ul. Wiśniowa","ul. Krasickiego","ul. Batorego",
    "ul. Klonowa","ul. Chopina","ul. Sienkiewicza","ul. Jasna","ul. Kredytowa",
    "ul. Górczewska","ul. Wolska","ul. Towarowa","ul. Powstańców Śląskich",
    "ul. Grochowska","ul. Ostrobramska","ul. Waszyngtona","ul. Targowa",
    "ul. Białostocka","ul. Radzymińska","ul. Kondratowicza","ul. Modlińska",
]

SERVICES = [
    "Haircut","Hair Coloring","Highlights","Balayage","Keratin Treatment",
    "Blow Dry","Hair Extensions","Perms","Scalp Treatment","Manicure",
    "Pedicure","Gel Nails","Eyebrow Shaping","Eyelash Extensions",
    "Facial","Makeup","Waxing","Threading","Massage","Microdermabrasion",
    "Ombre","Toning","Deep Conditioning","Brazilian Blowout","Hair Gloss",
]

NAMES = [
    "Belleza","Aria","Nova","Stella","Luna","Iris","Opal","Aura","Vera","Mia",
    "Naia","Zara","Lena","Sola","Kira","Deva","Nora","Alma","Rosa","Eva",
    "Hana","Rita","Sana","Tara","Veda","Amber","Bliss","Coco","Elan","Flair",
    "Grace","Halo","Icon","Jade","Kiss","Luxe","Muse","Pearl","Rouge","Silk",
    "Tone","Vogue","Glow","Lush","Neat","Plush","Rise","Sheen","Velvet","Satin",
    "Gloss","Shine","Blush","Crisp","Drift","Echo","Flush","Gleam","Jazz","Lace",
    "Mode","Pep","True","Vivid","Radiant","Chic","Trend","Urban","Zen","Elite",
    "Pure","Luxe Pro","Studio K","Atelier M","Salon 21","Hair Lab","Beauty Code",
    "Glam Room","The Cut","Colour Bar","Wave Studio","Hair Story","Bella Donna",
    "Magnolia","Jasmine","Orchid","Dahlia","Rose Gold","Platinum","Crystal",
    "Diamond","Ruby","Sapphire","Onyx","Amber Glow","Golden Touch","Silver Lining",
    "First Class","Top Knot","The Mane","Fringe Benefits","Split Ends","Smooth Operator",
]

PREFIXES = ["Studio","Salon","Atelier","Lounge","Beauty","Hair","Glamour",
            "Elite","Prestige","Chic","Urban","Trendy","Lux","Pure","Zen",""]

used = set()
salons = []
for i in range(110):
    while True:
        prefix = random.choice(PREFIXES)
        word   = random.choice(NAMES)
        name   = f"{prefix} {word}".strip() if prefix else word
        if name not in used:
            used.add(name); break

    district = random.choice(DISTRICTS)
    street   = random.choice(STREETS)
    num      = random.randint(1,120)
    zipcode  = f"{random.randint(0,26):02d}-{random.randint(100,999)}"
    address  = f"{street} {num}"
    phone    = f"+48 {random.randint(500,799)}-{random.randint(100,999)}-{random.randint(100,999)}"
    services = random.sample(SERVICES, random.randint(3,12))
    rating   = round(random.uniform(3.6,5.0),1)
    reviews  = random.randint(8,920)
    price    = random.choice(["$","$$","$$$","$$$$"])
    website  = f"https://www.{word.lower().replace(' ','')}.pl" if random.random()>.45 else None

    salons.append({
        "id": i+1,
        "name": name,
        "address": address,
        "district": district,
        "zipcode": zipcode,
        "city": "Warszawa",
        "phone": phone,
        "website": website,
        "booksy_url": None,
        "services": services,
        "price_range": price,
        "rating": rating,
        "reviews": reviews,
        "lat": round(52.1+random.random()*0.3,6),
        "lon": round(20.85+random.random()*0.4,6),
    })

out = Path("../data/salons.json")
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(salons, ensure_ascii=False, indent=2))
print(f"Generated {len(salons)} salons → {out}")
