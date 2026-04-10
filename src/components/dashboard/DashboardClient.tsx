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
  if (idx >= 75) return '#f05350'
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
  const color  = gaugeColor(idx)
  const lbl    = cfg.label[lang as 'ja' | 'en' | 'zh'] ?? cfg.label.ja
  const months = lang === 'en' ? MONTHS_EN : MONTHS_JA

  const latestY = getLatestYear()
  const cur     = officialData[latestY]
  const prevY   = officialData[latestY - 1]

  // 今週の需要指数カード用: 最新の実績エントリを中心に前後3週ずつ、計7本
  const latestActualIdx = history.reduce((acc, r, i) => (!r.isForecast ? i : acc), 0)
  const weekStart   = Math.max(0, latestActualIdx - 3)
  const weekEntries = history.slice(weekStart, weekStart + 7)

  // 日付を "M/D" 形式に変換するヘルパー
  const fmtDate = (dateStr: string) => {
    const [, m, d] = dateStr.split('-')
    return `${Number(m)}/${Number(d)}`
  }

  if (!mounted) return <div className="h-96 flex items-center justify-center text-stone-400 text-sm">Loading...</div>

  return (
    <div className="flex flex-col gap-5">

      {/* HERO BAND */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* 今週の需要指数 — 前後3週を含む7本棒グラフ */}
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
            {lang === 'ja' ? '前後3週の推移（週始め日付）' : '±3 weeks trend'}
          </p>
          <div style={{ flex: 1, minHeight: 130 }}>
            <Bar
              data={{
                labels: weekEntries.map((r) => fmtDate(r.date)),
                datasets: [{
                  data: weekEntries.map((r) => r.index),
                  backgroundColor: weekEntries.map((r) =>
                    r.isForecast ? 'rgba(200,200,200,.35)' : gaugeColor(r.index) + 'aa'
                  ),
                  borderColor: weekEntries.map((r) =>
                    r.isForecast ? 'rgba(150,150,150,.7)' : gaugeColor(r.index)
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
                        const entry = weekEntries[items[0].dataIndex]
                        return `${fmtDate(entry.date)}週${entry.isForecast ? '（予測）' : '（実績）'}`
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
          <div className="flex gap-3 text-xs text-stone-400 mt-2">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-2 rounded-sm" style={{ background: '#d4923faa' }} />
              {lang === 'ja' ? '実績' : 'Actual'}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-2 rounded-sm" style={{ background: 'rgba(200,200,200,.35)', border: '1px dashed #aaa' }} />
              {lang === 'ja' ? '予測' : 'Forecast'}
            </span>
          </div>
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
            {[
              { icon: '🔍', label: lang === 'ja' ? 'グーグル検索' : 'Google Trends', val: latest?.trends ?? 0, max: 50, pt: Math.round((latest?.trends ?? 0) * 0.5), color: '#4ea8f5' },
              { icon: '🏨', label: lang === 'ja' ? 'ホテル埋まり' : 'Hotel Vacancy',  val: latest?.hotel != null ? 100 - latest.hotel : 0, max: 30, pt: Math.round((latest?.hotel != null ? 100 - latest.hotel : 0) * 0.3), color: '#d4923f' },
              { icon: '✈️', label: lang === 'ja' ? '飛行機の値段' : 'Flight Price',   val: latest?.flight ? Math.min(100, Math.max(0, (latest.flight - 10000) / 200)) : 0, max: 20, pt: Math.round((latest?.flight ? Math.min(100, Math.max(0, (latest.flight - 10000) / 200)) : 0) * 0.2), color: '#3ec768' },
            ].map((b) => (
              <div key={b.label}>
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 13 }}>{b.icon}</span>
                  <span className="text-xs text-stone-500 flex-1">{b.label}</span>
                  <span className="text-xs font-semibold text-stone-600">{b.pt}<span className="text-stone-400 font-normal"> / {b.max}pt</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(26,18,8,.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(b.val / 100) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
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
              labels: history.map((r) => fmtDate(r.date)),
              datasets: [{
                data: history.map((r) => r.index),
                backgroundColor: history.map((r) =>
                  (r as { isForecast?: boolean }).isForecast
                    ? 'rgba(200,200,200,.35)'
                    : gaugeColor(r.index) + 'aa'
                ),
                borderColor: history.map((r) =>
                  (r as { isForecast?: boolean }).isForecast
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
                      const r = history[items[0].dataIndex]
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
          {lang === 'ja' ? '需要予測にもとづくお店向け提案' : 'Store recommendations based on demand forecast'}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-200">
                <th className="text-left py-2 pr-4 text-stone-400 font-normal whitespace-nowrap">
                  {lang === 'ja' ? '週' : 'Week'}
                </th>
                <th className="text-left py-2 pr-4 text-stone-400 font-normal whitespace-nowrap">
                  {lang === 'ja' ? '需要予測' : 'Forecast'}
                </th>
                <th className="text-left py-2 text-stone-400 font-normal">
                  {lang === 'ja' ? 'お店推奨アクション' : 'Recommended Action'}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  week: '4/13〜',
                  index: 88,
                  badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  action: lang === 'ja' ? 'DJイベント開催・スタッフ2倍体制' : 'Host DJ events & double staffing',
                },
                {
                  week: '4/20〜',
                  index: 92,
                  badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  action: lang === 'ja' ? 'SNS告知最大化・予約受付開始' : 'Max SNS promotions & open reservations',
                },
                {
                  week: '4/27〜',
                  index: 89,
                  badge: '🔴',
                  status: lang === 'ja' ? '激混み' : 'Peak',
                  action: lang === 'ja' ? '売上最大化週・特別メニュー投入' : 'Peak revenue week — special menus',
                },
                {
                  week: '5/11〜',
                  index: 62,
                  badge: '🟡',
                  status: lang === 'ja' ? 'にぎわい' : 'Busy',
                  action: lang === 'ja' ? 'GW明けの常連客対応・クーポン施策' : 'Post-GW regulars & coupon campaign',
                },
              ].map((row) => (
                <tr key={row.week} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="py-3 pr-4 text-stone-600 font-medium whitespace-nowrap">{row.week}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <span>{row.badge}</span>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: row.index >= 75 ? '#f05350' : '#f0b865' }}>{row.index}</span>
                      <span className="text-stone-400 ml-1">{row.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-stone-600 leading-relaxed">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
