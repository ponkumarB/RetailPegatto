import Chart from 'react-apexcharts';
import { DollarSign } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { currencyMonthly, currencyData, fxImpact, months } from '../data/mockData';

const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];

export default function CurrencyWiseTrend() {
  // Stacked Area
  const areaOpts = {
    chart: { type: 'area', stacked: true, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 2 }, colors,
    fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0.1 } },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const areaSeries = Object.entries(currencyMonthly).map(([name, data]) => ({ name, data }));

  // Donut
  const donutOpts = {
    chart: { type: 'donut', fontFamily: 'Inter' },
    labels: currencyData.map(c => c.currency), colors,
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total Revenue', formatter: () => '$12.84M' } } } } },
    dataLabels: { enabled: true, formatter: val => `${val.toFixed(1)}%` },
  };

  // FX Waterfall (simulated with bar)
  const fxEntries = fxImpact.filter(f => f.name !== 'Base Revenue' && f.name !== 'Final Revenue');
  const fxOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '50%', colors: { ranges: [{ from: -1000000, to: 0, color: '#EF4444' }, { from: 0, to: 1000000, color: '#10B981' }] } } },
    xaxis: { categories: fxEntries.map(f => f.name) },
    yaxis: { labels: { formatter: v => `$${(v / 1000).toFixed(0)}K` } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: true, formatter: v => `${v > 0 ? '+' : ''}$${(v / 1000).toFixed(0)}K`, style: { fontSize: '11px' } },
  };

  return (
    <section id="currency-wise-trend" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><DollarSign size={20} /> Currency Wise Trend</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Currency Revenue Trend" subtitle="Monthly revenue by currency (stacked area)">
          <Chart options={areaOpts} series={areaSeries} type="area" height={350} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Currency Contribution" subtitle="Revenue distribution by currency">
          <Chart options={donutOpts} series={currencyData.map(c => c.revenue)} type="donut" height={300} />
        </ChartCard>
        <ChartCard title="FX Impact Analysis" subtitle="Exchange rate gain/loss by currency">
          <Chart options={fxOpts} series={[{ name: 'FX Impact', data: fxEntries.map(f => f.value) }]} type="bar" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
