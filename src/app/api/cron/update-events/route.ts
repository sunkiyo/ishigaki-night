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
async function generateEventsWithClaude(): Promise<ExtractedEvent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return []

  const client = new Anthropic({ apiKey })
  const today = new Date().toISOString().slice(0, 10)
  const until = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const year  = new Date().getFullYear()

  const prompt = `あなたは石垣島・八重山諸島の観光イベントに詳しいアシスタントです。

今日は${today}です。${today}から${until}の間に石垣島・八重山諸島で開催される可能性が高いイベントをリストアップしてください。

以下の年間定番イベントを参考にしてください（毎年ほぼ同時期に開催）:
- 1月第3日曜: 石垣島マラソン
- 3月下旬〜4月上旬: 海びらき
- 4月下旬〜5月上旬: ゴールデンウィーク
- 旧暦5月4日頃(5〜6月): ハーリー（爬竜船漕ぎ大会）
- 6月上旬: 石垣島ウルトラマラソン
- 7〜8月: 石垣島サマーフェスタ
- 旧盆(8月中旬): アンガマ
- 8月下旬: 石垣島星まつり
- 9月第1〜2週: 八重山まつり（石垣島最大の祭り）
- 10月下旬〜11月: 石垣市産業まつり
- 11月: 石垣島ハーフマラソン
- 12月31日: 年越しカウントダウン

ルール:
- 今日(${today})から${until}の範囲のイベントのみ
- 年は${year}または${year + 1}で、実際の日程に近い日付を推定
- 確実性が低いものは demand_boost を低めに設定

JSON配列のみ返してください（説明文不要）:
[{
  "event_date": "YYYY-MM-DD",
  "event_end_date": "YYYY-MM-DD（複数日の場合のみ）",
  "event_name": "イベント名（日本語）",
  "event_name_en": "Event Name in English",
  "category": "festival|sports|music|marine|food|other",
  "demand_boost": 0.10〜0.45,
  "venue": "会場名",
  "note": "毎年○月頃開催など補足"
}]`

  try {
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as ExtractedEvent[]
  } catch (e) {
    console.error('Claude generation failed:', e)
    return []
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
  const generated = await generateEventsWithClaude()
  debug.generated_count = generated.length

  if (generated.length === 0) {
    return NextResponse.json({
      success: false,
      message: 'ANTHROPIC_API_KEY が未設定か、生成に失敗しました',
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
