// ========== ENTERPRISE DASHBOARD MOCK DATA ==========

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

// KPI Summary
export const kpiData = [
  { id: 'revenue', title: 'Total Revenue', value: '$8.75M', growth: 15.6, comparison: 'vs LY', status: 'success', icon: 'revenue' },
  { id: 'debitNotes', title: 'Pending Debit Notes', value: '$245K', pending: '36 Pending', status: 'danger', icon: 'debit' },
  { id: 'invoices', title: 'Pending Invoices', value: '$1.12M', shipments: '128 Shipments', status: 'warning', icon: 'invoice' },
  { id: 'shipments', title: 'Total Shipments', value: '2,342', growth: 12.5, comparison: 'vs LY', status: 'success', icon: 'shipments' },
  { id: 'customer', title: 'Top Customer', value: 'ABC Corp', subValue: '$1.25M', status: 'info', icon: 'customer' },
  { id: 'salesman', title: 'Top Salesman', value: 'John Smith', subValue: '$1.78M', status: 'warning', icon: 'salesman' },
];

// Monthly Revenue & Profit (CY & LY)
export const monthlyRevenue = {
  cy: { revenue: [5.2, 6.0, 7.3, 5.8, 6.1, 7.4, 7.4, 8.5, 5.8, 5.2, 7.1, 7.7], profit: [245,268,290,305,325,275,298,318,340,308,328,355], margin: [25,25.5,25.9,25.8,26,25.5,25.9,26.1,26.2,26.1,26.2,26.3] },
  ly: { revenue: [3.1, 4.0, 4.7, 3.6, 3.5, 4.9, 4.9, 5.5, 4.0, 3.3, 5.0, 5.3], profit: [210,228,245,255,270,235,252,268,285,263,275,298], margin: [24.7,24.8,25,25,25,24.7,24.9,25,25.2,25,25,25.3] },
  target: [6.0, 6.5, 7.5, 7.0, 7.2, 8.0, 8.0, 9.0, 7.0, 6.5, 8.0, 8.5],
};

// Revenue by Country
export const countryRevenueData = [
  { country: 'USA', revenue: '2.45M' },
  { country: 'India', revenue: '1.25M' },
  { country: 'UAE', revenue: '1.05M' },
  { country: 'Germany', revenue: '0.8M' },
  { country: 'UK', revenue: '0.65M' },
  { country: 'Australia', revenue: '0.55M' },
  { country: 'Others', revenue: '1.95M' },
];

// Country Detailed Data
export const countryData = [
  { flag: '🇺🇸', country: 'USA', revenue: 2.45, profit: 0.65, margin: 26.5, growth: 12.4, share: 28.5 },
  { flag: '🇮🇳', country: 'India', revenue: 1.25, profit: 0.35, margin: 28.0, growth: 22.4, share: 14.5 },
  { flag: '🇦🇪', country: 'UAE', revenue: 1.05, profit: 0.28, margin: 26.7, growth: 18.5, share: 12.2 },
  { flag: '🇩🇪', country: 'Germany', revenue: 0.80, profit: 0.21, margin: 26.2, growth: 15.6, share: 9.3 },
  { flag: '🇬🇧', country: 'UK', revenue: 0.65, profit: 0.17, margin: 25.9, growth: 8.2, share: 7.5 },
  { flag: '🇦🇺', country: 'Australia', revenue: 0.55, profit: 0.14, margin: 24.6, growth: 5.4, share: 6.4 },
  { flag: '🌐', country: 'Others', revenue: 1.95, profit: 0.50, margin: 25.6, growth: 9.1, share: 21.6 },
];

// Quick Insights
export const quickInsights = [
  { id: 1, text: 'Revenue increased by 15.6% compared to last year.', type: 'growth', icon: 'TrendingUp', color: 'green' },
  { id: 3, text: '128 shipments are pending invoice generation.', type: 'warning', icon: 'Package', color: 'orange' },
  { id: 4, text: '36 debit notes are pending for raising.', type: 'alert', icon: 'FileText', color: 'red' },
  { id: 5, text: 'John Smith is the top performer with $1.78M revenue.', type: 'info', icon: 'User', color: 'blue' },
];

// Currency Distribution
export const currencyData = [
  { currency: 'USD', revenue: 5.47, share: 62.5 },
  { currency: 'EUR', revenue: 1.38, share: 15.8 },
  { currency: 'INR', revenue: 0.84, share: 9.6 },
  { currency: 'AED', revenue: 0.54, share: 6.2 },
  { currency: 'GBP', revenue: 0.52, share: 5.9 },
];

// Top Performers
export const topSalesmen = [
  { name: 'John Smith', revenue: 1.78 },
  { name: 'Michael Brown', revenue: 1.32 },
  { name: 'David Wilson', revenue: 1.15 },
  { name: 'Robert Johnson', revenue: 0.98 },
  { name: 'William Davis', revenue: 0.76 },
];

export const topCustomers = [
  { name: 'ABC Corp', revenue: 1.25 },
  { name: 'Global Ltd', revenue: 0.95 },
  { name: 'Omega LLC', revenue: 0.85 },
  { name: 'Delta Industries', revenue: 0.65 },
  { name: 'Prime Solutions', revenue: 0.55 },
];

// Exception Monitoring Data
export const exceptionMetrics = {
  debitNote: {
    totalPending: 36,
    pendingAmount: '245K',
    avgAging: '28 Days',
    over30Days: 12,
    trend: [200, 260, 300, 225, 195, 245, 225, 255, 185, 315, 275, 265],
    topCustomers: [
      { name: 'Global Ltd', amount: '68K' },
      { name: 'ABC Corp', amount: '45K' },
      { name: 'Delta Industries', amount: '38K' },
      { name: 'Omega LLC', amount: '32K' },
      { name: 'Prime Solutions', amount: '28K' },
    ]
  },
  shipped: {
    pendingShipments: 128,
    pendingValue: '1.12M',
    avgDelay: '18 Days',
    over30Days: 42,
    trendShipped: [900, 1350, 1650, 1450, 1050, 1200, 1450, 1850, 1350, 900, 1250, 1600],
    trendInvoiced: [650, 850, 1050, 850, 780, 650, 1000, 1150, 950, 420, 700, 850],
    topCountries: [
      { name: 'USA', amount: '320K' },
      { name: 'UAE', amount: '210K' },
      { name: 'India', amount: '180K' },
      { name: 'Germany', amount: '150K' },
      { name: 'UK', amount: '120K' },
    ]
  }
};
export const productRevenue = {
  A: [1.3, 1.5, 1.35, 1.55, 1.7, 1.8, 2.0, 1.2, 1.18, 1.4, 1.75, 1.6],
  B: [0.85, 1.1, 0.9, 0.92, 1.1, 1.25, 1.4, 0.85, 0.75, 1.05, 1.3, 1.1],
  C: [0.6, 0.78, 0.68, 0.7, 0.95, 1.0, 1.1, 0.6, 0.55, 0.8, 0.95, 0.88],
  D: [0.28, 0.32, 0.28, 0.2, 0.4, 0.48, 0.48, 0.22, 0.22, 0.35, 0.45, 0.42],
};
export const fxImpact = [
  { name: 'Base Revenue', value: 12400000 },
  { name: 'USD Gain', value: 180000 },
  { name: 'EUR Loss', value: -95000 },
  { name: 'GBP Gain', value: 62000 },
  { name: 'INR Loss', value: -45000 },
  { name: 'AED Gain', value: 38000 },
  { name: 'Final Revenue', value: 12540000 },
];

// Currency Monthly Trend
export const currencyMonthly = {
  USD: [420,435,450,440,460,448,465,472,480,468,475,490],
  EUR: [248,255,262,258,270,265,275,280,288,278,282,295],
  GBP: [175,180,185,182,190,186,192,195,200,194,198,205],
  INR: [112,118,122,120,125,118,128,130,135,128,132,140],
  AED: [72,75,78,76,80,78,82,84,88,82,85,90],
};

// Debit Note Pending Trend
export const debitNoteTrend = { pending: [35,32,30,28,26,25,28,27,26,25,24,24], resolved: [12,15,18,14,16,20,15,18,16,14,18,20], amount: [280,260,245,230,215,205,225,218,210,200,192,186] };

// Aging Buckets
export const agingData = [
  { bucket: '0-7 Days', count: 8, amount: 45000, severity: 'low' },
  { bucket: '8-15 Days', count: 6, amount: 52000, severity: 'medium' },
  { bucket: '16-30 Days', count: 5, amount: 48000, severity: 'high' },
  { bucket: '30+ Days', count: 5, amount: 41000, severity: 'critical' },
];

// Customer Pending
export const customerPending = [
  { customer: 'Acme Corp', country: 'US', pending: 42000, aging: 22, shipments: 12, severity: 'high' },
  { customer: 'Global Trade Ltd', country: 'UK', pending: 38000, aging: 18, shipments: 8, severity: 'high' },
  { customer: 'TechVision GmbH', country: 'DE', pending: 28000, aging: 15, shipments: 6, severity: 'medium' },
  { customer: 'IndiaExports', country: 'IN', pending: 25000, aging: 12, shipments: 9, severity: 'medium' },
  { customer: 'Pacific Rim Co', country: 'AU', pending: 22000, aging: 28, shipments: 4, severity: 'critical' },
  { customer: 'Desert Trading', country: 'AE', pending: 18000, aging: 8, shipments: 5, severity: 'low' },
  { customer: 'Maple Industries', country: 'CA', pending: 13000, aging: 6, shipments: 3, severity: 'low' },
];

// Country Exceptions Heatmap
export const countryExceptions = [
  { country: 'US', exceptions: 8, shipmentIssues: 5, pendingInvoices: 12, leakage: 45000 },
  { country: 'UK', exceptions: 6, shipmentIssues: 3, pendingInvoices: 8, leakage: 32000 },
  { country: 'DE', exceptions: 4, shipmentIssues: 2, pendingInvoices: 6, leakage: 18000 },
  { country: 'IN', exceptions: 5, shipmentIssues: 4, pendingInvoices: 9, leakage: 28000 },
  { country: 'AE', exceptions: 3, shipmentIssues: 2, pendingInvoices: 5, leakage: 15000 },
  { country: 'FR', exceptions: 2, shipmentIssues: 1, pendingInvoices: 4, leakage: 10000 },
  { country: 'JP', exceptions: 1, shipmentIssues: 1, pendingInvoices: 2, leakage: 6000 },
];

// Invoice Delay Distribution
export const invoiceDelay = [
  { bucket: '0-3 Days', count: 18 },
  { bucket: '4-7 Days', count: 22 },
  { bucket: '8-15 Days', count: 15 },
  { bucket: '15+ Days', count: 12 },
];

// Shipment vs Invoice Trend
export const shipmentInvoiceTrend = {
  shipments: [148,155,162,158,170,165,175,180,188,178,185,195],
  invoices: [140,148,155,150,162,158,168,172,180,170,178,188],
  pending: [8,7,7,8,8,7,7,8,8,8,7,7],
  delayed: [3,4,3,5,4,3,4,5,4,3,4,5],
};

// Salesman Data
export const salesmanData = [
  { name: 'James Wilson', region: 'North America', revenue: 2850000, profit: 755000, orders: 342, margin: 26.5, growth: 15.2, collection: 94 },
  { name: 'Sarah Chen', region: 'APAC', revenue: 2420000, profit: 665000, orders: 298, margin: 27.5, growth: 18.8, collection: 96 },
  { name: 'Michael Brown', region: 'Europe', revenue: 2180000, profit: 572000, orders: 275, margin: 26.2, growth: 12.1, collection: 92 },
  { name: 'Emily Davis', region: 'Middle East', revenue: 1950000, profit: 530000, orders: 248, margin: 27.2, growth: 22.5, collection: 95 },
  { name: 'Robert Taylor', region: 'North America', revenue: 1680000, profit: 428000, orders: 215, margin: 25.5, growth: 8.5, collection: 91 },
  { name: 'Lisa Wang', region: 'APAC', revenue: 1420000, profit: 392000, orders: 188, margin: 27.6, growth: 14.8, collection: 97 },
  { name: 'David Miller', region: 'Europe', revenue: 1150000, profit: 298000, orders: 152, margin: 25.9, growth: 6.2, collection: 89 },
  { name: 'Anna Schmidt', region: 'Europe', revenue: 980000, profit: 268000, orders: 128, margin: 27.3, growth: 10.5, collection: 93 },
];

// Salesman Monthly
export const salesmanMonthly = {
  'James Wilson': [220,235,245,240,255,230,248,260,270,258,265,280],
  'Sarah Chen': [185,198,210,205,220,195,215,225,235,218,228,245],
  'Michael Brown': [168,175,185,180,195,172,188,198,205,192,200,215],
  'Emily Davis': [148,158,168,165,178,155,172,180,190,175,185,198],
};

// Customer Data
export const customerData = [
  { name: 'Acme Corp', country: 'United States', revenue: 1850000, profit: 492000, margin: 26.6, orders: 145, frequency: 12, retention: true, contribution: 14.4 },
  { name: 'Global Trade Ltd', country: 'United Kingdom', revenue: 1420000, profit: 398000, margin: 28.0, orders: 118, frequency: 11, retention: true, contribution: 11.1 },
  { name: 'TechVision GmbH', country: 'Germany', revenue: 1180000, profit: 312000, margin: 26.4, orders: 98, frequency: 10, retention: true, contribution: 9.2 },
  { name: 'IndiaExports', country: 'India', revenue: 980000, profit: 278000, margin: 28.4, orders: 85, frequency: 9, retention: true, contribution: 7.6 },
  { name: 'Pacific Rim Co', country: 'Australia', revenue: 820000, profit: 218000, margin: 26.6, orders: 72, frequency: 8, retention: true, contribution: 6.4 },
  { name: 'Desert Trading', country: 'UAE', revenue: 750000, profit: 205000, margin: 27.3, orders: 65, frequency: 7, retention: true, contribution: 5.8 },
  { name: 'Maple Industries', country: 'Canada', revenue: 580000, profit: 148000, margin: 25.5, orders: 52, frequency: 6, retention: false, contribution: 4.5 },
  { name: 'NexGen Solutions', country: 'Singapore', revenue: 420000, profit: 122000, margin: 29.0, orders: 38, frequency: 5, retention: true, contribution: 3.3 },
  { name: 'Atlas Freight', country: 'France', revenue: 350000, profit: 88000, margin: 25.1, orders: 32, frequency: 4, retention: false, contribution: 2.7 },
  { name: 'Nordic Supply', country: 'Japan', revenue: 280000, profit: 78000, margin: 27.9, orders: 28, frequency: 3, retention: true, contribution: 2.2 },
];

// Customer Retention Trend
export const retentionTrend = { active: [82,85,88,87,90,89,92,91,94,93,95,96], repeat: [65,68,72,70,75,73,78,76,80,79,82,84], lost: [8,6,5,7,4,6,3,5,2,4,3,2], rate: [89,90,91,90,92,91,93,92,94,93,95,96] };

// Product Data
export const productData = [
  { name: 'Industrial Valves', category: 'Engineering', revenue: 2850000, profit: 768000, margin: 26.9, quantity: 4250, growth: 14.2 },
  { name: 'Steel Pipes', category: 'Engineering', revenue: 2280000, profit: 592000, margin: 26.0, quantity: 8500, growth: 11.5 },
  { name: 'Chemical Reagents', category: 'Chemicals', revenue: 1920000, profit: 538000, margin: 28.0, quantity: 12000, growth: 18.8 },
  { name: 'Polymer Resins', category: 'Chemicals', revenue: 1580000, profit: 418000, margin: 26.5, quantity: 6800, growth: 9.2 },
  { name: 'Electronic Components', category: 'Electronics', revenue: 1350000, profit: 392000, margin: 29.0, quantity: 25000, growth: 22.5 },
  { name: 'Copper Wire', category: 'Metals', revenue: 1180000, profit: 295000, margin: 25.0, quantity: 15000, growth: 6.8 },
  { name: 'Precision Bearings', category: 'Engineering', revenue: 980000, profit: 275000, margin: 28.1, quantity: 3200, growth: 12.8 },
  { name: 'Lubricants', category: 'Chemicals', revenue: 750000, profit: 195000, margin: 26.0, quantity: 9500, growth: 5.5 },
  { name: 'Aluminum Sheets', category: 'Metals', revenue: 620000, profit: 155000, margin: 25.0, quantity: 4800, growth: 3.2 },
  { name: 'Capacitors', category: 'Electronics', revenue: 480000, profit: 144000, margin: 30.0, quantity: 18000, growth: 15.5 },
  { name: 'Rubber Gaskets', category: 'Engineering', revenue: 350000, profit: 98000, margin: 28.0, quantity: 22000, growth: 8.2 },
  { name: 'Solvents', category: 'Chemicals', revenue: 280000, profit: 67000, margin: 23.9, quantity: 7500, growth: -2.5 },
];

// Product Category Summary
export const categoryData = [
  { category: 'Engineering', revenue: 6460000, profit: 1733000, margin: 26.8, share: 41.2 },
  { category: 'Chemicals', revenue: 4530000, profit: 1218000, margin: 26.9, share: 28.9 },
  { category: 'Electronics', revenue: 1830000, profit: 536000, margin: 29.3, share: 11.7 },
  { category: 'Metals', revenue: 1800000, profit: 450000, margin: 25.0, share: 11.5 },
];

// Slow Moving Products Heatmap
export const slowMoving = [
  { product: 'Solvents', days: 45, sales: 12, movement: 'slow', decline: -2.5 },
  { product: 'Aluminum Sheets', days: 38, sales: 18, movement: 'slow', decline: 3.2 },
  { product: 'Rubber Gaskets', days: 32, sales: 22, movement: 'moderate', decline: 8.2 },
  { product: 'Lubricants', days: 28, sales: 28, movement: 'moderate', decline: 5.5 },
  { product: 'Copper Wire', days: 25, sales: 35, movement: 'moderate', decline: 6.8 },
];

// Profitability
export const profitTrend = {
  gross: [305,328,350,365,385,335,358,378,400,368,388,415],
  net: [245,268,290,305,325,275,298,318,340,308,328,355],
  growth: [8,7.5,6.7,4.3,5.5,3.2,6.8,5.3,5.8,2.9,6.5,6.9],
};

// Loss Making
export const lossMaking = [
  { product: 'Solvents', loss: -15000, revenue: 280000, impact: -5.4 },
  { product: 'Legacy Connectors', loss: -8500, revenue: 120000, impact: -7.1 },
  { product: 'Old Gasket Model', loss: -5200, revenue: 85000, impact: -6.1 },
];

// Quarterly Data
export const quarterlyData = {
  revenue: [3150, 3510, 3670, 3780],
  profit: [803, 905, 956, 991],
  margin: [25.5, 25.8, 26.0, 26.2],
  byCategory: {
    Engineering: [1280, 1420, 1520, 1620],
    Chemicals: [920, 1010, 1080, 1150],
    Electronics: [380, 420, 460, 510],
    Metals: [370, 410, 430, 450],
  }
};

// Reports Table
export const reportsData = Array.from({ length: 50 }, (_, i) => ({
  id: `INV-${String(10001 + i).padStart(5, '0')}`,
  date: `2024-${String(Math.floor(i / 4) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  customer: customerData[i % customerData.length].name,
  country: customerData[i % customerData.length].country,
  product: productData[i % productData.length].name,
  salesman: salesmanData[i % salesmanData.length].name,
  currency: ['USD','EUR','GBP','INR','AED'][i % 5],
  revenue: Math.round(50000 + Math.random() * 200000),
  profit: Math.round(12000 + Math.random() * 60000),
  margin: +(20 + Math.random() * 10).toFixed(1),
  shipments: Math.floor(1 + Math.random() * 10),
  status: ['Completed','Pending','In Transit','Delayed'][i % 4],
}));
