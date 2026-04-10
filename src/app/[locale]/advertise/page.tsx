import { setRequestLocale } from 'next-intl/server'

const MONTHLY_PLANS = [
  {
    id: 'starter',
    nameJa: 'スターター',
    nameEn: 'Starter',
    price: 2500,
    tagJa: 'まず試してみたい方に',
    tagEn: 'Just getting started',
    features: {
      ja: ['Web掲載（4言語）', '店舗詳細ページ', 'Googleマップリンク', 'フリーペーパー小枠'],
      en: ['Web listing (4 languages)', 'Spot detail page', 'Google Maps link', 'Free paper small slot'],
    },
    featured: false,
  },
  {
    id: 'basic',
    nameJa: 'ベーシック',
    nameEn: 'Basic',
    price: 5000,
    tagJa: '小さく始めたい方に',
    tagEn: 'To get started',
    features: {
      ja: ['Web掲載（4言語）', '店舗詳細ページ', 'Googleマップリンク', 'クーポン発行', 'フリーペーパー小枠'],
      en: ['Web listing (4 languages)', 'Spot detail page', 'Google Maps link', 'Coupon', 'Free paper small slot'],
    },
    featured: false,
  },
  {
    id: 'standard',
    nameJa: 'スタンダード',
    nameEn: 'Standard',
    price: 12000,
    tagJa: '集客に本気の方に',
    tagEn: 'For serious promotion',
    features: {
      ja: ['Web掲載（4言語）', '店舗詳細ページ', 'クーポン発行', 'SNS紹介（月2回）', 'フリーペーパー中枠'],
      en: ['Web listing (4 languages)', 'Spot detail page', 'Coupon', 'SNS feature (×2/mo)', 'Free paper mid slot'],
    },
    featured: true,
  },
  {
    id: 'premium',
    nameJa: 'プレミアム',
    nameEn: 'Premium',
    price: 25000,
    tagJa: 'メディア全面活用',
    tagEn: 'Full media exposure',
    features: {
      ja: ['スタンダード全機能', 'フリーペーパー優先枠', 'SNS紹介（週1回）', '写真撮影サポート', '月次レポート'],
      en: ['All Standard features', 'Free paper priority slot', 'SNS feature (weekly)', 'Photo shoot support', 'Monthly report'],
    },
    featured: false,
  },
]

const PAPER_PLANS = [
  {
    id: 'spread',
    nameJa: '見開き特集',
    nameEn: 'Feature Spread',
    price: 38000,
    tagJa: 'ジャンル先頭・A4サイズ相当',
    tagEn: 'Genre top position — A4 size',
    note: { ja: '3枠限定（レストラン・バー・キャバ 各1枠）', en: '3 slots only (Restaurant / Bar / Cabaret)' },
    featured: true,
  },
  {
    id: 'tokudai',
    nameJa: '特大（1ページ）',
    nameEn: 'Full Page',
    price: 30000,
    tagJa: '目立ち度◎',
    tagEn: 'Maximum impact',
    note: { ja: '2枠限定', en: '2 slots only' },
    featured: false,
  },
  {
    id: 'large',
    nameJa: '大枠（1/2ページ）',
    nameEn: 'Half Page',
    price: 18000,
    tagJa: '',
    tagEn: '',
    note: { ja: '4枠', en: '4 slots' },
    featured: false,
  },
  {
    id: 'medium',
    nameJa: '中枠（1/4ページ）',
    nameEn: 'Quarter Page',
    price: 10000,
    tagJa: '',
    tagEn: '',
    note: { ja: '8枠', en: '8 slots' },
    featured: false,
  },
  {
    id: 'small',
    nameJa: '小枠（1/8ページ）',
    nameEn: 'Small',
    price: 5000,
    tagJa: '',
    tagEn: '',
    note: { ja: '8枠', en: '8 slots' },
    featured: false,
  },
  {
    id: 'backcover',
    nameJa: '裏表紙',
    nameEn: 'Back Cover',
    price: 35000,
    tagJa: '最高視認率・1枠のみ',
    tagEn: 'Highest visibility — 1 slot only',
    note: { ja: '1枠限定', en: '1 slot only' },
    featured: false,
  },
]

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default async function AdvertisePage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const isJa = locale === 'ja'
  const isZh = locale === 'zh'

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">

      {/* HERO */}
      <div className="text-center mb-20">
        <p className="text-xs tracking-[0.3em] uppercase text-gold mb-6">
          {isJa ? '掲載・広告のご案内' : isZh ? '刊登廣告' : 'Advertise with Us'}
        </p>
        <h1 className="font-mincho text-4xl md:text-5xl font-semibold leading-tight mb-6">
          {isJa ? '石垣島の夜を、\nもっと多くの人へ。' : isZh ? '讓石垣島的夜晚\n被更多人看見。' : "Bring Ishigaki's\nnightlife to the world."}
        </h1>
        <p className="text-base leading-loose max-w-lg mx-auto opacity-60" style={{color:'rgb(var(--ink))'}}>
          {isJa
            ? '国内外の観光客が毎晩探している石垣島のバー・居酒屋情報。掲載するだけで、あなたのお店が旅人の夜の選択肢になります。'
            : isZh
            ? '每晚都有國內外遊客在尋找石垣島的酒吧和居酒屋。只需刊登，您的店就能成為旅人的夜晚選擇。'
            : 'Tourists search for Ishigaki bars every night. Get listed and become part of their evening.'}
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-20">
        {[
          { num: '150万人', label: isJa ? '年間観光客数（2025年実績）' : isZh ? '年遊客數（2025年實績）' : 'Annual visitors (2025)' },
          { num: '4言語',  label: isJa ? '日英中韓で発信' : isZh ? '日英中韓發信' : 'JP / EN / ZH / KO' },
          { num: '¥0',    label: isJa ? '初期費用なし' : isZh ? '無初始費用' : 'No setup fee' },
        ].map((s) => (
          <div key={s.num} className="border border-stone-200 rounded-xl p-6 text-center bg-surface">
            <div className="font-mincho text-3xl font-semibold text-gold mb-2">{s.num}</div>
            <div className="text-xs opacity-60" style={{color:'rgb(var(--ink))'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* MONTHLY PLANS */}
      <div className="mb-20">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-gold mb-2">
            {isJa ? 'Web掲載' : 'Web Listing'}
          </p>
          <h2 className="font-mincho text-2xl font-semibold">
            {isJa ? '月額プラン' : isZh ? '月費方案' : 'Monthly Plans'}
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {MONTHLY_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl p-6 border ${
                plan.featured ? 'border-gold bg-gold/8' : 'border-stone-200 bg-surface'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                  {isJa ? '人気' : isZh ? '熱門' : 'Popular'}
                </div>
              )}
              <p className="font-mincho text-lg font-semibold mb-1">
                {isJa ? plan.nameJa : plan.nameEn}
              </p>
              <p className="text-3xl font-semibold text-gold font-mincho mb-1">
                ¥{plan.price.toLocaleString()}
                <span className="text-sm text-stone-400 font-sans font-normal"> / {isJa ? '月' : 'mo'}</span>
              </p>
              <p className="text-xs text-stone-500 mb-5">{isJa ? plan.tagJa : plan.tagEn}</p>
              <ul className="space-y-2 text-sm text-stone-600">
                {(isJa ? plan.features.ja : plan.features.en).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-gold mt-0.5">—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* FREEPAPER PLANS */}
      <div className="mb-20">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-gold mb-2">
            {isJa ? 'フリーペーパー' : 'Free Paper'}
          </p>
          <h2 className="font-mincho text-2xl font-semibold">
            {isJa ? '単発プラン' : isZh ? '單次方案' : 'One-time Plans'}
          </h2>
          <p className="text-xs text-stone-400 mt-2">
            {isJa ? 'A5・32ページ　ジャンル別（レストラン／バー／キャバ）構成' : 'A5 · 32pp · Organized by genre (Restaurant / Bar / Cabaret)'}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {PAPER_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl p-5 border ${
                plan.featured ? 'border-gold bg-gold/8' : 'border-stone-200 bg-surface'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-semibold px-3 py-0.5 rounded-full whitespace-nowrap">
                  {isJa ? 'おすすめ' : 'Recommended'}
                </div>
              )}
              <p className="font-mincho text-base font-semibold mb-1">
                {isJa ? plan.nameJa : plan.nameEn}
              </p>
              <p className="text-2xl font-semibold text-gold font-mincho mb-1">
                ¥{plan.price.toLocaleString()}
                <span className="text-xs text-stone-400 font-sans font-normal"> / {isJa ? '回' : 'issue'}</span>
              </p>
              {plan.tagJa && (
                <p className="text-xs text-stone-500 mb-2">{isJa ? plan.tagJa : plan.tagEn}</p>
              )}
              <p className="text-xs text-stone-400 mt-2 border-t border-stone-100 pt-2">
                {isJa ? plan.note.ja : plan.note.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center border border-stone-200 rounded-2xl p-12 bg-surface">
        <h2 className="font-mincho text-2xl font-semibold mb-4">
          {isJa ? 'まず話を聞いてみませんか。' : isZh ? '先聽聽我們的介紹？' : 'Want to learn more?'}
        </h2>
        <p className="text-stone-500 text-sm mb-8">
          {isJa ? '資料請求・無料相談は下記からどうぞ。掲載を急かすことはしません。' : isZh ? '請透過以下方式索取資料或免費諮詢。' : 'Request info or a free consultation. No pressure.'}
        </p>
        <a
          href="mailto:info@ishigaki-night.jp"
          className="inline-block px-10 py-3 bg-gold text-white font-semibold text-sm tracking-wide hover:opacity-85 transition-opacity rounded"
        >
          {isJa ? '無料相談・資料請求' : isZh ? '免費諮詢・索取資料' : 'Free Consultation'}
        </a>
      </div>

    </div>
  )
}
