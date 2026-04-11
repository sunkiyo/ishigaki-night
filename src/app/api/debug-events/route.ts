import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = getSupabaseAdmin()
  const today = new Date().toISOString().slice(0, 10)
  const until = new Date(Date.now() + 35 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('ishigaki_events')
    .select('event_date, event_name, category, is_confirmed')
    .gte('event_date', today)
    .lte('event_date', until)
    .order('event_date')

  return NextResponse.json({ today, until, count: data?.length ?? 0, error: error?.message, events: data })
}
