export type CruiseArrival = {
  id: string
  arrival_date: string      // YYYY-MM-DD
  arrival_time: string | null
  departure_time: string | null
  ship_name: string
  passengers: number | null
  berth: string | null
  route: string | null
}

/** 乗客数から需要ブーストを計算 (0〜0.5) */
export function cruiseDemandBoost(passengers: number | null): number {
  if (!passengers) return 0.10
  if (passengers >= 3000) return 0.45
  if (passengers >= 2000) return 0.35
  if (passengers >= 1000) return 0.25
  if (passengers >= 500)  return 0.15
  return 0.10
}

/** 乗客数ラベル */
export function cruiseSizeLabel(passengers: number | null): string {
  if (!passengers) return '小型'
  if (passengers >= 3000) return '超大型'
  if (passengers >= 2000) return '大型'
  if (passengers >= 1000) return '中型'
  return '小型'
}

/** Supabase から今日〜指定日数先のクルーズ入港を取得（サーバーサイド専用） */
export async function getUpcomingCruises(days = 35): Promise<CruiseArrival[]> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin')
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().slice(0, 10)
    const until = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('ishigaki_cruises')
      .select('*')
      .gte('arrival_date', today)
      .lte('arrival_date', until)
      .order('arrival_date')

    if (error || !data) return []
    return data as CruiseArrival[]
  } catch {
    return []
  }
}
