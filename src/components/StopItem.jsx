import './StopItem.css';

const typeIcons = {
  airport: '✈️',
  grocery: '🛒',
  sightseeing: '👁️',
  waterfall: '💧',
  hiking: '🥾',
  geothermal: '♨️',
  glacier: '🧊',
  lava: '🌋',
  hot_spring: '♨️',
  campsite: '🏕️'
};

function StopItem({ stop, editMode, onEdit, onNavigate }) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(stop);
    }
  };

  return (
    <div className={`stop-item stop-${stop.type} ${editMode ? 'editable' : ''}`}>
      <div className="stop-icon">{typeIcons[stop.type] || '📍'}</div>
      <div className="stop-info">
        <strong>{stop.name}</strong>
        <p className="stop-duration">{formatDuration(stop.duration_min)}</p>
        {stop.notes && <p className="stop-notes">{stop.notes}</p>}
      </div>
      {!editMode && onNavigate && (
        <button className="navigate-stop-btn" onClick={handleNavigate} title="Open in Maps">
          🧭
        </button>
      )}
      {editMode && (
        <button className="edit-stop-btn" onClick={onEdit}>
          ✏️
        </button>
      )}
    </div>
  );
}

export default StopItem;
