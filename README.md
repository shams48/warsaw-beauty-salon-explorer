# 🌸 Warsaw Beauty Salon Explorer

A full-stack web application to browse, search, filter, review, and manage beauty salons in Warsaw.
Built with **Kotlin + Spring Boot** on the backend and **Next.js + TypeScript** on the frontend.

---

## ✨ Features

- **Browse 2017 real Warsaw salons** in a card grid or list view
- **Search** by name or address, **filter** by district or service type
- **Sort** by most reviewed, highest rated, or A–Z
- **Detail view** with full salon info, services, phone, website, and map location
- **Edit any salon** — changes persist to the database via the API
- **Add new salons** through a form
- **Reviews** — read and post reviews (author, rating, comment) per salon
- **Favourites** — save salons; persists across page reloads (localStorage)
- **Distance from you** — optional geolocation shows how far each salon is
- **Open now** indicator — parses opening hours where available
- **Map view** — see salons plotted on an interactive map

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version |
|------|---------|
| Java (JDK) | 17 (required — not 21 or newer) |
| Node.js | 18+ |
| Python | 3.9+ (for the scraper only) |

---

### Step 1 — Collect real salon data

The repo already ships with `data/salons.json` populated with 2017 real salons,
so this step is optional. To refresh the data:

```bash
cd scraper
pip install requests
python scrape_osm.py
# → fetches 2000+ real Warsaw salons from OpenStreetMap
# → writes ../data/salons.json
```

---

### Step 2 — Start the backend (Kotlin / Spring Boot)

```bash
cd backend

# Windows
.\gradlew.bat bootRun

# Mac / Linux
./gradlew bootRun
```

- First run downloads Gradle and dependencies (~2–3 min). Later runs are fast.
- API available at: **http://localhost:8080**
- On first startup, automatically seeds `salons.db` (SQLite) from `data/salons.json`.
  Delete `salons.db` and restart to re-seed from a fresh `salons.json`.

---

### Step 3 — Start the frontend (Next.js)

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

- UI available at: **http://localhost:3000**

---

## 🔌 REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/salons` | Paginated list with optional filters |
| `GET` | `/api/salons/meta` | Distinct districts & services (for dropdowns) |
| `GET` | `/api/salons/{id}` | Full details for one salon |
| `POST` | `/api/salons` | Create a new salon |
| `PATCH` | `/api/salons/{id}` | Partially update a salon |
| `GET` | `/api/salons/{id}/reviews` | List reviews for a salon |
| `POST` | `/api/salons/{id}/reviews` | Add a review to a salon |

### Query params for `GET /api/salons`
| Param | Example | Description |
|-------|---------|-------------|
| `district` | `Mokotów` | Filter by district (exact, case-insensitive) |
| `serviceType` | `Manicure` | Filter by service (substring match) |
| `search` | `beauty` | Full-text search on name, address, district |
| `sort` | `rating` | Sort order (`reviews`, `rating`, `name`) |
| `page` | `2` | Page number (default: 1) |
| `limit` | `20` | Items per page (default: 20) |

### Example requests
```bash
# All salons, page 1
curl http://localhost:8080/api/salons

# Filter by district
curl "http://localhost:8080/api/salons?district=Mokotów"

# Filter by service
curl "http://localhost:8080/api/salons?serviceType=Manicure"

# Salon detail
curl http://localhost:8080/api/salons/1

# Update a salon
curl -X PATCH http://localhost:8080/api/salons/1 \
  -H "Content-Type: application/json" \
  -d '{"phone": "+48 500-000-001"}'

# Add a review
curl -X POST http://localhost:8080/api/salons/1/reviews \
  -H "Content-Type: application/json" \
  -d '{"author": "Anna", "rating": 5, "comment": "Great service!"}'
```

---

## 🏗 Architecture

```
warsaw-beauty-salon-explorer/
├── scraper/
│   ├── scrape_osm.py            # Main scraper — OpenStreetMap Overpass API
│   ├── scrape_booksy.py         # Alternative — Booksy (blocked automated requests)
│   ├── scrape_google_places.py  # Alternative — Google Places API (needs paid key)
│   └── generate_seed.py         # Fake seed generator (fallback / demo)
├── data/
│   └── salons.json              # 2017 real Warsaw salons collected from OSM
├── backend/                     # Kotlin + Spring Boot 3 + SQLite
│   └── src/main/kotlin/com/warsaw/salon/
│       ├── model/               # Salon + Review entities, DTOs
│       ├── repository/          # JPA repositories (SalonRepository, ReviewRepository)
│       ├── service/             # Business logic + JSON seeder
│       └── controller/          # REST endpoints
└── frontend/                    # Next.js + TypeScript + Tailwind CSS
    ├── app/
    │   ├── page.tsx             # Listing page: search, filter, sort, pagination
    │   └── components/
    │       ├── SalonCard.tsx        # Card in the grid / list
    │       ├── DetailModal.tsx      # Detail view + edit form + reviews
    │       ├── AddSalonModal.tsx    # Create-a-salon form
    │       ├── MapView.tsx          # Interactive map of salons
    │       └── MapThumb.tsx         # Small map thumbnail in detail view
    └── lib/
        ├── api.ts               # Typed API client
        ├── favorites.tsx        # Favourites context (localStorage-backed)
        ├── geo.ts               # Haversine distance helper
        └── hours.ts             # "Open now" opening-hours parser
```

---

## 🛠 Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | **Kotlin + Spring Boot 3** | Type-safe, concise, industry standard on JVM |
| Database | **SQLite** (via JPA/Hibernate) | Zero-config, portable, fits the task scale |
| Frontend | **Next.js + TypeScript** | React with App Router, type-safe |
| Styling | **Tailwind CSS** | Fast, consistent, utility-first |
| Data | **OpenStreetMap Overpass API** | Free, no API key, 2000+ real Warsaw salons |

---

## 📊 Data Collection

**Source: OpenStreetMap via the Overpass API**

OpenStreetMap is a free, open map of the world maintained by volunteers — used in
production by Apple Maps, Uber, and Facebook. The Overpass API allows querying it by
area and shop type.

**Query used:** all nodes/ways tagged `shop=hairdresser`, `shop=beauty`,
`amenity=beauty_salon`, `shop=nail_salon`, or `shop=barber` inside Warsaw city boundaries.

**Why OpenStreetMap:**
- Completely free — no API key, no billing, no account needed
- Returned 2017 real Warsaw salons in a single request
- Tried Booksy first (blocked automated requests) and Google Places (required a paid billing setup)
- Production-grade data used by major tech companies

**Data quality handling:**
- Named businesses only — unnamed OSM nodes are skipped
- Deduplicated by business name
- District inferred from the Polish postcode prefix (e.g. `02-xxx` → Mokotów); nodes
  without a postcode fall back to "Warszawa"
- Service names cleaned up — underscores replaced with spaces, properly capitalised
- Missing fields (rating, price range) stored as `null`, never fabricated

> **Note on ratings & price:** OpenStreetMap does not provide ratings or price ranges,
> so those start empty. Ratings can be built up organically through the in-app review
> feature, or enriched from Google Places in a production setting.

---

## 🔮 What I'd Improve With More Time

1. **Ratings enrichment** — cross-reference with Google Places to backfill real ratings
2. **Better district resolution** — point-in-polygon against Warsaw district boundaries
   using each salon's lat/lon, instead of relying on the postcode prefix
3. **PostgreSQL + PostGIS** — replace SQLite for spatial queries at scale
4. **Auth + audit log** — track who edited what and when
5. **Automated tests** — Spring MockMvc for the API, Playwright for E2E
6. **Docker Compose** — single `docker compose up` to run everything

---

## 📈 Scaling to All of Poland

The scraper supports this with a one-line change — replace `"Warszawa"` with any Polish
city name in the Overpass query.

Production-scale approach:
1. Build a list of Poland's ~50 largest cities
2. Run the scraper in parallel for each city
3. Store in **PostgreSQL** with a `cities` table and a foreign key on `salons`
4. Schedule **weekly refresh jobs** (e.g. GitHub Actions cron)
5. Deduplicate across cities by `(name, coordinates)` with a small GPS tolerance
6. Enrich popular salons with Google Places ratings

Estimated coverage: ~50 cities × ~200 salons avg = **~10,000 salons**
