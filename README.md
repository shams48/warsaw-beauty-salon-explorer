# 🌸 Warsaw Beauty Salon Explorer

A full-stack web application to browse, search, filter, and manage beauty salons in Warsaw.  
Built with **Kotlin + Spring Boot** on the backend and **Next.js + TypeScript** on the frontend.

---

## 🚀 Quick Start

### Prerequisites
| Tool | Version |
|------|---------|
| Java (JDK) | 17+ |
| Node.js | 18+ |
| Python | 3.9+ (for scraper only) |

---

### Step 1 — Collect real salon data

```bash
cd scraper
pip install requests
python scrape_osm.py
# → fetches 2000+ real Warsaw salons from OpenStreetMap
# → writes ../data/salons.json
```

> The repo ships with `data/salons.json` already populated with 2017 real salons.
> Re-run the scraper any time to refresh the data.

---

### Step 2 — Start the backend (Kotlin / Spring Boot)

```bash
cd backend

# Windows
.\gradlew.bat bootRun

# Mac / Linux
./gradlew bootRun
```

- First run downloads Gradle and dependencies (~2 min). Subsequent runs are fast.
- API available at: **http://localhost:8080**
- On first startup, automatically seeds `salons.db` from `data/salons.json`

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
| `PATCH` | `/api/salons/{id}` | Partially update a salon |

### Query params for `GET /api/salons`
| Param | Example | Description |
|-------|---------|-------------|
| `district` | `Mokotów` | Filter by district (exact, case-insensitive) |
| `serviceType` | `Manicure` | Filter by service (substring match) |
| `search` | `beauty` | Full-text search on name, address, district |
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

# Full-text search
curl "http://localhost:8080/api/salons?search=beauty"

# Salon detail
curl http://localhost:8080/api/salons/1

# Update a salon
curl -X PATCH http://localhost:8080/api/salons/1 \
  -H "Content-Type: application/json" \
  -d '{"phone": "+48 500-000-001", "priceRange": "$$$"}'
```

---

## 🏗 Architecture

```
warsaw-v2/
├── scraper/
│   ├── scrape_osm.py        # Main scraper — OpenStreetMap Overpass API
│   ├── scrape_booksy.py     # Alternative scraper — Booksy (blocked)
│   ├── scrape_google_places.py  # Alternative scraper — Google Places API
│   └── generate_seed.py     # Seed data generator (fallback / demo)
├── data/
│   └── salons.json          # 2017 real Warsaw salons collected from OSM
├── backend/                 # Kotlin + Spring Boot 3 + SQLite
│   └── src/main/kotlin/com/warsaw/salon/
│       ├── model/           # Salon entity + DTOs
│       ├── repository/      # JPA repository with JPQL filters
│       ├── service/         # Business logic + JSON seeder
│       └── controller/      # REST endpoints
└── frontend/                # Next.js 14 + TypeScript + Tailwind CSS
    ├── app/
    │   ├── page.tsx              # Listing page with search/filter/pagination
    │   └── components/
    │       ├── SalonCard.tsx     # Card in the grid
    │       └── DetailModal.tsx   # Detail view + edit form
    └── lib/api.ts           # Typed API client
```

---

## 🛠 Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | **Kotlin + Spring Boot 3** | Type-safe, concise, industry standard on JVM |
| Database | **SQLite** (via JPA/Hibernate) | Zero-config, portable, fits the task scale |
| Frontend | **Next.js 14** + TypeScript | React with App Router, SSR-ready, type-safe |
| Styling | **Tailwind CSS** | Fast, consistent, utility-first |
| Data | **OpenStreetMap Overpass API** | Free, no API key, 2000+ real Warsaw salons |

---

## 📊 Data Collection

**Source: OpenStreetMap via Overpass API**

OpenStreetMap is a free, open map of the world maintained by volunteers — used in production by Apple Maps, Uber, and Facebook. The Overpass API allows querying it by area and shop type.

**Query used:**
```
All nodes tagged shop=hairdresser, shop=beauty, amenity=beauty_salon,
shop=nail_salon, or shop=barber inside Warsaw city boundaries
```

**Why OpenStreetMap:**
- Completely free — no API key, no billing, no account needed
- Returned 2017 real Warsaw salons in a single request
- Tried Booksy first (blocked automated requests) and Google Places (required €45 prepayment)
- Production-grade data used by major tech companies

**Data quality handling:**
- Named businesses only — unnamed OSM nodes are skipped
- Deduplication by business name to remove duplicates
- District inferred from Polish postcode prefix (e.g. 02-xxx → Mokotów)
- Service names cleaned up — underscores replaced with spaces, properly capitalized
- Missing fields (rating, price range) stored as `null`, never fake values

---

## 🔮 What I'd Improve With More Time

1. **Map view** — Leaflet.js with pins; every salon has lat/lon coordinates
2. **Ratings enrichment** — cross-reference with Google Places API to add real ratings
3. **PostgreSQL + PostGIS** — replace SQLite for spatial queries ("nearest salon to me")
4. **Docker Compose** — single `docker compose up` to run everything
5. **Auth + audit log** — track who edited what and when
6. **Tests** — Spring MockMvc for API, Playwright for E2E
7. **Favourites** — save preferred salons locally

---

## 📈 Scaling to All of Poland

The scraper supports this with one line change — replace `"Warszawa"` with any Polish city name in the Overpass query.

Production-scale approach:
1. Build a list of Poland's 50 largest cities
2. Run the scraper in parallel for each city
3. Store in **PostgreSQL** with a `cities` table and foreign key on `salons`
4. Schedule **weekly refresh jobs** via GitHub Actions cron
5. Deduplicate across cities by `(name, coordinates)` with small GPS tolerance
6. Enrich top salons with Google Places ratings

Estimated coverage: ~50 Polish cities × ~200 salons avg = **~10,000 salons**
