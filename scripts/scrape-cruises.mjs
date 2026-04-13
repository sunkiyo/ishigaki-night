/**
 * 石垣港クルーズ船スクレイパー（ローカル実行用）
 * データソース: nacru.my.site.com クルーズ船寄港予約システム
 *
 * 使い方:
 *   cd /Users/sunkiyo/projects/ishigaki-night
 *   node scripts/scrape-cruises.mjs
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local から環境変数を読み込む
const envPath = resolve(process.cwd(), '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase環境変数が未設定')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const NACRU_URL = 'https://nacru.my.site.com/s/?NHCR_ApplicationPublic__c-filterId=View5'

// ---- Playwrightでスクレイピング ----
async function scrapeCruises() {
  console.log('🚢 Playwright起動中...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja,en;q=0.9' })

  console.log('📡 クルーズ船寄港予約システム読み込み中...')
  await page.goto(NACRU_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(3000)

  // テーブルの行を取得
  const rows = await page.$$eval('table tr', trs =>
    trs.slice(1).map(tr => {
      const cells = [...tr.querySelectorAll('td, th')].map(td => td.innerText.trim())
      return cells
    }).filter(cells => cells.length >= 6)
  )

  await browser.close()
  console.log(`  → ${rows.length} 件取得`)

  // パース（日付パターンを持つセルのインデックスを動的に探す）
  const parseTime = (text) => text?.match(/(\d{2}:\d\d)$/)?.[1] ?? null
  const parseDate = (text) => {
    const m = text?.match(/(\d{4})\/(\d{2})\/(\d{2})/)
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null
  }

  const cruises = []
  for (const cells of rows) {
    // 日付セルを探す（入港日時・出港日時は連続する）
    const dateIndices = cells.map((c, i) => /\d{4}\/\d{2}\/\d{2}/.test(c) ? i : -1).filter(i => i >= 0)
    if (dateIndices.length < 1) continue

    const arrivalCell    = cells[dateIndices[0]] ?? ''
    const departureCell  = cells[dateIndices[1]] ?? ''
    const arrivalDate    = parseDate(arrivalCell)
    if (!arrivalDate) continue
    const arrivalTime    = parseTime(arrivalCell)
    const departureTime  = parseTime(departureCell)

    // 日付セルより後の残りセルから船名・乗客数・航路を取得
    const afterDateCells = cells.slice(dateIndices[dateIndices.length - 1] + 1)
    // バース（石垣岸壁など）をスキップして船名（大文字英字）を探す
    const shipName = afterDateCells.find(c => /^[A-Z][A-Z\s]{3,}/.test(c))?.trim() ?? null
    if (!shipName) continue

    // 乗客定員数（カンマ付き数字）
    const passengers = (() => {
      const c = afterDateCells.find(c => /^\d[,\d]+$/.test(c))
      return c ? parseInt(c.replace(',', '')) : null
    })()

    // 航路（ハイフン区切り）
    const route = afterDateCells.find(c => /[ー\-]/.test(c) && c.length > 5 && !/^\d/.test(c)) ?? null
    const berth = afterDateCells.find(c => /岸壁|バース|ターミナル/.test(c)) ?? null

    cruises.push({ arrivalDate, arrivalTime, departureTime, shipName, passengers, berth, route })
  }

  return cruises
}

// ---- Supabaseにupsert ----
async function upsertCruises(cruises) {
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = cruises.filter(c => c.arrivalDate >= today)
  console.log(`\n📋 本日以降: ${upcoming.length} 件\n`)

  let upserted = 0, skipped = 0

  for (const c of upcoming) {
    const { data: existing } = await supabase
      .from('ishigaki_cruises')
      .select('id')
      .eq('arrival_date', c.arrivalDate)
      .eq('ship_name', c.shipName)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭ スキップ: ${c.shipName} (${c.arrivalDate})`)
      skipped++
      continue
    }

    const { error } = await supabase.from('ishigaki_cruises').insert({
      arrival_date:    c.arrivalDate,
      arrival_time:    c.arrivalTime,
      departure_time:  c.departureTime,
      ship_name:       c.shipName,
      passengers:      c.passengers,
      berth:           c.berth,
      route:           c.route,
      source_url:      'nacru.my.site.com',
    })

    if (error) console.log(`  ❌ ${c.shipName}: ${error.message}`)
    else { console.log(`  ✅ ${c.shipName} (${c.arrivalDate}) 乗客:${c.passengers ?? '?'}人`); upserted++ }
  }

  console.log(`\n✨ 完了: ${upserted}件追加, ${skipped}件スキップ\n`)
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  console.log(`\n🗓  本日: ${today}\n`)

  const cruises = await scrapeCruises()

  if (cruises.length === 0) {
    console.log('⚠ データが取得できませんでした')
    return
  }

  console.log('\n取得データ:')
  cruises.forEach(c => console.log(`  ${c.arrivalDate} ${c.shipName} (${c.passengers ?? '?'}人) ${c.route ?? ''}`))

  await upsertCruises(cruises)
}

main().catch(console.error)
