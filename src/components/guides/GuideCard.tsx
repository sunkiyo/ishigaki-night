import type { Guide } from '@/lib/guides'

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="text-xs"
          style={{ color: i < full || (i === full && half) ? 'rgb(var(--gold))' : 'rgb(var(--ink)/.2)' }}
        >
          ★
        </span>
      ))}
    </span>
  )
}

export default function GuideCard({ guide, locale }: { guide: Guide; locale: string }) {
  const lang = locale
  const l = lang as 'en' | 'zh' | 'ko'
  const name = guide.i18n?.[l as "en" | "zh" | "ko"]?.name ?? guide.name
  const bio  = guide.i18n?.[l as "en" | "zh" | "ko"]?.bio  ?? guide.bio
  const priceLabel = lang === 'ja' ? 'から' : lang === 'zh' ? '起' : lang === 'ko' ? '부터/1인' : '/person from'

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-all hover:shadow-md hover:-translate-y-0.5 bg-surface"
      style={{ borderColor: 'rgb(var(--gold)/.2)' }}
    >
      {/* 上部: アバター＋基本情報 */}
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'rgb(var(--gold)/.12)', border: '2px solid rgb(var(--gold)/.25)' }}
        >
          {guide.photo}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-mincho text-base font-semibold truncate" style={{ color: 'rgb(var(--ink))' }}>
              {name}
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: 'rgb(var(--gold)/.1)', color: 'rgb(var(--gold))' }}
            >
              {guide.area}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={guide.rating} />
            <span className="text-xs" style={{ color: 'rgb(var(--gold))' }}>
              {guide.rating.toFixed(1)}
            </span>
            <span className="text-xs opacity-40" style={{ color: 'rgb(var(--ink))' }}>
              ({guide.reviews}{lang === 'ja' ? '件' : lang === 'zh' ? '评' : lang === 'ko' ? '건' : ' reviews'})
            </span>
          </div>
          {/* 言語 */}
          <div className="flex flex-wrap gap-1">
            {guide.languages.map(l => (
              <span
                key={l}
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgb(var(--night)/.07)', color: 'rgb(var(--ink)/.7)' }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 専門分野 */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {guide.specialties.map(s => (
          <span
            key={s}
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ borderColor: 'rgb(var(--gold)/.35)', color: 'rgb(var(--gold))' }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* 紹介文 */}
      <div className="px-5 pb-4">
        <p
          className="text-xs leading-relaxed line-clamp-3 opacity-65"
          style={{ color: 'rgb(var(--ink))' }}
        >
          {bio}
        </p>
      </div>

      {/* フッター: 料金＋CTA */}
      <div
        className="px-5 py-3 flex items-center justify-between border-t"
        style={{ borderColor: 'rgb(var(--gold)/.12)' }}
      >
        <div>
          <span className="text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
            {lang === 'ja' ? '料金' : lang === 'zh' ? '费用' : lang === 'ko' ? '요금' : 'Price'}
          </span>
          <p className="text-sm font-semibold" style={{ color: 'rgb(var(--gold))' }}>
            ¥{guide.priceFrom.toLocaleString()}
            <span className="text-xs font-normal opacity-60 ml-0.5">{priceLabel}</span>
          </p>
        </div>
        <button
          className="text-xs px-4 py-1.5 rounded-full font-medium text-white transition-opacity hover:opacity-80"
          style={{ background: 'rgb(var(--gold))' }}
        >
          {lang === 'ja' ? '詳細・予約' : lang === 'zh' ? '查看详情' : lang === 'ko' ? '상세·예약' : 'View & Book'}
        </button>
      </div>
    </div>
  )
}
