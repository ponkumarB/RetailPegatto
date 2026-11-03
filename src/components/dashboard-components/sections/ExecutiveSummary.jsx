import Chart from 'react-apexcharts';

import { LayoutDashboard, MoreHorizontal, TrendingUp, BarChart2, Package, FileText, User } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { kpiData, monthlyRevenue, currencyData, months, topSalesmen, topCustomers, productRevenue, quickInsights, countryRevenueData, currencyMonthly } from '../data/mockData';

import CYvsLY from './CYvsLY';

const chartColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];


function barLabel(item, context) {
  if ((item.value ?? 0) > 10) {
    return 'High';
  }
  return context.bar.height < 30 ? null : `${item.value?.toFixed(1)}M`;
}

export default function ExecutiveSummary() {

  const currentMonthIndex = 5; // Jan to May
  const cyRevenueTruncated = monthlyRevenue.cy.revenue.slice(0, currentMonthIndex);

  const revenueTrendSeries = [
    { name: 'USD', data: currencyMonthly.USD.slice(0, currentMonthIndex).map(v => v / 100) },
    { name: 'EUR', data: currencyMonthly.EUR.slice(0, currentMonthIndex).map(v => v / 100) },
    { name: 'GBP', data: currencyMonthly.GBP.slice(0, currentMonthIndex).map(v => v / 100) },
    { name: 'INR', data: currencyMonthly.INR.slice(0, currentMonthIndex).map(v => v / 100) },
  ];

  const revenueTrendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: {
      width: [2, 2, 2, 2],
      curve: 'smooth'
    },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    markers: { size: [3, 3, 3, 3], strokeWidth: 0, hover: { size: 6 } },
    xaxis: { categories: months, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: {
      min: 0, max: 10, tickAmount: 5,
      labels: { formatter: v => `${v}M` }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      markers: { radius: 12 },
      itemMargin: { horizontal: 5, vertical: 5 }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    tooltip: {
      y: {
        formatter: (v, { seriesIndex }) => {
          const symbols = ['$', '€', '£', '₹'];
          return `${symbols[seriesIndex]}${v}M`;
        }
      }
    },
  };


  // Currency Donut
  const donutOpts = {
    chart: { type: 'donut', fontFamily: 'Inter' },
    labels: currencyData.map(c => c.currency),
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#FBBF24', '#A855F7'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => '$8.75M',
              style: { fontSize: '14px', fontWeight: 500, color: '#64748B' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#1E293B',
              offsetY: -4,
              formatter: () => '$8.75M'
            }
          }
        }
      }
    },
    stroke: { show: false },
  };

  // Product Revenue Trend

  // Product Revenue Trend
  const productTrendOpts = {
    chart: { type: 'line', toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 2, curve: 'smooth' },
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
    markers: { size: 4, strokeWidth: 0, hover: { size: 6 } },
    xaxis: { categories: months, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { min: 0, max: 2.5, tickAmount: 5, labels: { formatter: v => `${v}M` } },
    legend: { position: 'top', horizontalAlign: 'left', markers: { radius: 12 } },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 0 },
    tooltip: { y: { formatter: v => `$${v}M` } },
  };
  const productTrendSeries = [
    { name: 'Product A', data: productRevenue.A },
    { name: 'Product B', data: productRevenue.B },
    { name: 'Product C', data: productRevenue.C },
    { name: 'Product D', data: productRevenue.D },
  ];

  return (
    <section id="executive-summary" className="dashboard-section">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {kpiData.map((kpi) => (
          <KPICard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            growth={kpi.growth}
            comparison={kpi.comparison}
            pending={kpi.pending}
            shipments={kpi.shipments}
            subValue={kpi.subValue}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="charts-grid-2">
        <ChartCard title="Revenue Trend (Monthly)" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <div className="revenue-trend-chart">
            <Chart options={revenueTrendOpts} series={revenueTrendSeries} type="line" height={300} />
          </div>
        </ChartCard>
        <CYvsLY />
        <ChartCard title="Revenue By Currency" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <div className="currency-donut-wrapper">
            <div className="currency-donut-chart">
              <Chart options={donutOpts} series={currencyData.map(c => c.revenue)} type="donut" height={280} />
            </div>
            <div className="currency-legend">
              {currencyData.map((item, index) => (
                <div key={item.currency} className="currency-legend-item">
                  <div className="currency-legend-left">
                    <span className="currency-dot" style={{ backgroundColor: donutOpts.colors[index] }}></span>
                    <span className="currency-code">{item.currency}</span>
                  </div>
                  <div className="currency-legend-right">
                    <span className="currency-share">{item.share.toFixed(1)}%</span>
                    <span className="currency-value">({{ USD: '$', EUR: '€', INR: '₹', AED: 'د.إ', GBP: '£' }[item.currency] || '$'}{item.revenue}M)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
        <ChartCard title="Top 5 Salesman (By Revenue)" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <div className="top-list-container">
            <div className="top-list-header">
              <span>Salesman</span>
              <span>Revenue (USD)</span>
            </div>
            {topSalesmen.map((item) => (
              <div key={item.name} className="top-list-item">
                <span className="top-list-name">{item.name}</span>
                <div className="top-list-bar-group">
                  <div className="top-list-bar-bg">
                    <div className="top-list-bar blue" style={{ width: `${(item.revenue / 1.78) * 100}%` }}></div>
                  </div>
                  <span className="top-list-value">${item.revenue}M</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top 5 Customers (By Revenue)" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <div className="top-list-container">
            <div className="top-list-header">
              <span>Customer</span>
              <span>Revenue (USD)</span>
            </div>
            {topCustomers.map((item) => (
              <div key={item.name} className="top-list-item">
                <span className="top-list-name">{item.name}</span>
                <div className="top-list-bar-group">
                  <div className="top-list-bar-bg">
                    <div className="top-list-bar green" style={{ width: `${(item.revenue / 1.78) * 100}%` }}></div>
                  </div>
                  <span className="top-list-value">${item.revenue}M</span>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Product Revenue Trend (Monthly)" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <Chart options={productTrendOpts} series={productTrendSeries} type="line" height={300} />
        </ChartCard>

        <ChartCard title="Quick Insights">
          <div className="quick-insights-container">
            {quickInsights.map((insight) => {
              const Icon = {
                TrendingUp: TrendingUp,
                BarChart2: BarChart2,
                Package: Package,
                FileText: FileText,
                User: User
              }[insight.icon];

              return (
                <div key={insight.id} className="quick-insight-item">
                  <div className={`insight-icon-circle ${insight.color}`}>
                    <Icon size={18} />
                  </div>
                  <span className="insight-text">{insight.text}</span>
                </div>
              );
            })}
          </div>
        </ChartCard>

        <ChartCard title="Revenue By Country" actions={<MoreHorizontal size={20} className="text-muted" />}>
          <div className="country-revenue-container only-table">
            <div className="country-list-block">
              <div className="country-list-header">
                <span>Country</span>
                <span>Revenue (USD)</span>
              </div>
              {countryRevenueData.map((item) => (
                <div key={item.country} className="country-list-row">
                  <span>{item.country}</span>
                  <span className="font-bold">${item.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </section>
  );
}
