import OfflineManager from './OfflineManager';
import './MapControls.css';

function MapControls({ viewMode, onViewModeChange, editMode, onEditModeToggle, days = [] }) {
  return (
    <div className="map-controls">
      <div className="view-toggle">
        <button
          className={viewMode === 'single' ? 'active' : ''}
          onClick={() => onViewModeChange('single')}
        >
          Single Day
        </button>
        <button
          className={viewMode === 'all' ? 'active' : ''}
          onClick={() => onViewModeChange('all')}
        >
          View All Days
        </button>
      </div>

      <button
        className={`edit-toggle ${editMode ? 'active' : ''}`}
        onClick={onEditModeToggle}
      >
        {editMode ? '✓ Done Editing' : '✏️ Edit Trip'}
      </button>

      <div className="offline-section">
        <OfflineManager
          tripData={{ trip: { days } }}
          onDownloadComplete={(result) => {
            console.log('Download complete:', result);
          }}
          onError={(error) => {
            console.error('Download error:', error);
          }}
        />
      </div>
    </div>
  );
}

export default MapControls;
