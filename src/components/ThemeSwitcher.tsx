'use client'

import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'B2A', label: 'ブルー',   bg: '#ffffff', accent: '#0064c8' },
  { id: 'B2B', label: 'ゴールド', bg: '#fffcf0', accent: '#b46e00' },
  { id: 'B2C', label: 'ティール', bg: '#f0fffc', accent: '#008c78' },
]

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState('B2A')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'B2A'
    setTheme(saved)
    document.documentElement.dataset.theme = saved
    setMounted(true)
  }, [])

  if (!mounted) return null

  function pick(id: string) {
    setTheme(id)
    document.documentElement.dataset.theme = id
    localStorage.setItem('theme', id)
    setOpen(false)
  }

  const current = THEMES.find(t => t.id === theme) ?? THEMES[0]

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-2 flex flex-col gap-2 items-end">
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-md border transition-all ${
                theme === t.id ? 'scale-105 border-stone-400' : 'border-stone-200 hover:scale-105'
              }`}
              style={{ background: t.bg, color: t.accent }}
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.accent }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full shadow-lg border-2 border-white/60 flex items-center justify-center text-sm font-bold transition-transform hover:scale-110"
        style={{ background: current.accent, color: '#fff' }}
        title="テーマを変更"
      >
        {theme}
      </button>
    </div>
  )
}
