import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PDFのURLを生成
// ファイル名パターン: nyuikisuikei[西暦下2桁][月2桁].pdf
// 例: 2026年2月 → nyuikisuikei2602.pdf
function buildPdfUrl(year: number, month: number): string {
  const yy = String(year).slice(-2)
  const mm = String(month).padStart(2, '0')
  return `https://www.city.ishigaki.okinawa.jp/material/files/group/11/nyuikisuikei${yy}${mm}.pdf`
}

// ライブラリ不要のPDFテキスト抽出
// Excelエクスポート系PDFのコンテンツストリームから (text) Tj / [(text)] TJ 形式でテキストを取り出す
function extractTextFromPDF(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const parts: string[] = []

  // (テキスト) Tj 形式
  for (const m of raw.matchAll(/\(([^)\\]{0,200})\)\s*Tj/g)) {
    parts.push(m[1])
  }
  // [(テキスト) ...] TJ 形式
  for (const m of raw.matchAll(/\[([^\]]{0,500})\]\s*TJ/g)) {
    for (const inner of m[1].matchAll(/\(([^)\\]{0,100})\)/g)) {
      parts.push(inner[1])
    }
  }

  return parts.join(' ')
}

// 抽出テキストから来島者数（観光客数・空路・海路）をパース
// 石垣市PDFの1ページ目: 月 | 観光客数 | 空路 | 海路 | ...
function parseVisitorData(
  text: string,
  targetMonth: number
): { visitors: number | null; air: number | null; sea: number | null } {
  // 5〜6桁のカンマ区切り数値を全て抽出
  const allNums = [...text.matchAll(/\b(\d{2,3}),(\d{3})\b/g)]
    .map(m => parseInt(m[1] + m[2], 10))
    .filter(n => n >= 5000 && n <= 999999)

  if (allNums.length < 3) {
    return { visitors: null, air: null, sea: null }
  }

  // 月ヘッダー付近の数値グループを特定する
  // PDFテキストに "1月" "2月" ... のパターンがあればその直後の数値3つを使う
  const monthStr = `${targetMonth}\u6708` // 例: "1月"
  const idx = text.indexOf(monthStr)
  if (idx !== -1) {
    const slice = text.slice(idx, idx + 200)
    const nums = [...slice.matchAll(/\b(\d{2,3}),(\d{3})\b/g)]
      .map(m => parseInt(m[1] + m[2], 10))
      .filter(n => n >= 5000)
    if (nums.length >= 3) {
      return { visitors: nums[0], air: nums[1], sea: nums[2] }
    }
  }

  // フォールバック: 先頭3つの大きな数値
  return {
    visitors: allNums[0] ?? null,
    air: allNums[1] ?? null,
    sea: allNums[2] ?? null,
  }
}

export async function GET(request: Request) {
  // Cronシークレット確認
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ year: number; month: number; status: string; [k: string]: unknown }> = []
  const now = new Date()

  // 直近3ヶ月を試行（新しいPDFが公開済みか確認）
  for (let i = 1; i <= 3; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() + 1

    // DBに既存データがあればスキップ
    const { data: existing } = await supabase
      .from('visitor_monthly')
      .select('id, visitors')
      .eq('year', year)
      .eq('month', month)
      .single()

    if (existing?.visitors) {
      results.push({ year, month, status: 'already_exists' })
      continue
    }

    const pdfUrl = buildPdfUrl(year, month)

    try {
      const response = await fetch(pdfUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ishigaki-night-bot/1.0)' },
      })

      if (!response.ok) {
        results.push({ year, month, status: `pdf_not_found: ${response.status}` })
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const text = extractTextFromPDF(buffer)
      const parsed = parseVisitorData(text, month)

      // デバッグ用: 抽出テキストの先頭300文字をログ
      console.log(`[${year}/${month}] extracted text sample:`, text.slice(0, 300))
      console.log(`[${year}/${month}] parsed:`, parsed)

      const { error } = await supabase
        .from('visitor_monthly')
        .upsert(
          {
            year,
            month,
            visitors: parsed.visitors,
            air: parsed.air,
            sea: parsed.sea,
            source_url: pdfUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'year,month' }
        )

      if (error) {
        results.push({ year, month, status: `db_error: ${error.message}` })
      } else {
        results.push({ year, month, status: 'updated', ...parsed })
      }
    } catch (err) {
      results.push({ year, month, status: `error: ${String(err)}` })
    }
  }

  return NextResponse.json({ success: true, results, timestamp: now.toISOString() })
}
