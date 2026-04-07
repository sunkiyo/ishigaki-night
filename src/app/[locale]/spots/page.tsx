import { setRequestLocale } from 'next-intl/server'
import SpotsClient from './SpotsClient'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default function SpotsPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  setRequestLocale(locale)
  return <SpotsClient locale={locale} />
}
