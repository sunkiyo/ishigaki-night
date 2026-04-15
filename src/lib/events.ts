// イベントページ用 — ishigaki_events テーブルから取得
// IslandEvent を Event として re-export して後方互換を維持
export type { IslandEvent as Event } from './demandEvents'

/** イベントページ用：今後90日分を取得 */
export async function getEvents() {
  const { getUpcomingEvents } = await import('./demandEvents')
  return getUpcomingEvents(90)
}
