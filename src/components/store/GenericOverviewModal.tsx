import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, LayoutDashboard, Info, Box } from 'lucide-react';

interface GenericOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRow: any;
  title: string;
  icon?: any;
}

export const GenericOverviewModal: React.FC<GenericOverviewModalProps> = ({ 
  isOpen, 
  onClose, 
  activeRow, 
  title, 
  icon: Icon = LayoutDashboard 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { kpis, standardFields, complexFields } = useMemo(() => {
    if (!activeRow) return { kpis: [], standardFields: [], complexFields: [] };

    const keys = Object.keys(activeRow).filter(k => k !== 'id' && !k.startsWith('_'));
    const kpis: { label: string; value: string; isGood?: boolean }[] = [];
    const standardFields: { label: string; value: string }[] = [];
    const complexFields: { label: string; value: any }[] = [];

    // Priority keywords for KPIs
    const kpiKeywords = ['status', 'date', 'total', 'amount', 'price', 'quantity', 'balance'];

    keys.forEach((k) => {
      const val = activeRow[k];
      const label = k.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
      const stringVal = String(val ?? '-');

      if (typeof val === 'object' && val !== null) {
        complexFields.push({ label, value: val });
        return;
      }

      const isKpiCandidate = kpiKeywords.some(kw => k.toLowerCase().includes(kw));
      
      if (isKpiCandidate && kpis.length < 4) {
        const isStatus = k.toLowerCase().includes('status');
        const isGood = isStatus ? (stringVal.toLowerCase() === 'active' || stringVal.toLowerCase() === 'true' || stringVal.toLowerCase() === 'approved') : undefined;
        
        kpis.push({
          label,
          value: isStatus ? (stringVal.toLowerCase() === 'true' ? 'Active' : (stringVal.toLowerCase() === 'false' ? 'Inactive' : stringVal)) : stringVal,
          isGood
        });
      } else {
        standardFields.push({ label, value: stringVal });
      }
    });

    // If we couldn't find enough KPIs, fill with first few standard fields
    while (kpis.length < 4 && standardFields.length > 0) {
      kpis.push(standardFields.shift()!);
    }

    return { kpis, standardFields, complexFields };
  }, [activeRow]);

  if (!activeRow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] w-[90vw] p-0 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950">
        <DialogHeader className="px-6 py-4 pr-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Icon className="h-6 w-6 text-emerald-600" />
            {title} Details
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-50 dark:bg-slate-950">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-auto p-0 mb-6 gap-6">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-2 py-3 text-[15px] font-semibold text-slate-500"
              >
                Overview
              </TabsTrigger>
              {complexFields.length > 0 && (
                <TabsTrigger 
                  value="raw" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600 data-[state=active]:shadow-none px-2 py-3 text-[15px] font-semibold text-slate-500"
                >
                  Raw Data
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-0 outline-none space-y-6">
              {/* Dynamic KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, idx) => (
                  <div key={idx} className={`bg-white dark:bg-slate-900 rounded-xl p-4 border shadow-sm flex flex-col justify-center min-h-[110px] ${kpi.isGood === true ? 'border-emerald-200 dark:border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : (kpi.isGood === false ? 'border-amber-300 dark:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-slate-200 dark:border-slate-800')}`}>
                    <p className="text-[13px] font-semibold text-slate-600 dark:text-slate-400 mb-1 line-clamp-1">{kpi.label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 truncate" title={kpi.value}>{kpi.value}</p>
                    <p className={`text-[11px] font-medium ${kpi.isGood === true ? 'text-emerald-500' : (kpi.isGood === false ? 'text-amber-500' : 'text-blue-500')}`}>
                      {kpi.isGood === true ? 'Active Status' : (kpi.isGood === false ? 'Inactive/Action Required' : 'Detail')}
                    </p>
                  </div>
                ))}
              </div>

              {/* General Information Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">General Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    {standardFields.map((field, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                          <Info className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-400 mb-0.5 line-clamp-1">{field.label}</p>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words">{field.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {complexFields.length > 0 && (
              <TabsContent value="raw" className="mt-0 outline-none space-y-6">
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                   {complexFields.map((field, idx) => (
                      <div key={idx} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{field.label}</h4>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                          <pre>{JSON.stringify(field.value, null, 2)}</pre>
                        </div>
                      </div>
                   ))}
                 </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
