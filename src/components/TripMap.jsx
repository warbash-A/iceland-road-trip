import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import MapControls from './MapControls';
import { getCachedRoute, cacheRoute } from '../utils/offlineUtils';
import 'leaflet/dist/leaflet.css';
import './TripMap.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Type icons mapping
const typeIcons = {
  airport: '✈️',
  grocery: '🛒',
  sightseeing: '👁️',
  waterfall: '💧',
  hiking: '🥾',
  geothermal: '♨️',
  glacier: '🧊',
  lava: '🌋',
  hot_spring: '♨️',
  campsite: '🏕️'
};

// Custom colored markers with day number and activity icon
const createColoredIconWithEmoji = (color, dayNum, stopType) => {
  const icon = typeIcons[stopType] || '📍';
  return L.divIcon({
    className: 'custom-marker-with-icon',
    html: `
      <div style="display: flex; align-items: center; gap: 2px; background: white; border-radius: 20px; padding: 2px 6px 2px 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); border: 2px solid white;">
        <div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; color: white;">${dayNum}</div>
        <span style="font-size: 16px; line-height: 1;">${icon}</span>
      </div>
    `,
    iconSize: [48, 24],
    iconAnchor: [24, 12],
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

function MapController({ days, selectedDay }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDay) {
      // Zoom to selected day
      const day = days.find(d => d.day === selectedDay);
      if (day && day.stops.length > 0) {
        const points = [...day.stops];
        if (day.overnight) {
          points.push(day.overnight);
        }
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 10 });
      }
    } else {
      // Show all days - fit to all stops
      const allStops = days.flatMap(d => d.stops);
      const allOvernights = days.filter(d => d.overnight).map(d => d.overnight);
      const allPoints = [...allStops, ...allOvernights];

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedDay, days, map]);

  return null;
}

function TripMap({ days, selectedDay, currentLocation, onNavigate, onDaySelect }) {
  const [routes, setRoutes] = useState({});

  // Create custom icon for current location
  const currentLocationIcon = useMemo(() => L.divIcon({
    className: 'current-location-marker',
    html: '<div class="current-location-pulse"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }), []);

  // Fetch routes for all days
  useEffect(() => {
    days.forEach(day => {
      if (routes[day.day]) return; // Already fetched

      const fetchRoute = async () => {
        const stops = day.stops;
        const routeCoords = [];

        for (let i = 0; i < stops.length - 1; i++) {
          const start = stops[i];
          const end = stops[i + 1];

          // Try to get cached route first
          const cached = getCachedRoute(day.day, i, i + 1);
          if (cached && cached.routes && cached.routes[0]) {
            const coords = cached.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            routeCoords.push(...coords);
            continue;
          }

          // If not cached and online, fetch from OSRM
          if (navigator.onLine) {
            try {
              const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
              );
              const data = await response.json();

              if (data.routes && data.routes[0]) {
                // Cache the response
                cacheRoute(day.day, i, i + 1, data);

                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                routeCoords.push(...coords);
              }
            } catch (error) {
              console.error('Error fetching route:', error);
            }
          } else {
            console.warn('Offline and route not cached:', day.day, i, i + 1);
          }
        }

        setRoutes(prev => ({ ...prev, [day.day]: routeCoords }));
      };

      fetchRoute();
    });
  }, [days, routes]);

  const renderMarkers = () => {
    return days.map((day) => (
      <div key={day.day}>
        {day.stops.map((stop, index) => (
          <Marker
            key={`${day.day}-${index}`}
            position={[stop.lat, stop.lng]}
            icon={createColoredIconWithEmoji(dayColors[(day.day - 1) % dayColors.length], day.day, stop.type)}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    color: dayColors[(day.day - 1) % dayColors.length],
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Day {day.day}
                </strong>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{stop.name}</strong>
                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>{stop.notes}</p>
                <button
                  onClick={() => onNavigate(stop)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}
                >
                  🧭 Navigate
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        {day.overnight && (
          <Marker
            position={[day.overnight.lat, day.overnight.lng]}
            icon={createColoredIconWithEmoji(dayColors[(day.day - 1) % dayColors.length], day.day, 'campsite')}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: '0.25rem',
                    color: dayColors[(day.day - 1) % dayColors.length],
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Day {day.day}
                </strong>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>🏕️ {day.overnight.name}</strong>
                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>{day.overnight.price_isk} ISK</p>
                {day.overnight.notes && <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#64748b' }}>{day.overnight.notes}</p>}
                <button
                  onClick={() => onNavigate(day.overnight)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}
                >
                  🧭 Navigate
                </button>
              </div>
            </Popup>
          </Marker>
        )}
      </div>
    ));
  };

  const renderRoutes = () => {
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

        <MapController days={days} selectedDay={selectedDay} />

        {renderMarkers()}
        {renderRoutes()}

        {/* Current location marker */}
        {currentLocation && (
          <>
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            >
              <Popup>
                <strong>📍 Your Location</strong>
                <p>Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
              </Popup>
            </Marker>
            <Circle
              center={[currentLocation.lat, currentLocation.lng]}
              radius={currentLocation.accuracy}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
            />
          </>
        )}
      </MapContainer>

    </div>
  );
}

export default TripMap;
