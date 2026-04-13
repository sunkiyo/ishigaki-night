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
      const cells = [...tr.querySelectorAll('td')].map(td => td.innerText.trim())
      return cells
    }).filter(cells => cells.length >= 6)
  )

  await browser.close()
  console.log(`  → ${rows.length} 件取得`)

  // パース
  const cruises = []
  for (const cells of rows) {
    // cells: [項目番号, 入港日時, 出港日時, OverNight, バース, 船名, 旅客定員数, 運航経路, 代理店, 申請No, アクション]
    // インデックスは空白セルのずれがあるため柔軟に
    const raw = cells.join('\t')

    const dateMatch = raw.match(/(\d{4})\/(\d{2})\/(\d{2})/)
    if (!dateMatch) continue

    const arrivalDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    const arrivalTime = raw.match(/(\d{4}\/\d{2}\/\d{2}) \([^)]+\) (\d{2}:\d{2})/)?.[2] ?? null

    // 出港日時
    const depMatch = raw.match(/\d{4}\/\d{2}\/\d{2} \([^)]+\) \d{2}:\d{2}.*?(\d{4}\/\d{2}\/(\d{2}))? \([^)]+\) (\d{2}:\d{2})/)
    const departureTimes = [...raw.matchAll(/\d{4}\/\d{2}\/\d{2} \([^)]+\) (\d{2}:\d{2})/g)]
    const departureTime = departureTimes[1]?.[1] ?? null

    // 船名 (日付・時刻・数字以外で最初の英字っぽいもの)
    const shipMatch = raw.match(/([A-Z][A-Z\s]+[A-Z])/)
    const shipName = shipMatch?.[1]?.trim() ?? null
    if (!shipName) continue

    // 乗客定員数
    const passengersMatch = raw.match(/\t(\d[,\d]+)\t/)
    const passengers = passengersMatch ? parseInt(passengersMatch[1].replace(',', '')) : null

    // バース
    const berth = raw.includes('石垣岸壁') ? '石垣岸壁' : raw.includes('旅客') ? '旅客ターミナル' : null

    // 運航経路
    const routeMatch = raw.match(/([^\t]*[ー\-][^\t]*基隆[^\t]*|[^\t]*基隆[^\t]*|[^\t]*[A-Z]{2,}[^\t]*[ー\-][^\t]*)/)
    const route = routeMatch?.[1]?.trim() ?? null

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
