import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { calcIndex } from '@/lib/demand'

// --- Google Trends (unofficial API) ---
async function fetchTrendsScore(): Promise<number | null> {
  try {
    // google-trends-apiパッケージを使用
    const googleTrends = await import('google-trends-api')
    const result = await googleTrends.default.interestOverTime({
      keyword: '石垣島',
      geo: 'JP',
      startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    })
    const parsed = JSON.parse(result)
    const timelineData = parsed?.default?.timelineData ?? []
    const recent = timelineData[timelineData.length - 1]
    return recent?.value?.[0] ?? null
  } catch (e) {
    console.error('Google Trends fetch failed:', e)
    return null
  }
}

// --- 楽天トラベルAPI (空室率 + 平均最安値) ---
let rakutenDebug: Record<string, unknown> = {}
async function fetchHotelData(checkInDate: string): Promise<{ vacancy: number | null; avgPrice: number | null }> {
  const appId = process.env.RAKUTEN_APP_ID
  rakutenDebug = { appIdSet: !!appId, appIdPrefix: appId ? appId.slice(0, 4) + '...' : null }
  if (!appId) return { vacancy: null, avgPrice: null }
  try {
    const url = new URL('https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426')
    url.searchParams.set('applicationId', appId)
    url.searchParams.set('largeClassCode', 'japan')
    url.searchParams.set('middleClassCode', 'okinawa')
    url.searchParams.set('smallClassCode', 'ritou')  // 石垣・西表・小浜島
    url.searchParams.set('checkinDate', checkInDate)
    url.searchParams.set('checkoutDate', addDays(checkInDate, 1))
    url.searchParams.set('adultNum', '2')
    url.searchParams.set('hits', '30')
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString())
    rakutenDebug = { ...rakutenDebug, httpStatus: res.status }
    if (!res.ok) {
      const errText = await res.text()
      rakutenDebug = { ...rakutenDebug, error: errText.slice(0, 200) }
      return { vacancy: null, avgPrice: null }
    }
    const json = await res.json()
    rakutenDebug = { ...rakutenDebug, rawKeys: Object.keys(json) }

    const hotels: unknown[] = json?.hotels ?? []
    const count = hotels.length
    // 空室率: count=0→満室(0%), count=30→空き多(100%)
    const vacancyRate = Math.min(100, Math.round((count / 30) * 100))

    // 各ホテルの最安値を抽出して平均を計算
    const prices = hotels
      .map((h) => {
        const arr = h as Array<{ hotelBasicInfo?: { hotelMinCharge?: number } }>
        return arr[0]?.hotelBasicInfo?.hotelMinCharge
      })
      .filter((p): p is number => typeof p === 'number' && p > 0)
    const avgPrice = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null

    rakutenDebug = { ...rakutenDebug, hotelCount: count, avgPrice, priceCount: prices.length }
    return { vacancy: vacancyRate, avgPrice }
  } catch (e) {
    rakutenDebug = { ...rakutenDebug, exception: String(e) }
    console.error('Rakuten Travel API failed:', e)
    return { vacancy: null, avgPrice: null }
  }
}

// --- OpenSky Network (石垣空港ROIG 週次フライト数 → 0-100スコア) ---
let openskyDebug: Record<string, unknown> = {}
async function fetchFlightScore(weekStart: string): Promise<number | null> {
  try {
    // 先週1週間のROIG(石垣空港)到着フライト数を取得
    const endTs   = Math.floor(new Date(weekStart).getTime() / 1000)
    const beginTs = endTs - 7 * 24 * 3600
    const url = `https://opensky-network.org/api/flights/arrival?airport=ROIG&begin=${beginTs}&end=${endTs}`

    const headers: Record<string, string> = {}
    if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
      const cred = Buffer.from(`${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`).toString('base64')
      headers['Authorization'] = `Basic ${cred}`
    }

    const res = await fetch(url, { headers })
    openskyDebug = { httpStatus: res.status, authed: !!headers['Authorization'] }
    if (!res.ok) {
      const errText = await res.text()
      openskyDebug = { ...openskyDebug, error: errText.slice(0, 200) }
      return null
    }
    const flights = await res.json()
    if (!Array.isArray(flights)) return null

    const count = flights.length
    // ISG: 閑散期~30便/週, 繁忙期~70便/週 を基準に正規化
    const score = Math.min(100, Math.round((count / 70) * 100))
    openskyDebug = { ...openskyDebug, flightCount: count, score, period: `${beginTs}-${endTs}` }
    return score
  } catch (e) {
    openskyDebug = { exception: String(e) }
    console.error('OpenSky fetch failed:', e)
    return null
  }
}

// 日付にn日加算してYYYY-MM-DD形式で返す
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

// 今週の月曜日を取得
function getMondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - ((day + 6) % 7))
  return d.toISOString().slice(0, 10)
}

// 石垣島のシーズン指数（0〜1）を月から計算
function seasonMultiplier(month: number): number {
  const seasonMap: Record<number, number> = {
    1: 0.70, 2: 0.65, 3: 0.80, 4: 0.95,
    5: 0.90, 6: 0.55, 7: 0.85, 8: 0.95,
    9: 0.70, 10: 0.75, 11: 0.70, 12: 0.75,
  }
  return seasonMap[month] ?? 0.75
}

// 需要予測を8週分生成（信頼区間付き）
function generateForecasts(
  baseIndex: number,
  fromDate: string,
): Array<{ week_start: string; trends: number; flight: number; hotel: number; index: number; is_forecast: boolean; confidence: number; note: string }> {
  const GW_WEEKS = ['2026-04-27', '2026-05-04']  // GWピーク
  return Array.from({ length: 8 }, (_, i) => {
    const weekStart = addDays(fromDate, (i + 1) * 7)
    const month = new Date(weekStart).getMonth() + 1
    const season = seasonMultiplier(month)
    const isGW = GW_WEEKS.includes(weekStart)
    const multiplier = isGW ? 1.3 : season

    const forecastIdx = Math.min(100, Math.round(baseIndex * multiplier))
    const confidence  = Math.max(0.15, 1 - i * 0.11)

    // 各指標を指数から逆算（概算）
    const trends  = Math.min(100, Math.round(forecastIdx / 0.5 * 0.6))
    const flight  = Math.round(10000 + forecastIdx * 200)
    const hotel   = Math.max(5, Math.round(100 - forecastIdx))

    return {
      week_start: weekStart,
      trends,
      flight,
      hotel,
      index: forecastIdx,
      is_forecast: true,
      confidence,
      note: isGW ? 'GW期間（予測）' : `${month}月予測`,
    }
  })
}

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const results: Record<string, unknown>[] = []
  const today     = new Date()
  const weekStart = getMondayOf(today)
  const checkIn   = addDays(weekStart, 14)  // 2週間後を予約サーチ対象に

  // --- 実績データ取得 (並列) ---
  const [trendsScore, hotelData, flightScore] = await Promise.all([
    fetchTrendsScore(),
    fetchHotelData(checkIn),
    fetchFlightScore(weekStart),
  ])

  const trends    = trendsScore        ?? 60
  const hotel     = hotelData.vacancy  ?? 40
  const flight    = flightScore        ?? 35   // OpenSkyスコア(0-100)
  const avgPrice  = hotelData.avgPrice          // 楽天平均最安値（参考）
  const index     = calcIndex(trends, flight, hotel)

  results.push({ week_start: weekStart, trends, hotel, flight, index, source: 'api' })

  const noteJson = JSON.stringify({
    src: 'api',
    hotel_avg_price: avgPrice,   // 楽天トラベル平均最安値(円)
    flight_source: 'opensky',    // OpenSky Network
  })

  const { error: upsertErr } = await supabase.from('demand_weekly').upsert({
    week_start: weekStart,
    trends,
    flight,
    hotel,
    index,
    is_forecast: false,
    confidence: 1.0,
    note: noteJson,
    source: 'api',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'week_start' })

  if (upsertErr) {
    results.push({ error: upsertErr.message })
  }

  // --- 予測データ生成（既存予測を上書き）---
  const forecasts = generateForecasts(index, weekStart)
  for (const f of forecasts) {
    const { error } = await supabase.from('demand_weekly').upsert({
      ...f,
      source: 'forecast',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'week_start' })
    if (error) results.push({ forecast_error: error.message, week: f.week_start })
  }

  return NextResponse.json({
    success: true,
    weekStart,
    actual: { trends, hotel, flight, index, hotel_avg_price: avgPrice },
    forecasts: forecasts.length,
    results,
    apis: {
      trends:  trendsScore        !== null ? 'ok' : 'fallback',
      hotel:   hotelData.vacancy  !== null ? 'ok' : 'fallback (RAKUTEN_APP_ID needed)',
      flight:  flightScore        !== null ? 'ok' : 'fallback (OPENSKY_USERNAME/PASSWORD optional)',
    },
    debug: { rakuten: rakutenDebug, opensky: openskyDebug },
    timestamp: today.toISOString(),
  })
}
