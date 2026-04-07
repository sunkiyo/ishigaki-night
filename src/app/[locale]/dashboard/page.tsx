// ダッシュボードは既存の ishigaki_dashboard_v4.html をReactコンポーネントとして移植
// Chart.jsはreact-chartjs-2経由で使用

import { getTranslations, setRequestLocale } from 'next-intl/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getDemandHistory } from '@/lib/demand'
import { OFFICIAL_DATA } from '@/lib/visitorData'

export function generateStaticParams() {
  return [{ locale: 'ja' }, { locale: 'en' }, { locale: 'zh' }, { locale: 'ko' }]
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  setRequestLocale(locale)
  const t = await getTranslations('dashboard')
  const history = await getDemandHistory()

  return (
    <div className="px-4 py-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6">
          <p className="text-xs tracking-[0.2em] uppercase text-gold mb-1">
            {t('label')}
          </p>
          <h1 className="font-mincho text-2xl font-semibold">
            {t('title')}
          </h1>
          <p className="text-stone-500 text-xs mt-1">{t('subtitle')}</p>
        </div>

        {/* クライアントコンポーネント（Chart.js使用） */}
        <DashboardClient
          history={history}
          officialData={OFFICIAL_DATA}
          lang={locale}
        />
      </div>
    </div>
  )
}
