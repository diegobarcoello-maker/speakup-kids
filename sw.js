/* ============================================================
   SpeakUp Kids — Service Worker

   Un niño juega en el asiento de atrás del carro, sin datos.
   Así que todo lo propio se guarda y se sirve desde la caché:
   "stale-while-revalidate" — responde al instante con lo que
   hay y descarga la versión nueva para la próxima vez.
   ============================================================ */

const VERSION = 'speakup-kids-v4';

const ESENCIALES = [
  './',
  './index.html',
  './styles.css?v=4',
  './data.js?v=4',
  './app.js?v=4',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(ESENCIALES.map(async ruta => {
      try { await cache.add(new Request(ruta, { cache: 'reload' })); }
      catch (e) { /* si falta un archivo suelto, la instalación no se cae entera */ }
    }));
    /* No se llama a skipWaiting() aquí a propósito: la versión nueva no
       debe entrar a mitad de un juego. La app avisa cuándo puede. */
  })());
});

self.addEventListener('message', ev => {
  if (ev.data === 'saltar-espera') self.skipWaiting();
});

self.addEventListener('activate', ev => {
  ev.waitUntil((async () => {
    const claves = await caches.keys();
    await Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', ev => {
  const pet = ev.request;
  if (pet.method !== 'GET') return;

  let url;
  try { url = new URL(pet.url); } catch (e) { return; }

  // La tipografía de Google se guarda aparte (respuesta opaca, sirve igual)
  const esFuente = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== self.location.origin && !esFuente) return;

  ev.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const guardado = await cache.match(pet, { ignoreSearch: true });

    const red = fetch(pet).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(pet, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);

    if (guardado) { ev.waitUntil(red); return guardado; }

    const fresco = await red;
    if (fresco) return fresco;

    if (pet.mode === 'navigate') {
      const inicio = await cache.match('./index.html') || await cache.match('./');
      if (inicio) return inicio;
    }
    return new Response('Sin conexión y sin copia guardada.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  })());
});
