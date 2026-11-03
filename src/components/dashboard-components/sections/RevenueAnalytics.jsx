import Chart from 'react-apexcharts';
import { TrendingUp } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { monthlyRevenue, quarterlyData, months, quarters, categoryData, productData } from '../data/mockData';

const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'];

export default function RevenueAnalytics() {
  // Monthly Revenue Trend (multi-line)
  const trendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: [3, 3, 2, 2, 2], curve: 'smooth', dashArray: [0, 0, 0, 5, 0] },
    colors, xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const trendSeries = [
    { name: 'Revenue', data: monthlyRevenue.cy.revenue },
    { name: 'Profit', data: monthlyRevenue.cy.profit },
    { name: 'Margin %', data: monthlyRevenue.cy.margin },
    { name: 'Target', data: monthlyRevenue.target },
    { name: 'Forecast', data: monthlyRevenue.cy.revenue.map((v, i) => i >= 9 ? Math.round(v * 1.05) : null) },
  ];

  // Quarterly Stacked Bar
  const qOpts = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { borderRadius: 4 } },
    colors, xaxis: { categories: quarters },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const qSeries = Object.entries(quarterlyData.byCategory).map(([name, data]) => ({ name, data }));

  // Revenue Growth Area
  const growthData = monthlyRevenue.cy.revenue.map((v, i) => i === 0 ? 0 : +((v - monthlyRevenue.cy.revenue[i-1]) / monthlyRevenue.cy.revenue[i-1] * 100).toFixed(1));
  const growthOpts = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 2 }, colors: ['#3B82F6'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `${v}%` } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    annotations: {
      yaxis: [{ y: 0, borderColor: '#EF4444', strokeDashArray: 0, borderWidth: 1, label: { text: 'Baseline', style: { color: '#EF4444', background: 'transparent' } } }],
    },
  };

  // Product Category Treemap
  const treemapOpts = {
    chart: { type: 'treemap', toolbar: { show: false }, fontFamily: 'Inter' },
    colors, legend: { show: false },
    plotOptions: { treemap: { distributed: true, enableShades: false } },
    dataLabels: { enabled: true, style: { fontSize: '13px' }, formatter: (text, op) => `${text}: $${(op.value/1000000).toFixed(1)}M` },
  };
  const treemapSeries = [{ data: productData.map(p => ({ x: p.name, y: p.revenue })) }];

  return (
    <section id="revenue-analytics" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><TrendingUp size={20} /> Revenue Analytics</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Monthly Revenue Trend" subtitle="Revenue, profit, margin, target & forecast">
          <Chart options={trendOpts} series={trendSeries} type="line" height={350} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2" style={{ marginBottom: 16 }}>
        <ChartCard title="Quarterly Analytics" subtitle="Revenue by product category (stacked)">
          <Chart options={qOpts} series={qSeries} type="bar" height={300} />
        </ChartCard>
        <ChartCard title="Revenue Growth Analysis" subtitle="Month-over-month growth %">
          <Chart options={growthOpts} series={[{ name: 'Growth %', data: growthData }]} type="area" height={300} />
        </ChartCard>
      </div>

      <div className="charts-row charts-full">
        <ChartCard title="Product Category Contribution" subtitle="Revenue distribution by product (treemap)">
          <Chart options={treemapOpts} series={treemapSeries} type="treemap" height={320} />
        </ChartCard>
      </div>
    </section>
  );
}
