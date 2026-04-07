import { setRequestLocale } from 'next-intl/server'
import { getGuides } from '@/lib/guides'
import GuideCard from '@/components/guides/GuideCard'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default function GuidesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale)
  const guides = getGuides()
  const p = (ja: string, en: string, zh: string, ko: string) =>
    locale === 'en' ? en : locale === 'zh' ? zh : locale === 'ko' ? ko : ja

  const title    = p('ローカルガイド', 'Local Guides', '本地导游', '현지 가이드')
  const subtitle = p(
    '石垣島を知り尽くした地元ガイドと、リアルな夜を体験しよう。',
    'Explore Ishigaki nights with a local who knows every corner of the island.',
    '与了解每个角落的当地人一起探索石垣岛的夜晚。',
    '이시가키의 구석구석을 아는 현지인과 함께 진짜 밤을 경험해보세요。'
  )

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-[0.3em] uppercase mb-2 text-gold">LOCAL GUIDES</p>
        <h1 className="font-mincho text-3xl font-semibold mb-3" style={{ color: 'rgb(var(--ink))' }}>
          {title}
        </h1>
        <p className="text-sm opacity-60 max-w-xl leading-relaxed" style={{ color: 'rgb(var(--ink))' }}>
          {subtitle}
        </p>
      </div>

      {/* 信頼性バッジ */}
      <div className="mb-8 flex flex-wrap gap-4">
        {[
          { icon: '✓', text: p('認定ローカルガイド', 'Verified local guides', '认证本地导游', '인증 현지 가이드') },
          { icon: '🔒', text: p('安心・安全な予約', 'Secure booking', '安全预订', '안전한 예약') },
          { icon: '⭐', text: p('平均評価 4.9', '4.9 avg rating', '平均评分 4.9', '평균 평점 4.9') },
          { icon: '💬', text: p('多言語対応', 'Multilingual support', '多语言支持', '다국어 지원') },
        ].map(b => (
          <div key={b.text} className="flex items-center gap-1.5 text-xs opacity-60" style={{ color: 'rgb(var(--ink))' }}>
            <span>{b.icon}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {guides.map(g => (
          <GuideCard key={g.id} guide={g} locale={locale} />
        ))}
      </div>
    </div>
  )
}
