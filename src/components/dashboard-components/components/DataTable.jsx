import { useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import { Download } from 'lucide-react';
import './DataTable.css';

export default function DataTable({ title, columns, data }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
  }, [data, search]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  }), []);

  return (
    <div className="data-table-wrapper">
      <div className="data-table-header">
        <span className="data-table-title">{title}</span>
        <div className="data-table-actions">
          <input className="data-table-search" type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="data-table-export" title="Export (placeholder)">
            <Download size={14} /> Export
          </button>
        </div>
      </div>
      <div className="data-table-grid ag-theme-alpine">
        <AgGridReact
          modules={[AllCommunityModule]}
          rowData={filtered}
          columnDefs={columns}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={15}
          domLayout="normal"
          animateRows={true}
          rowHeight={40}
          headerHeight={40}
        />
      </div>
    </div>
  );
}
