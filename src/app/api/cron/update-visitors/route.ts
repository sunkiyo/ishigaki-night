import { NextResponse } from 'next/server'
import { inflateSync } from 'zlib'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// PDFのURLを生成
// ファイル名パターン: nyuikisuikei[西暦下2桁][月2桁].pdf
// 例: 2026年2月 → nyuikisuikei2602.pdf
function buildPdfUrl(year: number, month: number): string {
  const yy = String(year).slice(-2)
  const mm = String(month).padStart(2, '0')
  return `https://www.city.ishigaki.okinawa.jp/material/files/group/11/nyuikisuikei${yy}${mm}.pdf`
}

// FlateDecode圧縮ストリームを含むPDFからテキストを抽出
function extractTextFromPDF(buffer: Buffer): string {
  const parts: string[] = []

  const streamMarker = Buffer.from('stream')
  const endStreamMarker = Buffer.from('endstream')

  let pos = 0
  while (pos < buffer.length) {
    const streamPos = buffer.indexOf(streamMarker, pos)
    if (streamPos === -1) break

    let dataStart = streamPos + streamMarker.length
    if (buffer[dataStart] === 0x0d && buffer[dataStart + 1] === 0x0a) {
      dataStart += 2
    } else if (buffer[dataStart] === 0x0a) {
      dataStart += 1
    } else {
      pos = streamPos + 1
      continue
    }

    const endStreamPos = buffer.indexOf(endStreamMarker, dataStart)
    if (endStreamPos === -1) break

    let dataEnd = endStreamPos
    if (buffer[dataEnd - 1] === 0x0a) dataEnd--
    if (dataEnd > 0 && buffer[dataEnd - 1] === 0x0d) dataEnd--

    const streamData = buffer.subarray(dataStart, dataEnd)

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
        pos = endStreamPos + endStreamMarker.length
        continue
      }
    } else {
      content = streamData.toString('latin1')
    }

    const tjRegex = /\(([^)\\]{0,200})\)\s*Tj/g
    let tjMatch: RegExpExecArray | null
    while ((tjMatch = tjRegex.exec(content)) !== null) {
      parts.push(tjMatch[1])
    }
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

// 生テキストから5〜6桁の来島者数候補を抽出
// スペース入り数字（"1 7 4 , 1 8 1"）と通常数字（"84,346" / "84, 346"）を両方対応
// (?<![,\d]) で "1,221,986" の "221,986" 部分を誤抽出しない
function extractVisitorNumbers(text: string): number[] {
  const nums: number[] = []
  // 左辺: 2〜3桁の連続数字 or スペース区切り1+1〜2桁
  // 右辺: 3桁の連続数字 or スペース区切り1+1+1桁
  const numRegex =
    /(?<![,\d])\b(\d{2,3}|\d(?:\s\d){1,2})\s*,\s*(\d{3}|\d(?:\s\d){2})\b/g
  let m: RegExpExecArray | null
  while ((m = numRegex.exec(text)) !== null) {
    const n = parseInt(m[1].replace(/\s/g, '') + m[2].replace(/\s/g, ''), 10)
    if (n >= 5000 && n <= 999999) nums.push(n)
  }
  return nums
}

// air + sea = total の整合性を持つ3数値を探す（最も差が小さいものを優先）
// 石垣市PDF: 来島者数（合計）= 空路 + 海路
function findConsistentTriplet(
  nums: number[]
): { visitors: number; air: number; sea: number } | null {
  const candidates = nums.slice(0, 25)
  let best: { visitors: number; air: number; sea: number } | null = null
  let bestDiff = 201

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const sum = candidates[i] + candidates[j]
      if (sum < 50000 || sum > 400000) continue
      for (let k = 0; k < candidates.length; k++) {
        if (k === i || k === j) continue
        const diff = Math.abs(candidates[k] - sum)
        if (diff < bestDiff) {
          bestDiff = diff
          best = {
            visitors: candidates[k],
            air: Math.max(candidates[i], candidates[j]),
            sea: Math.min(candidates[i], candidates[j]),
          }
        }
      }
    }
  }

  return bestDiff <= 200 ? best : null
}

// 抽出テキストから来島者数（観光客数・空路・海路）をパース
function parseVisitorData(
  text: string,
  targetMonth: number
): { visitors: number | null; air: number | null; sea: number | null; allNums: number[] } {
  const allNums = extractVisitorNumbers(text)

  if (allNums.length < 3) {
    return { visitors: null, air: null, sea: null, allNums }
  }

  // 月ヘッダー付近の数値グループを特定する（PDFが日本語テキストを含む場合）
  const monthStr = `${targetMonth}\u6708` // 例: "2月"
  const idx = text.indexOf(monthStr)
  if (idx !== -1) {
    const slice = text.slice(idx, idx + 300)
    const sliceNums = extractVisitorNumbers(slice)
    if (sliceNums.length >= 3) {
      const triplet = findConsistentTriplet(sliceNums)
      if (triplet) return { ...triplet, allNums }
      return { visitors: sliceNums[0], air: sliceNums[1], sea: sliceNums[2], allNums }
    }
  }

  // air + sea = total の整合性チェックで最も精度の高い3値を特定
  const triplet = findConsistentTriplet(allNums)
  if (triplet) return { ...triplet, allNums }

  // フォールバック: 先頭3つの大きな数値
  return {
    visitors: allNums[0] ?? null,
    air: allNums[1] ?? null,
    sea: allNums[2] ?? null,
    allNums,
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ year: number; month: number; status: string; [k: string]: unknown }> = []
  const now = new Date()

  for (let i = 1; i <= 3; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() + 1

    const { data: existing } = await getSupabaseAdmin()
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
      const { allNums, ...parsedValues } = parsed

      console.log(`[${year}/${month}] allNums(top10):`, allNums.slice(0, 10))
      console.log(`[${year}/${month}] parsed:`, parsedValues)

      const { error } = await getSupabaseAdmin()
        .from('visitor_monthly')
        .upsert(
          {
            year,
            month,
            visitors: parsedValues.visitors,
            air: parsedValues.air,
            sea: parsedValues.sea,
            source_url: pdfUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'year,month' }
        )

      if (error) {
        results.push({
          year,
          month,
          status: `db_error: ${error.message}`,
          allNums: allNums.slice(0, 10),
        })
      } else {
        results.push({
          year,
          month,
          status: 'updated',
          ...parsedValues,
          allNums: allNums.slice(0, 10),
        })
      }
    } catch (err) {
      results.push({ year, month, status: `error: ${String(err)}` })
    }
  }

  return NextResponse.json({ success: true, results, timestamp: now.toISOString() })
}
