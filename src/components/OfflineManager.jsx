import { useState, useEffect } from 'react';
import './OfflineManager.css';
import {
  calculateAllTiles,
  calculateBoundingBox,
  tileToUrl,
  saveTile,
  cacheRoute,
  getStorageInfo,
  setOfflineMetadata,
  isOfflineDataAvailable,
  getOfflineMetadata,
  clearAllTiles,
  clearAllRoutes,
  getTileCount
} from '../utils/offlineUtils';

/**
 * OfflineManager Component
 * Handles offline map download, storage management, and status display
 */
function OfflineManager({ tripData, onDownloadComplete, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [storageInfo, setStorageInfo] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check if offline data is available on mount
  useEffect(() => {
    checkOfflineStatus();
  }, []);

  async function checkOfflineStatus() {
    const available = await isOfflineDataAvailable();
    setIsOfflineReady(available);

    if (available) {
      const metadata = getOfflineMetadata();
      setStorageInfo(metadata);
    }
  }

  function handleDownloadClick() {
    setShowConfirmModal(true);
  }

  function handleConfirmDownload() {
    setShowConfirmModal(false);
    startDownload();
  }

  function handleCancelDownload() {
    setShowConfirmModal(false);
  }

  async function downloadTile(tile) {
    const url = tileToUrl(tile.z, tile.x, tile.y);

    // Retry logic with exponential backoff
    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Iceland-Road-Trip-App/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await saveTile(tile.z, tile.x, tile.y, uint8Array);
        return true;

      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}:`, error);
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  async function downloadRoutes() {
    const routePromises = [];

    tripData.trip.days.forEach(day => {
      const stops = day.stops;

      for (let i = 0; i < stops.length - 1; i++) {
        const start = stops[i];
        const end = stops[i + 1];

        const promise = fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        )
          .then(res => res.json())
          .then(data => {
            if (data.routes && data.routes[0]) {
              cacheRoute(day.day, i, i + 1, data);
            }
          })
          .catch(err => console.error('Route fetch error:', err));

        routePromises.push(promise);
      }
    });

    await Promise.allSettled(routePromises);
  }

  async function startDownload() {
    setIsDownloading(true);
    setProgress({ current: 0, total: 0 });

    try {
      // Extract all stops from trip data
      const allStops = [];
      tripData.trip.days.forEach(day => {
        day.stops.forEach(stop => allStops.push(stop));
        if (day.overnight) {
          allStops.push(day.overnight);
        }
      });

      // Calculate tiles to download
      const zoomLevels = [7, 8, 9, 10, 11, 12, 13, 14, 15];
      const tiles = calculateAllTiles(allStops, 20, zoomLevels);

      setProgress({ current: 0, total: tiles.length });

      // Download tiles in batches
      const batchSize = 10;
      let downloadedCount = 0;
      const failedTiles = [];

      for (let i = 0; i < tiles.length; i += batchSize) {
        const batch = tiles.slice(i, i + batchSize);

        // Download batch in parallel
        const results = await Promise.allSettled(
          batch.map(tile => downloadTile(tile))
        );

        // Count successes and failures
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            downloadedCount++;
          } else {
            failedTiles.push(batch[idx]);
          }
        });

        setProgress({ current: downloadedCount, total: tiles.length });

        // Delay between batches (respect tile server)
        if (i + batchSize < tiles.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Download routes
      await downloadRoutes();

      // Save metadata
      const bbox = calculateBoundingBox(allStops, 20);
      const storageUsed = downloadedCount * 45 * 1024; // Estimate

      setOfflineMetadata({
        version: '1.0',
        downloadedAt: Date.now(),
        lastUpdated: Date.now(),
        totalTiles: downloadedCount,
        storageUsedBytes: storageUsed,
        boundingBox: bbox,
        zoomLevels,
        routesDownloaded: tripData.trip.days.reduce((sum, day) => sum + day.stops.length - 1, 0),
        failedTiles: failedTiles.length
      });

      // Show success
      setIsDownloading(false);
      setShowSuccessMessage(true);
      setIsOfflineReady(true);

      setTimeout(() => setShowSuccessMessage(false), 3000);

      if (onDownloadComplete) {
        onDownloadComplete({ success: true, failedTiles: failedTiles.length });
      }

    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);

      if (onError) {
        onError(error);
      }
    }
  }

  async function handleClearCache() {
    if (!confirm('Delete offline maps? This will free up storage space.')) {
      return;
    }

    try {
      await clearAllTiles();
      clearAllRoutes();
      localStorage.removeItem('offline_metadata');

      setIsOfflineReady(false);
      setStorageInfo(null);

    } catch (error) {
      console.error('Error clearing cache:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  return (
    <div className="offline-manager">
      {/* Status Indicator */}
      {!isDownloading && (
        <div className="offline-status">
          {isOfflineReady ? (
            <button className="status-button ready" onClick={handleClearCache}>
              <span className="status-dot green">🟢</span>
              <span>Offline ready</span>
              {storageInfo && <span className="storage-size">({Math.round(storageInfo.storageUsedBytes / 1024 / 1024)}MB)</span>}
            </button>
          ) : (
            <button className="status-button not-ready" onClick={handleDownloadClick}>
              <span className="status-dot yellow">🟡</span>
              <span>Download offline maps</span>
            </button>
          )}
        </div>
      )}

      {/* Download Progress */}
      {isDownloading && (
        <div className="download-progress">
          <p>Downloading offline maps...</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="progress-text">
            {progress.current} / {progress.total} tiles ({Math.round((progress.current / progress.total) * 100)}%)
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancelDownload}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Download Offline Maps</h2>
            <p>Size: ~65 MB</p>
            <p>Tiles: ~1,500 map tiles</p>
            <p>Coverage: All trip locations</p>
            <p className="modal-note">Best done on WiFi before your trip.</p>
            <div className="modal-buttons">
              <button onClick={handleCancelDownload} className="btn-cancel">Cancel</button>
              <button onClick={handleConfirmDownload} className="btn-download">Download</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="success-message">
          <p>✓ Offline Maps Ready!</p>
          <p className="success-detail">You can now use maps without internet.</p>
        </div>
      )}
    </div>
  );
}

export default OfflineManager;
