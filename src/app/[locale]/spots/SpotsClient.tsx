'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import SpotCard from '@/components/spots/SpotCard'
import SpotFilter from '@/components/spots/SpotFilter'
import { spots } from '@/lib/spots'

const CATEGORIES = ['all', 'bar', 'izakaya', 'live', 'club', 'dining'] as const

export default function SpotsClient({ locale }: { locale: string }) {
  const t = useTranslations('spots')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [openNow, setOpenNow] = useState(false)

  const filtered = useMemo(() => {
    return spots.filter((s) => {
      const q = query.toLowerCase()
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.area.toLowerCase().includes(q)
      const matchC = category === 'all' || s.category === category
      const now = new Date().getHours()
      const matchO = !openNow || (s.openHour <= now && s.closeHour > now)
      return matchQ && matchC && matchO
    })
  }, [query, category, openNow])

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-xs tracking-[0.2em] uppercase text-gold mb-2">{t('label')}</p>
        <h1 className="font-mincho text-3xl font-semibold mb-2">{t('title')}</h1>
        <p className="text-stone-500 text-sm">{t('subtitle')}</p>
      </div>

      <SpotFilter
        query={query}
        onQuery={setQuery}
        category={category}
        onCategory={setCategory}
        categories={CATEGORIES}
        openNow={openNow}
        onOpenNow={setOpenNow}
        locale={locale}
      />

      <p className="text-xs text-stone-400 mb-6">
        {filtered.length} {t('results')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((spot) => (
          <SpotCard key={spot.id} spot={spot} locale={locale} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 text-center py-20 text-stone-400">{t('noResults')}</p>
        )}
      </div>
    </div>
  )
}
