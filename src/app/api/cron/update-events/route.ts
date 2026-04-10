import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const maxDuration = 60  // Claude API呼び出しのため60秒

// イベント情報を取得するURLリスト
const EVENT_SOURCES = [
  { url: 'https://painushima.com/events/',   label: '石垣市観光交流協会' },
  { url: 'https://painushima.com/',          label: '石垣市観光交流協会TOP' },
  { url: 'https://www.city.ishigaki.okinawa.jp/', label: '石垣市公式' },
]

// HTMLからテキストを抽出（タグ除去・圧縮）
function stripHtml(html: string, maxLen = 4000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')  // script除去
    .replace(/<style[\s\S]*?<\/style>/gi, '')    // style除去
    .replace(/<[^>]+>/g, ' ')                   // タグ除去
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
}

// 複数ソースからイベント情報テキストを収集
async function fetchSourceTexts(): Promise<{ label: string; text: string }[]> {
  const results: { label: string; text: string }[] = []
  await Promise.allSettled(
    EVENT_SOURCES.map(async ({ url, label }) => {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(12000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ishigaki-night-bot/1.0)' },
        })
        if (!res.ok) return
        const html = await res.text()
        const text = stripHtml(html)
        if (text.length > 100) results.push({ label, text })
      } catch {
        // タイムアウト・接続失敗はスキップ
      }
    })
  )
  return results
}

type ExtractedEvent = {
  event_date: string       // YYYY-MM-DD
  event_end_date?: string  // YYYY-MM-DD (省略可)
  event_name: string
  event_name_en?: string
  category: 'festival' | 'sports' | 'music' | 'marine' | 'food' | 'other'
  demand_boost?: number    // 0.0〜0.5
  venue?: string
  note?: string
}

// Claude Haiku でイベント抽出
async function extractEventsWithClaude(sources: { label: string; text: string }[]): Promise<ExtractedEvent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || sources.length === 0) return []

  const client = new Anthropic({ apiKey })
  const today  = new Date().toISOString().slice(0, 10)
  const until  = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10) // 90日先まで

  const sourceText = sources.map(s => `=== ${s.label} ===\n${s.text}`).join('\n\n')

  const prompt = `以下は石垣島の観光・地域情報サイトのテキストです。
今日(${today})から${until}までの石垣島で開催されるイベントを抽出してください。

抽出ルール:
- 確認できる日付があるイベントのみ（推測禁止）
- 今日以降のイベントのみ
- 石垣島・八重山諸島で開催されるもの

JSON配列で返してください（他のテキスト不要）:
[{
  "event_date": "YYYY-MM-DD",
  "event_end_date": "YYYY-MM-DD または省略",
  "event_name": "イベント名（日本語）",
  "event_name_en": "Event Name in English",
  "category": "festival|sports|music|marine|food|other",
  "demand_boost": 0.10〜0.45（超大型祭り=0.40、大型=0.25、中型=0.15、小型=0.10）,
  "venue": "会場名（不明なら省略）",
  "note": "補足（省略可）"
}]

イベントが見つからない場合は [] を返してください。

テキスト:
${sourceText}`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    // JSONのみ抽出（マークダウンコードブロック対応）
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as ExtractedEvent[]
  } catch (e) {
    console.error('Claude extraction failed:', e)
    return []
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const debug: Record<string, unknown> = {}

  // Step1: ソースからテキスト収集
  const sources = await fetchSourceTexts()
  debug.sources_fetched = sources.map(s => ({ label: s.label, chars: s.text.length }))

  // Step2: Claude で抽出
  const extracted = await extractEventsWithClaude(sources)
  debug.extracted_count = extracted.length
  debug.has_api_key = !!process.env.ANTHROPIC_API_KEY

  if (extracted.length === 0) {
    return NextResponse.json({
      success: true,
      message: sources.length === 0
        ? 'ソースURLに接続できませんでした。手動でSupabaseから更新してください。'
        : 'イベント情報が見つかりませんでした（サイト構造変更の可能性）',
      upserted: 0,
      debug,
    })
  }

  // Step3: Supabaseにupsert（event_date + event_name でユニーク判定）
  let upserted = 0
  let skipped  = 0
  const errors: string[] = []

  for (const ev of extracted) {
    // 既存チェック（同名・同日は上書きしない）
    const { data: existing } = await supabase
      .from('ishigaki_events')
      .select('id')
      .eq('event_date', ev.event_date)
      .ilike('event_name', ev.event_name)
      .maybeSingle()

    if (existing) { skipped++; continue }

    const { error } = await supabase.from('ishigaki_events').insert({
      event_date:     ev.event_date,
      event_end_date: ev.event_end_date ?? null,
      event_name:     ev.event_name,
      event_name_en:  ev.event_name_en ?? null,
      category:       ev.category ?? 'other',
      demand_boost:   ev.demand_boost ?? 0.10,
      venue:          ev.venue ?? null,
      note:           ev.note ?? null,
      is_confirmed:   false,  // 自動取得は未確認フラグ
      source_url:     'auto',
    })
    if (error) errors.push(`${ev.event_name}: ${error.message}`)
    else upserted++
  }

  return NextResponse.json({
    success: true,
    upserted,
    skipped,
    errors,
    debug,
    timestamp: new Date().toISOString(),
  })
}
