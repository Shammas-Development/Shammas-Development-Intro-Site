const CACHE_NAME = 'shammas-development-v3'
const STATIC_CACHE = 'shammas-static-v3'
const DYNAMIC_CACHE = 'shammas-dynamic-v3'

// Static assets to cache immediately
const urlsToCache = [
  '/',
  '/offline',
  '/about',
  '/services',
  '/products',
  '/work',
  '/process',
  '/contact',
  '/faq',
  '/get-quote',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/apple-touch-icon.png',
]

// Max items in dynamic cache
const MAX_DYNAMIC_CACHE_ITEMS = 50

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Continue even if some assets fail
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

// Activate service worker
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Limit dynamic cache size
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length > maxItems) {
    await cache.delete(keys[0])
    limitCacheSize(cacheName, maxItems)
  }
}

// Fetch with smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip cross-origin requests except for CDN assets
  if (!request.url.startsWith(self.location.origin) &&
      !request.url.includes('fonts.googleapis.com') &&
      !request.url.includes('fonts.gstatic.com')) {
    return
  }

  // Skip API calls and external services
  if (request.url.includes('/api/') ||
      request.url.includes('web3forms.com') ||
      request.url.includes('mailchimp.com') ||
      request.url.includes('calendly.com') ||
      request.url.includes('brevo.com') ||
      request.url.includes('tawk.to') ||
      request.url.includes('clarity.ms') ||
      request.url.includes('google-analytics.com') ||
      request.url.includes('googletagmanager.com')) {
    return
  }

  // Cache-first for static assets (images, fonts, css, js)
  if (request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css|js)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Network-first for HTML pages
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
              limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Return offline page
            return caches.match('/offline')
          })
        })
    )
    return
  }

  // Stale-while-revalidate for other requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
            limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_ITEMS)
          })
        }
        return response
      })
      return cachedResponse || fetchPromise
    })
  )
})

// Background sync for failed form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    // Handle background sync
  }
})

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/web-app-manifest-192x192.png',
      badge: '/favicon-96x96.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    }
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
