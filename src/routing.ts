import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ja', 'en', 'zh', 'ko'],
  defaultLocale: 'ja',
  localePrefix: 'always',
})
