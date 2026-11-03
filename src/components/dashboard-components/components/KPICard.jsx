import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, BarChart3, Percent, FileText, FileCheck, Truck, User, UserCheck } from 'lucide-react';

const IconMap = {
  revenue: { icon: ShoppingBag, color: '#f43f5e', bg: 'bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30', stroke: '#f43f5e', grad: 'colorRevenue' },
  profit: { icon: BarChart3, color: '#10b981', bg: 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30', stroke: '#10b981', grad: 'colorProfit' },
  debit: { icon: FileText, color: '#ef4444', bg: 'bg-red-50/50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30', stroke: '#ef4444', grad: 'colorDebit' },
  invoice: { icon: FileCheck, color: '#f59e0b', bg: 'bg-amber-50/50 border-amber-100 dark:bg-amber-955/20 dark:border-amber-955/30', stroke: '#f59e0b', grad: 'colorInvoice' },
  shipments: { icon: Truck, color: '#8b5cf6', bg: 'bg-purple-50/50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30', stroke: '#8b5cf6', grad: 'colorShipments' },
  customer: { icon: User, color: '#3b82f6', bg: 'bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30', stroke: '#3b82f6', grad: 'colorCustomer' },
  salesman: { icon: UserCheck, color: '#10b981', bg: 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30', stroke: '#10b981', grad: 'colorSalesman' },
};

// Generates custom sparklines depending on the type of metric to look authentic
const getSparklineData = (icon) => {
  switch (icon) {
    case 'revenue':
      return [{ val: 30 }, { val: 45 }, { val: 35 }, { val: 50 }, { val: 40 }, { val: 60 }, { val: 55 }, { val: 70 }];
    case 'debit':
      return [{ val: 50 }, { val: 45 }, { val: 48 }, { val: 38 }, { val: 40 }, { val: 32 }, { val: 35 }, { val: 30 }];
    case 'invoice':
      return [{ val: 30 }, { val: 35 }, { val: 32 }, { val: 45 }, { val: 38 }, { val: 48 }, { val: 42 }, { val: 52 }];
    case 'shipments':
      return [{ val: 45 }, { val: 52 }, { val: 48 }, { val: 60 }, { val: 52 }, { val: 65 }, { val: 58 }, { val: 64 }];
    case 'customer':
      return [{ val: 20 }, { val: 35 }, { val: 25 }, { val: 45 }, { val: 30 }, { val: 50 }, { val: 45 }, { val: 55 }];
    default:
      return [{ val: 25 }, { val: 30 }, { val: 28 }, { val: 35 }, { val: 32 }, { val: 40 }, { val: 36 }, { val: 44 }];
  }
};

export default function KPICard({ title, value, growth, comparison, pending, shipments, subValue, icon }) {
  const isPositive = growth >= 0;
  const iconData = IconMap[icon] || IconMap.revenue;
  const IconComponent = iconData.icon;
  const sparklineData = getSparklineData(icon);

  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between h-[130px] p-4 pb-0 text-left">
      {/* Icon & Title Row */}
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 ${iconData.bg}`}>
          <IconComponent size={20} color={iconData.color} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">{title}</span>
          <span className="text-lg font-black text-slate-805 dark:text-white mt-0.5 block leading-none">{value}</span>
        </div>
      </div>

      {/* Growth/Meta Row */}
      <div className="flex items-center justify-between mt-3 text-[10px] font-bold">
        {growth !== undefined ? (
          <span className={`${isPositive ? 'text-emerald-500' : 'text-red-500'} flex items-center gap-0.5`}>
            {isPositive ? '↗' : '↘'} {Math.abs(growth)}% 
            <span className="text-slate-400 dark:text-slate-500 font-medium ml-1">{comparison}</span>
          </span>
        ) : pending ? (
          <span className="text-red-500">{pending}</span>
        ) : shipments ? (
          <span className="text-amber-500">{shipments}</span>
        ) : subValue ? (
          <span className="text-slate-500 dark:text-slate-400">{subValue}</span>
        ) : (
          <span className="text-slate-400 font-medium">Metric Update</span>
        )}
        <span className="text-slate-400 dark:text-slate-500 font-medium">vs last month</span>
      </div>

      {/* Sparkline Wave */}
      <div className="-mx-4 mt-2 h-12 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={sparklineData} 
            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={iconData.grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={iconData.color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={iconData.color} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={iconData.color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#${iconData.grad})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
