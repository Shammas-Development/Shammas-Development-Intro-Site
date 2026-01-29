import type { Metadata, Viewport } from 'next';
import RootLayout from "@/components/RootLayout";
import "./globals.css";
import { Playfair_Display, Inter } from 'next/font/google';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import InstallPrompt from '@/components/InstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SpeedInsights } from '@vercel/speed-insights/next';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import ToastProvider from '@/components/Toast';
import LiveChat from '@/components/LiveChat';
import CookieConsent from '@/components/CookieConsent';
import BackToTop from '@/components/BackToTop';
import MicrosoftClarity from '@/components/MicrosoftClarity';
import ExitIntentPopup from '@/components/ExitIntentPopup';
import NewsletterPopup from '@/components/NewsletterPopup';
import StickyCTA from '@/components/StickyCTA';
import NavigationEvents from '@/components/NavigationEvents';
import AdSense from '@/components/AdSense';
import Trustpilot from '@/components/Trustpilot';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shammasdevelopment.io';
const heroImage = '/web-app-manifest-512x512.png';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | Shammas Development",
    default: "Shammas Development - Complete IT Solutions & Technology Services",
  },
  description: "Shammas Development LLC - Leading IT solutions provider specializing in software development, AI/ML, e-commerce platforms, cloud management, and digital transformation services. Expert technology consulting and investment solutions.",
  keywords: [
    // Brand name variations for maximum visibility
    'Shammas Development',
    'Shammas Investment',
    'shammas',
    'shammasdevelopment',
    'shammasdev',
    'shammas invest',
    'shammas LLC',
    'Shammas Development LLC',
    'shammas development company',
    'shammas technology',
    'shammas tech',
    'shammas solutions',
    // Core services
    'software development',
    'AI development',
    'machine learning',
    'artificial intelligence services',
    'e-commerce solutions',
    'Amazon seller services',
    'Walmart marketplace',
    'Shopify development',
    'cloud management',
    'AWS services',
    'game development',
    'mobile app development',
    'web development',
    'LLM chatbots',
    'graphics design',
    'social media management',
    'IT consulting',
    'digital transformation',
    'technology services',
    'enterprise software',
    // Investment related
    'technology investment',
    'IT investment',
    'tech investment firm',
    'investment company',
    // Location/Industry
    'IT solutions provider',
    'technology consulting',
    'software consultancy',
    'tech company',
  ],
  applicationName: 'Shammas Development',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'Shammas Development - Complete IT Solutions & Technology Services',
    description: 'Leading IT solutions provider specializing in software development, AI/ML, e-commerce platforms, cloud management, and digital transformation services.',
    siteName: 'Shammas Development',
    images: [
      {
        url: heroImage,
        width: 512,
        height: 512,
        alt: 'Shammas Development - Complete IT Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shammas Development - Complete IT Solutions & Technology Services',
    description: 'Leading IT solutions provider specializing in software development, AI/ML, e-commerce platforms, cloud management, and digital transformation services.',
    images: [heroImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: [{ url: '/favicon.svg' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'icon',
        url: '/web-app-manifest-192x192.png',
        sizes: '192x192',
      },
      {
        rel: 'icon',
        url: '/web-app-manifest-512x512.png',
        sizes: '512x512',
      },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Shammas Development',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  category: 'technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a0a0a',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Shammas Development LLC',
    alternateName: [
      'Shammas Development',
      'Shammas Investment',
      'shammasdevelopment',
      'shammasdev',
      'Shammas LLC',
      'Shammas Technology Solutions',
    ],
    legalName: 'Shammas Development LLC',
    url: siteUrl,
    logo: `${siteUrl}/web-app-manifest-512x512.png`,
    image: `${siteUrl}/web-app-manifest-512x512.png`,
    description: 'Shammas Development LLC is a leading IT solutions provider specializing in software development, AI/ML, e-commerce platforms, cloud management, and digital transformation services. Expert technology consulting and investment solutions.',
    slogan: 'Complete IT Solutions & Technology Services',
    founder: [
      {
        '@type': 'Person',
        name: 'Jonathan Shammas',
        jobTitle: 'Co-Founder',
      },
      {
        '@type': 'Person',
        name: 'Joe Shammas',
        jobTitle: 'Co-Founder',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
      addressRegion: 'United States',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@shammasdevelopment.io',
      contactType: 'Customer Service',
      availableLanguage: ['English'],
    },
    sameAs: [
      // Add your social media URLs here when available
    ],
    serviceArea: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Software Development',
      'Artificial Intelligence',
      'Machine Learning',
      'E-commerce Solutions',
      'Cloud Computing',
      'Mobile App Development',
      'Game Development',
      'Web Development',
      'Digital Transformation',
      'IT Consulting',
      'Technology Investment',
    ],
    makesOffer: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Software Development Services',
          description: 'Custom software development, web development, mobile app development',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'AI & Machine Learning Solutions',
          description: 'Artificial intelligence development, machine learning models, LLM chatbots',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'E-commerce Solutions',
          description: 'Amazon seller services, Walmart marketplace, Shopify development',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Cloud Management Services',
          description: 'AWS services, cloud infrastructure, cloud management',
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      className={`h-full bg-neutral-950 text-base antialiased text-neutral-100 ${inter.variable} ${playfair.variable}`}
    >
      <head>
        {/* Preconnect to critical third-party origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://embed.tawk.to" />
        <link rel="dns-prefetch" href="https://invitejs.trustpilot.com" />
        <link rel="dns-prefetch" href="https://www.clarity.ms" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <NavigationEvents />
        <ServiceWorkerRegistration />
        <InstallPrompt />
        <ToastProvider>
          <ErrorBoundary>
            <RootLayout>{children}</RootLayout>
          </ErrorBoundary>
        </ToastProvider>
        <SpeedInsights />
        <GoogleAnalytics />
        <LiveChat />
        <CookieConsent />
        <BackToTop />
        <MicrosoftClarity />
        <ExitIntentPopup />
        <NewsletterPopup />
        <StickyCTA />
        <AdSense />
        <Trustpilot />
      </body>
    </html>
  );
}
