export type DemandEntry = {
  date: string      // YYYY-MM-DD
  trends: number | null
  flight: number | null
  hotel: number | null
  note: string
  index: number
  isForecast?: boolean
  confidence?: number  // 0〜1: 信頼度（実績=1.0、予測は週が遠いほど低下）
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

// 予測エントリの信頼度（週順: 1週目=0.88, 2週目=0.76, ..., 8週目=0.18）
const FORECAST_CONFIDENCE = [0.88, 0.76, 0.64, 0.52, 0.42, 0.33, 0.25, 0.18]

// ── サンプル履歴データ（実際はdemand.jsonやDBから取得）──
const rawHistoryData: Omit<DemandEntry, 'index'>[] = [
  { date: '2025-12-22', trends: 45, flight: 18500, hotel: 55, note: 'クリスマス前', isForecast: false },
  { date: '2025-12-29', trends: 78, flight: 24800, hotel: 20, note: '年末年始', isForecast: false },
  { date: '2026-01-05', trends: 52, flight: 15200, hotel: 48, note: '', isForecast: false },
  { date: '2026-01-12', trends: 41, flight: 13800, hotel: 62, note: '閑散期', isForecast: false },
  { date: '2026-01-19', trends: 38, flight: 12500, hotel: 70, note: '', isForecast: false },
  { date: '2026-01-26', trends: 44, flight: 13200, hotel: 65, note: '', isForecast: false },
  { date: '2026-02-02', trends: 50, flight: 14500, hotel: 58, note: '', isForecast: false },
  { date: '2026-02-09', trends: 55, flight: 15800, hotel: 52, note: '', isForecast: false },
  { date: '2026-02-16', trends: 58, flight: 16200, hotel: 45, note: '', isForecast: false },
  { date: '2026-02-23', trends: 63, flight: 17400, hotel: 40, note: '', isForecast: false },
  { date: '2026-03-09', trends: 68, flight: 18900, hotel: 35, note: '春休み前', isForecast: false },
  { date: '2026-03-16', trends: 74, flight: 21500, hotel: 28, note: '繁忙期入り', isForecast: false },
  { date: '2026-03-23', trends: 76, flight: 22800, hotel: 22, note: '春休みピーク', isForecast: false },
  { date: '2026-03-30', trends: 82, flight: 25600, hotel: 15, note: '春休みピーク継続', isForecast: false },
  { date: '2026-04-06', trends: 71, flight: 21200, hotel: 25, note: 'GW直前', isForecast: false },
  { date: '2026-04-13', trends: 88, flight: 28500, hotel: 10, note: 'GW前半（予測）', isForecast: true },
  { date: '2026-04-20', trends: 92, flight: 31000, hotel: 8,  note: 'GWピーク（予測）', isForecast: true },
  { date: '2026-04-27', trends: 89, flight: 29000, hotel: 12, note: 'GW後半（予測）', isForecast: true },
  { date: '2026-05-04', trends: 85, flight: 26000, hotel: 18, note: 'GW最終週（予測）', isForecast: true },
  { date: '2026-05-11', trends: 62, flight: 18000, hotel: 38, note: 'GW明け（予測）', isForecast: true },
  { date: '2026-05-18', trends: 52, flight: 16200, hotel: 48, note: '5月中旬（予測）', isForecast: true },
  { date: '2026-05-25', trends: 44, flight: 14800, hotel: 58, note: '5月末（予測）', isForecast: true },
  { date: '2026-06-01', trends: 36, flight: 13500, hotel: 65, note: '梅雨入り前（予測）', isForecast: true },
]

// 予測エントリに対して週順にconfidenceを付与
let forecastIdx = 0
const historyData: DemandEntry[] = rawHistoryData.map((d) => {
  const index = calcIndex(d.trends ?? 0, d.flight ?? 15000, d.hotel ?? 50)
  if (!d.isForecast) {
    return { ...d, index, confidence: 1.0 }
  }
  const confidence = FORECAST_CONFIDENCE[forecastIdx] ?? 0.18
  forecastIdx++
  return { ...d, index, confidence }
})

export async function getDemandHistory(): Promise<DemandEntry[]> {
  return historyData
}

export async function getDemandHistoryFromDB(): Promise<DemandEntry[]> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data, error } = await supabase
      .from('demand_weekly')
      .select('*')
      .order('week_start')
    if (error || !data || data.length === 0) return getDemandHistory()  // フォールバック
    return data.map((row) => ({
      date: row.week_start,
      trends: row.trends,
      flight: row.flight,
      hotel: row.hotel,
      index: row.index,
      isForecast: row.is_forecast,
      confidence: row.confidence ?? (row.is_forecast ? 0.5 : 1.0),
      note: row.note ?? '',
    }))
  } catch {
    return getDemandHistory()
  }
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
