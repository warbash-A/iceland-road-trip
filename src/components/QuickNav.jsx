import { useState, useEffect } from 'react';
import './QuickNav.css';

function QuickNav({ currentDay, totalDays, onDayChange, tripStartDate }) {
  const [todayDayNumber, setTodayDayNumber] = useState(null);

  useEffect(() => {
    // Calculate which day of the trip today is
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(tripStartDate);
    startDate.setHours(0, 0, 0, 0);

    const diffTime = today - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < totalDays) {
      setTodayDayNumber(diffDays + 1);
    }
  }, [tripStartDate, totalDays]);

  const handlePrevDay = () => {
    if (currentDay > 1) {
      onDayChange(currentDay - 1);
    }
  };

  const handleNextDay = () => {
    if (currentDay < totalDays) {
      onDayChange(currentDay + 1);
    }
  };

  const handleToday = () => {
    if (todayDayNumber) {
      onDayChange(todayDayNumber);
    }
  };

  return (
    <div className="quick-nav">
      <button
        className="nav-btn prev"
        onClick={handlePrevDay}
        disabled={currentDay === 1}
      >
        ‹
      </button>

      <div className="nav-center">
        <div className="day-indicator">
          Day {currentDay} of {totalDays}
        </div>
        {todayDayNumber && todayDayNumber !== currentDay && (
          <button className="today-btn" onClick={handleToday}>
            📍 Today (Day {todayDayNumber})
          </button>
        )}
      </div>

      <button
        className="nav-btn next"
        onClick={handleNextDay}
        disabled={currentDay === totalDays}
      >
        ›
      </button>
    </div>
  );
}

export default QuickNav;
