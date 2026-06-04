"use client"
import { useEffect, useRef, useState } from "react"

const TILE = 256

/**
 * A real map thumbnail: renders the OpenStreetMap raster tile that contains the
 * given coordinates and overlays a pin at the exact spot. No API key required.
 * (For production-scale traffic you'd use a tile provider with an API key —
 * OSM's tile server is fine for a demo.)
 */
export default function MapThumb({
  lat,
  lon,
  zoom = 16,
  className = "",
}: {
  lat: number | null
  lon: number | null
  zoom?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (lat == null || lon == null) {
    return (
      <div className={`bg-purple-50 flex items-center justify-center ${className}`}>
        <span className="text-3xl text-purple-300">✿</span>
      </div>
    )
  }

  const n = 2 ** zoom
  const xF = ((lon + 180) / 360) * n
  const latRad = (lat * Math.PI) / 180
  const yF = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  const xT = Math.floor(xF)
  const yT = Math.floor(yF)
  const fx = xF - xT // 0..1 within the tile
  const fy = yF - yT
  const url = `https://tile.openstreetmap.org/${zoom}/${xT}/${yT}.png`

  // Map the pin's tile-fraction onto the cover-scaled, centred tile
  const f = size.w && size.h ? Math.max(size.w / TILE, size.h / TILE) : 1
  const rendered = TILE * f
  const offX = (size.w - rendered) / 2
  const offY = (size.h - rendered) / 2
  const leftPct = size.w ? ((offX + fx * rendered) / size.w) * 100 : 50
  const topPct = size.h ? ((offY + fy * rendered) / size.h) * 100 : 50

  return (
    <div ref={ref} className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Map location" loading="lazy" className="w-full h-full object-cover" />
      <div
        className="absolute"
        style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: "translate(-50%, -50%)" }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-purple-600 border-2 border-white shadow-md" />
      </div>
    </div>
  )
}
