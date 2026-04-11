import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const client = new Anthropic({ apiKey })

  // モデル一覧取得
  try {
    const models = await client.models.list()
    return NextResponse.json({ models: models.data.map((m: { id: string }) => m.id) })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
