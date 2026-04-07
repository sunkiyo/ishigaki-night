'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LABELS: Record<string, { ja: string; en: string; zh: string; ko: string }> = {
  spots:     { ja: 'スポット一覧',  en: 'Spots',        zh: '场所',   ko: '스팟' },
  events:    { ja: 'イベント',      en: 'Events',       zh: '活动',   ko: '이벤트' },
  dashboard: { ja: '需要予測',      en: 'Dashboard',    zh: '需求预测', ko: '수요 예측' },
  advertise: { ja: '掲載案内',      en: 'Advertise',    zh: '广告',   ko: '게재 안내' },
  guides:    { ja: 'ローカルガイド', en: 'Local Guides', zh: '本地导游', ko: '현지 가이드' },
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  const lang = segments[0] || 'ja'
  const l = lang as 'ja' | 'en' | 'zh' | 'ko'

  const homeLabel = lang === 'ja' ? 'ホーム' : lang === 'zh' ? '首页' : lang === 'ko' ? '홈' : 'Home'
  const crumbs = [
    { label: homeLabel, href: `/${lang}` },
  ]

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = LABELS[seg]?.[l] ?? seg
    crumbs.push({ label, href })
  }

  return (
    <nav className="max-w-screen-xl mx-auto px-6 pt-5 pb-1">
      <ol className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs">
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className="opacity-30" style={{ color: 'rgb(var(--gold))' }}>/</span>
            )}
            {i < crumbs.length - 1 ? (
              <Link
                href={c.href}
                className="text-gold opacity-60 hover:opacity-100 transition-opacity"
              >
                {c.label}
              </Link>
            ) : (
              <span className="opacity-50" style={{ color: 'rgb(var(--ink))' }}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
