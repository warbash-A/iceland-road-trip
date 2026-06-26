import { useState, useEffect } from 'react';
import campsitesData from '../data/campsites.json';
import './CampsitePanel.css';

function CampsitePanel({ currentCampsite, onClose, onSelect }) {
  const [nearbyCampsites, setNearbyCampsites] = useState([]);

  useEffect(() => {
    if (!currentCampsite) return;

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Find nearby campsites (within 100km)
    const nearby = campsitesData.campsites
      .map(site => ({
        ...site,
        distance: calculateDistance(
          currentCampsite.lat,
          currentCampsite.lng,
          site.lat,
          site.lng
        )
      }))
      .filter(site =>
        site.distance > 0.1 && // Not the same campsite
        site.distance < 100 // Within 100km
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // Top 5 nearest

    setNearbyCampsites(nearby);
  }, [currentCampsite]);

  if (!currentCampsite) return null;

  return (
    <div className="campsite-panel-overlay" onClick={onClose}>
      <div className="campsite-panel" onClick={(e) => e.stopPropagation()}>
        <div className="campsite-panel-header">
          <div>
            <h2>🏕️ Campsite Options</h2>
            <p className="current-campsite">Current: {currentCampsite.name}</p>
          </div>
          <button className="close-panel-btn" onClick={onClose}>×</button>
        </div>

        <div className="campsite-panel-content">
          <div className="current-campsite-details">
            <h3>Selected Campsite</h3>
            <div className="campsite-card selected">
              <div className="campsite-header">
                <strong>{currentCampsite.name}</strong>
                <span className="price">{currentCampsite.price_isk} ISK</span>
              </div>
              {currentCampsite.notes && (
                <p className="notes">{currentCampsite.notes}</p>
              )}
            </div>
          </div>

          {nearbyCampsites.length > 0 && (
            <div className="nearby-campsites">
              <h3>Nearby Alternatives</h3>
              {nearbyCampsites.map(site => (
                <div key={site.id} className="campsite-card">
                  <div className="campsite-header">
                    <div>
                      <strong>{site.name}</strong>
                      <span className="distance">
                        {site.distance.toFixed(1)} km away
                      </span>
                    </div>
                    <span className="price">{site.price_isk} ISK</span>
                  </div>

                  {site.facilities && site.facilities.length > 0 && (
                    <div className="facilities">
                      {site.facilities.map((facility, i) => (
                        <span key={i} className="facility-tag">
                          {facility}
                        </span>
                      ))}
                    </div>
                  )}

                  {site.notes && <p className="notes">{site.notes}</p>}

                  {site.phone && (
                    <p className="contact">
                      📞 <a href={`tel:${site.phone}`}>{site.phone}</a>
                    </p>
                  )}

                  {site.website && (
                    <p className="contact">
                      🌐 <a href={site.website} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </p>
                  )}

                  <button
                    className="select-campsite-btn"
                    onClick={() => onSelect(site)}
                  >
                    Use This Campsite
                  </button>
                </div>
              ))}
            </div>
          )}

          {nearbyCampsites.length === 0 && (
            <div className="no-nearby">
              <p>No nearby campsites found within 100km radius.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CampsitePanel;
