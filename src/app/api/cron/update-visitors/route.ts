import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// pdf-parse が内部で使うブラウザ専用 API を Node.js 環境でポリフィル
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    a=1;b=0;c=0;d=1;e=0;f=0
    m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0
    m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1
    isIdentity=true;is2D=true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromMatrix() { return new (globalThis as any).DOMMatrix() }
    invertSelf() { return this }
    multiplySelf() { return this }
    translateSelf() { return this }
    scaleSelf() { return this }
    rotateSelf() { return this }
  }
}
if (typeof globalThis.Path2D === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).Path2D = class Path2D {}
}

// PDFのURLを生成
// ファイル名パターン: nyuikisuikei[西暦下2桁][月2桁].pdf
// 例: 2026年2月 → nyuikisuikei2602.pdf
function buildPdfUrl(year: number, month: number): string {
  const yy = String(year).slice(-2) // 西暦の下2桁（2026→"26"）
  const mm = String(month).padStart(2, '0')
  return `https://www.city.ishigaki.okinawa.jp/material/files/group/11/nyuikisuikei${yy}${mm}.pdf`
}

// PDFテキストから来島者数を抽出するパーサー
// PDFのページ1には月別データが表形式で入っている
// テキスト抽出後に数値パターンを正規表現でパース
function parseVisitorData(text: string, targetMonth: number): { visitors: number | null, air: number | null, sea: number | null } {
  // PDFテキストの数値は3桁カンマ区切り（例: 118,755）または桁区切りなし
  // ページ1の構造: 月 | 観光客数 | 空路 | 海路 | ...
  const lines = text.split('\n').filter(l => l.trim())

  // 月を表す行を探す（例: "1月" "1" など）
  const monthPatterns = [
    new RegExp(`^${targetMonth}月`),
    new RegExp(`^${targetMonth}\\s`),
    new RegExp(`\\b${targetMonth}月\\b`),
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (monthPatterns.some(p => p.test(line.trim()))) {
      // この行またはその周辺から数値を抽出
      const numbers = (line + ' ' + (lines[i+1] || '')).match(/[\d,]+/g)
        ?.map(n => parseInt(n.replace(/,/g, ''), 10))
        .filter(n => n > 1000) // 来島者数は数千〜数十万

      if (numbers && numbers.length >= 3) {
        return {
          visitors: numbers[0] || null,
          air: numbers[1] || null,
          sea: numbers[2] || null,
        }
      }
    }
  }

  // フォールバック: 大きな数値を探す
  const allNumbers = text.match(/\d{2,3},\d{3}/g)?.map(n => parseInt(n.replace(',', ''), 10)) || []
  return {
    visitors: allNumbers[0] || null,
    air: allNumbers[1] || null,
    sea: allNumbers[2] || null,
  }
}

export async function GET(request: Request) {
  // Cronシークレット確認（Vercel Cronは自動でヘッダーを付与）
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Array<{ year: number, month: number, status: string }> = []
  const now = new Date()

  // 直近3ヶ月分を試行（最新データが公開済みか確認するため）
  for (let i = 1; i <= 3; i++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() + 1

    // すでにDBにデータがあるかチェック
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
      // PDFをフェッチ
      const response = await fetch(pdfUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ishigaki-night-bot/1.0)' },
      })

      if (!response.ok) {
        results.push({ year, month, status: `pdf_not_found: ${response.status}` })
        continue
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // pdf-parseでテキスト抽出
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse: (buffer: Buffer, options?: object) => Promise<{ text: string }> = require('pdf-parse')
      const pdfData = await pdfParse(buffer, { max: 1 }) // 1ページ目のみ

      const parsed = parseVisitorData(pdfData.text, month)

      // Supabaseに保存（upsert）
      const { error } = await supabase
        .from('visitor_monthly')
        .upsert({
          year,
          month,
          visitors: parsed.visitors,
          air: parsed.air,
          sea: parsed.sea,
          source_url: pdfUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'year,month' })

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
