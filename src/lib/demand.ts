export type DemandEntry = {
  date: string      // YYYY-MM-DD
  trends: number | null
  flight: number | null
  hotel: number | null
  note: string
  index: number
  isForecast?: boolean
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
  if (index >= 85) return 'hot'
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
  { date: '2026-03-23', trends: 76, flight: 22800, hotel: 22, note: '春休みピーク', index: 0 },
  { date: '2026-03-30', trends: 82, flight: 25600, hotel: 15, note: '春休みピーク継続', index: 0 },
  { date: '2026-04-06', trends: 71, flight: 21200, hotel: 25, note: 'GW直前', index: 0 },
  { date: '2026-04-13', trends: 88, flight: 28500, hotel: 10, note: 'GW前半（予測）', isForecast: true, index: 0 },
  { date: '2026-04-20', trends: 92, flight: 31000, hotel: 8,  note: 'GWピーク（予測）', isForecast: true, index: 0 },
  { date: '2026-04-27', trends: 89, flight: 29000, hotel: 12, note: 'GW後半（予測）', isForecast: true, index: 0 },
  { date: '2026-05-04', trends: 85, flight: 26000, hotel: 18, note: 'GW最終週（予測）', isForecast: true, index: 0 },
  { date: '2026-05-11', trends: 62, flight: 18000, hotel: 38, note: 'GW明け（予測）',    isForecast: true, index: 0 },
  { date: '2026-05-18', trends: 52, flight: 16200, hotel: 48, note: '5月中旬（予測）',   isForecast: true, index: 0 },
  { date: '2026-05-25', trends: 44, flight: 14800, hotel: 58, note: '5月末（予測）',     isForecast: true, index: 0 },
  { date: '2026-06-01', trends: 36, flight: 13500, hotel: 65, note: '梅雨入り前（予測）', isForecast: true, index: 0 },
].map((d) => ({
  ...d,
  index: calcIndex(d.trends ?? 0, d.flight ?? 15000, d.hotel ?? 50),
}))

export async function getDemandHistory(): Promise<DemandEntry[]> {
  return historyData
}

export async function getLatestDemand(): Promise<DemandSummary> {
  const latest = [...historyData].reverse().find((d) => !d.isForecast) ?? historyData[historyData.length - 1]
  return {
    index: latest.index,
    status: getStatus(latest.index),
    trends: latest.trends,
    flight: latest.flight,
    hotel: latest.hotel,
    updatedAt: latest.date,
  }
}
