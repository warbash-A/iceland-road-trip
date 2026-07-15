import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/iceland-road-trip/service-worker.js', {
      scope: '/iceland-road-trip/'
    })
      .then(registration => {
        console.log('[SW] Registered:', registration.scope);
      })
      .catch(error => {
        console.error('[SW] Registration failed:', error);
      });
  });
}
