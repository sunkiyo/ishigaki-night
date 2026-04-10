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
import { getStatus } from '@/lib/demand'
import { getLatestYear, wareki, MONTHS_JA, MONTHS_EN } from '@/lib/visitorData'

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
  lang: string
}

export default function DashboardClient({ history, officialData, lang }: Props) {
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

  // 今週（月〜日）の日別需要指数を生成
  // 夜の繁華街向け曜日係数: 月〜日
  const DOW_MULTIPLIERS = [0.55, 0.62, 0.72, 0.82, 1.22, 1.32, 0.88]
  const DOW_LABELS_JA   = ['月', '火', '水', '木', '金', '土', '日']
  const todayJs   = new Date()
  const todayDow  = todayJs.getDay() // 0=Sun
  const mondayJs  = new Date(todayJs)
  mondayJs.setDate(todayJs.getDate() - ((todayDow + 6) % 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mondayJs)
    d.setDate(mondayJs.getDate() + i)
    const isToday   = d.toDateString() === todayJs.toDateString()
    const isFuture  = d > todayJs
    const dailyIdx  = Math.min(100, Math.round(idx * DOW_MULTIPLIERS[i]))
    return {
      label: [DOW_LABELS_JA[i], `${d.getMonth() + 1}/${d.getDate()}`] as [string, string],
      index: dailyIdx,
      isToday,
      isFuture,
    }
  })

  // 需要指数グラフ: 過去8週の実績 + 全予測エントリ
  const actualEntries   = history.filter((r) => !r.isForecast)
  const forecastEntries = history.filter((r) => r.isForecast)
  const displayHistory  = [...actualEntries.slice(-8), ...forecastEntries]

  // 需要レベルカード: 3本バー用の計算
  const trendsScore = latest?.trends ?? 0
  const trendsPt    = Math.round(trendsScore * 0.5)
  const occupancy   = latest?.hotel != null ? 100 - latest.hotel : 0
  const hotelPt     = Math.round(occupancy * 0.3)
  const flightScore = latest?.flight
    ? Math.min(100, Math.max(0, (latest.flight - 10000) / 200))
    : 0
  const flightPt    = Math.round(flightScore * 0.2)
  const flightLevel = !latest?.flight ? '-'
    : latest.flight < 15000 ? (lang === 'ja' ? '安め' : 'Low')
    : latest.flight < 20000 ? (lang === 'ja' ? '普通' : 'Normal')
    : latest.flight < 25000 ? (lang === 'ja' ? '高め' : 'High')
    : (lang === 'ja' ? '激高' : 'Very High')

  if (!mounted) return <div className="h-96 flex items-center justify-center text-stone-400 text-sm">Loading...</div>

  return (
    <div className="flex flex-col gap-5">

      {/* HERO BAND */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* 今週の需要指数 — 曜日別（月〜日）棒グラフ */}
        <div className="bg-surface border border-stone-200 rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-xs tracking-widest uppercase text-stone-400">
              {lang === 'ja' ? '今週の需要指数' : lang === 'zh' ? '本週需求指數' : 'This Week'}
            </p>
            <span
              className="text-xs font-semibold px-3 py-0.5 rounded-full"
              style={{ color: cfg.color, background: cfg.color + '22', border: `1px solid ${cfg.color}44` }}
            >
              {idx} — {lbl}
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-3">
            {lang === 'ja' ? '曜日別の予測需要（今日以降は推定）' : 'Daily demand estimate this week'}
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
                      label: (item) => `需要指数: ${item.raw}`,
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
            {lang === 'ja' ? '太枠＝今日　薄色＝今日以降の推定' : 'Bold border = today, light = estimated'}
          </p>
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

            {/* 航空運賃: 実額＋レベル表示 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 13 }}>✈️</span>
                <span className="text-xs text-stone-500 flex-1">{lang === 'ja' ? '航空運賃' : 'Flight Price'}</span>
                <span className="text-xs font-semibold text-stone-600">
                  {latest?.flight ? `¥${latest.flight.toLocaleString()}` : '-'}
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
                  ? '安め<¥15k / 普通¥15〜20k / 高め¥20〜25k / 激高≥¥25k'
                  : 'Low<¥15k / Normal¥15-20k / High¥20-25k / Very High≥¥25k'}
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
            ['🎵', lang === 'ja' ? 'DJイベント・ライブ開催推奨' : 'Host DJ events & live music'],
            ['👥', lang === 'ja' ? 'スタッフ増員・仕入れ増量' : 'Increase staff & stock'],
            ['📱', lang === 'ja' ? 'SNS告知を最大化' : 'Maximize SNS promotions'],
          ] : status === 'warm' ? [
            ['📣', lang === 'ja' ? 'SNS積極発信・特別メニュー' : 'Active SNS + specials'],
            ['🌐', lang === 'ja' ? 'インバウンド向けコンテンツ' : 'Multilingual content push'],
            ['🎟', lang === 'ja' ? 'イベントを事前告知' : 'Pre-promote events'],
          ] : status === 'normal' ? [
            ['🎫', lang === 'ja' ? 'クーポン・割引で集客強化' : 'Launch coupons & discounts'],
            ['📍', lang === 'ja' ? '地元客向けイベント' : 'Target local residents'],
            ['💰', lang === 'ja' ? 'SNS広告を出すタイミング' : 'Good timing for paid ads'],
          ] : [
            ['🕐', lang === 'ja' ? '短縮営業・休業を検討' : 'Consider reduced hours'],
            ['📸', lang === 'ja' ? 'コンテンツ制作に活用' : 'Create content for later'],
            ['📊', lang === 'ja' ? '次の繁忙期の準備' : 'Prep for next peak'],
          ]).map(([icon, text]) => (
            <div key={text as string} className="flex items-start gap-3 py-2 border-b border-stone-100 last:border-0">
              <span className="text-sm mt-0.5" style={{ fontSize: 14 }}>{icon}</span>
              <span className="text-xs text-stone-600 leading-relaxed">{text}</span>
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
              labels: displayHistory.map((r) => fmtDate(r.date)),
              datasets: [{
                data: displayHistory.map((r) => r.index),
                backgroundColor: displayHistory.map((r) =>
                  r.isForecast
                    ? 'rgba(200,200,200,.35)'
                    : gaugeColor(r.index) + 'aa'
                ),
                borderColor: displayHistory.map((r) =>
                  r.isForecast
                    ? 'rgba(150,150,150,.7)'
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
                      const r = displayHistory[items[0].dataIndex]
                      return `${fmtDate(r.date)}週${r.isForecast ? '（予測）' : '（実績）'}`
                    },
                    label: (item) => `需要指数: ${item.raw} / 100`,
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

    </div>
  )
}
