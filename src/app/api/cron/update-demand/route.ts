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

// --- 楽天トラベルAPI (ホテル空室率プロキシ) ---
let rakutenDebug: Record<string, unknown> = {}
async function fetchHotelVacancy(checkInDate: string): Promise<number | null> {
  const appId = process.env.RAKUTEN_APP_ID
  rakutenDebug = { appIdSet: !!appId, appIdPrefix: appId ? appId.slice(0, 4) + '...' : null }
  if (!appId) return null
  try {
    const url = new URL('https://app.rakuten.co.jp/services/api/Travel/VacantHotelSearch/20170426')
    url.searchParams.set('applicationId', appId)
    url.searchParams.set('largeClassCode', 'japan')
    url.searchParams.set('middleClassCode', 'okinawa')
    url.searchParams.set('smallClassCode', 'yaeyama')
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
      return null
    }
    const json = await res.json()
    rakutenDebug = { ...rakutenDebug, rawKeys: Object.keys(json) }

    const hotels = json?.hotels ?? []
    const count = hotels.length
    rakutenDebug = { ...rakutenDebug, hotelCount: count }
    const vacancyRate = Math.min(100, Math.round((count / 30) * 100))
    return vacancyRate
  } catch (e) {
    rakutenDebug = { ...rakutenDebug, exception: String(e) }
    console.error('Rakuten Travel API failed:', e)
    return null
  }
}

// --- Amadeus API (航空運賃) ---
async function fetchFlightPrice(departureDate: string): Promise<number | null> {
  const clientId     = process.env.AMADEUS_CLIENT_ID
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  try {
    // アクセストークン取得
    const tokenRes = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    })
    if (!tokenRes.ok) return null
    const { access_token } = await tokenRes.json()

    // フライト価格取得 HND→ISG
    const flightUrl = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers')
    flightUrl.searchParams.set('originLocationCode', 'HND')
    flightUrl.searchParams.set('destinationLocationCode', 'ISG')
    flightUrl.searchParams.set('departureDate', departureDate)
    flightUrl.searchParams.set('adults', '1')
    flightUrl.searchParams.set('max', '5')
    flightUrl.searchParams.set('currencyCode', 'JPY')

    const flightRes = await fetch(flightUrl.toString(), {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!flightRes.ok) return null
    const flightJson = await flightRes.json()

    const offers = flightJson?.data ?? []
    if (offers.length === 0) return null
    // 最安値を取得
    const prices = offers.map((o: { price: { grandTotal: string } }) => parseFloat(o.price.grandTotal))
    return Math.round(Math.min(...prices))
  } catch (e) {
    console.error('Amadeus API failed:', e)
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
  const flightDay = addDays(weekStart, 7)   // 来週の運賃を参照

  // --- 実績データ取得 ---
  const [trendsScore, hotelVacancy, flightPrice] = await Promise.all([
    fetchTrendsScore(),
    fetchHotelVacancy(checkIn),
    fetchFlightPrice(flightDay),
  ])

  const trends = trendsScore ?? 60
  const hotel  = hotelVacancy ?? 40
  const flight = flightPrice  ?? 18000
  const index  = calcIndex(trends, flight, hotel)

  results.push({ week_start: weekStart, trends, hotel, flight, index, source: 'api' })

  const { error: upsertErr } = await supabase.from('demand_weekly').upsert({
    week_start: weekStart,
    trends,
    flight,
    hotel,
    index,
    is_forecast: false,
    confidence: 1.0,
    note: '自動取得',
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
    actual: { trends, hotel, flight, index },
    forecasts: forecasts.length,
    results,
    apis: {
      trends: trendsScore !== null ? 'ok' : 'fallback',
      hotel:  hotelVacancy !== null ? 'ok' : 'fallback (RAKUTEN_APP_ID needed)',
      flight: flightPrice  !== null ? 'ok' : 'fallback (AMADEUS_CLIENT_ID/SECRET needed)',
    },
    debug: { rakuten: rakutenDebug },
    timestamp: today.toISOString(),
  })
}
