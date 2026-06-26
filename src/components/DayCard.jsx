import StopItem from './StopItem';
import './DayCard.css';

function DayCard({ day, isSelected, onSelect, editMode, onEditStop, onAddStop, onEditDay, onCampsiteClick, onNavigate }) {
  const totalDriveTime = day.stops
    .filter(s => s.drive_from_prev_min)
    .reduce((sum, s) => sum + s.drive_from_prev_min, 0);

  const totalActivityTime = day.stops
    .reduce((sum, s) => sum + s.duration_min, 0);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className={`day-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="day-header">
        <div>
          <h2>Day {day.day}</h2>
          <p className="day-label">{day.label}</p>
          <p className="day-date">{day.date}</p>
        </div>
        {editMode && (
          <button
            className="edit-day-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEditDay(day.day - 1);
            }}
          >
            📅 Edit Date
          </button>
        )}
      </div>

      <div className="day-stats">
        <span>{day.stops.length} stops</span>
        <span>🚗 {formatTime(totalDriveTime)}</span>
        <span>⏱️ {formatTime(totalActivityTime)}</span>
      </div>

      <div className="stops-list">
        {day.stops.map((stop, index) => (
          <div key={index}>
            <StopItem
              stop={stop}
              editMode={editMode}
              onEdit={() => onEditStop(day.day - 1, index)}
              onNavigate={onNavigate}
            />
            {stop.drive_from_prev_min && index < day.stops.length - 1 && (
              <div className="drive-time">
                🚗 {formatTime(stop.drive_from_prev_min)}
              </div>
            )}
          </div>
        ))}
        {editMode && (
          <button className="add-stop-btn" onClick={() => onAddStop(day.day - 1)}>
            + Add Stop
          </button>
        )}
      </div>

      {day.overnight && (
        <div className="overnight-section">
          <div
            className="overnight navigable"
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate) {
                onNavigate(day.overnight);
              }
            }}
          >
            <div className="overnight-icon">🏕️</div>
            <div className="overnight-info">
              <strong>{day.overnight.name}</strong>
              <p>{day.overnight.price_isk} ISK</p>
            </div>
            <div className="navigate-indicator">
              <span className="navigate-text">Navigate</span>
              <span className="navigate-icon">🧭</span>
            </div>
          </div>
          <button
            className="alternatives-btn"
            onClick={(e) => {
              e.stopPropagation();
              onCampsiteClick(day.overnight, day.day - 1);
            }}
          >
            View Alternatives →
          </button>
        </div>
      )}
    </div>
  );
}

export default DayCard;
