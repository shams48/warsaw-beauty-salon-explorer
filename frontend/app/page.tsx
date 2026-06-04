"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { fetchSalons, fetchMeta, SalonSummary } from "@/lib/api"
import { useFavorites } from "@/lib/favorites"
import { haversineMeters, formatDistance } from "@/lib/geo"
import { isOpenNow } from "@/lib/hours"
import DetailModal from "./components/DetailModal"
import MapView from "./components/MapView"
import AddSalonModal from "./components/AddSalonModal"

const LIMIT = 8

// Map the human sort labels to the backend `sort` keys. "Nearest" is handled client-side.
const SORT_KEYS: Record<string, string> = {
  "Most Popular": "popular",
  "Highest Rated": "rating",
  "A–Z": "name",
}

type Tab = "salons" | "map" | "favorites" | "about"
type UserLoc = { lat: number; lon: number }

// Aesthetic placeholder photos (Unsplash) — picked deterministically by salon id
const SALON_PHOTOS = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&q=80",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=500&q=80",
  "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=500&q=80",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=500&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=500&q=80",
  "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&q=80",
]

function getPhoto(id: number) {
  return SALON_PHOTOS[id % SALON_PHOTOS.length]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-amber-400">★</span>
      <span className="font-semibold text-gray-800">{rating.toFixed(1)}</span>
    </span>
  )
}

function ServiceTag({ label }: { label: string }) {
  const clean = label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
      {clean}
    </span>
  )
}

function OpenBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
        open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={open ? "text-green-500" : "text-gray-400"}>●</span>
      {open ? "Open now" : "Closed"}
    </span>
  )
}

function SalonCard({
  salon,
  onClick,
  view,
  userLoc,
}: {
  salon: SalonSummary
  onClick: () => void
  view: "grid" | "list"
  userLoc: UserLoc | null
}) {
  const { isFavorite, toggle } = useFavorites()
  const fav = isFavorite(salon.id)
  const open = isOpenNow(salon.openingHours, salon.lat, salon.lon)
  const services = ["Hair", "Coloring", "Styling", "Nails", "Facial", "Makeup", "Waxing", "Spa"]
  const salonServices = services.filter((_, i) => (salon.id + i) % 3 === 0).slice(0, 3)

  const distance =
    userLoc && salon.lat != null && salon.lon != null
      ? haversineMeters(userLoc.lat, userLoc.lon, salon.lat, salon.lon)
      : null

  const ratingEl =
    salon.rating != null ? (
      <StarRating rating={salon.rating} />
    ) : (
      <span className="text-xs font-medium text-gray-400">New</span>
    )

  const heart = (extra: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggle(salon.id)
      }}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={extra}
    >
      <span className={fav ? "text-red-500" : "text-gray-400 hover:text-red-400"}>{fav ? "♥" : "♡"}</span>
    </button>
  )

  if (view === "list") {
    return (
      <div
        onClick={onClick}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 p-4"
      >
        <img src={getPhoto(salon.id)} alt={salon.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{salon.name}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {ratingEl}
              {heart("text-lg leading-none")}
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-0.5 truncate">{salon.address}</p>
          <div className="flex flex-wrap gap-1.5 mt-2 items-center">
            {open != null && <OpenBadge open={open} />}
            {salonServices.map((s) => (
              <ServiceTag key={s} label={s} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span>📍</span> {salon.district}
              {distance != null && <span className="text-purple-500 font-medium ml-1">· {formatDistance(distance)}</span>}
            </span>
            <button className="text-purple-600 text-xs font-semibold hover:text-purple-800">View Details →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer overflow-hidden group"
    >
      <div className="relative h-44 overflow-hidden">
        <img src={getPhoto(salon.id)} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3 flex gap-2">
          {open != null && <OpenBadge open={open} />}
          {distance != null && (
            <span className="bg-white/90 backdrop-blur text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {formatDistance(distance)}
            </span>
          )}
        </div>
        {heart(
          "absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 truncate text-sm">{salon.name}</h3>
          {ratingEl}
        </div>
        <p className="text-gray-400 text-xs mb-3 truncate">{salon.address}</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {salonServices.map((s) => (
            <ServiceTag key={s} label={s} />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 flex items-center gap-1">📍 {salon.district}</span>
          <button className="text-purple-600 text-xs font-semibold hover:text-purple-800">View Details →</button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [salons, setSalons] = useState<SalonSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [district, setDistrict] = useState("")
  const [service, setService] = useState("")
  const [districts, setDistricts] = useState<string[]>([])
  const [services, setServices] = useState<string[]>([])
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sort, setSort] = useState("Most Popular")
  const [searchInput, setSearchInput] = useState("")

  const [tab, setTab] = useState<Tab>("salons")
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState("")

  // Full dataset (lazy-loaded) used by Map, Favorites, and the Nearest sort
  const [allSalons, setAllSalons] = useState<SalonSummary[]>([])
  const [allLoaded, setAllLoaded] = useState(false)
  const [allLoading, setAllLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Geolocation
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null)
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle")

  const { favorites, isFavorite } = useFavorites()

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("denied")
      return
    }
    setGeoStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoStatus("granted")
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    fetchMeta().then((m) => {
      setDistricts(m.districts)
      setServices(m.services)
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchSalons({ district, service, search, sort: SORT_KEYS[sort], page, limit: LIMIT })
      setSalons(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [district, service, search, sort, page, refresh])

  // Skip the server fetch entirely when sorting by distance (handled client-side)
  useEffect(() => {
    if (sort !== "Nearest") load()
  }, [load, sort])

  const ensureAll = useCallback(async () => {
    setAllLoading(true)
    try {
      const res = await fetchSalons({ limit: 5000 })
      setAllSalons(res.data)
      setAllLoaded(true)
    } finally {
      setAllLoading(false)
    }
  }, [])

  // Load the full dataset when needed (Map, Favorites, or Nearest sort)
  useEffect(() => {
    const needsAll = tab === "map" || tab === "favorites" || sort === "Nearest"
    if (needsAll && !allLoaded && !allLoading) ensureAll()
  }, [tab, sort, allLoaded, allLoading, ensureAll])

  // When the user picks Nearest, ask for their location
  useEffect(() => {
    if (sort === "Nearest" && !userLoc && geoStatus === "idle") requestLocation()
  }, [sort, userLoc, geoStatus, requestLocation])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
    setTab("salons")
  }

  // Client-side distance sort
  const nearest = sort === "Nearest" && userLoc != null
  const sortedByDistance = useMemo(() => {
    if (!nearest || !userLoc) return [] as SalonSummary[]
    return allSalons
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => ({ s, d: haversineMeters(userLoc.lat, userLoc.lon, s.lat as number, s.lon as number) }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.s)
  }, [nearest, userLoc, allSalons])

  const displaySalons = nearest ? sortedByDistance.slice((page - 1) * LIMIT, page * LIMIT) : salons
  const displayTotal = nearest ? sortedByDistance.length : total
  const totalPages = Math.ceil(displayTotal / LIMIT)
  const showLoading = sort === "Nearest" ? geoStatus === "loading" || (allLoading && !allLoaded) : loading

  const favSalons = allSalons.filter((s) => isFavorite(s.id))
  const mappable = allSalons.filter((s) => s.lat != null && s.lon != null).length

  const navTabs: { key: Tab; label: string }[] = [
    { key: "salons", label: "⌂ Salons" },
    { key: "map", label: "🗺 Map" },
    { key: "favorites", label: `♡ Favorites${favorites.length ? ` (${favorites.length})` : ""}` },
    { key: "about", label: "About" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => setTab("salons")} className="flex items-center gap-2 text-left">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">✿</span>
            </div>
            <div>
              <span className="font-bold text-gray-900">Warsaw </span>
              <span className="font-bold text-purple-600">Beauty Salon Explorer</span>
              <p className="text-xs text-gray-400 leading-none">Discover the best hair & beauty salons across Warsaw</p>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-6">
            {navTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? "text-sm font-medium text-purple-600 border-b-2 border-purple-600 pb-0.5"
                    : "text-sm font-medium text-gray-500 hover:text-gray-900"
                }
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setShowAdd(true)}
              className="bg-white border-2 border-purple-600 text-purple-600 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              + Add Salon
            </button>
          </div>
        </div>
      </nav>

      {/* ───────────────── Salons tab ───────────────── */}
      {tab === "salons" && (
        <>
          {/* Hero */}
          <div className="relative pt-16 h-[420px] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent" />
            <div className="relative max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
              <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-2">Find Your Perfect</h1>
              <h2 className="text-5xl font-bold italic text-purple-600 leading-tight mb-4">Beauty Experience</h2>
              <p className="text-gray-600 text-lg mb-8">
                Explore top-rated hair & beauty salons
                <br />
                <strong>near you in Warsaw</strong> ♡
              </p>

              {/* Search bar */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 flex flex-wrap gap-2 max-w-3xl">
                <input
                  className="flex-1 min-w-48 px-4 py-2 text-sm text-gray-700 placeholder-gray-400 outline-none"
                  placeholder="🔍 Search by salon name, service or address..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none bg-white min-w-36"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">📍 All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 outline-none bg-white min-w-36"
                  value={service}
                  onChange={(e) => {
                    setService(e.target.value)
                    setPage(1)
                  }}
                >
                  <option value="">✂️ All Services</option>
                  {services.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-6 py-2 rounded-xl transition-colors flex items-center gap-2"
                >
                  ☰ Search
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="bg-white border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "🏪", value: total.toLocaleString(), label: "Salons Found" },
                { icon: "🗺", value: "18", label: "Districts" },
                { icon: "⏰", value: "Live", label: "Open-now hours" },
                { icon: "📍", value: "Real", label: "Map locations" },
              ].map(({ icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="font-bold text-xl text-gray-900">{value}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Featured Salons <span className="text-purple-500">✦</span>
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {showLoading ? "Loading…" : `${displayTotal} salon${displayTotal !== 1 ? "s" : ""} found · Page ${page} of ${totalPages || 1}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Near me */}
                <button
                  onClick={() => {
                    setSort("Nearest")
                    setPage(1)
                    requestLocation()
                  }}
                  className={`text-sm font-semibold px-3 py-2 rounded-lg border transition-colors ${
                    sort === "Nearest"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  📍 Near me
                </button>
                {/* View toggle */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView("grid")}
                    className={`px-3 py-2 text-sm transition-colors ${
                      view === "grid" ? "bg-purple-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    ⊞
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`px-3 py-2 text-sm transition-colors ${
                      view === "list" ? "bg-purple-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    ☰
                  </button>
                </div>
                {/* Sort */}
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none bg-white"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value)
                    setPage(1)
                  }}
                >
                  <option>Most Popular</option>
                  <option>Highest Rated</option>
                  <option>A–Z</option>
                  <option>Nearest</option>
                </select>
              </div>
            </div>

            {/* Location prompt when Nearest is selected but no location yet */}
            {sort === "Nearest" && geoStatus === "denied" && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
                Location access was blocked, so we can&apos;t sort by distance. Enable location for this site, then{" "}
                <button onClick={requestLocation} className="underline font-semibold">
                  try again
                </button>
                .
              </div>
            )}

            {/* Active filters */}
            {(search || district || service) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {search && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    &quot;{search}&quot;{" "}
                    <button
                      onClick={() => {
                        setSearch("")
                        setSearchInput("")
                      }}
                      className="ml-1 hover:text-purple-900"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {district && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    📍 {district}{" "}
                    <button onClick={() => setDistrict("")} className="ml-1 hover:text-purple-900">
                      ✕
                    </button>
                  </span>
                )}
                {service && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                    ✂️ {service}{" "}
                    <button onClick={() => setService("")} className="ml-1 hover:text-purple-900">
                      ✕
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Grid / List */}
            {showLoading ? (
              <div className="text-center py-20 text-gray-400">Loading salons…</div>
            ) : displaySalons.length === 0 ? (
              <div className="text-center py-20 text-gray-400">No salons found. Try different filters.</div>
            ) : (
              <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" : "flex flex-col gap-3"}>
                {displaySalons.map((s) => (
                  <SalonCard key={s.id} salon={s} onClick={() => setSelectedId(s.id)} view={view} userLoc={userLoc} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10 flex-wrap">
                <Pg onClick={() => setPage(1)} disabled={page === 1}>
                  «
                </Pg>
                <Pg onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                  ‹
                </Pg>
                {pageRange(page, totalPages).map((p) => (
                  <Pg key={p} onClick={() => setPage(p)} active={p === page}>
                    {p}
                  </Pg>
                ))}
                <Pg onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>
                  ›
                </Pg>
                <Pg onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                  »
                </Pg>
              </div>
            )}

            {/* CTA banner */}
            <div className="mt-12 bg-purple-50 border border-purple-100 rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl">💎</div>
                <div>
                  <p className="font-semibold text-gray-900">Can&apos;t find what you&apos;re looking for?</p>
                  <p className="text-sm text-gray-500">Try adjusting your search or explore all salons on the map.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setTab("map")}
                  className="border border-purple-300 text-purple-700 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-2"
                >
                  🗺 View on Map
                </button>
                <button
                  onClick={() => {
                    setSearch("")
                    setDistrict("")
                    setService("")
                    setSearchInput("")
                    setPage(1)
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  Explore All Salons →
                </button>
              </div>
            </div>
          </main>
        </>
      )}

      {/* ───────────────── Map tab ───────────────── */}
      {tab === "map" && (
        <div className="pt-24 max-w-7xl mx-auto px-6 pb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Salons on the Map <span className="text-purple-500">🗺</span>
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {allLoading ? "Loading map…" : `${mappable.toLocaleString()} salons plotted · click a pin for details`}
              </p>
            </div>
            <button onClick={() => setTab("salons")} className="text-sm text-purple-600 font-semibold hover:text-purple-800">
              ← Back to list
            </button>
          </div>
          <MapView salons={allSalons} onSelect={setSelectedId} />
        </div>
      )}

      {/* ───────────────── Favorites tab ───────────────── */}
      {tab === "favorites" && (
        <div className="pt-24 max-w-7xl mx-auto px-6 pb-12 min-h-screen">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Your Favorites <span className="text-red-400">♥</span>
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">{favorites.length} saved salon{favorites.length !== 1 ? "s" : ""}</p>
          </div>
          {allLoading ? (
            <div className="text-center py-20 text-gray-400">Loading…</div>
          ) : favSalons.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">No favorites yet. Tap the ♡ on any salon to save it here.</p>
              <button
                onClick={() => setTab("salons")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Browse salons →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {favSalons.map((s) => (
                <SalonCard key={s.id} salon={s} onClick={() => setSelectedId(s.id)} view="grid" userLoc={userLoc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────── About tab ───────────────── */}
      {tab === "about" && (
        <div className="pt-24 max-w-3xl mx-auto px-6 pb-16 min-h-screen">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">About this project</h2>
          <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
            <p>
              <strong>Warsaw Beauty Salon Explorer</strong> collects real hair &amp; beauty salons across Warsaw, exposes
              them through a REST API, and presents them in a searchable, filterable interface.
            </p>
            <p>
              All salon data — names, addresses, districts, coordinates, opening hours and accessibility — comes from{" "}
              <strong>OpenStreetMap</strong> via the free Overpass API. Ratings are real too: they&apos;re computed from
              user reviews submitted in the app, not invented.
            </p>
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Tech stack</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Backend: Kotlin + Spring Boot 3 + SQLite (JPA/Hibernate)</li>
                <li>Frontend: Next.js + TypeScript + Tailwind CSS</li>
                <li>Map: Leaflet + OpenStreetMap tiles</li>
                <li>Data: Python scraper against the Overpass API</li>
              </ul>
            </div>
            <p className="text-gray-400 text-xs">Built as a home task for the SumUp Warsaw Accelerator Program.</p>
          </div>
        </div>
      )}

      {selectedId != null && (
        <DetailModal
          salonId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            setRefresh((x) => x + 1)
            setAllLoaded(false)
          }}
        />
      )}

      {showAdd && (
        <AddSalonModal
          districts={districts}
          onClose={() => setShowAdd(false)}
          onCreated={(created) => {
            setShowAdd(false)
            setAllLoaded(false) // map & favorites will refetch the full set
            setRefresh((x) => x + 1) // reload the current list
            setToast(`✓ "${created.name}" added`)
            setTimeout(() => setToast(""), 3000)
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[70] bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

function Pg({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
        ${
          active
            ? "bg-purple-600 text-white"
            : "bg-white border border-gray-200 text-gray-600 hover:bg-purple-50 hover:border-purple-300 disabled:opacity-40 disabled:cursor-not-allowed"
        }`}
    >
      {children}
    </button>
  )
}

function pageRange(current: number, total: number) {
  const range: number[] = []
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) range.push(i)
  return range
}
