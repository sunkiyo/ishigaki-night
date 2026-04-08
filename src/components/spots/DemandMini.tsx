import Link from 'next/link'
import type { DemandSummary } from '@/lib/demand'

// スポット一覧・詳細で使うコンパクト需要バッジ

const STATUS_CONFIG = {
  hot: {
    dot: '🔴',
    ja: '今週末: 激混み',
    en: 'This weekend: Peak',
    zh: '本周末: 超热',
    ko: '이번 주말: 매우 혼잡',
    sub: { ja: '予約推奨', en: 'Reservation recommended', zh: '建议预约', ko: '예약 추천' },
    color: '#f05350',
    bg: 'rgba(240,83,80,.1)',
    border: 'rgba(240,83,80,.3)',
  },
  warm: {
    dot: '🟡',
    ja: '今週末: にぎわい',
    en: 'This weekend: Busy',
    zh: '本周末: 热闹',
    ko: '이번 주말: 혼잡',
    sub: { ja: 'やや混雑', en: 'Moderately crowded', zh: '较为热闹', ko: '약간 혼잡' },
    color: '#f0b865',
    bg: 'rgba(240,184,101,.1)',
    border: 'rgba(240,184,101,.3)',
  },
  normal: {
    dot: '🟢',
    ja: '今週末: 普通',
    en: 'This weekend: Moderate',
    zh: '本周末: 一般',
    ko: '이번 주말: 보통',
    sub: { ja: '当日でもOK', en: 'Walk-ins welcome', zh: '当天也可以', ko: '당일도 OK' },
    color: '#3ec768',
    bg: 'rgba(62,199,104,.1)',
    border: 'rgba(62,199,104,.3)',
  },
  cool: {
    dot: '🔵',
    ja: '今週末: 空いてる',
    en: 'This weekend: Slow',
    zh: '本周末: 空闲',
    ko: '이번 주말: 한산',
    sub: { ja: 'ゆっくり楽しめる', en: 'Plenty of space', zh: '可以慢慢享受', ko: '여유롭게 즐길 수 있음' },
    color: '#4ea8f5',
    bg: 'rgba(78,168,245,.1)',
    border: 'rgba(78,168,245,.3)',
  },
}

type Lang = 'ja' | 'en' | 'zh' | 'ko'

export default function DemandMini({
  demand,
  locale,
}: {
  demand: DemandSummary
  locale: string
}) {
  const l: Lang = (['ja', 'en', 'zh', 'ko'] as Lang[]).includes(locale as Lang) ? (locale as Lang) : 'ja'
  const cfg = STATUS_CONFIG[demand.status]
  const mainLabel = cfg[l] ?? cfg.ja
  const subLabel = cfg.sub[l] ?? cfg.sub.ja
  const linkLabel =
    l === 'ja' ? '需要予測とは？' :
    l === 'zh' ? '什么是需求预测？' :
    l === 'ko' ? '수요 예측이란？' :
    'What is demand forecast?'

  return (
    <div
      className="flex items-center gap-2 px-3 rounded-full text-xs"
      style={{
        height: 32,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: 'inline-flex',
        width: 'fit-content',
      }}
    >
      <span style={{ fontSize: 12 }}>{cfg.dot}</span>
      <span style={{ color: cfg.color, fontWeight: 600 }}>{mainLabel}</span>
      <span style={{ color: cfg.color, opacity: 0.75 }}>·</span>
      <span style={{ color: cfg.color, opacity: 0.85 }}>{subLabel}</span>
      <Link
        href={`/${locale}/dashboard`}
        className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: cfg.color, textDecoration: 'underline', fontSize: 10 }}
      >
        {linkLabel} →
      </Link>
    </div>
  )
}
