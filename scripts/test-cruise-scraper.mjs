/**
 * nacru.my.site.com クルーズ船寄港予約システム スクレイピングテスト
 */
import { chromium } from 'playwright'

const URL = 'https://nacru.my.site.com/s/?NHCR_ApplicationPublic__c-filterId=View5'

async function main() {
  console.log('🚢 Playwright起動中...')
  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()

  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja,en;q=0.9' })

  console.log('📡 ページ読み込み中...')
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })

  // Salesforce LWCのレンダリングを待つ
  await page.waitForTimeout(3000)

  // ページ全体のテキストを確認
  const bodyText = await page.innerText('body')
  console.log('\n=== ページテキスト（先頭1000文字）===')
  console.log(bodyText.slice(0, 1000))

  // テーブルやリストを探す
  const tables = await page.$$eval('table', ts => ts.map(t => t.innerText.slice(0, 300)))
  console.log(`\n=== テーブル数: ${tables.length} ===`)
  tables.forEach((t, i) => console.log(`\n[table ${i}]\n${t}`))

  // 日付っぽいテキストを探す
  const dateTexts = await page.$$eval('*', els =>
    els.flatMap(el => {
      const t = el.textContent?.trim() || ''
      return /\d{4}[\/\-年]\d{1,2}[\/\-月]\d{1,2}/.test(t) && t.length < 100 ? [t] : []
    }).slice(0, 20)
  )
  console.log('\n=== 日付っぽいテキスト ===')
  dateTexts.forEach(d => console.log(' ', d))

  await browser.close()
  console.log('\n✅ テスト完了')
}

main().catch(console.error)
