import { setRequestLocale } from 'next-intl/server'
import SpotsClient from './SpotsClient'
import { getLatestDemand } from '@/lib/demand'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default async function SpotsPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  setRequestLocale(locale)
  const demand = await getLatestDemand()
  return <SpotsClient locale={locale} demand={demand} />
}
