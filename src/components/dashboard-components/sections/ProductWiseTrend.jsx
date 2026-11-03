import Chart from 'react-apexcharts';
import { Package } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { productData, categoryData, slowMoving, months } from '../data/mockData';

const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'];

export default function ProductWiseTrend() {
  // Product Revenue Trend (multi-line, simulated)
  const trendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 3 }, colors,
    xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const top4 = productData.slice(0, 4);
  const trendSeries = top4.map((p, idx) => ({
    name: p.name,
    data: months.map((_, i) => Math.round(p.revenue / 12000 * (0.85 + Math.random() * 0.3) + i * (idx + 1))),
  }));

  // Top Selling Products Vertical Bar
  const barOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    colors: ['#3B82F6', '#10B981'],
    xaxis: { categories: productData.slice(0, 8).map(p => p.name), labels: { rotate: -45, style: { fontSize: '11px' } } },
    yaxis: { labels: { formatter: v => `$${(v / 1000000).toFixed(1)}M` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const barSeries = [
    { name: 'Revenue', data: productData.slice(0, 8).map(p => p.revenue) },
    { name: 'Profit', data: productData.slice(0, 8).map(p => p.profit) },
  ];

  // Category Donut
  const donutOpts = {
    chart: { type: 'donut', fontFamily: 'Inter' },
    labels: categoryData.map(c => c.category), colors,
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, total: { show: true, label: 'Total', formatter: () => '$14.6M' } } } } },
    dataLabels: { enabled: true, formatter: val => `${val.toFixed(1)}%` },
  };

  // Slow Moving Heatmap
  const heatOpts = {
    chart: { type: 'heatmap', toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#EF4444'],
    plotOptions: { heatmap: { radius: 4, enableShades: true, shadeIntensity: 0.5 } },
    dataLabels: { enabled: true, style: { fontSize: '11px' } },
    xaxis: { categories: ['Inventory Days', 'Sales', 'Movement Score', 'Growth %'] },
  };
  const heatSeries = slowMoving.map(p => ({
    name: p.product,
    data: [
      { x: 'Inventory Days', y: p.days },
      { x: 'Sales', y: p.sales },
      { x: 'Movement Score', y: p.movement === 'slow' ? 2 : p.movement === 'moderate' ? 5 : 8 },
      { x: 'Growth %', y: Math.abs(p.decline) },
    ],
  }));

  return (
    <section id="product-wise-trend" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><Package size={20} /> Product Wise Trend</h2>
      </div>

      <div className="charts-row charts-row-2" style={{ marginBottom: 16 }}>
        <ChartCard title="Product Revenue Trend" subtitle="Top 4 products monthly revenue">
          <Chart options={trendOpts} series={trendSeries} type="line" height={300} />
        </ChartCard>
        <ChartCard title="Top Selling Products" subtitle="Revenue & profit by product">
          <Chart options={barOpts} series={barSeries} type="bar" height={300} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Product Category Contribution" subtitle="Revenue share by category">
          <Chart options={donutOpts} series={categoryData.map(c => c.revenue)} type="donut" height={300} />
        </ChartCard>
        <ChartCard title="Slow Moving Products" subtitle="Inventory days, sales & movement score">
          <Chart options={heatOpts} series={heatSeries} type="heatmap" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
