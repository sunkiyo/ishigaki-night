import Link from 'next/link'
import type { Spot } from '@/lib/spots'
import type { DemandSummary } from '@/lib/demand'
import DemandMini from '@/components/spots/DemandMini'

const CATEGORY_LABEL: Record<string, { ja: string; en: string; zh: string; ko: string }> = {
  bar:     { ja: 'バー',       en: 'Bar',      zh: '酒吧',   ko: '바' },
  izakaya: { ja: '居酒屋',     en: 'Izakaya',  zh: '居酒屋', ko: '이자카야' },
  live:    { ja: 'ライブ',     en: 'Live',     zh: '现场',   ko: '라이브' },
  club:    { ja: 'クラブ',     en: 'Club',     zh: '俱乐部', ko: '클럽' },
  dining:  { ja: 'ダイニング', en: 'Dining',   zh: '餐厅',   ko: '다이닝' },
}

export default function SpotCard({ spot, locale, demand }: { spot: Spot; locale: string; demand?: DemandSummary }) {
  const lang = locale
  const l = lang as 'ja' | 'en' | 'zh' | 'ko'
  const name = spot.i18n?.[l as "en" | "zh" | "ko"]?.name ?? spot.name
  const desc = spot.i18n?.[l as "en" | "zh" | "ko"]?.description ?? spot.description
  const catLabel = CATEGORY_LABEL[spot.category]?.[l] ?? spot.category

  return (
    <Link
      href={`/${lang}/spots/${spot.id}`}
      className="group block bg-surface rounded-xl overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{ border: '1px solid rgb(var(--gold)/.2)' }}
    >
      {/* サムネイル */}
      <div className="h-40 flex items-center justify-center relative overflow-hidden" style={{ background: 'rgb(var(--gold)/.1)' }}>
        <span className="text-6xl">{spot.thumb}</span>
        {spot.featured && (
          <span className="absolute top-3 left-3 text-xs bg-gold text-white px-2 py-0.5 rounded font-medium">
            PICK UP
          </span>
        )}
        {spot.coupon && (
          <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'rgb(var(--gold)/.15)', color: 'rgb(var(--gold))', border: '1px solid rgb(var(--gold)/.3)' }}>
            COUPON
          </span>
        )}
        <span className="absolute bottom-2 right-3 text-xs font-medium" style={{ color: 'rgb(var(--gold))' }}>
          {spot.priceRange}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs rounded px-1.5 py-0.5" style={{ border: '1px solid rgb(var(--gold)/.3)', color: 'rgb(var(--gold))' }}>{catLabel}</span>
          <span className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>{spot.area}</span>
        </div>
        <h3 className="font-mincho text-base font-semibold mb-1.5 group-hover:text-gold transition-colors line-clamp-1" style={{ color: 'rgb(var(--ink))' }}>
          {name}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 opacity-60 mb-3" style={{ color: 'rgb(var(--ink))' }}>{desc}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gold">★ {spot.rating.toFixed(1)}</span>
            <span className="text-xs opacity-40" style={{ color: 'rgb(var(--ink))' }}>({spot.reviewCount})</span>
          </div>
          <div className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
            {spot.openHour}:00–{spot.closeHour}:00
          </div>
        </div>
        {demand && (
          <div className="mt-3">
            <DemandMini demand={demand} locale={locale} />
          </div>
        )}
      </div>
    </Link>
  )
}
