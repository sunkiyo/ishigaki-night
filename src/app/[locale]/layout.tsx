import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Shippori_Mincho, Noto_Sans_JP } from 'next/font/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import '../globals.css'

const mincho = Shippori_Mincho({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-mincho',
})

const noto = Noto_Sans_JP({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-noto',
})

const locales = ['ja', 'en', 'zh', 'ko']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params
  if (!locales.includes(locale)) notFound()

  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${mincho.variable} ${noto.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <Breadcrumb />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
