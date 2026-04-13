'use client'

// ダッシュボードの既存HTMLロジックをReactコンポーネントとして移植
// 詳細実装は ishigaki_dashboard_v4.html を参照し、Chart.jsを react-chartjs-2 経由で使用

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, LineController, BarController,
  ArcElement, Filler, Tooltip, Legend,
  type ChartData,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { DemandEntry } from '@/lib/demand'
import type { YearData } from '@/lib/visitorData'
import type { IslandEvent } from '@/lib/demandEvents'
import type { CruiseArrival } from '@/lib/cruiseData'
import { cruiseDemandBoost, cruiseSizeLabel } from '@/lib/cruiseData'
import { getStatus } from '@/lib/demand'
import { getLatestYear, wareki, MONTHS_JA, MONTHS_EN } from '@/lib/visitorData'
import EventsSection from '@/components/dashboard/EventsSection'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, LineController, BarController, ArcElement, Filler, Tooltip, Legend)

const STATUS_CONFIG = {
  hot:    { label: { ja: '激混み', en: 'Peak',     zh: '超热' }, color: '#f05350' },
  warm:   { label: { ja: 'にぎわい', en: 'Busy',   zh: '热闹' }, color: '#f0b865' },
  normal: { label: { ja: '普通',   en: 'Moderate', zh: '一般' }, color: '#3ec768' },
  cool:   { label: { ja: '閑散',   en: 'Slow',     zh: '安静' }, color: '#4ea8f5' },
}

function gaugeColor(idx: number) {
  if (idx >= 85) return '#f05350'
  if (idx >= 55) return '#d4923f'
  if (idx >= 35) return '#3ec768'
  return '#4ea8f5'
}

type Props = {
  history: DemandEntry[]
  officialData: Record<number, YearData>
  upcomingEvents?: IslandEvent[]
  upcomingCruises?: CruiseArrival[]
  lang: string
}

export default function DashboardClient({ history, officialData, upcomingEvents = [], upcomingCruises = [], lang }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const latest = history[history.length - 1]
  const idx    = latest?.index ?? 0
  const status = getStatus(idx)
  const cfg    = STATUS_CONFIG[status]
  const lbl    = cfg.label[lang as 'ja' | 'en' | 'zh'] ?? cfg.label.ja
  const months = lang === 'en' ? MONTHS_EN : MONTHS_JA

  const latestY = getLatestYear()
  const cur     = officialData[latestY]
  const prevY   = officialData[latestY - 1]

  // 日付を "M/D" 形式に変換するヘルパー
  const fmtDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-')
    return `${Number(m)}/${Number(d)}`
  }

  // 今日〜6日後（合計7日間）の日別需要指数を生成
  // 夜の繁華街向け曜日係数: 月〜日
  const DOW_MULTIPLIERS = [0.55, 0.62, 0.72, 0.82, 1.22, 1.32, 0.88]
  const DOW_LABELS_JA   = ['月', '火', '水', '木', '金', '土', '日']
  const todayJs = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayJs)
    d.setDate(todayJs.getDate() + i)
    const dow      = d.getDay() // 0=Sun
    const dowIdx   = dow === 0 ? 6 : dow - 1  // 0=月…6=日
    const isToday  = i === 0
    const isFuture = i > 0
    const dateStr  = d.toISOString().slice(0, 10)
    // クルーズ船入港ブースト
    const cruise   = upcomingCruises.find(c => c.arrival_date === dateStr) ?? null
    const boost    = cruise ? cruiseDemandBoost(cruise.passengers) : 0
    const baseIdx  = Math.round(idx * DOW_MULTIPLIERS[dowIdx])
    const dailyIdx = Math.min(100, Math.round(baseIdx + boost * 100 * 0.3))
    return {
      label: [DOW_LABELS_JA[dowIdx], `${d.getMonth() + 1}/${d.getDate()}`] as [string, string],
      index: dailyIdx,
      isToday,
      isFuture,
      cruise,
    }
  })

  // 需要指数グラフ: 過去8週の実績 + 全予測エントリ
  const actualEntries   = history.filter((r) => !r.isForecast)
  const forecastEntries = history.filter((r) => r.isForecast)
  const displayHistory  = [...actualEntries.slice(-8), ...forecastEntries]

  // forecastエントリに信頼度を付与（なければ週順で計算）
  let forecastCount = 0
  const displayWithConf = displayHistory.map((r) => {
    if (!r.isForecast) return { ...r, confidence: r.confidence ?? 1.0 }
    const conf = r.confidence ?? Math.max(0.15, 1 - forecastCount * 0.11)
    forecastCount++
    return { ...r, confidence: conf }
  })

  // 需要レベルカード: 3本バー用の計算
  const trendsScore = latest?.trends ?? 0
  const trendsPt    = Math.round(trendsScore * 0.5)
  const occupancy   = latest?.hotel != null ? 100 - latest.hotel : 0
  const hotelPt     = Math.round(occupancy * 0.3)
  // flight = OpenSkyフライトスコア(0-100, 旧:円)
  const flightScore = latest?.flight ?? 0
  const estimatedFlights = latest?.flight ? Math.round(latest.flight * 0.7) : null  // スコア→推定週次便数
  const flightLevel = !latest?.flight ? '-'
    : latest.flight < 30 ? (lang === 'ja' ? '少なめ' : 'Low')
    : latest.flight < 55 ? (lang === 'ja' ? '普通' : 'Normal')
    : latest.flight < 80 ? (lang === 'ja' ? '多め' : 'High')
    : (lang === 'ja' ? '激混み' : 'Very High')

  if (!mounted) return <div className="h-96 flex items-center justify-center text-stone-400 text-sm">Loading...</div>

  return (
    <div className="flex flex-col gap-5">

      {/* HERO BAND */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* 今週の需要指数 — 曜日別（月〜日）棒グラフ */}
        <div className="bg-surface border border-stone-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-xs tracking-widest uppercase text-stone-400">
              {lang === 'ja' ? '今後7日の需要指数' : lang === 'zh' ? '未來7天需求指數' : 'Next 7 Days'}
            </p>
            <span
              className="text-xs font-semibold px-3 py-0.5 rounded-full"
              style={{ color: cfg.color, background: cfg.color + '22', border: `1px solid ${cfg.color}44` }}
            >
              {idx} — {lbl}
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-3">
            {lang === 'ja' ? '今日を起点に7日間の予測需要' : 'Demand forecast from today for 7 days'}
          </p>
          <div style={{ flex: 1, minHeight: 130 }}>
            <Bar
              data={{
                labels: weekDays.map((d) => d.label),
                datasets: [{
                  data: weekDays.map((d) => d.index),
                  backgroundColor: weekDays.map((d) =>
                    d.isFuture
                      ? gaugeColor(d.index) + '44'
                      : gaugeColor(d.index) + 'aa'
                  ),
                  borderColor: weekDays.map((d) =>
                    d.isToday ? '#1a1208' : gaugeColor(d.index)
                  ),
                  borderWidth: weekDays.map((d) => d.isToday ? 2 : 1),
                  borderRadius: 3,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      title: (items) => {
                        const d = weekDays[items[0].dataIndex]
                        return `${d.label[0]}曜 ${d.label[1]}${d.isToday ? '（今日）' : d.isFuture ? '（推定）' : ''}`
                      },
                      label: (item) => {
                        const d = weekDays[item.dataIndex]
                        const lines = [`需要指数: ${item.raw}`]
                        if (d.cruise) lines.push(`🚢 ${d.cruise.ship_name} (${d.cruise.passengers?.toLocaleString() ?? '?'}人)`)
                        return lines
                      },
                    },
                    backgroundColor: '#faf5ee',
                    borderColor: 'rgba(192,112,40,.2)',
                    borderWidth: 1,
                    titleColor: '#2d1f0e',
                    bodyColor: '#7a6048',
                  },
                },
                scales: {
                  x: { ticks: { color: '#a89070', font: { size: 9 } }, grid: { display: false } },
                  y: { min: 0, max: 100, display: false },
                },
              }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-2">
            {lang === 'ja' ? '太枠＝今日　薄色＝今日以降の推定　🚢＝クルーズ船入港日' : 'Bold = today, light = estimated, 🚢 = cruise day'}
          </p>
          {/* クルーズ船入港ミニバッジ */}
          {weekDays.some(d => d.cruise) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {weekDays.filter(d => d.cruise).map((d, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  🚢 {d.label[1]} {d.cruise!.ship_name.split(' ').slice(-1)[0]}
                  {d.cruise!.passengers && ` ${(d.cruise!.passengers / 1000).toFixed(1)}k人`}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ゲージ */}
        <div className="bg-surface border border-stone-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-stone-600 mb-1">
              {lang === 'ja' ? '需要レベル' : 'Demand Level'}
            </p>
            <p className="text-xs text-stone-400 mb-4">
              {lang === 'ja' ? '3つのデータを組み合わせて算出' : 'Calculated from 3 data sources'}
            </p>
            <div className="h-2.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(26,18,8,.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${idx}%`,
                  background: 'linear-gradient(90deg,#3ec768 0%,#d4923f 55%,#f05350 100%)',
                  backgroundSize: '300px 10px',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-400">
              <span>{lang === 'ja' ? '静か' : 'Quiet'}</span>
              <span>{lang === 'ja' ? '激混み' : 'Peak'}</span>
            </div>
          </div>
          {/* 3本バー */}
          <div className="flex flex-col gap-3 mt-4">

            {/* グーグル検索: Trendsスコア(0-100)×0.5=pt */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 13 }}>🔍</span>
                <span className="text-xs text-stone-500 flex-1">{lang === 'ja' ? 'グーグル検索' : 'Google Trends'}</span>
                <span className="text-xs font-semibold text-stone-600">
                  {trendsPt}<span className="text-stone-400 font-normal"> / 50pt</span>
                </span>
              </div>
              <div className="relative h-3 rounded-full" style={{ background: 'rgba(26,18,8,.08)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${trendsScore}%`, background: '#4ea8f5', minWidth: 4 }} />
                <span className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold whitespace-nowrap"
                  style={{ left: `calc(${trendsScore}% + 3px)`, color: '#4ea8f5' }}>
                  {trendsScore}
                </span>
              </div>
              <p className="text-[9px] text-stone-300 mt-0.5">{lang === 'ja' ? '相対人気度スコア（最高値=100）×0.5' : 'Relative search score (peak=100) ×0.5'}</p>
            </div>

            {/* ホテル満室率: 空室率の逆数 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 13 }}>🏨</span>
                <span className="text-xs text-stone-500 flex-1">{lang === 'ja' ? 'ホテル満室率' : 'Hotel Occupancy'}</span>
                <span className="text-xs font-semibold text-stone-600">
                  {occupancy}<span className="text-stone-400 font-normal">%</span>
                  <span className="text-stone-300 font-normal ml-1">({hotelPt}/{lang === 'ja' ? '30pt' : '30pt'})</span>
                </span>
              </div>
              <div className="relative h-3 rounded-full" style={{ background: 'rgba(26,18,8,.08)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${occupancy}%`, background: '#d4923f', minWidth: 4 }} />
                <span className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold whitespace-nowrap"
                  style={{ left: `calc(${occupancy}% + 3px)`, color: '#d4923f' }}>
                  {occupancy}%
                </span>
              </div>
            </div>

            {/* 石垣便数: OpenSkyフライトスコア表示 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 13 }}>✈️</span>
                <span className="text-xs text-stone-500 flex-1">{lang === 'ja' ? '石垣便数' : 'Flights/Week'}</span>
                <span className="text-xs font-semibold text-stone-600">
                  {estimatedFlights != null ? `~${estimatedFlights}便/週` : '-'}
                  <span className="text-stone-400 font-normal ml-1">({flightLevel})</span>
                </span>
              </div>
              <div className="relative h-3 rounded-full" style={{ background: 'rgba(26,18,8,.08)' }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{ width: `${flightScore}%`, background: '#3ec768', minWidth: 4 }} />
                <span className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold whitespace-nowrap"
                  style={{ left: `calc(${flightScore}% + 3px)`, color: '#3ec768' }}>
                  {flightLevel}
                </span>
              </div>
              <p className="text-[9px] text-stone-300 mt-0.5">
                {lang === 'ja'
                  ? '少なめ<30便 / 普通30〜55便 / 多め55〜80便 / 激混み≥80便（週次推定）'
                  : 'Low<30 / Normal30-55 / High55-80 / Very High≥80 flights/week'}
              </p>
            </div>

          </div>
        </div>

        {/* 推奨アクション */}
        <div className="bg-surface border border-stone-200 rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-gold mb-4">
            {lang === 'ja' ? '今週やること' : 'This Week'}
          </p>
          {(status === 'hot' ? [
            ['🎵',
              lang === 'ja' ? 'DJイベント・ライブを週1回以上開催する' : 'Host DJ/live events weekly',
              lang === 'ja' ? '→ 滞在時間が延びて客単価1.5〜2倍に' : '→ Longer stays, 1.5–2× spend per head'],
            ['👥',
              lang === 'ja' ? 'スタッフを2名増員・仕入れを1.5倍にする' : 'Add 2 staff & increase stock 1.5×',
              lang === 'ja' ? '→ 機会損失ゼロ・売上を最大化できる' : '→ Zero missed sales, max revenue'],
            ['📱',
              lang === 'ja' ? '「今週末空きあり」をSNSで毎朝投稿する' : 'Post "seats available" on SNS each morning',
              lang === 'ja' ? '→ 新規来店が週10〜20組増える' : '→ 10–20 extra walk-ins per week'],
          ] : status === 'warm' ? [
            ['⏰',
              lang === 'ja' ? 'ハッピーアワーを19〜21時に設定する' : 'Set happy hour 7–9 PM',
              lang === 'ja' ? '→ アイドルタイムの売上が30%以上向上' : '→ 30%+ revenue lift in slow hours'],
            ['🌐',
              lang === 'ja' ? 'インスタを英語・中国語でも週2回投稿する' : 'Post on Instagram in EN/ZH twice a week',
              lang === 'ja' ? '→ インバウンド客の認知を獲得できる' : '→ Reach international tourist audience'],
            ['🎟',
              lang === 'ja' ? '週末イベントを3日前にSNS告知する' : 'Announce weekend events 3 days ahead',
              lang === 'ja' ? '→ 予約数が告知なし比で約2倍に増える' : '→ ~2× reservations vs. no advance notice'],
          ] : status === 'normal' ? [
            ['🎫',
              lang === 'ja' ? 'LINE登録で500円クーポンを配布する' : 'Offer ¥500 coupon for LINE sign-ups',
              lang === 'ja' ? '→ リピーター獲得・再来店率が上がる' : '→ Build loyalty & drive repeat visits'],
            ['📍',
              lang === 'ja' ? '常連向けに限定メニューを1品追加する' : 'Add one exclusive menu item for regulars',
              lang === 'ja' ? '→ 口コミと地元客のリピートが増える' : '→ Word-of-mouth & local repeat boost'],
            ['💰',
              lang === 'ja' ? 'SNS広告を週¥3,000〜試してみる' : 'Try SNS ads from ¥3,000/week',
              lang === 'ja' ? '→ 閑散期は入札単価が安く費用対効果が高い' : '→ Lower CPC in slow season = better ROI'],
          ] : [
            ['🕐',
              lang === 'ja' ? '営業時間を2時間短縮する' : 'Reduce hours by 2 hours',
              lang === 'ja' ? '→ 人件費を月5〜8万円削減できる' : '→ Save ¥50–80k/month in labor costs'],
            ['📸',
              lang === 'ja' ? '店内・料理の写真・動画を撮り溜める' : 'Shoot photos & videos of food/interior',
              lang === 'ja' ? '→ 繁忙期SNS投稿の素材を先行確保できる' : '→ Pre-build content for peak-season posts'],
            ['📊',
              lang === 'ja' ? 'GW・夏の仕込み計画を今から立てる' : 'Plan stock & staffing for GW & summer now',
              lang === 'ja' ? '→ 繁忙期の機会損失を防ぐ事前準備になる' : '→ Prevent stockouts & understaffing at peak'],
          ]).map(([icon, action, result]) => (
            <div key={action as string} className="flex items-start gap-3 py-2.5 border-b border-stone-100 last:border-0">
              <span className="mt-0.5 shrink-0" style={{ fontSize: 14 }}>{icon}</span>
              <div>
                <p className="text-xs text-stone-700 font-medium leading-relaxed">{action as string}</p>
                <p className="text-xs text-stone-400 leading-relaxed mt-0.5">{result as string}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 来島者数グラフ */}
      <div className="bg-surface border border-stone-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className="text-sm font-medium text-stone-700">
            {lang === 'ja' ? `月別来島者数・内訳・予測（${wareki(latestY)}）` : `Monthly Visitors — Air/Sea/Forecast (${latestY})`}
          </p>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 h-2 rounded-sm" style={{ background: 'rgba(78,168,245,.75)' }} />
              {lang === 'ja' ? '空路' : 'Air'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 h-2 rounded-sm" style={{ background: 'rgba(45,212,191,.75)' }} />
              {lang === 'ja' ? '海路' : 'Sea'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 h-0.5 rounded-full" style={{ background: 'rgba(107,117,133,.55)' }} />
              {lang === 'ja' ? `前年（${wareki(latestY - 1).replace('年', '')}年）` : String(latestY - 1)}
            </span>
          </div>
        </div>
        <p className="text-xs text-stone-400 mb-4">
          {lang === 'ja' ? '出典：石垣市観光文化課「入域観光推計」' : 'Source: Ishigaki City Tourism Division'}
        </p>
        <div style={{ height: 280 }}>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  type: 'line' as const,
                  label: lang === 'ja' ? `${wareki(latestY - 1).replace('年', '')}年` : String(latestY - 1),
                  data: prevY?.visitors ?? [],
                  borderColor: 'rgba(107,117,133,.55)',
                  borderWidth: 1.5,
                  order: 2,
                },
                {
                  label: lang === 'ja' ? '空路（飛行機）' : 'Air',
                  data: cur.air,
                  backgroundColor: 'rgba(78,168,245,.75)',
                  stack: 'visitor',
                  order: 4,
                },
                {
                  label: lang === 'ja' ? '海路（クルーズ）' : 'Sea',
                  data: cur.sea,
                  backgroundColor: 'rgba(45,212,191,.75)',
                  stack: 'visitor',
                  order: 4,
                },
              ],
            } as ChartData<'bar'>}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#faf5ee',
                  borderColor: 'rgba(192,112,40,.2)',
                  borderWidth: 1,
                  titleColor: '#2d1f0e',
                  bodyColor: '#7a6048',
                },
              },
              scales: {
                x: { stacked: true, ticks: { color: '#a89070', font: { size: 9 } }, grid: { color: 'rgba(26,18,8,.05)' } },
                y: { stacked: true, ticks: { color: '#a89070', font: { size: 9 }, callback: (v) => `${Math.round(Number(v) / 10000)}万` }, grid: { color: 'rgba(26,18,8,.05)' } },
              },
            }}
          />
        </div>
      </div>

      {/* 需要指数履歴 */}
      <div className="bg-surface border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm font-medium text-stone-700">
              {lang === 'ja' ? '需要指数 過去実績＋予測' : 'Demand Index History + Forecast'}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {lang === 'ja' ? '需要指数：0（閑散）〜100（激混み）、縦軸の数字が大きいほど混雑' : 'Index: 0 (slow) – 100 (peak), higher = busier'}
            </p>
          </div>
          {/* 凡例 */}
          <div className="flex items-center gap-4 text-xs text-stone-400 shrink-0">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#d4923faa', border: '1px solid #d4923f' }} />
              {lang === 'ja' ? '実績' : 'Actual'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: 'rgba(200,200,200,.35)', border: '1px dashed #aaa' }} />
              {lang === 'ja' ? '予測' : 'Forecast'}
            </span>
          </div>
        </div>
        <div style={{ height: 220 }}>
          <Bar
            data={{
              labels: displayWithConf.map((r) => fmtDate(r.date)),
              datasets: [{
                data: displayWithConf.map((r) => r.index),
                backgroundColor: displayWithConf.map((r) =>
                  r.isForecast
                    ? `rgba(180,180,180,${(r.confidence * 0.5).toFixed(2)})`
                    : gaugeColor(r.index) + 'aa'
                ),
                borderColor: displayWithConf.map((r) =>
                  r.isForecast
                    ? `rgba(130,130,130,${(r.confidence * 0.9).toFixed(2)})`
                    : gaugeColor(r.index)
                ),
                borderWidth: 1,
                borderRadius: 3,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    title: (items) => {
                      const r = displayWithConf[items[0].dataIndex]
                      return `${fmtDate(r.date)}週${r.isForecast ? '（予測）' : '（実績）'}`
                    },
                    label: (item) => {
                      const r = displayWithConf[item.dataIndex]
                      const confStr = r.isForecast ? ` 信頼度: ${Math.round(r.confidence * 100)}%` : ''
                      return `需要指数: ${item.raw} / 100${confStr}`
                    },
                  },
                  backgroundColor: '#faf5ee',
                  borderColor: 'rgba(192,112,40,.2)',
                  borderWidth: 1,
                  titleColor: '#2d1f0e',
                  bodyColor: '#7a6048',
                },
              },
              scales: {
                x: {
                  ticks: { color: '#a89070', font: { size: 9 } },
                  grid: { display: false },
                  title: { display: true, text: lang === 'ja' ? '日付（週始め）' : 'Date (week start)', color: '#b8a090', font: { size: 9 } },
                },
                y: {
                  min: 0,
                  max: 100,
                  ticks: {
                    color: '#a89070',
                    font: { size: 9 },
                    stepSize: 25,
                    callback: (v) => {
                      const n = Number(v)
                      if (n === 0)   return '0 閑散'
                      if (n === 25)  return '25'
                      if (n === 50)  return '50'
                      if (n === 75)  return '75 激混み'
                      if (n === 100) return '100'
                      return String(n)
                    },
                  },
                  grid: { color: 'rgba(26,18,8,.05)' },
                  title: { display: true, text: lang === 'ja' ? '需要指数' : 'Demand Index', color: '#b8a090', font: { size: 9 } },
                },
              },
            }}
          />
        </div>
      </div>

      {/* 今後4週間のアクション提案テーブル */}
      <div className="bg-surface border border-stone-200 rounded-xl p-5">
        <p className="text-sm font-medium text-stone-700 mb-1">
          {lang === 'ja' ? '今後4週間 お店推奨アクション' : 'Next 4 Weeks — Recommended Actions'}
        </p>
        <p className="text-xs text-stone-400 mb-4">
          {lang === 'ja' ? '業種別・需要予測にもとづくお店向け提案' : 'Per-category recommendations based on demand forecast'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 pr-3 text-stone-400 font-normal whitespace-nowrap">{lang === 'ja' ? '週' : 'Week'}</th>
                <th className="text-left py-2 pr-3 text-stone-400 font-normal whitespace-nowrap">{lang === 'ja' ? '需要予測' : 'Forecast'}</th>
                <th className="text-left py-2 pr-3 text-stone-400 font-normal whitespace-nowrap">{lang === 'ja' ? '業種' : 'Type'}</th>
                <th className="text-left py-2 text-stone-400 font-normal">{lang === 'ja' ? '推奨アクション' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {([
                {
                  week: '4/13〜', index: 88, badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  rows: [
                    { icon: '🍸', type: 'バー',      action: lang === 'ja' ? 'DJイベント・ライブ開催、カクテル特別メニューで客単価UP' : 'DJ events & premium cocktail menu' },
                    { icon: '💃', type: 'キャバクラ', action: lang === 'ja' ? '指名予約を優先受付・シャンパンタワーキャンペーン告知' : 'Priority reservations & champagne promos' },
                    { icon: '🍺', type: '居酒屋',    action: lang === 'ja' ? '飲み放題プランを前面訴求・仕込みと仕入れを増量' : 'Push all-you-can-drink plans & stock up' },
                  ],
                },
                {
                  week: '4/20〜', index: 92, badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  rows: [
                    { icon: '🍸', type: 'バー',      action: lang === 'ja' ? 'SNS告知を最大化・スタッフ増員でキャパシティ確保' : 'Max SNS outreach & increase staff' },
                    { icon: '💃', type: 'キャバクラ', action: lang === 'ja' ? 'GWスペシャルイベント開催・新人キャスト積極起用' : 'GW special event & feature new staff' },
                    { icon: '🍺', type: '居酒屋',    action: lang === 'ja' ? '回転率重視の席づくり・テーブルチャージで売上UP' : 'Optimize table turnover & add table charge' },
                  ],
                },
                {
                  week: '4/27〜', index: 89, badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  rows: [
                    { icon: '🍸', type: 'バー',      action: lang === 'ja' ? 'GW最終週で高単価狙い・プレミアムカクテルを前面に' : 'Push premium cocktails for GW finale' },
                    { icon: '💃', type: 'キャバクラ', action: lang === 'ja' ? 'GWラスト告知・延長・同伴プランで滞在時間を延ばす' : 'GW last-day promos & companion plans' },
                    { icon: '🍺', type: '居酒屋',    action: lang === 'ja' ? '〆メニュー充実・GW疲れの観光客を取り込む' : 'Late-night specials for tired tourists' },
                  ],
                },
                {
                  week: '5/11〜', index: 62, badge: '🟡',
                  status: lang === 'ja' ? 'にぎわい' : 'Busy',
                  rows: [
                    { icon: '🍸', type: 'バー',      action: lang === 'ja' ? 'GW明け地元客向けクーポン・ハッピーアワー延長' : 'Local coupons & extended happy hour' },
                    { icon: '💃', type: 'キャバクラ', action: lang === 'ja' ? '体験入店キャンペーン・リピーター向けポイント施策' : 'Trial visit campaign & loyalty points' },
                    { icon: '🍺', type: '居酒屋',    action: lang === 'ja' ? '常連向け季節メニュー刷新・地元イベントに協賛' : 'Seasonal menu refresh & local tie-ups' },
                  ],
                },
              ] as Array<{
                week: string; index: number; badge: string; status: string;
                rows: { icon: string; type: string; action: string }[]
              }>).map((row) => (
                row.rows.map((r, ri) => (
                  <tr
                    key={`${row.week}-${ri}`}
                    className={`border-stone-100 hover:bg-stone-50 transition-colors ${ri === row.rows.length - 1 ? 'border-b' : ''}`}
                  >
                    {ri === 0 && (
                      <>
                        <td className="py-2 pr-3 text-stone-600 font-medium whitespace-nowrap align-top pt-3" rowSpan={3}>{row.week}</td>
                        <td className="py-2 pr-3 whitespace-nowrap align-top pt-3" rowSpan={3}>
                          <span className="flex items-center gap-1">
                            <span>{row.badge}</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: row.index >= 85 ? '#f05350' : '#f0b865' }}>{row.index}</span>
                          </span>
                          <span className="text-stone-400 block mt-0.5">{row.status}</span>
                        </td>
                      </>
                    )}
                    <td className="py-1.5 pr-3 whitespace-nowrap text-stone-500">
                      <span className="mr-1">{r.icon}</span>{r.type}
                    </td>
                    <td className="py-1.5 text-stone-600 leading-relaxed">{r.action}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 直近のイベント */}
      <EventsSection events={upcomingEvents} lang={lang} />

      {/* クルーズ船入港スケジュール */}
      <div className="bg-surface border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs tracking-widest uppercase text-stone-400">
            {lang === 'ja' ? 'クルーズ船入港スケジュール' : 'Cruise Ship Arrivals'}
          </p>
          <span className="text-xs text-stone-400">石垣港</span>
        </div>
        {upcomingCruises.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">今後35日間の入港情報はありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingCruises.map((c) => {
              const boost = cruiseDemandBoost(c.passengers)
              const sizeLabel = cruiseSizeLabel(c.passengers)
              const sizeColor = boost >= 0.40 ? '#f05350' : boost >= 0.30 ? '#f0b865' : boost >= 0.20 ? '#3ec768' : '#94a3b8'
              const [, m, d] = c.arrival_date.split('-')
              const dateLabel = `${Number(m)}/${Number(d)}`
              return (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-xs text-stone-400">🚢</p>
                    <p className="text-sm font-semibold text-stone-700">{dateLabel}</p>
                    {c.arrival_time && c.departure_time ? (
                      <p className="text-[10px] text-stone-400 leading-tight">
                        {c.arrival_time}〜{c.departure_time}
                      </p>
                    ) : c.arrival_time ? (
                      <p className="text-[10px] text-stone-400">{c.arrival_time}〜</p>
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-700 truncate">{c.ship_name}</p>
                    {c.route && <p className="text-[11px] text-stone-400 truncate">{c.route}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: sizeColor, background: sizeColor + '22', border: `1px solid ${sizeColor}44` }}
                    >
                      {sizeLabel}
                    </span>
                    {c.passengers && (
                      <p className="text-[11px] text-stone-400 mt-0.5">{c.passengers.toLocaleString()}人</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-[10px] text-stone-300 mt-3 text-right">
          出典: 石垣港クルーズ船寄港予約システム
        </p>
      </div>

    </div>
  )
}
