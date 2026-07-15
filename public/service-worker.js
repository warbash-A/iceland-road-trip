/* global self, caches, fetch */

const CACHE_NAME = 'iceland-trip-v1';
const DB_NAME = 'iceland-trip-tiles';
const STORE_NAME = 'tiles';

/**
 * Open IndexedDB (duplicated from offlineUtils for service worker)
 */
function openTileDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get tile from IndexedDB
 */
async function getTileFromDB(key) {
  const db = await openTileDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate gray placeholder tile (1x1 PNG)
 */
function generatePlaceholderTile() {
  // 1x1 gray PNG (base64)
  const grayPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8c+bMfwAHzAL+tFWqKAAAAABJRU5ErkJggg==';
  const binary = atob(grayPng);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Response(array, {
    headers: { 'Content-Type': 'image/png' }
  });
}

/**
 * Extract tile coordinates from URL
 */
function parseTileUrl(url) {
  // Match: /z/x/y.png
  const match = url.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
  if (match) {
    return {
      z: parseInt(match[1], 10),
      x: parseInt(match[2], 10),
      y: parseInt(match[3], 10)
    };
  }
  return null;
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// Fetch event - intercept tile requests
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only intercept OpenStreetMap tile requests
  if (url.includes('tile.openstreetmap.org')) {
    event.respondWith(
      (async () => {
        try {
          // Parse tile coordinates from URL
          const tile = parseTileUrl(url);
          if (!tile) {
            return fetch(event.request);
          }

          // Try to get from IndexedDB
          const key = `tile_${tile.z}_${tile.x}_${tile.y}`;
          const cached = await getTileFromDB(key);

          if (cached && cached.blob) {
            // Return cached tile
            return new Response(cached.blob, {
              headers: { 'Content-Type': 'image/png' }
            });
          }

          // If online, fetch from network
          if (self.navigator.onLine) {
            return fetch(event.request);
          }

          // Offline and not cached - return placeholder
          return generatePlaceholderTile();
        } catch (error) {
          console.error('[Service Worker] Fetch error:', error);
          // Fallback to network or placeholder
          if (self.navigator.onLine) {
            return fetch(event.request);
          }
          return generatePlaceholderTile();
        }
      })()
    );
  }
});

console.log('[Service Worker] Loaded');
