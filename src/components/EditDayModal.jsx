import { useState } from 'react';
import './EditDayModal.css';

function EditDayModal({ day, dayIndex, onSave, onClose }) {
  const [formData, setFormData] = useState({
    date: day.date || '',
    label: day.label || '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(dayIndex, formData);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Day {day.day}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
            <p className="help-text">Change the date for this day of your trip</p>
          </div>

          <div className="form-group">
            <label>Day Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="e.g., Golden Circle, Arrival → Reykjavík"
              required
            />
            <p className="help-text">A brief description of what you'll do this day</p>
          </div>

          <div className="modal-actions">
            <div className="action-buttons">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDayModal;
