// Display formatting shared by every screen. All inputs are seconds or ISO strings from the API.

const MINUTE = 60
const HOUR = 3600
const DAY = 86400

/** "30:00", "1:05:09". Used for held time and timers. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / HOUR)
  const m = Math.floor((s % HOUR) / MINUTE)
  const sec = s % MINUTE
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

/** Whole hours with thousands separators: "138h", "1,240h". Under an hour shows minutes: "45m". */
export function hours(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  if (s < HOUR) return `${Math.floor(s / MINUTE)}m`
  return `${Math.floor(s / HOUR).toLocaleString('en-US')}h`
}

/** Short duration in minutes for lists: "30m", "45m", "1h 20m". */
export function minutes(totalSeconds: number): string {
  const total = Math.round(Math.max(0, totalSeconds) / MINUTE)
  if (total < 60) return `${total}m`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/** Long form for settings: "30 minutes", "1 hour", "1 hour 30 minutes". */
export function durationLong(totalSeconds: number): string {
  const total = Math.round(Math.max(0, totalSeconds) / MINUTE)
  const h = Math.floor(total / 60)
  const m = total % 60
  const parts: string[] = []
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`)
  if (m || !h) parts.push(`${m} minute${m === 1 ? '' : 's'}`)
  return parts.join(' ')
}

/** Practice tenure from a start date: "8m", "1y 2m", "6y". Minimum "1m". */
export function tenure(since: string, now: Date = new Date()): string {
  const start = new Date(`${since.slice(0, 10)}T00:00:00`)
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  months = Math.max(1, months)
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0 || y >= 3) return `${y}y`
  return `${y}y ${m}m`
}

/** Compact age: "now", "12m", "4h", "1d", "3w". */
export function ago(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000)
  if (diff < MINUTE) return 'now'
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`
  return `${Math.floor(diff / (7 * DAY))}w`
}

/** "4h ago", "just now". */
export function agoLong(iso: string, now: Date = new Date()): string {
  const short = ago(iso, now)
  return short === 'now' ? 'just now' : `${short} ago`
}

/** "Tue". */
export function weekdayShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' })
}

/** "Tuesday, 19:40" */
export function weekdayTime(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-GB', { weekday: 'long' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day}, ${time}`
}

/** "July 2025" */
export function monthYear(isoDate: string): string {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

/** "Morning" | "Afternoon" | "Evening" | "Night", in the viewer's local time. */
export function timeOfDay(iso: string): string {
  const h = new Date(iso).getHours()
  if (h >= 5 && h < 12) return 'Morning'
  if (h >= 12 && h < 17) return 'Afternoon'
  if (h >= 17 && h < 22) return 'Evening'
  return 'Night'
}

/** Integer percentage of a part in a whole, never NaN. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}
