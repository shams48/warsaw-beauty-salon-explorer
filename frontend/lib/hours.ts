import OpeningHours from "opening_hours"

const WARSAW = { lat: 52.2297, lon: 21.0122 }

/**
 * Returns true/false if the salon is open right now, or null if we can't tell
 * (no hours, or an opening_hours string the parser can't handle).
 */
export function isOpenNow(
  oh: string | null | undefined,
  lat?: number | null,
  lon?: number | null
): boolean | null {
  if (!oh) return null
  try {
    const o = new OpeningHours(oh, {
      lat: lat ?? WARSAW.lat,
      lon: lon ?? WARSAW.lon,
      address: { country_code: "pl" },
    })
    return o.getState()
  } catch {
    return null
  }
}

/** Split "Mo-Fr 09:00-19:00; Sa 10:00-15:00" into readable lines. */
export function hoursLines(oh: string | null | undefined): string[] {
  if (!oh) return []
  return oh
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
}
