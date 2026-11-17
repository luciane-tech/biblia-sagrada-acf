/* Service worker: guarda o app no aparelho para abrir rápido e funcionar sem internet.
 * __VERSAO__ é trocado a cada build (scripts/pwa.js), o que renova o cache. */
const CACHE = 'biblia-__VERSAO__';
const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Páginas: tenta a rede (para receber atualizações) e, sem internet, usa a cópia guardada.
  if (req.mode === 'navigate') {
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copia));
          return resp;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Arquivos (scripts, fontes, imagens): usa a cópia guardada; se não houver, baixa e guarda.
  evento.respondWith(
    caches.match(req).then(
      (guardado) =>
        guardado ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        }),
    ),
  );
});
