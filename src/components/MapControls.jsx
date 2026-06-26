import './MapControls.css';

function MapControls({ viewMode, onViewModeChange, editMode, onEditModeToggle }) {
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
    </div>
  );
}

export default MapControls;
