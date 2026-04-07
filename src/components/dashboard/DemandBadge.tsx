import Link from 'next/link'
import type { DemandSummary } from '@/lib/demand'

const STATUS_CONFIG = {
  hot:    { ja: '激混み',   en: 'Peak',     zh: '超热', ko: '매우 혼잡', color: '#f05350', bg: 'rgba(240,83,80,.12)'  },
  warm:   { ja: 'にぎわい', en: 'Busy',     zh: '热闹', ko: '혼잡',     color: '#f0b865', bg: 'rgba(212,146,63,.12)' },
  normal: { ja: '普通',     en: 'Moderate', zh: '一般', ko: '보통',     color: '#3ec768', bg: 'rgba(62,199,104,.12)' },
  cool:   { ja: '閑散',     en: 'Slow',     zh: '安静', ko: '한산',     color: '#4ea8f5', bg: 'rgba(78,168,245,.12)' },
}

export default function DemandBadge({
  demand,
  locale,
}: {
  demand: DemandSummary
  locale: string
}) {
  const lang = locale
  const cfg = STATUS_CONFIG[demand.status]
  const label = (cfg as Record<string, string>)[lang] ?? cfg.ja

  return (
    <div
      className="rounded-xl border p-6 flex items-center gap-8 bg-surface"
      style={{ borderColor: cfg.color + '44' }}
    >
      {/* スコア */}
      <div className="text-center flex-shrink-0">
        <div className="text-5xl font-bold" style={{ color: cfg.color, fontVariantNumeric: 'tabular-nums' }}>
          {demand.index}
        </div>
        <div className="text-xs mt-1 opacity-50" style={{ color: 'rgb(var(--ink))' }}>/ 100</div>
        <div
          className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44` }}
        >
          {label}
        </div>
      </div>

      {/* バー */}
      <div className="flex-1">
        <div className="h-3 rounded-full overflow-hidden mb-3" style={{ background: 'rgb(var(--ink)/.12)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${demand.index}%`,
              background: 'linear-gradient(90deg, #3ec768 0%, #d4923f 55%, #f05350 100%)',
              backgroundSize: '300px 12px',
              backgroundPosition: '0 0',
            }}
          />
        </div>
        <div className="flex justify-between text-xs opacity-50" style={{ color: 'rgb(var(--ink))' }}>
          <span>{lang === 'ja' ? '静か' : lang === 'zh' ? '安静' : lang === 'ko' ? '한산' : 'Quiet'}</span>
          <span>{lang === 'ja' ? '激混み' : lang === 'zh' ? '极热' : lang === 'ko' ? '매우 혼잡' : 'Peak'}</span>
        </div>
      </div>

      {/* 詳細リンク */}
      <Link
        href={`/${locale}/dashboard`}
        className="hidden md:block text-xs transition-colors px-4 py-2 rounded flex-shrink-0 text-gold opacity-70 hover:opacity-100"
        style={{ border: '1px solid rgb(var(--gold)/.4)' }}
      >
        {lang === 'ja' ? '詳細を見る' : lang === 'zh' ? '查看详情' : lang === 'ko' ? '자세히 보기' : 'View Details'} →
      </Link>
    </div>
  )
}
