import type { Event } from '@/lib/events'

const CAT_COLOR: Record<string, string> = {
  live:     'text-purple-700 border-purple-300 bg-purple-50',
  dj:       'text-blue-700   border-blue-300   bg-blue-50',
  festival: 'text-amber-700  border-amber-300  bg-amber-50',
  other:    'text-stone-500  border-stone-200  bg-stone-50',
}

export default function EventCard({ event, locale }: { event: Event; locale: string }) {
  const lang = locale
  const l = lang as "en" | "zh" | "ko"
  const title = event.i18n?.[l as "en" | "zh" | "ko"]?.title ?? event.title
  const desc  = event.i18n?.[l as "en" | "zh" | "ko"]?.description ?? event.description

  const dateObj = new Date(event.date + 'T00:00:00')
  const dateStr = lang === 'ja'
    ? `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`
    : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="flex gap-4 p-4 bg-surface rounded-xl transition-colors" style={{ border: '1px solid rgb(var(--gold)/.2)' }}>
      {/* サムネイル */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgb(var(--gold)/.1)' }}>
        {event.thumb}
      </div>

      {/* 日付 + 内容 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs px-2 py-0.5 rounded border ${CAT_COLOR[event.category]}`}>
            {event.category.toUpperCase()}
          </span>
          <span className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
            {dateStr} {event.startTime} — {event.venue}
          </span>
        </div>
        <h3 className="font-mincho text-base font-semibold line-clamp-1 mb-1" style={{ color: 'rgb(var(--ink))' }}>{title}</h3>
        <p className="text-xs line-clamp-2 leading-relaxed opacity-60 mb-2" style={{ color: 'rgb(var(--ink))' }}>{desc}</p>
        {event.price && (
          <span className="text-xs font-medium" style={{ color: 'rgb(var(--gold))' }}>{event.price}</span>
        )}
      </div>
    </div>
  )
}
