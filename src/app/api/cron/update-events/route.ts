import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const maxDuration = 60

type ExtractedEvent = {
  event_date: string
  event_end_date?: string
  event_name: string
  event_name_en?: string
  category: 'festival' | 'sports' | 'music' | 'marine' | 'food' | 'other'
  demand_boost?: number
  venue?: string
  note?: string
}

/**
 * Claudeの知識から石垣島の今後イベントを生成する
 * スクレイピング不要・Vercelのネットワーク制限に非依存
 */
async function generateEventsWithClaude(): Promise<{ events: ExtractedEvent[]; raw: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { events: [], raw: 'no api key' }

  const client = new Anthropic({ apiKey })
  const today = new Date().toISOString().slice(0, 10)
  const until = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const year  = new Date().getFullYear()

  const prompt = `あなたは石垣島・八重山諸島の観光イベントに詳しいアシスタントです。

今日は${today}です。${today}から${until}の間に石垣島・八重山諸島で開催される可能性が高いイベントをリストアップしてください。

大型イベント（毎年ほぼ同時期に開催）:
- 1月第3日曜: 石垣島マラソン (demand_boost: 0.35)
- 3月下旬〜4月上旬: 海びらき (0.20)
- 4月下旬〜5月上旬: ゴールデンウィーク (0.45)
- 旧暦5月4日頃(5〜6月): ハーリー（爬竜船漕ぎ大会）(0.30)
- 6月上旬: 石垣島ウルトラマラソン (0.25)
- 7〜8月: 石垣島サマーフェスタ (0.20)
- 旧盆(8月中旬): アンガマ (0.20)
- 8月下旬: 石垣島星まつり (0.20)
- 9月第1〜2週: 八重山まつり（石垣島最大の祭り）(0.40)
- 10月下旬〜11月: 石垣市産業まつり (0.20)
- 11月: 石垣島ハーフマラソン (0.25)
- 12月31日: 年越しカウントダウン (0.20)

小・中規模イベント（これらも必ず含めること）:
- 毎月第2・第4土曜頃: 石垣島ナイトマーケット・ゆいまーる市場（ユーグレナモール周辺）(0.08)
- 毎週土日: 地元バーやライブハウスでの沖縄民謡ライブ・三線ライブ（フルスト原遺跡近くのバー等）(0.08)
- 毎月1〜2回: 星空観察ツアー・天体観測イベント（川平湾周辺）(0.10)
- 毎月1〜2回: シュノーケル・ダイビング体験フェア（青の洞窟・川平湾）(0.08)
- 4〜5月: 石垣島トライアスロン (0.20)
- 毎年春: 八重山ゆらてぃく憲章まつり (0.12)
- 毎年秋: 石垣島ホエールウォッチングシーズン開幕（11月〜翌4月）(0.12)
- 毎年11〜12月: 石垣島バンナ公園紅葉ライトアップ・イルミネーション (0.10)
- 毎月: 地域の公民館まつり・集落の豊年祭 (0.08)
- 3月・10月: 石垣市観光フォトコンテスト表彰式・写真展 (0.05)
- 4〜6月: マンタシーズン開幕・マンタスクランブルダイビングツアー (0.12)
- 10〜翌4月: ザトウクジラ観察シーズン・ホエールウォッチングツアー (0.12)

ルール:
- 今日(${today})から${until}の範囲のイベントのみ
- 年は${year}または${year + 1}で、実際の日程に近い日付を推定
- 小規模イベントも積極的に含める（demand_boost 0.05〜0.15 程度でOK）
- 定期開催イベントは該当期間内の具体的な日付を1〜2件推定して含める
- 合計15〜25件程度を目安に

JSON配列のみ返してください（説明文不要）:
[{
  "event_date": "YYYY-MM-DD",
  "event_end_date": "YYYY-MM-DD（複数日の場合のみ）",
  "event_name": "イベント名（日本語）",
  "event_name_en": "Event Name in English",
  "category": "festival|sports|music|marine|food|other",
  "demand_boost": 0.05〜0.45,
  "venue": "会場名",
  "note": "2〜3文でイベントの内容・見どころ・来場者向けアドバイスを具体的に記載。例: '毎年ゴールデンウィーク期間に開催される石垣島最大の観光ピークシーズン。島内各所でイベントや催しが集中し、ライブや屋台も多数出店する。宿泊・交通の早期予約が必須で、賑わいを楽しみたい観光客に特におすすめ。'"
}]`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    // マークダウンコードブロック（```json ... ```）を除去してからパース
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in response:', raw.slice(0, 300))
      return { events: [], raw: raw.slice(0, 500) }
    }
    const events = JSON.parse(jsonMatch[0]) as ExtractedEvent[]
    return { events, raw: raw.slice(0, 200) }
  } catch (e) {
    console.error('Claude generation failed:', e)
    throw e
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const debug: Record<string, unknown> = { has_api_key: !!process.env.ANTHROPIC_API_KEY, mode: 'claude-knowledge' }

  // Claudeの知識からイベント生成
  let generated: ExtractedEvent[] = []
  try {
    const result = await generateEventsWithClaude()
    generated = result.events
    debug.claude_raw = result.raw
  } catch (e) {
    debug.error = e instanceof Error ? e.message : String(e)
    return NextResponse.json({
      success: false,
      message: 'Claude API呼び出しに失敗しました',
      upserted: 0,
      debug,
    })
  }
  debug.generated_count = generated.length

  if (generated.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'イベントを生成できませんでした（JSONパース失敗の可能性）',
      upserted: 0,
      debug,
    })
  }

  // Supabaseにupsert（同名・同日はスキップ）
  let upserted = 0
  let skipped  = 0
  const errors: string[] = []

  for (const ev of generated) {
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
      is_confirmed:   false,  // AI生成は未確認フラグ
      source_url:     'claude-knowledge',
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
    events: generated.map(e => ({ date: e.event_date, name: e.event_name })),
    timestamp: new Date().toISOString(),
  })
}
