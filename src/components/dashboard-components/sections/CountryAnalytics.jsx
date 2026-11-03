import Chart from 'react-apexcharts';
import { Globe } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { countryData, months } from '../data/mockData';

export default function CountryAnalytics() {
  // Revenue by Country (with flags)
  const barOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    colors: ['#3B82F6', '#10B981'],
    xaxis: { 
      categories: countryData.map(c => `${c.flag} ${c.country}`),
      labels: { formatter: v => `$${(v / 1000000).toFixed(1)}M` } 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: v => `$${(v / 1000).toFixed(0)}K` } },
    yaxis: { labels: { style: { fontSize: '12px' } } }
  };
  const barSeries = [
    { name: 'Revenue', data: countryData.map(c => c.revenue) },
    { name: 'Profit', data: countryData.map(c => c.profit) },
  ];

  // Country Margin Grouped Bar
  const marginOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    xaxis: { categories: countryData.slice(0, 7).map(c => c.country), labels: { rotate: -45, style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: v => `${v}%` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: true, formatter: v => `${v}%`, style: { fontSize: '10px' } },
  };
  const marginSeries = [
    { name: 'Margin %', data: countryData.slice(0, 7).map(c => c.margin) },
    { name: 'Growth %', data: countryData.slice(0, 7).map(c => c.growth) },
    { name: 'Share %', data: countryData.slice(0, 7).map(c => c.share) },
  ];

  // Shipment Trend by Country (multi-line, simulated)
  const trendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    xaxis: { categories: months },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const top5 = countryData.slice(0, 5);
  const trendSeries = top5.map((c, idx) => ({
    name: c.country,
    data: months.map((_, i) => Math.round(c.shipments / 12 * (0.8 + Math.random() * 0.4) + i * (idx % 3))),
  }));

  return (
    <section id="country-analytics" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><Globe size={20} /> Country Analytics</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Revenue by Country" subtitle="All countries — revenue & profit">
          <Chart options={barOpts} series={barSeries} type="bar" height={380} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Country Margin Comparison" subtitle="Margin, growth & revenue share by country">
          <Chart options={marginOpts} series={marginSeries} type="bar" height={300} />
        </ChartCard>
        <ChartCard title="Shipment Trend by Country" subtitle="Top 5 countries monthly shipments">
          <Chart options={trendOpts} series={trendSeries} type="line" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
