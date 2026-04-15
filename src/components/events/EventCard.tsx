import type { IslandEvent } from '@/lib/demandEvents'
import { CATEGORY_CONFIG, BOOST_LABEL } from '@/lib/demandEvents'

// ソースURLマッピング（EventsSectionと共通）
function sourceToUrl(source: string): string | null {
  if (!source || source === 'claude-knowledge') return null
  const map: Record<string, string> = {
    'okinawastory.jp': 'https://www.okinawastory.jp/event/list?area=34',
    'yaenavi.com': 'http://yaenavi.com/calendar',
    'nacru.my.site.com': 'https://nacru.my.site.com/s/?NHCR_ApplicationPublic__c-filterId=View5',
  }
  return map[source] ?? `https://${source}`
}

export default function EventCard({ event, locale }: { event: IslandEvent; locale: string }) {
  const cat = CATEGORY_CONFIG[event.category]
  const lang = locale

  // 日付フォーマット
  const dateObj = new Date(event.event_date + 'T00:00:00')
  const dateStr = lang === 'ja'
    ? `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
    : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // 終了日（複数日イベント）
  const endDateStr = event.event_end_date && event.event_end_date !== event.event_date
    ? (() => {
        const e = new Date(event.event_end_date + 'T00:00:00')
        return lang === 'ja'
          ? `〜${e.getMonth() + 1}月${e.getDate()}日`
          : `–${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      })()
    : null

  const sourceUrl = event.source_url ? sourceToUrl(event.source_url) : null
  const sourceDomain = event.source_url
    ? event.source_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    : null

  return (
    <div
      className="flex gap-4 p-4 bg-surface rounded-xl transition-colors"
      style={{ border: '1px solid rgb(var(--gold)/.2)' }}
    >
      {/* アイコン */}
      <div
        className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
        style={{ background: cat.bg }}
      >
        {cat.icon}
      </div>

      {/* コンテンツ */}
      <div className="flex-1 min-w-0">
        {/* 日付 + カテゴリ + 規模 */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ color: cat.color, background: cat.bg }}
          >
            {lang === 'en' ? cat.labelEn : cat.label}
          </span>
          <span className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
            {BOOST_LABEL(event.demand_boost)}
          </span>
          {event.venue && (
            <span className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
              📍 {event.venue}
            </span>
          )}
        </div>

        {/* タイトル */}
        <h3
          className="font-mincho text-base font-semibold mb-0.5"
          style={{ color: 'rgb(var(--ink))' }}
        >
          {event.event_name}
        </h3>

        {/* 日付範囲 */}
        <p className="text-xs mb-1.5 opacity-60" style={{ color: 'rgb(var(--ink))' }}>
          {dateStr}{endDateStr}
        </p>

        {/* 説明文（note） */}
        {event.note && (
          <p
            className="text-sm leading-relaxed mb-2"
            style={{ color: 'rgb(var(--ink) / 0.7)' }}
          >
            {event.note}
          </p>
        )}

        {/* ソースリンク */}
        {sourceUrl && sourceDomain && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs"
            style={{ color: 'rgb(var(--gold))' }}
          >
            🔗 {sourceDomain}
          </a>
        )}
      </div>
    </div>
  )
}
