'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

const LOCALES = [
  { code: 'ja', label: 'JP' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中' },
  { code: 'ko', label: '한' },
]

export default function Header() {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // 現在の言語を pathname から取得
  const lang = pathname.split('/')[1] || 'ja'

  function switchLang(newLang: string) {
    const segments = pathname.split('/')
    segments[1] = newLang
    return segments.join('/')
  }

  const navLinks = [
    { href: `/${lang}/spots`,     label: t('spots') },
    { href: `/${lang}/events`,    label: t('events') },
    { href: `/${lang}/dashboard`, label: t('dashboard') },
    { href: `/${lang}/advertise`, label: t('advertise') },
  ]

  return (
    <header className="sticky top-0 z-50 bg-night/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* ロゴ */}
        <Link href={`/${lang}`} className="font-mincho text-gold2 font-semibold text-sm tracking-widest">
          ISHIGAKI NIGHT
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs text-white/50 hover:text-white transition-colors tracking-wide"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 言語切替 */}
        <div className="flex items-center gap-1">
          {LOCALES.map((loc) => (
            <Link
              key={loc.code}
              href={switchLang(loc.code)}
              className={`px-2 py-1 text-xs rounded border transition-colors ${
                lang === loc.code
                  ? 'border-gold2 bg-gold2/15 text-gold2'
                  : 'border-white/15 text-white/40 hover:text-white hover:border-white/40'
              }`}
            >
              {loc.label}
            </Link>
          ))}

          {/* モバイルハンバーガー */}
          <button
            className="ml-3 md:hidden text-white/60"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="menu"
          >
            <span className="block w-5 h-px bg-current mb-1" />
            <span className="block w-5 h-px bg-current mb-1" />
            <span className="block w-5 h-px bg-current" />
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-night">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-sm text-white/60 hover:text-white border-b border-white/8"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
