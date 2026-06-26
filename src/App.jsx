import { useState } from 'react';
import DayList from './components/DayList';
import TripMap from './components/TripMap';
import EditStopModal from './components/EditStopModal';
import CampsitePanel from './components/CampsitePanel';
import tripDataOriginal from './data/trip.json';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [tripData, setTripData] = useState(tripDataOriginal);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [editMode, setEditMode] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [selectedCampsite, setSelectedCampsite] = useState(null);

  const handleSaveStop = (dayIndex, stopIndex, stopData) => {
    const newTripData = { ...tripData };
    if (stopIndex === -1) {
      // Add new stop
      newTripData.trip.days[dayIndex].stops.push(stopData);
    } else {
      // Edit existing stop
      newTripData.trip.days[dayIndex].stops[stopIndex] = stopData;
    }
    setTripData(newTripData);

    // Download updated JSON
    downloadTripData(newTripData);
  };

  const handleDeleteStop = (dayIndex, stopIndex) => {
    const newTripData = { ...tripData };
    newTripData.trip.days[dayIndex].stops.splice(stopIndex, 1);
    setTripData(newTripData);
    downloadTripData(newTripData);
  };

  const downloadTripData = (data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trip.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditStop = (dayIndex, stopIndex) => {
    setEditingStop({ dayIndex, stopIndex });
  };

  const handleAddStop = (dayIndex) => {
    setEditingStop({ dayIndex, stopIndex: -1 });
  };

  const handleCampsiteClick = (campsite, dayIndex) => {
    setSelectedCampsite({ ...campsite, dayIndex });
  };

  const handleSelectNewCampsite = (newCampsite) => {
    if (selectedCampsite && selectedCampsite.dayIndex !== undefined) {
      const newTripData = { ...tripData };
      newTripData.trip.days[selectedCampsite.dayIndex].overnight = newCampsite;
      setTripData(newTripData);
      downloadTripData(newTripData);
      setSelectedCampsite(null);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{tripData.trip.title}</h1>
        <p>{tripData.trip.days.length} Days · {tripData.trip.start_date}</p>
      </header>
      <div className="app-content">
        <DayList
          days={tripData.trip.days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          editMode={editMode}
          onEditStop={handleEditStop}
          onAddStop={handleAddStop}
          onCampsiteClick={handleCampsiteClick}
        />
        <TripMap
          days={tripData.trip.days}
          selectedDay={selectedDay}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          editMode={editMode}
          onEditModeToggle={() => setEditMode(!editMode)}
        />
      </div>

      {editingStop && (
        <EditStopModal
          stop={editingStop.stopIndex >= 0 ? tripData.trip.days[editingStop.dayIndex].stops[editingStop.stopIndex] : null}
          dayIndex={editingStop.dayIndex}
          stopIndex={editingStop.stopIndex}
          onSave={handleSaveStop}
          onDelete={handleDeleteStop}
          onClose={() => setEditingStop(null)}
        />
      )}

      {selectedCampsite && (
        <CampsitePanel
          currentCampsite={selectedCampsite}
          onClose={() => setSelectedCampsite(null)}
          onSelect={handleSelectNewCampsite}
        />
      )}
    </div>
  );
}

export default App;
