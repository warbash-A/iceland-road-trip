import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';
import './TripMap.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom colored markers with day labels
const createColoredIcon = (color, dayNum) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: ${dayNum ? '24px' : '16px'}; height: ${dayNum ? '24px' : '16px'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: white;">${dayNum || ''}</div>`,
    iconSize: [dayNum ? 24 : 16, dayNum ? 24 : 16],
    iconAnchor: [dayNum ? 12 : 8, dayNum ? 12 : 8],
  });
};

const typeColors = {
  airport: '#6b7280',
  grocery: '#f59e0b',
  sightseeing: '#3b82f6',
  waterfall: '#3b82f6',
  hiking: '#3b82f6',
  geothermal: '#8b5cf6',
  glacier: '#3b82f6',
  lava: '#3b82f6',
  hot_spring: '#8b5cf6',
  campsite: '#10b981'
};

const dayColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

function MapController({ selectedDay, days, viewMode }) {
  const map = useMap();

  useEffect(() => {
    if (viewMode === 'all') {
      // Show all days - fit to all stops
      const allStops = days.flatMap(d => d.stops);
      const allOvernights = days.filter(d => d.overnight).map(d => d.overnight);
      const allPoints = [...allStops, ...allOvernights];

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Show single day
      const day = days.find(d => d.day === selectedDay);
      if (day && day.stops.length > 0) {
        const bounds = L.latLngBounds(
          day.stops.map(s => [s.lat, s.lng])
        );
        if (day.overnight) {
          bounds.extend([day.overnight.lat, day.overnight.lng]);
        }
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedDay, days, map, viewMode]);

  return null;
}

function TripMap({ days, selectedDay, viewMode, onViewModeChange, editMode, onEditModeToggle }) {
  const [routes, setRoutes] = useState({});

  // Fetch routes for all days or just current day
  useEffect(() => {
    const daysToFetch = viewMode === 'all' ? days : days.filter(d => d.day === selectedDay);

    daysToFetch.forEach(day => {
      if (routes[day.day]) return; // Already fetched

      const fetchRoute = async () => {
        const stops = day.stops;
        const routeCoords = [];

        for (let i = 0; i < stops.length - 1; i++) {
          const start = stops[i];
          const end = stops[i + 1];

          try {
            const response = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();

            if (data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              routeCoords.push(...coords);
            }
          } catch (error) {
            console.error('Error fetching route:', error);
          }
        }

        setRoutes(prev => ({ ...prev, [day.day]: routeCoords }));
      };

      fetchRoute();
    });
  }, [days, selectedDay, viewMode, routes]);

  const renderMarkers = () => {
    if (viewMode === 'all') {
      // Show all days with day-numbered markers
      return days.map((day) => (
        <div key={day.day}>
          {day.stops.map((stop, index) => (
            <Marker
              key={`${day.day}-${index}`}
              position={[stop.lat, stop.lng]}
              icon={createColoredIcon(dayColors[(day.day - 1) % dayColors.length], day.day)}
            >
              <Popup>
                <strong>Day {day.day}: {stop.name}</strong>
                <p>{stop.notes}</p>
              </Popup>
            </Marker>
          ))}
          {day.overnight && (
            <Marker
              position={[day.overnight.lat, day.overnight.lng]}
              icon={createColoredIcon(typeColors.campsite)}
            >
              <Popup>
                <strong>🏕️ Day {day.day}: {day.overnight.name}</strong>
                <p>{day.overnight.price_isk} ISK</p>
                <p>{day.overnight.notes}</p>
              </Popup>
            </Marker>
          )}
        </div>
      ));
    } else {
      // Show single day with type-colored markers
      const currentDay = days.find(d => d.day === selectedDay);
      if (!currentDay) return null;

      return (
        <>
          {currentDay.stops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.lat, stop.lng]}
              icon={createColoredIcon(typeColors[stop.type] || '#3b82f6')}
            >
              <Popup>
                <strong>{stop.name}</strong>
                <p>{stop.notes}</p>
              </Popup>
            </Marker>
          ))}

          {currentDay.overnight && (
            <Marker
              position={[currentDay.overnight.lat, currentDay.overnight.lng]}
              icon={createColoredIcon(typeColors.campsite)}
            >
              <Popup>
                <strong>🏕️ {currentDay.overnight.name}</strong>
                <p>{currentDay.overnight.price_isk} ISK</p>
                <p>{currentDay.overnight.notes}</p>
              </Popup>
            </Marker>
          )}
        </>
      );
    }
  };

  const renderRoutes = () => {
    if (viewMode === 'all') {
      // Show all routes in different colors
      return days.map((day) => {
        if (!routes[day.day] || routes[day.day].length === 0) return null;
        return (
          <Polyline
            key={day.day}
            positions={routes[day.day]}
            color={dayColors[(day.day - 1) % dayColors.length]}
            weight={3}
            opacity={0.7}
          />
        );
      });
    } else {
      // Show single day route
      if (!routes[selectedDay] || routes[selectedDay].length === 0) return null;
      return (
        <Polyline
          positions={routes[selectedDay]}
          color="#3b82f6"
          weight={3}
          opacity={0.7}
        />
      );
    }
  };

  return (
    <div className="trip-map">
      <MapContainer
        center={[64.9631, -19.0208]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedDay={selectedDay} days={days} viewMode={viewMode} />

        {renderMarkers()}
        {renderRoutes()}
      </MapContainer>

      <MapControls
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        editMode={editMode}
        onEditModeToggle={onEditModeToggle}
      />
    </div>
  );
}

export default TripMap;
