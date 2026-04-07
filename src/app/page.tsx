import { redirect } from 'next/navigation'

// / にアクセスしたら /ja にリダイレクト（middlewareでも処理するが念のため）
export default function RootPage() {
  redirect('/ja')
}
