"use client"
import { useState } from "react"
import { createSalon, SalonDetail } from "@/lib/api"

interface Props {
  districts: string[]
  onClose: () => void
  onCreated: (salon: SalonDetail) => void
}

export default function AddSalonModal({ districts, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    phone: "",
    website: "",
    services: "",
    priceRange: "",
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const canSave = !!(form.name.trim() && form.address.trim() && form.district.trim())

  const submit = async () => {
    if (!canSave) {
      setErr("Name, address and district are required.")
      return
    }
    setSaving(true)
    setErr("")
    try {
      const created = await createSalon({
        name: form.name.trim(),
        address: form.address.trim(),
        district: form.district.trim(),
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
        priceRange: form.priceRange.trim() || undefined,
        services: form.services
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })
      onCreated(created)
    } catch {
      setErr("Failed to add salon. Make sure the backend is running on :8080.")
    } finally {
      setSaving(false)
    }
  }

  const field = (k: keyof typeof form, label: string, placeholder = "", required = false) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-5">
          <div>
            <h2 className="text-xl font-bold">Add a Salon</h2>
            <p className="text-xs text-gray-400 mt-0.5">Create a new salon record in the database.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {field("name", "Salon name", "e.g. Glamour Studio", true)}
          {field("address", "Address", "e.g. Marszałkowska 1", true)}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              District <span className="text-red-500">*</span>
            </label>
            <input
              list="wbse-districts"
              value={form.district}
              onChange={(e) => set("district", e.target.value)}
              placeholder="e.g. Mokotów"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
            />
            <datalist id="wbse-districts">
              {districts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          {field("phone", "Phone", "+48 ...")}
          {field("website", "Website", "https://...")}
          {field("priceRange", "Price range", "$, $$, $$$ or $$$$")}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Services (comma-separated)</label>
            <textarea
              value={form.services}
              onChange={(e) => set("services", e.target.value)}
              rows={2}
              placeholder="Haircut, Coloring, Manicure"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none"
            />
          </div>

          {err && <p className="text-red-500 text-xs">{err}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={submit}
              disabled={saving || !canSave}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Add Salon"}
            </button>
            <button
              onClick={onClose}
              className="border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
