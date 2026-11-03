import Chart from 'react-apexcharts';
import { UserCheck } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { salesmanData, salesmanMonthly, months } from '../data/mockData';

export default function SalesmanPerformance() {
  // Leaderboard Horizontal Bar
  const lbOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    colors: ['#3B82F6', '#10B981'],
    xaxis: { 
      categories: salesmanData.map(s => s.name),
      labels: { formatter: v => `$${(v / 1000000).toFixed(1)}M` } 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    tooltip: { y: { formatter: v => `$${(v / 1000).toFixed(0)}K` } },
    yaxis: { labels: { style: { fontSize: '12px' } } }
  };
  const lbSeries = [
    { name: 'Revenue', data: salesmanData.map(s => s.revenue) },
    { name: 'Profit', data: salesmanData.map(s => s.profit) },
  ];

  // Monthly Sales Trend (multi-line)
  const trendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const trendSeries = Object.entries(salesmanMonthly).map(([name, data]) => ({ name, data }));

  // Scatter/Bubble
  const bubbleOpts = {
    chart: { type: 'bubble', toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
    xaxis: { title: { text: 'Revenue ($K)' }, labels: { formatter: v => `${(v / 1000).toFixed(0)}K` } },
    yaxis: { title: { text: 'Profit ($K)' }, labels: { formatter: v => `${(v / 1000).toFixed(0)}K` } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    fill: { opacity: 0.7 },
  };
  const bubbleSeries = salesmanData.map(s => ({
    name: s.name,
    data: [[s.revenue, s.profit, s.orders]],
  }));

  return (
    <section id="salesman-performance" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><UserCheck size={20} /> Salesman Performance</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Salesman Leaderboard" subtitle="Revenue & profit by salesman">
          <Chart options={lbOpts} series={lbSeries} type="bar" height={350} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Monthly Sales Trend" subtitle="Top 4 salesmen monthly revenue">
          <Chart options={trendOpts} series={trendSeries} type="line" height={300} />
        </ChartCard>
        <ChartCard title="Revenue vs Profit Analysis" subtitle="Bubble size = order count">
          <Chart options={bubbleOpts} series={bubbleSeries} type="bubble" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
