import { useEffect, useRef } from 'react';
import DayCard from './DayCard';
import './DayList.css';

function DayList({ days, selectedDay, onSelectDay, editMode, onEditStop, onAddStop, onEditDay, onCampsiteClick, onNavigate }) {
  const listRef = useRef(null);
  const dayRefs = useRef({});

  // Auto-scroll to selected day when it changes
  useEffect(() => {
    if (selectedDay && dayRefs.current[selectedDay]) {
      dayRefs.current[selectedDay].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [selectedDay]);

  return (
    <div className="day-list" ref={listRef}>
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
          />
        </div>
      ))}
    </div>
  );
}

export default DayList;
