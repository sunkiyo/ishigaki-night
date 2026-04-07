import { getTranslations, setRequestLocale } from 'next-intl/server'

export async function generateStaticParams() {
  return ['ja', 'en', 'zh', 'ko'].map((locale) => ({ locale }))
}

export default async function AboutPage({
  params,
}: {
  params: { locale: string }
}) {
  const { locale } = params
  setRequestLocale(locale)

  const t = await getTranslations('about')

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* ヘッダー */}
      <div className="mb-12">
        <p className="text-xs tracking-[0.2em] uppercase text-gold mb-3">{t('label')}</p>
        <h1 className="font-mincho text-4xl font-semibold mb-4">{t('title')}</h1>
        <p className="text-stone-400 text-lg leading-loose">{t('subtitle')}</p>
      </div>

      {/* セクション1: 石垣島の夜を世界へ */}
      <section className="mb-12">
        <h2 className="font-mincho text-2xl font-semibold mb-4 border-l-4 border-gold pl-4">
          {t('section1Title')}
        </h2>
        <p className="text-stone-500 leading-loose">{t('section1Body')}</p>
      </section>

      {/* セクション2: フリーペーパーとの連携 */}
      <section className="mb-12">
        <h2 className="font-mincho text-2xl font-semibold mb-4 border-l-4 border-gold pl-4">
          {t('section2Title')}
        </h2>
        <p className="text-stone-500 leading-loose">{t('section2Body')}</p>
      </section>

      {/* セクション3: 掲載・広告 */}
      <section className="mb-12">
        <h2 className="font-mincho text-2xl font-semibold mb-4 border-l-4 border-gold pl-4">
          {t('section3Title')}
        </h2>
        <p className="text-stone-500 leading-loose mb-6">{t('section3Body')}</p>

        <div className="border border-stone-200 rounded-xl p-6 bg-surface">
          <a
            href={`mailto:${t('contactEmail')}`}
            className="inline-flex items-center gap-2 bg-gold text-black font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            <span>✉</span>
            {t('contactButton')}
          </a>
          <p className="mt-3 text-xs text-stone-400">{t('contactEmail')}</p>
        </div>
      </section>
    </div>
  )
}
