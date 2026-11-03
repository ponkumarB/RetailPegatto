import { useState } from 'react';
import './FilterBar.css';

const filters = [
  { id: 'type', label: 'Type', options: ['All', 'Agency', 'Trading', 'Stores'] },
];

export default function FilterBar({ collapsed, onTypeChange }) {
  const [selected, setSelected] = useState({ type: 'All' });

  const handleChange = (id, value) => {
    const updated = { ...selected, [id]: value };
    setSelected(updated);
    // Update heading immediately on dropdown change
    if (id === 'type' && onTypeChange) onTypeChange(value);
  };

  const handleApply = () => {
    if (onTypeChange) onTypeChange(selected.type);
  };

  const handleClear = () => {
    const reset = { type: 'All' };
    setSelected(reset);
    if (onTypeChange) onTypeChange('All');
  };

  return (
    <div className={`filter-bar${collapsed ? ' sidebar-collapsed' : ''}`}>
      {filters.map(f => (
        <div className="filter-item" key={f.id}>
          <label className="filter-label">{f.label}</label>
          <select
            className="filter-select"
            id={`filter-${f.id}`}
            value={selected[f.id]}
            onChange={e => handleChange(f.id, e.target.value)}
          >
            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
      <div className="filter-actions">
        <button className="filter-btn filter-btn-apply" onClick={handleApply}>Apply</button>
        <button className="filter-btn filter-btn-clear" onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
}
