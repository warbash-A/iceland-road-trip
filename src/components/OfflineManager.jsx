import { useState, useEffect } from 'react';
import './OfflineManager.css';

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
    // TODO: Implement in next task
    setIsOfflineReady(false);
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

  async function startDownload() {
    // TODO: Implement in next task
    setIsDownloading(true);
  }

  function handleClearCache() {
    // TODO: Implement in next task
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
