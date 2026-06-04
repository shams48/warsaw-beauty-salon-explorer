"use client"
import { useEffect, useState } from "react"
import {
  SalonDetail,
  fetchSalonDetail,
  updateSalon,
  Review,
  fetchReviews,
  createReview,
} from "@/lib/api"
import { isOpenNow, hoursLines } from "@/lib/hours"
import MapThumb from "./MapThumb"

interface Props {
  salonId: number
  onClose: () => void
  onChanged?: () => void
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 font-semibold">
      {"★".repeat(Math.round(rating))}
      {"☆".repeat(Math.max(0, 5 - Math.round(rating)))}{" "}
      <span className="text-gray-600">{rating.toFixed(1)}</span>
    </span>
  )
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="text-2xl leading-none" aria-label={`${n} stars`}>
          <span className={n <= value ? "text-amber-400" : "text-gray-300"}>★</span>
        </button>
      ))}
    </div>
  )
}

function formatService(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function serviceIcon(s: string): string {
  const map: Record<string, string> = {
    Haircut: "✂️", "Hair Coloring": "🎨", "Blow Dry": "💨",
    "Beauty Treatments": "✨", Facial: "🧖", Makeup: "💄",
    Waxing: "🪮", Manicure: "💅", Pedicure: "🦶",
    "Gel Nails": "💅", Massage: "💆", Spa: "🛁",
    Barbering: "🪒", "Beard Trim": "🧔", Shave: "🪒",
  }
  return map[s] ?? "💆"
}

function wheelchairInfo(w: string | null): { icon: string; text: string } | null {
  if (w === "yes") return { icon: "♿", text: "Wheelchair accessible" }
  if (w === "limited") return { icon: "♿", text: "Partially accessible" }
  if (w === "no") return { icon: "🚫", text: "Not wheelchair accessible" }
  return null
}

export default function DetailModal({ salonId, onClose, onChanged }: Props) {
  const [salon, setSalon] = useState<SalonDetail | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saveMsg, setSaveMsg] = useState("")
  const [errMsg, setErrMsg] = useState("")
  const [saving, setSaving] = useState(false)

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewForm, setReviewForm] = useState({ author: "", rating: 5, comment: "" })
  const [postingReview, setPostingReview] = useState(false)
  const [reviewErr, setReviewErr] = useState("")

  const loadDetail = () =>
    fetchSalonDetail(salonId).then((s) => {
      setSalon(s)
      setForm({
        name: s.name,
        address: s.address,
        district: s.district,
        phone: s.phone ?? "",
        website: s.website ?? "",
        priceRange: s.priceRange ?? "",
        services: s.services.join(", "),
      })
    })

  useEffect(() => {
    loadDetail()
    fetchReviews(salonId).then(setReviews).catch(() => setReviews([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId])

  const handleSave = async () => {
    if (!salon) return
    setSaving(true)
    setErrMsg("")
    setSaveMsg("")
    try {
      const updated = await updateSalon(salonId, {
        name: form.name,
        address: form.address,
        district: form.district,
        phone: form.phone || undefined,
        website: form.website || undefined,
        priceRange: form.priceRange || undefined,
        services: form.services.split(",").map((s) => s.trim()).filter(Boolean),
      })
      setSalon(updated)
      setEditing(false)
      setSaveMsg("✓ Changes saved!")
      onChanged?.()
      setTimeout(() => setSaveMsg(""), 3000)
    } catch {
      setErrMsg("Failed to save. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddReview = async () => {
    setPostingReview(true)
    setReviewErr("")
    try {
      await createReview(salonId, {
        author: reviewForm.author.trim() || "Anonymous",
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim() || undefined,
      })
      setReviewForm({ author: "", rating: 5, comment: "" })
      const [, fresh] = await Promise.all([loadDetail(), fetchReviews(salonId)])
      setReviews(fresh)
      onChanged?.()
    } catch {
      setReviewErr("Failed to submit review. Is the backend running?")
    } finally {
      setPostingReview(false)
    }
  }

  const field = (key: string, label: string, type = "text") => (
    <div key={key}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[key] ?? ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
      />
    </div>
  )

  const open = salon ? isOpenNow(salon.openingHours, salon.lat, salon.lon) : null
  const hours = salon ? hoursLines(salon.openingHours) : []
  const wheelchair = salon ? wheelchairInfo(salon.wheelchair) : null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {!salon ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : (
          <>
            <MapThumb lat={salon.lat} lon={salon.lon} className="w-full h-32 rounded-xl mb-4" />
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-2 pr-4">
                <h2 className="text-xl font-bold">{salon.name}</h2>
                {open != null && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      open ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {open ? "Open now" : "Closed"}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1 rounded-lg hover:bg-gray-100">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="📍 Address">
                {salon.address}
                {salon.zipcode ? `, ${salon.zipcode}` : ""}, {salon.city}
              </Row>
              <Row label="🏘 District">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-0.5 rounded-full">{salon.district}</span>
              </Row>
              {hours.length > 0 && (
                <Row label="⏰ Hours">
                  <div className="space-y-0.5">
                    {hours.map((h, i) => (
                      <div key={i} className="text-gray-700">
                        {h}
                      </div>
                    ))}
                  </div>
                </Row>
              )}
              {wheelchair && (
                <Row label="♿ Access">
                  <span className="text-gray-700">
                    {wheelchair.icon} {wheelchair.text}
                  </span>
                </Row>
              )}
              {salon.phone && <Row label="📞 Phone">{salon.phone}</Row>}
              {salon.website && (
                <Row label="🌐 Website">
                  <a href={salon.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline break-all">
                    {salon.website}
                  </a>
                </Row>
              )}
              {salon.email && (
                <Row label="✉️ Email">
                  <a href={`mailto:${salon.email}`} className="text-indigo-600 hover:underline break-all">
                    {salon.email}
                  </a>
                </Row>
              )}
              {salon.priceRange && <Row label="💰 Price">{salon.priceRange}</Row>}
              {salon.rating != null && (
                <Row label="⭐ Rating">
                  <Stars rating={salon.rating} />
                  {salon.reviews != null && <span className="text-gray-400 text-xs ml-1">({salon.reviews} review{salon.reviews !== 1 ? "s" : ""})</span>}
                </Row>
              )}

              <Row label="✂️ Services">
                {salon.services.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {salon.services.map((s) => {
                      const label = formatService(s)
                      return (
                        <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                          {serviceIcon(label)} {label}
                        </span>
                      )
                    })}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs italic">Not listed — contact salon directly</span>
                )}
              </Row>
            </div>

            {/* Reviews */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">
                Reviews {reviews.length > 0 && <span className="text-gray-400 font-normal">({reviews.length})</span>}
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-800">{r.author}</span>
                        <span className="text-amber-400 text-xs">{"★".repeat(r.rating)}<span className="text-gray-300">{"★".repeat(5 - r.rating)}</span></span>
                      </div>
                      {r.comment && <p className="text-gray-600 text-sm mt-1">{r.comment}</p>}
                      <p className="text-gray-300 text-[11px] mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm mb-4">No reviews yet — be the first to leave one.</p>
              )}

              <div className="bg-indigo-50/60 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700">Leave a review</p>
                <input
                  value={reviewForm.author}
                  onChange={(e) => setReviewForm((f) => ({ ...f, author: e.target.value }))}
                  placeholder="Your name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                />
                <StarInput value={reviewForm.rating} onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))} />
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  rows={2}
                  placeholder="Share your experience (optional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none bg-white"
                />
                {reviewErr && <p className="text-red-500 text-xs">{reviewErr}</p>}
                <button
                  onClick={handleAddReview}
                  disabled={postingReview}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {postingReview ? "Posting…" : "Post review"}
                </button>
              </div>
            </div>

            {saveMsg && <p className="mt-3 text-green-600 text-sm font-medium">{saveMsg}</p>}

            {/* Edit */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                  ✏️ Edit Details
                </button>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Edit Salon Details</h3>
                  {field("name", "Name")}
                  {field("address", "Address")}
                  {field("district", "District")}
                  {field("phone", "Phone")}
                  {field("website", "Website")}
                  {field("priceRange", "Price Range (e.g. $$)")}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Services (comma-separated)</label>
                    <textarea
                      value={form.services}
                      onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    />
                  </div>
                  {errMsg && <p className="text-red-500 text-xs">{errMsg}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                    <button onClick={() => { setEditing(false); setErrMsg("") }} className="border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-28 shrink-0 text-xs pt-0.5">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  )
}
