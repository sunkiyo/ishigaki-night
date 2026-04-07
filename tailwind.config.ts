import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ブランドカラー（CSS変数ベース・テーマ切替対応）
        night:   'rgb(var(--night) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        gold:    'rgb(var(--gold) / <alpha-value>)',
        gold2:   'rgb(var(--gold2) / <alpha-value>)',
        teal:    '#2dd4bf',
      },
      fontFamily: {
        mincho: ['"Shippori Mincho"', 'serif'],
        sans:   ['"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
