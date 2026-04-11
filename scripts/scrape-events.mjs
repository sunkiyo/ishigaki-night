/**
 * 石垣島イベントスクレイパー（ローカル実行用）
 *
 * データソース:
 *   - おきなわ物語 (okinawastory.jp) - 石垣エリア確定情報
 *   - やえなび (yaenavi.com)          - 年次イベントカレンダー
 *
 * 使い方:
 *   cd /Users/sunkiyo/projects/ishigaki-night
 *   node scripts/scrape-events.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local から環境変数を読み込む
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()] })
    .filter(([k]) => k)
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が .env.local に未設定')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

// ---- おきなわ物語スクレイパー（確定イベント情報）----
async function scrapeOkinawaStory(today, until) {
  console.log('📡 おきなわ物語を取得中...')
  const events = []

  for (let page = 1; page <= 5; page++) {
    const url = `https://www.okinawastory.jp/event/list?area=34&page=${page}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      const html = await res.text()

      // <article> ごとに分割してパース
      const articles = html.split(/<\/article>/)
      for (const block of articles) {
        // イベント名
        const nameMatch = block.match(/os-c-list-cmn__title-link[^>]*>([\s\S]*?)<\/a>/)
        if (!nameMatch) continue
        let name = nameMatch[1].replace(/<[^>]+>/g, '').trim()
        if (!name || name.length < 2) continue

        // 日付テキスト
        const dateText = block.match(/os-c-list-cmn__lead[^>]*>\s*([\s\S]*?)\s*<\/p>/)?.[1]?.replace(/<[^>]+>/g, '').trim() || ''

        // 開始日
        const d1 = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
        if (!d1) continue
        const eventDate    = `${d1[1]}-${d1[2].padStart(2,'0')}-${d1[3].padStart(2,'0')}`

        // 終了日（範囲イベント）
        const dates = [...dateText.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)]
        let eventEndDate = null
        if (dates.length >= 2) {
          const d2 = dates[dates.length - 1]
          eventEndDate = `${d2[1]}-${d2[2].padStart(2,'0')}-${d2[3].padStart(2,'0')}`
        }

        // 期間フィルタ（終了日がある場合は終了日で判定）
        const checkEnd  = eventEndDate || eventDate
        if (checkEnd < today || eventDate > until) continue

        // イベント名に埋め込まれた日付を除去してクリーンにする
        name = name.replace(/【[^】]*】/, '').replace(/\s*\|/, '').trim()

        // 会場
        const venue = block.match(/os-c-list-cmn-tile-event-line-leader[^>]*>\s*([\s\S]*?)\s*<\/p>/)?.[1]?.trim() || null

        events.push({ name, eventDate, eventEndDate, venue, source: 'okinawastory.jp' })
      }

      if (!html.includes(`page=${page + 1}`)) break
      await new Promise(r => setTimeout(r, 800))
    } catch (e) {
      console.warn(`  ⚠ page=${page} 失敗:`, e.message)
    }
  }

  console.log(`  → ${events.length} 件取得`)
  return events
}

// ---- やえなびスクレイパー（年次イベントカレンダー）----
async function scrapeYaenavi(today, until) {
  console.log('📡 やえなびを取得中...')
  const events = []

  try {
    const res = await fetch('http://yaenavi.com/calendar', { headers: { 'User-Agent': UA } })
    const html = await res.text()
    const year  = new Date(today).getFullYear()

    // テーブル行を抽出
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || []
    for (const row of rows) {
      const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [])
        .map(c => c.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim())

      if (cells.length < 2) continue
      const name     = cells[0]
      const dateText = cells[1]
      const venue    = cells[2] || null

      if (!name || !dateText || !/月/.test(dateText)) continue
      if (name.includes('名称') || name.includes('祭事')) continue  // ヘッダー行スキップ

      // 年なし日付（例: "4月12日"）→ 今年または来年を付与
      let fullDateText = dateText
      if (!/\d{4}年/.test(dateText)) {
        // 月を取得して今年か来年かを判断
        const mMatch = dateText.match(/(\d{1,2})月/)
        if (mMatch) {
          const month = parseInt(mMatch[1])
          const currentMonth = new Date(today).getMonth() + 1
          const assignYear = month < currentMonth - 1 ? year + 1 : year
          fullDateText = `${assignYear}年${dateText}`
        }
      }

      // 開始日パース
      const d1 = fullDateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
      if (!d1) continue
      const eventDate = `${d1[1]}-${d1[2].padStart(2,'0')}-${d1[3].padStart(2,'0')}`

      // 終了日パース
      const allDates = [...fullDateText.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)]
      let eventEndDate = null
      if (allDates.length >= 2) {
        const d2 = allDates[allDates.length - 1]
        eventEndDate = `${d2[1]}-${d2[2].padStart(2,'0')}-${d2[3].padStart(2,'0')}`
      }

      const checkEnd = eventEndDate || eventDate
      if (checkEnd < today || eventDate > until) continue

      events.push({ name, eventDate, eventEndDate, venue, source: 'yaenavi.com' })
    }
  } catch (e) {
    console.warn('  ⚠ やえなび失敗:', e.message)
  }

  console.log(`  → ${events.length} 件取得`)
  return events
}

// ---- カテゴリ・ブースト推定 ----
function guessCategory(name) {
  if (/マラソン|トライアスロン|SUP|大会|競技|レース/.test(name)) return 'sports'
  if (/ライブ|音楽|コンサート|三線|民謡|演奏|音祭|アコースティック/.test(name)) return 'music'
  if (/ダイビング|シュノーケル|クジラ|マンタ|サンゴ|ウォッチング|カジキ|釣り/.test(name)) return 'marine'
  if (/グルメ|フード|ランチ|料理|食|ブッフェ/.test(name)) return 'food'
  if (/祭|まつり|フェスティバル|フェスタ|盆|豊年|海びらき|夕べ|大綱引き|プーリィ|ソーロン|ムシャーマ|結願祭|節祭|種子取/.test(name)) return 'festival'
  return 'other'
}

function guessDemandBoost(name, source) {
  // 公式確認済みイベントは少し高め
  const base = source === 'okinawastory.jp' ? 0.05 : 0
  if (/マラソン|トライアスロン|まつり|フェスティバル|フェスタ|大綱引き/.test(name)) return Math.min(0.40, 0.25 + base)
  if (/SUP|グランプリ|音楽|ライブ|コンサート|音祭|カジキ|釣り/.test(name)) return 0.15 + base
  if (/ハーリー|海神祭|豊年|ソーロン|旧盆|結願祭|種子取/.test(name)) return 0.20 + base
  return 0.10 + base
}

// ---- メイン ----
async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const until = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  console.log(`\n🗓  対象期間: ${today} 〜 ${until}\n`)

  const [okinawa, yaenavi] = await Promise.all([
    scrapeOkinawaStory(today, until),
    scrapeYaenavi(today, until),
  ])

  // 重複除去（okinawastory優先）
  const seen = new Set()
  const all = [...okinawa, ...yaenavi].filter(ev => {
    const key = `${ev.eventDate}-${ev.name.slice(0, 10)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\n📋 期間内合計: ${all.length} 件\n`)
  if (all.length === 0) { console.log('⚠ イベントが見つかりませんでした'); return }

  // AI生成イベント（is_confirmed=false）を一旦削除して実データで上書き
  console.log('🗑  AI生成イベントを削除中...')
  const { error: delErr } = await supabase
    .from('ishigaki_events')
    .delete()
    .eq('is_confirmed', false)
  if (delErr) console.warn('  削除エラー:', delErr.message)
  else console.log('  削除完了\n')

  let upserted = 0, skipped = 0, errors = 0

  for (const ev of all) {
    // 同名イベントが既にあればスキップ
    const { data: existing } = await supabase
      .from('ishigaki_events')
      .select('id')
      .eq('event_date', ev.eventDate)
      .ilike('event_name', `%${ev.name.slice(0, 8)}%`)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭ スキップ: ${ev.name} (${ev.eventDate})`)
      skipped++
      continue
    }

    const { error } = await supabase.from('ishigaki_events').insert({
      event_date:     ev.eventDate,
      event_end_date: ev.eventEndDate,
      event_name:     ev.name,
      category:       guessCategory(ev.name),
      demand_boost:   guessDemandBoost(ev.name, ev.source),
      venue:          ev.venue,
      is_confirmed:   true,
      source_url:     ev.source,
      note:           ev.source === 'yaenavi.com' ? '年次イベント（日付は概算）' : '公式サイト確認済み',
    })

    if (error) {
      console.log(`  ❌ ${ev.name}: ${error.message}`)
      errors++
    } else {
      console.log(`  ✅ ${ev.name} (${ev.eventDate}) [${ev.source}]`)
      upserted++
    }
  }

  console.log(`\n✨ 完了: ${upserted} 件追加, ${skipped} 件スキップ, ${errors} 件エラー\n`)
}

main().catch(console.error)
