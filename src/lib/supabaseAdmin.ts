import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Service role key を使うサーバー専用クライアント（RLSをバイパス）
// このファイルはサーバーサイドのみで使用すること
// ビルド時に環境変数が存在しないため、遅延初期化でランタイムのみ生成する

let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

// 後方互換のため旧名でも export
export const supabaseAdmin = { get: getSupabaseAdmin }
