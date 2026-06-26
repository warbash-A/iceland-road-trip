import DayCard from './DayCard';
import './DayList.css';

function DayList({ days, selectedDay, onSelectDay, editMode, onEditStop, onAddStop, onCampsiteClick }) {
  return (
    <div className="day-list">
      {days.map((day) => (
        <DayCard
          key={day.day}
          day={day}
          isSelected={day.day === selectedDay}
          onSelect={() => onSelectDay(day.day)}
          editMode={editMode}
          onEditStop={onEditStop}
          onAddStop={onAddStop}
          onCampsiteClick={onCampsiteClick}
        />
      ))}
    </div>
  );
}

export default DayList;
