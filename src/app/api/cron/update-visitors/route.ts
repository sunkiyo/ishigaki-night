import { NextResponse } from 'next/server'
import { inflateSync } from 'zlib'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// PDFのURLを生成
// ファイル名パターン: nyuikisuikei[西暦下2桁][月2桁].pdf
// 例: 2026年2月 → nyuikisuikei2602.pdf
function buildPdfUrl(year: number, month: number): string {
  const yy = String(year).slice(-2)
  const mm = String(month).padStart(2, '0')
  return `https://www.city.ishigaki.okinawa.jp/material/files/group/11/nyuikisuikei${yy}${mm}.pdf`
}

// FlateDecode圧縮ストリームを含むPDFからテキストを抽出
// Buffer操作でstream/endstreamを検出 → zlibで解凍 → Tj/TJ演算子でテキスト収集
function extractTextFromPDF(buffer: Buffer): string {
  const parts: string[] = []

  const streamMarker = Buffer.from('stream')
  const endStreamMarker = Buffer.from('endstream')

  let pos = 0
  while (pos < buffer.length) {
    // 'stream' キーワードを探す
    const streamPos = buffer.indexOf(streamMarker, pos)
    if (streamPos === -1) break

    // stream の直後は \r\n か \n
    let dataStart = streamPos + streamMarker.length
    if (buffer[dataStart] === 0x0d && buffer[dataStart + 1] === 0x0a) {
      dataStart += 2
    } else if (buffer[dataStart] === 0x0a) {
      dataStart += 1
    } else {
      pos = streamPos + 1
      continue
    }

    // 対応する endstream を探す
    const endStreamPos = buffer.indexOf(endStreamMarker, dataStart)
    if (endStreamPos === -1) break

    // endstream 直前の \r\n or \n を除去
    let dataEnd = endStreamPos
    if (buffer[dataEnd - 1] === 0x0a) dataEnd--
    if (dataEnd > 0 && buffer[dataEnd - 1] === 0x0d) dataEnd--

    const streamData = buffer.subarray(dataStart, dataEnd)

    // stream オブジェクトのヘッダーを確認（直前500バイト）
    const headerArea = buffer
      .subarray(Math.max(0, streamPos - 500), streamPos)
      .toString('latin1')
    const isFlateDecode =
      headerArea.includes('FlateDecode') || headerArea.includes('/Fl ')

    let content = ''
    if (isFlateDecode) {
      try {
        content = inflateSync(streamData).toString('latin1')
      } catch {
        // inflate失敗はスキップ
        pos = endStreamPos + endStreamMarker.length
        continue
      }
    } else {
      content = streamData.toString('latin1')
    }

    // (テキスト) Tj 形式
    const tjRegex = /\(([^)\\]{0,200})\)\s*Tj/g
    let tjMatch: RegExpExecArray | null
    while ((tjMatch = tjRegex.exec(content)) !== null) {
      parts.push(tjMatch[1])
    }
    // [(テキスト) ...] TJ 形式
    const tjArrayRegex = /\[([^\]]{0,500})\]\s*TJ/g
    let tjArrayMatch: RegExpExecArray | null
    while ((tjArrayMatch = tjArrayRegex.exec(content)) !== null) {
      const innerRegex = /\(([^)\\]{0,100})\)/g
      let innerMatch: RegExpExecArray | null
      while ((innerMatch = innerRegex.exec(tjArrayMatch[1])) !== null) {
        parts.push(innerMatch[1])
      }
    }

    pos = endStreamPos + endStreamMarker.length
  }

  return parts.join(' ')
}

// PDFのカーニングによるスペース入り数字を正規化
// 例: "1 7 4 , 1 8 1" → "174,181" / "84, 346" → "84,346"
function normalizeNumbers(text: string): string {
  let result = text
  // カンマ前後のスペース除去
  result = result.replace(/(\d)\s*,\s*(\d)/g, '$1,$2')
  // 桁間スペースを除去（"1 7 4" → "174"）を複数回適用
  for (let i = 0; i < 6; i++) {
    result = result.replace(/(\d) (\d)/g, '$1$2')
  }
  return result
}

// 抽出テキストから来島者数（観光客数・空路・海路）をパース
// 石垣市PDFの1ページ目: 月 | 観光客数 | 空路 | 海路 | ...
function parseVisitorData(
  text: string,
  targetMonth: number
): { visitors: number | null; air: number | null; sea: number | null } {
  const normalized = normalizeNumbers(text)

  // 5〜6桁のカンマ区切り数値を全て抽出
  const allNums: number[] = []
  const numRegex = /\b(\d{2,3}),(\d{3})\b/g
  let numMatch: RegExpExecArray | null
  while ((numMatch = numRegex.exec(normalized)) !== null) {
    const n = parseInt(numMatch[1] + numMatch[2], 10)
    if (n >= 5000 && n <= 999999) allNums.push(n)
  }

  if (allNums.length < 3) {
    return { visitors: null, air: null, sea: null }
  }

  // 月ヘッダー付近の数値グループを特定する
  const monthStr = `${targetMonth}\u6708` // 例: "1月"
  const idx = normalized.indexOf(monthStr)
  if (idx !== -1) {
    const slice = normalized.slice(idx, idx + 200)
    const sliceNums: number[] = []
    const sliceRegex = /\b(\d{2,3}),(\d{3})\b/g
    let sliceMatch: RegExpExecArray | null
    while ((sliceMatch = sliceRegex.exec(slice)) !== null) {
      const n = parseInt(sliceMatch[1] + sliceMatch[2], 10)
      if (n >= 5000) sliceNums.push(n)
    }
    if (sliceNums.length >= 3) {
      return { visitors: sliceNums[0], air: sliceNums[1], sea: sliceNums[2] }
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
    const { data: existing } = await supabaseAdmin
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

      // デバッグ用: 正規化後テキストの先頭500文字をレスポンスに含める
      const normalized = normalizeNumbers(text)
      const textSample = normalized.slice(0, 500)
      console.log(`[${year}/${month}] normalized:`, textSample)
      console.log(`[${year}/${month}] parsed:`, parsed)

      const { error } = await supabaseAdmin
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
        results.push({ year, month, status: `db_error: ${error.message}`, textSample })
      } else {
        results.push({ year, month, status: 'updated', ...parsed, textSample })
      }
    } catch (err) {
      results.push({ year, month, status: `error: ${String(err)}` })
    }
  }

  return NextResponse.json({ success: true, results, timestamp: now.toISOString() })
}
