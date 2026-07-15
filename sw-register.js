/**
 * Register service worker for offline tile caching
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/iceland-road-trip/service-worker.js', {
        scope: '/iceland-road-trip/'
      });
      console.log('[SW] Registration successful:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[SW] Registration failed:', error);
      throw error;
    }
  } else {
    console.warn('[SW] Service Workers not supported');
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('[SW] Unregistered');
  }
}

/**
 * Check if service worker is registered
 */
export async function isServiceWorkerRegistered() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration !== undefined;
  }
  return false;
}
