import './ProgressBar.css';

function ProgressBar({ currentDay, totalDays, visitedStops, totalStops }) {
  const dayProgress = Math.round((currentDay / totalDays) * 100);
  const stopsProgress = totalStops > 0 ? Math.round((visitedStops / totalStops) * 100) : 0;

  return (
    <div className="progress-bar-container">
      <div className="progress-stats">
        <div className="progress-stat">
          <span className="progress-label">Day Progress</span>
          <span className="progress-value">Day {currentDay} of {totalDays}</span>
        </div>
        <div className="progress-stat">
          <span className="progress-label">Stops Completed</span>
          <span className="progress-value">{visitedStops}/{totalStops}</span>
        </div>
      </div>

      <div className="progress-bars">
        <div className="progress-item">
          <div className="progress-track">
            <div
              className="progress-fill day-progress"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <span className="progress-percent">{dayProgress}%</span>
        </div>

        <div className="progress-item">
          <div className="progress-track">
            <div
              className="progress-fill stops-progress"
              style={{ width: `${stopsProgress}%` }}
            />
          </div>
          <span className="progress-percent">{stopsProgress}%</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
