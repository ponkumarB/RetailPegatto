import Chart from 'react-apexcharts';
import { exceptionMetrics, months } from '../data/mockData';
import './ExceptionMonitoring.css';

export default function ExceptionMonitoring() {
  const { debitNote, shipped } = exceptionMetrics;

  const dnTrendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#EF4444'],
    dataLabels: { 
      enabled: true,
      style: { fontSize: '9px', fontWeight: 700, colors: ['#fff'] },
      background: { enabled: true, foreColor: '#fff', padding: 4, borderRadius: 2, borderWidth: 0, opacity: 1, backgroundColor: '#EF4444' },
      offsetY: -10,
      formatter: v => v
    },
    markers: { size: 4, strokeWidth: 0, colors: ['#EF4444'] },
    xaxis: { categories: months, labels: { style: { fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { 
      title: { text: 'Amount (USD)', style: { fontSize: '10px', fontWeight: 500, color: '#64748B' } },
      labels: { style: { fontSize: '10px' }, formatter: v => `${v}K` }, 
      min: 0, 
      max: 400, 
      tickAmount: 4 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 0, xaxis: { lines: { show: false } } },
    tooltip: { y: { formatter: v => `$${v}K` } },
  };

  const shipTrendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#3B82F6', '#10B981'],
    markers: { size: 4, strokeWidth: 0 },
    xaxis: { categories: months, labels: { style: { fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { fontSize: '10px' } }, min: 0, max: 2000, tickAmount: 4 },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 0 },
    legend: { position: 'top', horizontalAlign: 'center', markers: { radius: 12 }, fontSize: '12px', itemMargin: { horizontal: 10 } },
    tooltip: { shared: true, intersect: false, y: { formatter: v => v ? v.toLocaleString() : v } },
  };

  return (
    <section id="exception-monitoring" className="dashboard-section">
      <h2 className="exception-main-title">Exception Monitoring</h2>

      <div className="exception-grid">
        {/* Debit Note Block */}
        <div className="exception-card red-theme">
          <h3 className="exception-card-title">Debit Note Not Raised</h3>
          
          <div className="exception-mini-kpis">
            <div className="mini-kpi">
              <span className="mini-kpi-label">Total Pending</span>
              <span className="mini-kpi-value blue">{debitNote.totalPending}</span>
            </div>
            <div className="mini-kpi highlighted">
              <span className="mini-kpi-label">Pending Amount</span>
              <span className="mini-kpi-value red">${debitNote.pendingAmount}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-kpi-label">Avg Aging</span>
              <span className="mini-kpi-value red">{debitNote.avgAging}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-kpi-label">&gt; 30 Days</span>
              <span className="mini-kpi-value red">{debitNote.over30Days}</span>
            </div>
          </div>

          <div className="exception-content">
            <div className="exception-chart-block">
              <h4 className="block-subtitle">Pending Debit Notes Trend</h4>
              <Chart options={dnTrendOpts} series={[{ name: 'Amount', data: debitNote.trend }]} type="line" height={200} />
            </div>
            
            <div className="exception-list-block">
              <h4 className="block-subtitle">Top 5 Customers (By Pending Amount)</h4>
              <div className="exception-table">
                <div className="table-header">
                  <span>Customer</span>
                  <span>Pending Amount</span>
                </div>
                {debitNote.topCustomers.map(c => (
                  <div key={c.name} className="table-row">
                    <span>{c.name}</span>
                    <span className="font-bold">${c.amount}</span>
                  </div>
                ))}
              </div>
              <a href="#" className="view-all-link">View All</a>
            </div>
          </div>
        </div>

        {/* Shipment Block */}
        <div className="exception-card blue-theme">
          <h3 className="exception-card-title">Invoiced But Shipment Not Generated</h3>
          
          <div className="exception-mini-kpis">
            <div className="mini-kpi">
              <span className="mini-kpi-label">Pending Shipments</span>
              <span className="mini-kpi-value blue">{shipped.pendingShipments}</span>
            </div>
            <div className="mini-kpi highlighted-blue">
              <span className="mini-kpi-label">Pending Value</span>
              <span className="mini-kpi-value blue">${shipped.pendingValue}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-kpi-label">Avg Delay</span>
              <span className="mini-kpi-value blue">{shipped.avgDelay}</span>
            </div>
            <div className="mini-kpi">
              <span className="mini-kpi-label">&gt; 30 Days</span>
              <span className="mini-kpi-value red">{shipped.over30Days}</span>
            </div>
          </div>

          <div className="exception-content">
            <div className="exception-chart-block">
              <h4 className="block-subtitle">Shipment vs Invoice Trend</h4>
              <Chart 
                options={shipTrendOpts} 
                series={[
                  { name: 'Shipped', data: shipped.trendShipped },
                  { name: 'Invoiced', data: shipped.trendInvoiced }
                ]} 
                type="line" 
                height={200} 
              />
            </div>
            
            <div className="exception-list-block">
              <h4 className="block-subtitle">Top 5 Countries (By Pending Value)</h4>
              <div className="exception-table">
                <div className="table-header">
                  <span>Country</span>
                  <span>Pending Value</span>
                </div>
                {shipped.topCountries.map(c => (
                  <div key={c.name} className="table-row">
                    <span>{c.name}</span>
                    <span className="font-bold">${c.amount}</span>
                  </div>
                ))}
              </div>
              <a href="#" className="view-all-link">View All</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
