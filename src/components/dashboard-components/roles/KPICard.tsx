'use client';

import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  growth: string;
  isPositive: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  period: string;
}

export function KPICard({
  title,
  value,
  growth,
  isPositive,
  icon,
  iconBg,
  iconColor,
  period
}: KPICardProps) {
  const formatValue = (valStr: string) => {
    const cleanNumStr = valStr.replace(/[^\d.]/g, '');
    const num = parseFloat(cleanNumStr);
    if (isNaN(num)) return valStr;

    const match = valStr.match(/^([^0-9]*)([0-9,.]+)([^0-9]*)$/);
    if (!match) return valStr;

    const prefix = match[1];
    const suffix = match[3];

    let formatted = '';
    if (num >= 10000000) {
      formatted = `${parseFloat((num / 10000000).toFixed(2))} Cr`;
    } else if (num >= 100000) {
      formatted = `${parseFloat((num / 100000).toFixed(2))} L`;
    } else {
      return valStr;
    }
    return `${prefix}${formatted}${suffix}`;
  };

  const getGrowthDisplay = (growthStr: string) => {
    if (growthStr.toLowerCase().includes('vs')) {
      return growthStr.replace(/vs\s+.*/gi, `vs ${period}`);
    }
    return growthStr;
  };

  return (
    <div
      title={`${title}: ${value} (${growth})`}
      className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-3 md:p-3.5 pr-2.5 shadow-xs transition-all duration-200 hover:shadow-md flex flex-col gap-1.5 min-w-0 w-full"
    >
      <div className="w-full text-left">
        <span className="text-[9px] md:text-[10px] lg:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-tight break-words">
          {title}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        <h3 className="text-xs md:text-base lg:text-lg font-black text-slate-800 dark:text-slate-100 leading-none py-0.5 break-words text-left flex-grow min-w-0">
          {formatValue(value)}
        </h3>
        <div className={`h-7 w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 rounded-xl flex items-center justify-center shrink-0 flex-none ${iconBg} ${iconColor} [&>svg]:h-4 [&>svg]:w-4 md:[&>svg]:h-4.5 md:[&>svg]:w-4.5 lg:[&>svg]:h-5 lg:[&>svg]:w-5`}>
          {icon}
        </div>
      </div>
      <div className="w-full text-left">
        <span className={`text-[9px] md:text-[10px] lg:text-[10.5px] font-extrabold flex flex-wrap items-center gap-1 leading-tight ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
          <span className="w-full">{isPositive ? '↑' : '↓'}</span>
          <span>{getGrowthDisplay(growth)}</span>
        </span>
      </div>
    </div>
  );
}
