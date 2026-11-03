'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  AlertTriangle,
  Gauge,
  Brain,
  RefreshCw,
  Download,
  PackageSearch,
  PackageOpen,
  PackageX,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#7c3aed',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
];

const mockData = {
  executive_summary: {
    total_inventory_value: { value: 12.5, change: 4.2 },
    total_skus: { value: 4500, change: 1.5 },
    available_stock: { value: 152000, change: -2.1 },
    low_stock_items: { value: 85, change: 12.5 },
    inventory_turnover: { value: 4.8, change: 5.4 }
  },
  inventory_trend: [
    { month: 'Jan', value: 10.2 },
    { month: 'Feb', value: 10.5 },
    { month: 'Mar', value: 11.0 },
    { month: 'Apr', value: 10.8 },
    { month: 'May', value: 11.5 },
    { month: 'Jun', value: 12.0 },
    { month: 'Jul', value: 12.5 },
  ],
  category_breakdown: [
    { name: 'Electronics', value: 5.2 },
    { name: 'Apparel', value: 3.1 },
    { name: 'Home & Kitchen', value: 2.4 },
    { name: 'Beauty', value: 1.2 },
    { name: 'Sports', value: 0.6 }
  ],
  inventory_health: {
    fast_moving: { value: 1250 },
    slow_moving: { value: 850 },
    dead_stock: { value: 120 }
  },
  inventory_aging: [
    { label: '0-30 Days', value: 4.5 },
    { label: '31-60 Days', value: 3.2 },
    { label: '61-90 Days', value: 2.1 },
    { label: '91-180 Days', value: 1.5 },
    { label: '180+ Days', value: 1.2 }
  ],
  low_stock_items: [
    { sku: 'SKU-1001', product_name: 'Wireless Earbuds PRO', warehouse: 'WH-East', available_qty: 12, reorder_level: 50 },
    { sku: 'SKU-2054', product_name: 'Smart Watch Series 5', warehouse: 'WH-West', available_qty: 5, reorder_level: 30 },
    { sku: 'SKU-8022', product_name: 'Ergonomic Desk Chair', warehouse: 'WH-North', available_qty: 2, reorder_level: 15 },
    { sku: 'SKU-4401', product_name: '4K Monitor 27"', warehouse: 'WH-South', available_qty: 8, reorder_level: 25 }
  ],
  overstock_items: [
    { sku: 'SKU-9902', product_name: 'Basic T-Shirt (White)', warehouse: 'WH-Central', available_qty: 1500, overstock_qty: 800 },
    { sku: 'SKU-5544', product_name: 'USB-C Cable 1m', warehouse: 'WH-East', available_qty: 2200, overstock_qty: 1200 },
    { sku: 'SKU-1122', product_name: 'Winter Jacket (L)', warehouse: 'WH-North', available_qty: 450, overstock_qty: 300 }
  ],
  ai_recommendations: [
    { type: 'reorder', title: 'Critical Reorder Required', description: 'Wireless Earbuds PRO are trending above normal sales rate. Stockout predicted in 3 days.', impact: '₹ 1.2 L Revenue Risk' },
    { type: 'clearance', title: 'Initiate Clearance Sale', description: 'Winter Jackets are heavily overstocked for the current season.', impact: '₹ 4.5 L Locked Capital' },
    { type: 'reduce', title: 'Reduce Future Orders', description: 'USB-C Cable demand has dropped by 15% consistently over 3 months.', impact: 'Optimize Inventory' },
    { type: 'reorder', title: 'Stock Redistribution', description: 'Move 50 units of 4K Monitors from WH-Central to WH-South to meet local demand spikes.', impact: 'Reduce Delivery Time' }
  ]
};

const StatCard = ({ title, value, change, icon: Icon, color, suffix = '', unit = '' }) => {
  const isPositive = change > 0;
  
  // Custom logic for isGood (if churn/error/low stock, lower is better)
  const isGood = title.toLowerCase().includes('low stock') ? change < 0 : change > 0;
  const isColorClass = color && (color.startsWith('bg-') || color.includes(' text-'));
  
  const formatValue = () => {
    if (typeof value === 'number') {
      if (title.includes('Value') || unit === 'Cr') return `₹${value.toLocaleString()} Cr`;
      if (title.includes('Available Stock')) return `${(value / 1000).toLocaleString()}K`;
      return value.toLocaleString();
    }
    return value;
  };

  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-slate-950 hover:shadow-md transition-all">
      <CardContent className="p-5 flex items-center justify-between gap-3 h-full">
        <div className="flex flex-col justify-center h-full min-w-0 py-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{title}</p>
          <div className="mt-2 mb-2">
            <h3 className="text-2xl xl:text-[28px] font-bold text-slate-900 dark:text-white leading-none truncate">
              {formatValue()}{unit || ''}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-auto">
            {isPositive ? (
              <ArrowUpRight className={`h-4 w-4 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
            ) : (
              <ArrowDownRight className={`h-4 w-4 shrink-0 ${isGood ? 'text-emerald-500' : 'text-rose-500'}`} />
            )}
            <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${isGood ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
              {Math.abs(change)}% from last month
            </span>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex items-center justify-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${isColorClass ? color : ''}`} style={!isColorClass ? { backgroundColor: `${color}15`, color: color } : {}}>
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AIInventoryDashboard() {
  const { 
    executive_summary: summary, 
    inventory_trend: trendData,
    category_breakdown: categoryData,
    inventory_health: health,
    inventory_aging: agingData,
    low_stock_items: lowStock,
    overstock_items: overstock,
    ai_recommendations: recommendations
  } = mockData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#348169eb] p-6 rounded-2xl text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Inventory Analytics Dashboard
            </h1>
            <p className="text-sm opacity-90 mt-1">
              AI-Powered Real-time Insights | Stock Health Intelligence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 border-0 text-white">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" className="gap-2 bg-white/10 hover:bg-white/20 border-0 text-white">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Inventory Value"
          value={summary.total_inventory_value.value}
          change={summary.total_inventory_value.change}
          icon={Target}
          color="bg-purple-50 dark:bg-purple-950/30 text-purple-600"
        />
        <StatCard
          title="Total SKUs"
          value={summary.total_skus.value}
          change={summary.total_skus.change}
          icon={ShoppingBag}
          color="bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600"
        />
        <StatCard
          title="Available Stock"
          value={summary.available_stock.value}
          change={summary.available_stock.change}
          icon={PackageOpen}
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
        />
        <StatCard
          title="Low Stock Items"
          value={summary.low_stock_items.value}
          change={summary.low_stock_items.change}
          icon={AlertTriangle}
          color="bg-amber-50 dark:bg-amber-950/30 text-amber-600"
        />
        <StatCard
          title="Inventory Turnover"
          value={summary.inventory_turnover.value}
          change={summary.inventory_turnover.change}
          icon={Gauge}
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Value Trend</CardTitle>
            <p className="text-xs text-slate-500">Monthly trend analysis (₹ in Crores)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Value"]} />
                <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory by Category</CardTitle>
            <p className="text-xs text-slate-500">Value distribution (₹ in Crores)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Value"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Health Metrics & Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                <PackageSearch className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">{health.fast_moving.value}</div>
                <div className="text-xs font-medium text-emerald-700/70 mt-1">Fast Moving</div>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                <PackageOpen className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{health.slow_moving.value}</div>
                <div className="text-xs font-medium text-amber-700/70 mt-1">Slow Moving</div>
              </div>
              <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                <PackageX className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-rose-600">{health.dead_stock.value}</div>
                <div className="text-xs font-medium text-rose-700/70 mt-1">Dead Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Inventory Aging (By Value)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agingData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`₹ ${value} Cr`, "Value"]} />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Reorder Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lowStock.map((item) => (
                    <tr key={item.sku} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.product_name}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-bold">{item.available_qty}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Overstock Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-medium">
                  <tr>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3 text-right">Available</th>
                    <th className="px-4 py-3 text-right">Overstock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {overstock.map((item) => (
                    <tr key={item.sku} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.product_name}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{item.available_qty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-amber-600 font-bold">{item.overstock_qty.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="border-purple-200 dark:border-purple-900 shadow-sm overflow-hidden">
        <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-4 flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/50">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-purple-900 dark:text-purple-300">AI-Powered Recommendations</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => {
              const colors: Record<string, string> = {
                reorder: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800',
                reduce: 'border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-rose-800',
                clearance: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20 text-purple-800',
              };
              const colorClass = colors[rec.type] || 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800';

              return (
                <div key={idx} className={`p-4 rounded-xl border-l-4 ${colorClass}`}>
                  <h4 className="font-bold text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs opacity-80 mb-2">{rec.description}</p>
                  <p className="text-xs font-bold opacity-100">Impact: {rec.impact}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
