import { getTranslations, setRequestLocale } from 'next-intl/server'
import EventCard from '@/components/events/EventCard'
import { getEvents } from '@/lib/events'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default async function EventsPage({
  params,
}: {
  params: { locale: string }
}) {
  const { locale } = params
  setRequestLocale(locale)
  const t = await getTranslations('events')
  const events = await getEvents()

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-gold mb-2">{t('label')}</p>
        <h1 className="font-mincho text-3xl font-semibold mb-2">{t('title')}</h1>
        <p className="text-stone-500 text-sm">{t('subtitle')}</p>
      </div>

      {events.length === 0 ? (
        <p className="text-center py-20 text-stone-400">{t('noEvents')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} locale={locale} />
          ))}
        </div>
      )}
    </div>
  )
}
