/**
 * Service Worker de FestiApp
 * Estrategia: Network First con fallback a cache para navegación.
 * Cache First para assets estáticos.
 */

const CACHE_NAME = 'festiapp-v1';

/** Assets estáticos que se pre-cachean en la instalación */
const ASSETS_PRECACHE = [
  '/manifest.json',
  '/icons/web-app-manifest-icon-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  '/icons/apple-touch-icon1.png',
];

/** Patrones de URLs que NO se deben cachear (API, admin, etc.) */
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /\/admin/,
  /supabase/,
  /_next\/webpack-hmr/,
];

// === Instalación: pre-cachear assets esenciales ===
self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_PRECACHE);
    })
  );
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// === Activación: limpiar caches antiguos ===
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) => {
      return Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      );
    })
  );
  // Tomar control de todas las pestañas abiertas
  self.clients.claim();
});

// === Fetch: estrategia según tipo de recurso ===
self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);

  // Ignorar peticiones que no sean GET
  if (evento.request.method !== 'GET') return;

  // Ignorar URLs que no se deben cachear
  if (NO_CACHE_PATTERNS.some((patron) => patron.test(url.pathname))) return;

  // Assets estáticos (_next/static, fonts, imágenes): Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)
  ) {
    evento.respondWith(cacheFirst(evento.request));
    return;
  }

  // Navegación y otros: Network First
  evento.respondWith(networkFirst(evento.request));
});

/**
 * Cache First: busca en cache, si no → red, y guarda en cache.
 */
async function cacheFirst(peticion) {
  const respuestaCache = await caches.match(peticion);
  if (respuestaCache) return respuestaCache;

  try {
    const respuestaRed = await fetch(peticion);
    if (respuestaRed.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(peticion, respuestaRed.clone());
    }
    return respuestaRed;
  } catch {
    // Sin conexión y sin cache: respuesta genérica
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First: intenta red, si falla → cache.
 */
async function networkFirst(peticion) {
  try {
    const respuestaRed = await fetch(peticion);
    if (respuestaRed.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(peticion, respuestaRed.clone());
    }
    return respuestaRed;
  } catch {
    const respuestaCache = await caches.match(peticion);
    if (respuestaCache) return respuestaCache;

    // Si es navegación, devolver la página cacheada del mapa como fallback
    if (peticion.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) return fallback;
    }

    return new Response('Offline — Sin conexión', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
