export type IslandEvent = {
  id: string
  event_date: string        // YYYY-MM-DD
  event_end_date: string | null
  event_name: string
  event_name_en: string | null
  category: EventCategory
  demand_boost: number      // 0.0〜0.5
  venue: string | null
  source_url: string | null
  is_confirmed: boolean
  note: string | null
}

export type EventCategory = 'festival' | 'sports' | 'music' | 'marine' | 'food' | 'other'

export const CATEGORY_CONFIG: Record<EventCategory, {
  label: string; labelEn: string; color: string; bg: string; icon: string
}> = {
  festival: { label: '祭り・文化',   labelEn: 'Festival', color: '#e07b3f', bg: '#e07b3f22', icon: '🎆' },
  sports:   { label: 'スポーツ',    labelEn: 'Sports',   color: '#3ec768', bg: '#3ec76822', icon: '🏃' },
  music:    { label: '音楽・ライブ', labelEn: 'Music',    color: '#9b59b6', bg: '#9b59b622', icon: '🎵' },
  marine:   { label: 'マリン',      labelEn: 'Marine',   color: '#2980b9', bg: '#2980b922', icon: '🐠' },
  food:     { label: 'フード',      labelEn: 'Food',     color: '#c0392b', bg: '#c0392b22', icon: '🍺' },
  other:    { label: 'その他',      labelEn: 'Other',    color: '#7f8c8d', bg: '#7f8c8d22', icon: '📅' },
}

export const BOOST_LABEL = (b: number): string =>
  b >= 0.40 ? '🔴 超大型' : b >= 0.25 ? '🟠 大型' : b >= 0.15 ? '🟡 中型' : '🟢 小型'

/** Supabase から今日〜指定日数先のイベントを取得 */
export async function getUpcomingEvents(days = 35): Promise<IslandEvent[]> {
  try {
    const { getSupabaseAdmin } = await import('@/lib/supabaseAdmin')
    const supabase = getSupabaseAdmin()
    const today = new Date().toISOString().slice(0, 10)
    const until = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('ishigaki_events')
      .select('*')
      .gte('event_date', today)
      .lte('event_date', until)
      .order('event_date')

    if (error || !data) return []
    return data as IslandEvent[]
  } catch {
    return []
  }
}

/** 指定週（weekStart〜+6日）に重なるイベントのうち最大 demand_boost を返す */
export function getWeekBoost(events: IslandEvent[], weekStart: string): number {
  const start = new Date(weekStart)
  const end   = new Date(weekStart)
  end.setDate(end.getDate() + 6)

  const overlapping = events.filter((ev) => {
    const evStart = new Date(ev.event_date)
    const evEnd   = ev.event_end_date ? new Date(ev.event_end_date) : evStart
    return evStart <= end && evEnd >= start
  })

  return overlapping.reduce((max, ev) => Math.max(max, ev.demand_boost), 0)
}
