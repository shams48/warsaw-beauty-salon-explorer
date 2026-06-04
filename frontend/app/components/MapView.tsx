"use client"
import { useEffect, useRef } from "react"
import { SalonSummary } from "@/lib/api"

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
const CLUSTER_CSS = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"
const CLUSTER_CSS_DEFAULT = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"
const CLUSTER_JS = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"

declare global {
  interface Window {
    // Leaflet is loaded at runtime from a CDN
    L: any
  }
}

function loadCss(href: string) {
  if (typeof document === "undefined") return
  if (document.querySelector(`link[href="${href}"]`)) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = href
  document.head.appendChild(link)
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === "true") resolve()
      else {
        existing.addEventListener("load", () => resolve())
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)))
      }
      return
    }
    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.onload = () => {
      s.dataset.loaded = "true"
      resolve()
    }
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  )
}

export default function MapView({
  salons,
  onSelect,
}: {
  salons: SalonSummary[]
  onSelect: (id: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const clusterRef = useRef<any>(null)
  const salonsRef = useRef(salons)
  salonsRef.current = salons
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  function renderMarkers() {
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current)
      clusterRef.current = null
    }

    const cluster = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 })
    const icon = L.divIcon({
      className: "wbse-pin",
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#9333ea;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    })

    for (const s of salonsRef.current) {
      if (s.lat == null || s.lon == null) continue
      const marker = L.marker([s.lat as number, s.lon as number], { icon })
      marker.bindPopup(
        `<div style="min-width:160px">` +
          `<strong>${escapeHtml(s.name)}</strong><br/>` +
          `<span style="color:#666;font-size:12px">${escapeHtml(s.address)}</span><br/>` +
          `<a href="#" class="wbse-pin-link" style="color:#9333ea;font-weight:600;font-size:12px">View details →</a>` +
          `</div>`
      )
      marker.on("popupopen", (e: any) => {
        const el = e.popup.getElement()?.querySelector(".wbse-pin-link") as HTMLElement | null
        if (el) {
          el.addEventListener("click", (ev: Event) => {
            ev.preventDefault()
            onSelectRef.current(s.id)
          })
        }
      })
      cluster.addLayer(marker)
    }

    map.addLayer(cluster)
    clusterRef.current = cluster
  }

  // Initialise the map once on mount
  useEffect(() => {
    let cancelled = false
    loadCss(LEAFLET_CSS)
    loadCss(CLUSTER_CSS)
    loadCss(CLUSTER_CSS_DEFAULT)
    loadScript(LEAFLET_JS)
      .then(() => loadScript(CLUSTER_JS))
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return
        const L = window.L
        const map = L.map(containerRef.current).setView([52.2297, 21.0122], 12)
        mapRef.current = map
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)
        renderMarkers()
      })
      .catch((err) => console.error("Map failed to load:", err))

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        clusterRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-plot markers whenever the salon set changes
  useEffect(() => {
    renderMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salons])

  return (
    <div
      ref={containerRef}
      className="w-full h-[70vh] min-h-[480px] rounded-2xl overflow-hidden border border-gray-200"
      style={{ zIndex: 0 }}
    />
  )
}
