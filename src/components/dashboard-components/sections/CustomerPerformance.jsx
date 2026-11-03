import Chart from 'react-apexcharts';
import { Users } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { customerData, retentionTrend, months } from '../data/mockData';

export default function CustomerPerformance() {
  // Top Customers Horizontal Bar
  const topOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } },
    colors: ['#3B82F6', '#10B981'],
    xaxis: { 
      categories: customerData.map(c => c.name),
      labels: { formatter: v => `$${(v / 1000000).toFixed(1)}M` } 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    yaxis: { labels: { style: { fontSize: '12px' } } }
  };
  const topSeries = [
    { name: 'Revenue', data: customerData.map(c => c.revenue) },
    { name: 'Profit', data: customerData.map(c => c.profit) },
  ];

  // Bubble Chart (Profitability Matrix)
  const bubbleOpts = {
    chart: { type: 'bubble', toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#A855F7'],
    xaxis: { title: { text: 'Revenue ($K)' }, labels: { formatter: v => `${(v / 1000).toFixed(0)}K` } },
    yaxis: { title: { text: 'Margin %' }, labels: { formatter: v => `${v}%` } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    fill: { opacity: 0.7 },
  };
  const bubbleSeries = customerData.map(c => ({
    name: c.name,
    data: [[c.revenue, c.margin, c.orders]],
  }));

  // Retention Line
  const retOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6'],
    xaxis: { categories: months },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const retSeries = [
    { name: 'Active', data: retentionTrend.active },
    { name: 'Repeat', data: retentionTrend.repeat },
    { name: 'Lost', data: retentionTrend.lost },
    { name: 'Retention %', data: retentionTrend.rate },
  ];

  return (
    <section id="customer-performance" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><Users size={20} /> Customer Performance</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Top Customers" subtitle="Revenue & profit by customer">
          <Chart options={topOpts} series={topSeries} type="bar" height={380} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Customer Profitability Matrix" subtitle="Revenue vs margin (bubble size = orders)">
          <Chart options={bubbleOpts} series={bubbleSeries} type="bubble" height={300} />
        </ChartCard>
        <ChartCard title="Customer Retention" subtitle="Active, repeat, lost customers & retention rate">
          <Chart options={retOpts} series={retSeries} type="line" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
