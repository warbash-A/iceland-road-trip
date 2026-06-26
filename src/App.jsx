import { useState } from 'react';
import DayList from './components/DayList';
import TripMap from './components/TripMap';
import EditStopModal from './components/EditStopModal';
import EditDayModal from './components/EditDayModal';
import CampsitePanel from './components/CampsitePanel';
import QuickNav from './components/QuickNav';
import NextStop from './components/NextStop';
import tripDataOriginal from './data/trip.json';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  console.log('🇮🇸 Iceland Road Trip App v2.0 - Mobile Optimized', {
    days: tripDataOriginal?.trip?.days?.length,
    startDate: tripDataOriginal?.trip?.start_date
  });
  const [tripData, setTripData] = useState(tripDataOriginal);
  const [selectedDay, setSelectedDay] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [editMode, setEditMode] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
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

  const handleEditDay = (dayIndex) => {
    setEditingDay(dayIndex);
  };

  const handleSaveDay = (dayIndex, dayData) => {
    const newTripData = { ...tripData };
    newTripData.trip.days[dayIndex].date = dayData.date;
    newTripData.trip.days[dayIndex].label = dayData.label;
    setTripData(newTripData);
    downloadTripData(newTripData);
  };

  const handleNavigate = (stop) => {
    // Open in Google Maps or Apple Maps depending on device
    const lat = stop.lat;
    const lng = stop.lng;
    const name = encodeURIComponent(stop.name);

    // Detect iOS vs Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;

    window.open(url, '_blank');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1>{tripData.trip.title}</h1>
          <span style={{
            background: '#10b981',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.625rem',
            fontWeight: '700'
          }}>MOBILE v2.0</span>
        </div>
        <p>{tripData.trip.days.length} Days · {tripData.trip.start_date}</p>
      </header>
      <div className={`app-content ${editMode ? 'edit-mode' : ''}`}>
        <DayList
          days={tripData.trip.days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          editMode={editMode}
          onEditStop={handleEditStop}
          onAddStop={handleAddStop}
          onEditDay={handleEditDay}
          onCampsiteClick={handleCampsiteClick}
          onNavigate={handleNavigate}
        />
        {!editMode && (
          <TripMap
            days={tripData.trip.days}
            selectedDay={selectedDay}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            editMode={editMode}
            onEditModeToggle={() => setEditMode(!editMode)}
          />
        )}
        {editMode && (
          <div className="edit-mode-panel">
            <div className="edit-mode-header">
              <h2>✏️ Edit Mode</h2>
              <p>Make changes to your itinerary</p>
            </div>
            <div className="edit-mode-actions">
              <button className="done-editing-btn" onClick={() => setEditMode(false)}>
                ✓ Done Editing
              </button>
            </div>
            <div className="edit-mode-tips">
              <h3>What you can do:</h3>
              <ul>
                <li>📅 Edit day dates and labels</li>
                <li>✏️ Edit stop details</li>
                <li>➕ Add new stops</li>
                <li>🗑️ Delete stops</li>
                <li>🏕️ Change campsites</li>
              </ul>
            </div>
          </div>
        )}
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

      {editingDay !== null && (
        <EditDayModal
          day={tripData.trip.days[editingDay]}
          dayIndex={editingDay}
          onSave={handleSaveDay}
          onClose={() => setEditingDay(null)}
        />
      )}

      {selectedCampsite && (
        <CampsitePanel
          currentCampsite={selectedCampsite}
          onClose={() => setSelectedCampsite(null)}
          onSelect={handleSelectNewCampsite}
        />
      )}

      {!editMode && (
        <>
          <NextStop
            day={tripData.trip.days.find(d => d.day === selectedDay)}
            onNavigate={handleNavigate}
          />

          <QuickNav
            currentDay={selectedDay}
            totalDays={tripData.trip.days.length}
            onDayChange={setSelectedDay}
            tripStartDate={tripData.trip.start_date}
          />
        </>
      )}
    </div>
  );
}

export default App;
