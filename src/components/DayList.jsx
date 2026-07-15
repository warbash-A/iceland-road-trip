import { useEffect, useRef } from 'react';
import DayCard from './DayCard';
import './DayList.css';

function DayList({ days, selectedDay, onSelectDay, editMode, onEditStop, onAddStop, onEditDay, onCampsiteClick, onNavigate, visitedStops, onToggleVisited, selectedStop, onSelectStop, isFullDayView }) {
  const listRef = useRef(null);
  const dayRefs = useRef({});

  // Auto-scroll selected day to top so user sees full day details
  useEffect(() => {
    if (selectedDay && dayRefs.current[selectedDay] && listRef.current) {
      // Longer delay to let the day expand fully before scrolling
      setTimeout(() => {
        const dayElement = dayRefs.current[selectedDay];
        const listElement = listRef.current;

        // Get the position of the day card relative to the list container
        const offset = dayElement.offsetTop;

        // Scroll the list to position the day at the very top (0 position)
        listElement.scrollTo({
          top: offset,
          behavior: 'smooth'
        });
      }, 200);
    }
  }, [selectedDay]);

  return (
    <div className={`day-list ${isFullDayView ? 'expanded' : ''}`} ref={listRef}>
      {days.map((day) => (
        <div
          key={day.day}
          ref={(el) => {
            if (el) dayRefs.current[day.day] = el;
          }}
        >
          <DayCard
            day={day}
            isSelected={day.day === selectedDay}
            onSelect={() => onSelectDay(day.day)}
            editMode={editMode}
            onEditStop={onEditStop}
            onAddStop={onAddStop}
            onEditDay={onEditDay}
            onCampsiteClick={onCampsiteClick}
            onNavigate={onNavigate}
            visitedStops={visitedStops}
            onToggleVisited={onToggleVisited}
            selectedStop={selectedStop}
            onSelectStop={onSelectStop}
          />
        </div>
      ))}
    </div>
  );
}

export default DayList;
