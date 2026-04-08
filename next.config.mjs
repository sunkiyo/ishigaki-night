import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { missingSuspenseWithCSRBailout: false },
  serverExternalPackages: ['pdf-parse'],
}

export default withNextIntl(nextConfig)
