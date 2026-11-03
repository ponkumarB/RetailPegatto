import { FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import { reportsData } from '../data/mockData';

const columns = [
  { headerName: 'Invoice ID', field: 'id', width: 130, pinned: 'left' },
  { headerName: 'Date', field: 'date', width: 120 },
  { headerName: 'Customer', field: 'customer', width: 160 },
  { headerName: 'Country', field: 'country', width: 130 },
  { headerName: 'Product', field: 'product', width: 160 },
  { headerName: 'Salesman', field: 'salesman', width: 150 },
  { headerName: 'Currency', field: 'currency', width: 100 },
  { headerName: 'Revenue', field: 'revenue', width: 130, valueFormatter: p => `$${(p.value / 1000).toFixed(1)}K`, cellStyle: { fontFamily: 'var(--font-mono)', fontWeight: 600 } },
  { headerName: 'Profit', field: 'profit', width: 120, valueFormatter: p => `$${(p.value / 1000).toFixed(1)}K`, cellStyle: { fontFamily: 'var(--font-mono)' } },
  { headerName: 'Margin %', field: 'margin', width: 100, valueFormatter: p => `${p.value}%`, cellStyle: { fontFamily: 'var(--font-mono)' } },
  { headerName: 'Shipments', field: 'shipments', width: 110 },
  { headerName: 'Status', field: 'status', width: 120, cellStyle: p => {
    const map = { Completed: '#10B981', Pending: '#F59E0B', 'In Transit': '#3B82F6', Delayed: '#EF4444' };
    return { color: map[p.value] || '#64748B', fontWeight: 600 };
  }},
];

export default function Reports() {
  return (
    <section id="reports" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><FileText size={20} /> Reports</h2>
      </div>
      <DataTable title="Detailed Analytics Report" columns={columns} data={reportsData} />
    </section>
  );
}
