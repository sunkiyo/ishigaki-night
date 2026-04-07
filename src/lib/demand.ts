export type DemandEntry = {
  date: string      // YYYY-MM-DD
  trends: number | null
  flight: number | null
  hotel: number | null
  note: string
  index: number
}

export type DemandSummary = {
  index: number
  status: 'hot' | 'warm' | 'normal' | 'cool'
  trends: number | null
  flight: number | null
  hotel: number | null
  updatedAt: string
}

export function calcIndex(t: number, p: number, h: number): number {
  const ps = Math.min(100, Math.max(0, (p - 10000) / 200))
  return Math.min(100, Math.max(0, Math.round(t * 0.5 + (100 - h) * 0.3 + ps * 0.2)))
}

export function getStatus(index: number): 'hot' | 'warm' | 'normal' | 'cool' {
  if (index >= 75) return 'hot'
  if (index >= 55) return 'warm'
  if (index >= 35) return 'normal'
  return 'cool'
}

// ── サンプル履歴データ（実際はdemand.jsonやDBから取得）──
const historyData: DemandEntry[] = [
  { date: '2025-12-22', trends: 45, flight: 18500, hotel: 55, note: 'クリスマス前', index: 0 },
  { date: '2025-12-29', trends: 78, flight: 24800, hotel: 20, note: '年末年始', index: 0 },
  { date: '2026-01-05', trends: 52, flight: 15200, hotel: 48, note: '', index: 0 },
  { date: '2026-01-12', trends: 41, flight: 13800, hotel: 62, note: '閑散期', index: 0 },
  { date: '2026-01-19', trends: 38, flight: 12500, hotel: 70, note: '', index: 0 },
  { date: '2026-01-26', trends: 44, flight: 13200, hotel: 65, note: '', index: 0 },
  { date: '2026-02-02', trends: 50, flight: 14500, hotel: 58, note: '', index: 0 },
  { date: '2026-02-09', trends: 55, flight: 15800, hotel: 52, note: '', index: 0 },
  { date: '2026-02-16', trends: 58, flight: 16200, hotel: 45, note: '', index: 0 },
  { date: '2026-02-23', trends: 63, flight: 17400, hotel: 40, note: '', index: 0 },
  { date: '2026-03-09', trends: 68, flight: 18900, hotel: 35, note: '春休み前', index: 0 },
  { date: '2026-03-16', trends: 74, flight: 21500, hotel: 28, note: '繁忙期入り', index: 0 },
].map((d) => ({
  ...d,
  index: calcIndex(d.trends ?? 0, d.flight ?? 15000, d.hotel ?? 50),
}))

export async function getDemandHistory(): Promise<DemandEntry[]> {
  return historyData
}

export async function getLatestDemand(): Promise<DemandSummary> {
  const latest = historyData[historyData.length - 1]
  return {
    index: latest.index,
    status: getStatus(latest.index),
    trends: latest.trends,
    flight: latest.flight,
    hotel: latest.hotel,
    updatedAt: latest.date,
  }
}
