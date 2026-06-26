import { useState, useEffect } from 'react';
import './NextStop.css';

function NextStop({ day, onNavigate }) {
  const [nextStop, setNextStop] = useState(null);
  const [arrivalTime, setArrivalTime] = useState(null);

  useEffect(() => {
    if (!day || !day.stops || day.stops.length === 0) return;

    // Find the first stop (you could make this smarter by tracking which stops are visited)
    const next = day.stops[0];
    setNextStop(next);

    // Calculate arrival time
    const now = new Date();
    const driveTime = next.drive_from_prev_min || 0;
    const arrival = new Date(now.getTime() + driveTime * 60000);
    setArrivalTime(arrival);
  }, [day]);

  if (!nextStop) return null;

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="next-stop">
      <div className="next-stop-content">
        <div className="next-stop-info">
          <div className="next-stop-label">Next Stop</div>
          <div className="next-stop-name">{nextStop.name}</div>
          <div className="next-stop-meta">
            {nextStop.drive_from_prev_min > 0 && (
              <span>🚗 {formatDuration(nextStop.drive_from_prev_min)}</span>
            )}
            {arrivalTime && nextStop.drive_from_prev_min > 0 && (
              <span>• Arrive ~{formatTime(arrivalTime)}</span>
            )}
          </div>
        </div>
        <button
          className="navigate-btn"
          onClick={() => onNavigate(nextStop)}
        >
          Navigate →
        </button>
      </div>
    </div>
  );
}

export default NextStop;
