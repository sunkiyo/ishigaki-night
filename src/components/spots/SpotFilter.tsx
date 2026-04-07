'use client'

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  all:     { ja: 'すべて',      en: 'All',      zh: '全部' },
  bar:     { ja: 'バー',        en: 'Bar',       zh: '酒吧' },
  izakaya: { ja: '居酒屋',      en: 'Izakaya',   zh: '居酒屋' },
  live:    { ja: 'ライブ',      en: 'Live',      zh: '现场' },
  club:    { ja: 'クラブ',      en: 'Club',      zh: '俱乐部' },
  dining:  { ja: 'ダイニング',  en: 'Dining',    zh: '餐厅' },
}

type Props = {
  query: string
  onQuery: (v: string) => void
  category: string
  onCategory: (v: string) => void
  categories: readonly string[]
  openNow: boolean
  onOpenNow: (v: boolean) => void
  locale: string
}

export default function SpotFilter({
  query, onQuery, category, onCategory, categories, openNow, onOpenNow, locale,
}: Props) {
  const lang = locale
  const placeholder = lang === 'ja' ? '店名・エリアで検索' : lang === 'zh' ? '按名称或地区搜索' : 'Search by name or area'
  const openNowLabel = lang === 'ja' ? '今すぐ営業中' : lang === 'zh' ? '现在営業' : 'Open now'

  return (
    <div className="flex flex-col gap-3 mb-8">
      <input
        type="text"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface rounded-lg px-4 py-3 text-sm outline-none transition-colors"
        style={{ border: '1px solid rgb(var(--gold)/.25)', color: 'rgb(var(--ink))' }}
      />
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategory(cat)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              category === cat ? 'text-gold' : 'opacity-60'
            }`}
            style={category === cat
              ? { borderColor: 'rgb(var(--gold))', background: 'rgb(var(--gold)/.1)', color: 'rgb(var(--gold))' }
              : { borderColor: 'rgb(var(--gold)/.25)', color: 'rgb(var(--ink))' }
            }
          >
            {CATEGORY_LABELS[cat]?.[lang] ?? cat}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 cursor-pointer text-xs opacity-60" style={{ color: 'rgb(var(--ink))' }}>
          <input
            type="checkbox"
            checked={openNow}
            onChange={(e) => onOpenNow(e.target.checked)}
            className="accent-gold"
          />
          {openNowLabel}
        </label>
      </div>
    </div>
  )
}
