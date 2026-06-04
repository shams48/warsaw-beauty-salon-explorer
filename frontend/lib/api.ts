// Types matching the Kotlin backend DTOs

export interface SalonSummary {
  id: number
  name: string
  address: string
  district: string
  rating: number | null
  reviews: number | null
  priceRange: string | null
  lat: number | null
  lon: number | null
  openingHours: string | null
  wheelchair: string | null
}

export interface SalonDetail extends SalonSummary {
  zipcode: string | null
  city: string | null
  phone: string | null
  website: string | null
  booksyUrl: string | null
  services: string[]
  lat: number | null
  lon: number | null
  email: string | null
}

export interface PagedResponse<T> {
  total: number
  page: number
  limit: number
  data: T[]
}

export interface MetaResponse {
  districts: string[]
  services: string[]
}

export interface SalonUpdateRequest {
  name?: string
  address?: string
  district?: string
  phone?: string
  website?: string
  services?: string[]
  priceRange?: string
  rating?: number
  reviews?: number
}

// ── API client ──────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"

export async function fetchSalons(params: {
  district?: string
  service?: string
  search?: string
  sort?: string
  page?: number
  limit?: number
}): Promise<PagedResponse<SalonSummary>> {
  const qs = new URLSearchParams()
  if (params.district) qs.set("district", params.district)
  if (params.service)  qs.set("serviceType", params.service)
  if (params.search)   qs.set("search",   params.search)
  if (params.sort)     qs.set("sort",     params.sort)
  if (params.page)     qs.set("page",     String(params.page))
  if (params.limit)    qs.set("limit",    String(params.limit))
  const res = await fetch(`${BASE}/salons?${qs}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch salons")
  return res.json()
}

export async function fetchSalonDetail(id: number): Promise<SalonDetail> {
  const res = await fetch(`${BASE}/salons/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Salon not found")
  return res.json()
}

export async function fetchMeta(): Promise<MetaResponse> {
  const res = await fetch(`${BASE}/salons/meta`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch meta")
  return res.json()
}

export async function updateSalon(id: number, body: SalonUpdateRequest): Promise<SalonDetail> {
  const res = await fetch(`${BASE}/salons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to update salon")
  return res.json()
}

export interface SalonCreateRequest {
  name: string
  address: string
  district: string
  zipcode?: string
  city?: string
  phone?: string
  website?: string
  services?: string[]
  priceRange?: string
  lat?: number
  lon?: number
}

export async function createSalon(body: SalonCreateRequest): Promise<SalonDetail> {
  const res = await fetch(`${BASE}/salons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to create salon")
  return res.json()
}

// ── Reviews ─────────────────────────────────────────────────
export interface Review {
  id: number
  author: string
  rating: number
  comment: string
  createdAt: number
}

export interface ReviewCreateRequest {
  author: string
  rating: number
  comment?: string
}

export async function fetchReviews(salonId: number): Promise<Review[]> {
  const res = await fetch(`${BASE}/salons/${salonId}/reviews`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch reviews")
  return res.json()
}

export async function createReview(salonId: number, body: ReviewCreateRequest): Promise<Review> {
  const res = await fetch(`${BASE}/salons/${salonId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error("Failed to submit review")
  return res.json()
}
