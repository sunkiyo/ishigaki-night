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

今日は${today}です。${today}から${until}の間に石垣島・八重山諸島で開催が確実または高確率なイベントをリストアップしてください。

【重要】以下のルールを必ず守ること:
- 店舗・事業者の定期営業（三線ライブ居酒屋、ダイビングショップ、星空ツアー会社等）は絶対に含めない
- 「毎週」「毎月」「毎日」開催の店舗サービスは対象外
- 不確かな情報は含めない。日付・会場が確認できないものはリストに入れない
- 夜間・夕方のイベント、または夜に盛り上がる祭り・文化行事を優先する

【掲載OKなイベント種別】
★ 夜系・夜間イベント（優先）:
- 花火大会・夜祭・打ち上げ花火のある祭り
- 夜間の伝統行事（旧盆のアンガマ等）
- ナイトマーケット（主催者・日程が確認できるもののみ）
- カウントダウン・年越しイベント
- 夜間ライブイベント・音楽フェス（会場・日程が公式発表されたもの）
- ホタル鑑賞など季節限定の夜の自然現象

★ 大型・中型の公式祭り・イベント（昼でも可）:
- 石垣市・竹富町等の公式主催イベント
- 毎年開催が確立された伝統行事・祭り

【確認済み年間主要イベント（日付は毎年の傾向から推定）】:
- 1月第3日曜: 石垣島マラソン (0.35)
- 3月〜5月: ヤエヤマヒメボタル鑑賞シーズン・夜の自然観察（バンナ公園等）(0.12)
- 3月中旬〜4月: 八重山の海びらき (0.20)
- 4月下旬〜5月上旬: ゴールデンウィーク観光ピーク (0.45)
- 旧暦5月4日(6月): ハーリー・海神祭（石垣漁港・白保等） ※2026年=6/18(木) (0.30)
- 6月上旬: 石垣島ウルトラマラソン (0.25)
- 7月中旬日曜: オリオンビアフェスト in 石垣（新栄公園・花火あり）(0.20)
- 旧暦7月7日前後（8月下旬）: 南の島の星まつり・ライトダウンイベント（南ぬ浜町緑地公園）(0.20)
- 旧盆（8月下旬）: アンガマ＝夜の旧盆行事（石垣島各地・仮装行列） ※2026年=8/25〜27 (0.20)
- 7〜8月: 石垣島サマーフェスタ (0.20)
- 9月第1〜2週: 八重山まつり（石垣市最大の祭り・2日目花火あり）(0.40)
- 11月第1土日: 石垣島まつり（新栄公園・2日目打ち上げ花火あり） ※2026年=11/7〜8 (0.30)
- 11月中旬〜下旬: 石垣島ハーフマラソン (0.25)
- 12月中旬〜下旬: 南の島の灯ろう祭（クリスマス前後・夜のイルミネーション）(0.15)
- 12月31日: 年越しカウントダウン (0.20)

ルール:
- 今日(${today})から${until}の範囲のイベントのみ
- 年は${year}または${year + 1}で実際の日程に近い日付を推定
- 上記リストから期間内に該当するものを中心に8〜15件程度
- 日付が旧暦の場合は新暦に換算して記載すること
- noteには「2〜3文で内容・夜の見どころ・観光客向けアドバイス」を具体的に書くこと

JSON配列のみ返してください（説明文不要）:
[{
  "event_date": "YYYY-MM-DD",
  "event_end_date": "YYYY-MM-DD（複数日の場合のみ）",
  "event_name": "イベント名（日本語）",
  "event_name_en": "Event Name in English",
  "category": "festival|sports|music|other",
  "demand_boost": 0.08〜0.45,
  "venue": "会場名（正確な地名・施設名）",
  "note": "2〜3文で内容・夜の見どころ・観光客向けのアドバイスを具体的に"
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
