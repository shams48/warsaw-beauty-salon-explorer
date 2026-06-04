"use client"
import { SalonSummary } from "@/lib/api"

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 font-semibold text-sm">
      {"★".repeat(Math.floor(rating))}
      {rating % 1 >= 0.5 ? "½" : ""}
      <span className="text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}

const priceColor: Record<string, string> = {
  "$":    "bg-green-100 text-green-800",
  "$$":   "bg-lime-100 text-lime-800",
  "$$$":  "bg-yellow-100 text-yellow-800",
  "$$$$": "bg-orange-100 text-orange-800",
}

interface Props {
  salon: SalonSummary
  onClick: () => void
}

export default function SalonCard({ salon, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm border border-transparent hover:border-indigo-400 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
    >
      <h3 className="font-semibold text-base mb-1 truncate">{salon.name}</h3>
      <p className="text-gray-500 text-xs mb-3 truncate">{salon.address}</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {salon.district}
        </span>
        {salon.priceRange && (
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${priceColor[salon.priceRange] ?? "bg-gray-100 text-gray-700"}`}>
            {salon.priceRange}
          </span>
        )}
        {salon.rating != null && <Stars rating={salon.rating} />}
        {salon.reviews != null && (
          <span className="text-xs text-gray-400">({salon.reviews})</span>
        )}
      </div>
    </div>
  )
}
