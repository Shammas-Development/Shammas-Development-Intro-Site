/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Performance optimizations
  reactStrictMode: true,

  // Experimental performance features
  experimental: {
    optimizeCss: true,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
  },

  // Security headers and PWA support
  async headers() {
    return [
      {
        // Service Worker headers for PWA
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest headers for PWA
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' ${isDevelopment ? "'unsafe-eval'" : ''} https://va.vercel-scripts.com https://embed.tawk.to https://*.tawk.to https://invitejs.trustpilot.com https://*.trustpilot.com https://widget.trustpilot.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.sentry.io https://browser.sentry-cdn.com https://assets.calendly.com`,
              "style-src 'self' 'unsafe-inline' https://*.tawk.to https://assets.calendly.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://*.tawk.to",
              "connect-src 'self' https://vitals.vercel-insights.com https://api.web3forms.com https://*.list-manage.com https://*.mailchimp.com https://calendly.com https://*.calendly.com https://*.tawk.to wss://*.tawk.to https://www.google-analytics.com https://*.trustpilot.com https://api.brevo.com https://*.clarity.ms https://*.googlesyndication.com https://*.googleadservices.com https://*.doubleclick.net https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://calendly.com https://*.calendly.com https://*.tawk.to https://*.trustpilot.com https://*.googlesyndication.com https://*.doubleclick.net https://googleads.g.doubleclick.net",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Compress assets
  compress: true,

  // Source maps uploaded to Sentry only, NOT served to browsers
  // Sentry plugin handles upload via hideSourceMaps: true
  productionBrowserSourceMaps: false,
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with Turbopack)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

// Wrap with Sentry only if DSN is configured
const configWithPlugins = withBundleAnalyzer(nextConfig);

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(configWithPlugins, sentryWebpackPluginOptions)
  : configWithPlugins;
