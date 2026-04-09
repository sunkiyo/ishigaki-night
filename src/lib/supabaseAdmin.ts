import { createClient } from '@supabase/supabase-js'

// Service role key を使うサーバー専用クライアント（RLSをバイパス）
// このファイルはサーバーサイドのみで使用すること
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
