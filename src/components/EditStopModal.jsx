import { useState } from 'react';
import './EditStopModal.css';

function EditStopModal({ stop, dayIndex, stopIndex, onSave, onDelete, onClose }) {
  const [formData, setFormData] = useState(stop || {
    name: '',
    type: 'sightseeing',
    lat: 64.0,
    lng: -19.0,
    duration_min: 60,
    drive_from_prev_min: 30,
    notes: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dayIndex, stopIndex, formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{stop ? 'Edit Stop' : 'Add New Stop'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Type</label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="sightseeing">Sightseeing</option>
              <option value="waterfall">Waterfall</option>
              <option value="glacier">Glacier</option>
              <option value="hiking">Hiking</option>
              <option value="hot_spring">Hot Spring</option>
              <option value="geothermal">Geothermal</option>
              <option value="lava">Lava Field</option>
              <option value="grocery">Grocery Store</option>
              <option value="campsite">Campsite</option>
              <option value="airport">Airport</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => handleChange('lat', parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.lng}
                onChange={(e) => handleChange('lng', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                value={formData.duration_min}
                onChange={(e) => handleChange('duration_min', parseInt(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label>Drive time from previous (minutes)</label>
              <input
                type="number"
                value={formData.drive_from_prev_min || 0}
                onChange={(e) => handleChange('drive_from_prev_min', parseInt(e.target.value) || null)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows="4"
            />
          </div>

          <div className="modal-actions">
            {stop && (
              <button
                type="button"
                className="delete-btn"
                onClick={() => {
                  onDelete(dayIndex, stopIndex);
                  onClose();
                }}
              >
                Delete Stop
              </button>
            )}
            <div className="action-buttons">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                {stop ? 'Save Changes' : 'Add Stop'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStopModal;
