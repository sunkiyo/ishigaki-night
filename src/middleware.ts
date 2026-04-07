import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['ja', 'en', 'zh', 'ko'],
  defaultLocale: 'ja',
  localePrefix: 'always',
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
