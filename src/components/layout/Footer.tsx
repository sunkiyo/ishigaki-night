import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 mt-20 py-12 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="font-mincho text-gold font-semibold tracking-widest mb-2">ISHIGAKI NIGHT</p>
          <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
            石垣島のナイトライフを国内外の旅行者へ届けるメディア
          </p>
        </div>
        <div className="flex gap-12 text-xs text-stone-400">
          <div className="flex flex-col gap-2">
            <p className="text-stone-600 font-medium mb-1">サイト</p>
            <Link href="/ja/spots"     className="hover:text-stone-900 transition-colors">店舗一覧</Link>
            <Link href="/ja/events"    className="hover:text-stone-900 transition-colors">イベント</Link>
            <Link href="/ja/dashboard" className="hover:text-stone-900 transition-colors">需要予測</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-stone-600 font-medium mb-1">掲載</p>
            <Link href="/ja/advertise" className="hover:text-stone-900 transition-colors">広告・掲載案内</Link>
          </div>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto mt-8 pt-6 border-t border-stone-200 text-xs text-stone-300 flex justify-between">
        <span>© 2026 ISHIGAKI NIGHT. All rights reserved.</span>
        <span>Powered by Next.js + Vercel</span>
      </div>
    </footer>
  )
}
