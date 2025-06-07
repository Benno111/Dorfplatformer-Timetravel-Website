const DB_NAME = 'pageCache';
const STORE_NAME = 'files';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getFile(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Only intercept requests from your base URL
  if (url.origin === self.origin) {
    event.respondWith(
      (async () => {
        const db = await openDB();
        const path = url.pathname.slice(1); // remove leading slash
        const cachedContent = await getFile(db, path);
        if (cachedContent !== null) {
          let headers = {};
          if (path.endsWith('.js')) headers['Content-Type'] = 'application/javascript';
          else if (path.endsWith('.css')) headers['Content-Type'] = 'text/css';
          else if (path.endsWith('.html')) headers['Content-Type'] = 'text/html';
          else if (path.endsWith('.json')) headers['Content-Type'] = 'application/json';
          else headers['Content-Type'] = 'text/plain';

          return new Response(cachedContent, { headers });
        }
        return fetch(event.request); // fallback to network
      })()
    );
  }
});
