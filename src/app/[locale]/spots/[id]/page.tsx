import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getSpotById, getSpots } from '@/lib/spots'
import CouponButton from '@/components/spots/CouponButton'

export async function generateStaticParams() {
  const spots = await getSpots()
  const locales = ['ja', 'en', 'zh', 'ko']
  return locales.flatMap((locale) =>
    spots.map((s) => ({ locale, id: s.id }))
  )
}

export default async function SpotDetailPage({
  params,
}: {
  params: { locale: string; id: string }
}) {
  const { locale, id } = params
  setRequestLocale(locale)

  const spot = await getSpotById(id)
  if (!spot) notFound()

  const t = await getTranslations('spotDetail')
  const i18nKey = locale as 'en' | 'zh' | 'ko'
  const name = spot.i18n?.[i18nKey]?.name ?? spot.name
  const desc = spot.i18n?.[i18nKey]?.description ?? spot.description

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-gold mb-3">{spot.area} — {spot.category}</p>
        <h1 className="font-mincho text-4xl font-semibold mb-4">{name}</h1>
        <p className="text-stone-500 leading-loose">{desc}</p>
      </div>

      <div className="border border-stone-200 rounded-xl overflow-hidden mb-8 bg-surface">
        {[
          [t('address'), spot.address],
          [t('hours'), `${spot.openHour}:00 – ${spot.closeHour}:00`],
          [t('phone'), spot.phone || '—'],
          [t('instagram'), spot.instagram ? `@${spot.instagram}` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex border-b border-stone-200 last:border-0">
            <span className="w-32 flex-shrink-0 px-5 py-3 text-xs text-stone-400 border-r border-stone-200">{label}</span>
            <span className="px-5 py-3 text-sm text-stone-700">{value}</span>
          </div>
        ))}
      </div>

      {spot.googleMapEmbed && (
        <div className="mb-8 rounded-xl overflow-hidden border border-stone-200">
          <iframe
            src={spot.googleMapEmbed}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {spot.coupon && (
        <CouponButton coupon={spot.coupon} locale={locale} />
      )}
    </div>
  )
}
