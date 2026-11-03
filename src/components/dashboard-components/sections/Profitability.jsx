import Chart from 'react-apexcharts';
import { PieChart } from 'lucide-react';
import ChartCard from '../components/ChartCard';
import { profitTrend, productData, customerData, countryData, lossMaking, months } from '../data/mockData';

export default function Profitability() {
  // Gross Profit Area
  const areaOpts = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#10B981', '#3B82F6'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
    xaxis: { categories: months },
    yaxis: { labels: { formatter: v => `$${v}K` } },
    legend: { position: 'top', horizontalAlign: 'right' },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
  };
  const areaSeries = [
    { name: 'Gross Profit', data: profitTrend.gross },
    { name: 'Net Profit', data: profitTrend.net },
  ];

  // Margin Analysis Horizontal Bar
  const marginOpts = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
    colors: ['#3B82F6', '#10B981', '#F59E0B'],
    xaxis: { 
      categories: productData.slice(0, 6).map(p => p.name),
      labels: { formatter: v => `${v}%` } 
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right' },
    dataLabels: { enabled: true, formatter: v => `${v}%`, style: { fontSize: '11px' } },
    yaxis: { labels: { style: { fontSize: '12px' } } }
  };
  const topProducts = productData.slice(0, 6);
  const marginSeries = [
    { name: 'Product Margin', data: topProducts.map(p => p.margin) },
  ];

  // Loss Making Treemap
  const treemapOpts = {
    chart: { type: 'treemap', toolbar: { show: false }, fontFamily: 'Inter' },
    colors: ['#EF4444', '#F97316', '#F59E0B'],
    legend: { show: false },
    plotOptions: { treemap: { distributed: true, enableShades: false } },
    dataLabels: { enabled: true, style: { fontSize: '12px' }, formatter: (text, op) => `${text}: -$${Math.abs(op.value / 1000).toFixed(1)}K` },
  };
  const treemapSeries = [{ data: lossMaking.map(p => ({ x: p.product, y: Math.abs(p.loss) })) }];

  return (
    <section id="profitability" className="dashboard-section">
      <div className="section-header">
        <h2 className="section-title"><PieChart size={20} /> Profitability</h2>
      </div>

      <div className="charts-row charts-full" style={{ marginBottom: 16 }}>
        <ChartCard title="Gross Profit Trend" subtitle="Monthly gross & net profit">
          <Chart options={areaOpts} series={areaSeries} type="area" height={320} />
        </ChartCard>
      </div>

      <div className="charts-row charts-row-2">
        <ChartCard title="Margin Analysis" subtitle="Profit margin % by top products">
          <Chart options={marginOpts} series={marginSeries} type="bar" height={300} />
        </ChartCard>
        <ChartCard title="Loss Making Products" subtitle="Products with negative profitability">
          <Chart options={treemapOpts} series={treemapSeries} type="treemap" height={300} />
        </ChartCard>
      </div>
    </section>
  );
}
