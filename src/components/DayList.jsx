import DayCard from './DayCard';
import './DayList.css';

function DayList({ days, selectedDay, onSelectDay, editMode, onEditStop, onAddStop, onEditDay, onCampsiteClick, onNavigate }) {
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
          onEditDay={onEditDay}
          onCampsiteClick={onCampsiteClick}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export default DayList;
