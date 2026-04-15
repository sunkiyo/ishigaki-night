'use client'

import { IslandEvent, CATEGORY_CONFIG, BOOST_LABEL } from '@/lib/demandEvents'

// ソースURLのドメインを実際のリンクURLに変換
function sourceToUrl(source: string): string | null {
  if (!source || source === 'claude-knowledge') return null
  const map: Record<string, string> = {
    'okinawastory.jp': 'https://www.okinawastory.jp/event/list?area=34',
    'yaenavi.com': 'http://yaenavi.com/calendar',
    'nacru.my.site.com': 'https://nacru.my.site.com/s/?NHCR_ApplicationPublic__c-filterId=View5',
  }
  return map[source] ?? `https://${source}`
}

function sourceDomain(source: string): string {
  return source.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

type Props = {
  events: IslandEvent[]
  lang: string
}

function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr)
  if (lang === 'en') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const ev = new Date(dateStr)
  ev.setHours(0, 0, 0, 0)
  return Math.ceil((ev.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function EventsSection({ events, lang }: Props) {
  if (events.length === 0) {
    return (
      <div className="bg-surface border border-stone-200 rounded-xl p-5">
        <p className="text-xs tracking-widest uppercase text-stone-400 mb-2">
          {lang === 'ja' ? '直近のイベント' : 'Upcoming Events'}
        </p>
        <p className="text-xs text-stone-400">
          {lang === 'ja' ? '今後35日間に登録されたイベントはありません' : 'No events in the next 35 days'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-stone-200 rounded-xl p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-stone-400">
            {lang === 'ja' ? '直近のイベント' : lang === 'zh' ? '近期活動' : 'Upcoming Events'}
          </p>
          <p className="text-[10px] text-stone-300 mt-0.5">
            {lang === 'ja' ? `今後35日間 · ${events.length}件` : `Next 35 days · ${events.length} events`}
          </p>
        </div>
        <span className="text-xs text-stone-300 italic">
          {lang === 'ja' ? '需要予測に反映' : 'Affects demand forecast'}
        </span>
      </div>

      {/* イベントリスト */}
      <div className="flex flex-col gap-2">
        {events.map((ev) => {
          const cat  = CATEGORY_CONFIG[ev.category] ?? CATEGORY_CONFIG.other
          const days = daysUntil(ev.event_date)
          const isNear = days <= 7

          return (
            <div
              key={ev.id}
              className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-stone-50"
              style={{ border: `1px solid ${cat.color}33`, background: isNear ? cat.bg : undefined }}
            >
              {/* 日付バッジ */}
              <div className="flex-shrink-0 text-center min-w-[44px]">
                <div
                  className="text-xs font-bold leading-none"
                  style={{ color: cat.color }}
                >
                  {new Date(ev.event_date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
                </div>
                <div className="text-[9px] text-stone-400 mt-0.5">
                  {days === 0 ? '今日' : days === 1 ? '明日' : `${days}日後`}
                </div>
              </div>

              {/* イベント情報 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-xs font-semibold text-stone-700 truncate">
                    {lang === 'en' && ev.event_name_en ? ev.event_name_en : ev.event_name}
                  </span>
                  {isNear && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                      まもなく
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {/* カテゴリ */}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ color: cat.color, background: cat.bg }}
                  >
                    {lang === 'en' ? cat.labelEn : cat.label}
                  </span>
                  {/* 需要インパクト */}
                  <span className="text-[9px] text-stone-400">
                    {BOOST_LABEL(ev.demand_boost)}
                  </span>
                  {/* 会場 */}
                  {ev.venue && (
                    <span className="text-[9px] text-stone-400 truncate">
                      📍 {ev.venue}
                    </span>
                  )}
                  {/* 複数日 */}
                  {ev.event_end_date && ev.event_end_date !== ev.event_date && (
                    <span className="text-[9px] text-stone-400">
                      〜{formatDate(ev.event_end_date, lang)}
                    </span>
                  )}
                </div>
                {/* 説明文 */}
                {ev.note && (
                  <p className="text-[9px] text-stone-500 mt-1 leading-relaxed line-clamp-2">
                    {ev.note}
                  </p>
                )}
                {/* ソースリンク */}
                {ev.source_url && ev.source_url !== 'claude-knowledge' && (() => {
                  const href = sourceToUrl(ev.source_url)
                  return href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[9px] text-blue-400 hover:text-blue-600 mt-0.5"
                    >
                      🔗 {sourceDomain(ev.source_url)}
                    </a>
                  ) : null
                })()}
              </div>

              {/* 需要ブーストバー */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                <div
                  className="w-1.5 rounded-full"
                  style={{
                    height: `${Math.round(ev.demand_boost * 80) + 8}px`,
                    background: cat.color,
                    opacity: 0.8,
                  }}
                />
                <span className="text-[8px] text-stone-400">
                  +{Math.round(ev.demand_boost * 100)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* フッター注記 */}
      <p className="text-[9px] text-stone-300 mt-3 text-right">
        {lang === 'ja'
          ? '※ イベント情報はSupabaseダッシュボードから随時更新可能'
          : '※ Events can be updated anytime via Supabase dashboard'}
      </p>
    </div>
  )
}
