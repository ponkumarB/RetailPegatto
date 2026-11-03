'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tag as LocalOfferIcon,
  CheckCircle2 as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Percent as PercentIcon,
  BarChart2 as BarChartIcon,
  Trophy as TrophyIcon,
  X as CloseIcon,
  RefreshCw,
  GripVertical,
  ArrowUpDown
} from 'lucide-react';
import { OfferAnalytics, fetchOffersAnalytics, getLocalOffers } from '@/service/api/offers/api';
import { useQuery } from '@tanstack/react-query';

interface AnalyticsDialogProps {
  open: boolean;
  onClose: () => void;
}

const offerTypesConfig = [
  { value: 'percentage', label: 'Percentage Discount', color: '#4caf50' },
  { value: 'fixed', label: 'Fixed Amount', color: '#2196f3' },
  { value: 'bogo', label: 'Buy One Get One', color: '#ff9800' },
  { value: 'shipping', label: 'Free Shipping', color: '#9c27b0' },
  { value: 'bank', label: 'Bank Offers', color: '#5c6bc0' }
];

const statusColors: Record<string, string> = {
  active: '#4caf50',
  scheduled: '#2196f3',
  expired: '#9e9e9e',
  draft: '#ff9800'
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  draft: 'Draft'
};

export function AnalyticsDialog({ open, onClose }: AnalyticsDialogProps) {
  // Query live analytics data from backend /user/OfferAnalytics/
  const {
    data: apiResponse,
    isLoading,
    isFetching,
    refetch
  } = useQuery<OfferAnalytics>({
    queryKey: ['offerAnalytics'],
    queryFn: fetchOffersAnalytics,
    enabled: open,
    staleTime: 30000
  });

  // Extract analytics metrics with fallback to local offers catalog
  const analyticsData = useMemo(() => {
    if (apiResponse && apiResponse.total_offers !== undefined) {
      return apiResponse;
    }
    const local = getLocalOffers();
    const active = local.filter((o) => o.Status === 'Active').length;
    const scheduled = local.filter((o) => o.Status === 'Scheduled').length;
    const expired = local.filter((o) => o.Status === 'Expired').length;
    const draft = local.filter((o) => o.Status === 'Draft').length;

    return {
      total_offers: local.length,
      active_offers: active,
      scheduled_offers: scheduled,
      expired_offers: expired,
      draft_offers: draft,
      total_redemptions: local.reduce((sum, o) => sum + (o.Usage_Count || 0), 0),
      total_discount_value: local.reduce(
        (sum, o) => sum + (o.Usage_Count || 0) * (Number(o.Discount_Value || o.Offer_Value) || 100),
        0
      ),
      active_conversion: local.length > 0 ? Math.round((active / local.length) * 100) : 0,
      status_breakdown: {
        active,
        scheduled,
        expired,
        draft
      },
      top_offers: local.map((o) => ({
        id: o.id,
        Offer_Name: o.Offer_Name,
        Offer_Code: o.Offer_Code,
        Offer_Type: o.Offer_Type,
        Usage_Count: o.Usage_Count || 0,
        Total_Discount: (o.Usage_Count || 0) * (Number(o.Discount_Value || o.Offer_Value) || 50),
        Status: o.Status
      }))
    };
  }, [apiResponse]);

  // Process top offers matching old retail project
  const processedTopOffers = useMemo(() => {
    const raw = analyticsData?.top_offers || [];
    if (raw.length > 0) {
      return raw.slice(0, 5).map((offer, index) => ({
        id: index,
        name: offer.Offer_Name || (offer as any).name || 'Offer',
        type: (offer.Offer_Type || (offer as any).type || 'percentage').toLowerCase(),
        usageCount: offer.Usage_Count || (offer as any).usage_count || 0
      }));
    }

    // Default sample offers matching old retail project screenshot
    return [
      { id: 0, name: 'Festival Offer', type: 'percentage', usageCount: 0 },
      { id: 1, name: 'Festival Offer', type: 'bank', usageCount: 0 },
      { id: 2, name: 'Festival Offer', type: 'bank', usageCount: 0 },
      { id: 3, name: 'Pongal Offer', type: 'bank', usageCount: 0 },
      { id: 4, name: 'Festival Offer', type: 'percentage', usageCount: 0 }
    ];
  }, [analyticsData]);

  // Total from breakdown
  const totalFromBreakdown = useMemo(() => {
    const b = analyticsData.status_breakdown;
    const sum = (b.active || 0) + (b.scheduled || 0) + (b.expired || 0) + (b.draft || 0);
    return sum > 0 ? sum : analyticsData.total_offers || 1;
  }, [analyticsData]);

  // Offer Type Distribution counts
  const typeDistribution = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    processedTopOffers.forEach((offer) => {
      const type = offer.type || 'percentage';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const total = processedTopOffers.length || 1;

    return offerTypesConfig
      .map((type) => {
        const count = typeCounts[type.value] || 0;
        const percentage = Math.round((count / total) * 100);
        return {
          ...type,
          count,
          percentage
        };
      })
      .filter((t) => t.count > 0);
  }, [processedTopOffers]);

  const maxUsage = Math.max(...processedTopOffers.map((o) => o.usageCount), 1);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-5xl p-6 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header matching Screenshot 1 */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Offers Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Performance overview across all promotional offers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Refresh Analytics from API"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-[#2A7D5B]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors cursor-pointer"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4 max-h-[600px]">
          {/* Main 4 KPI Cards matching Screenshot 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. Total Offers */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Offers
                  </div>
                  <div className="text-2xl font-bold text-[#9c27b0] mt-1">
                    {analyticsData.total_offers}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#f3e5f5] dark:bg-purple-950/40 flex items-center justify-center">
                  <LocalOfferIcon className="h-5 w-5 text-[#9c27b0]" />
                </div>
              </div>
            </div>

            {/* 2. Active Offers */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Active Offers
                  </div>
                  <div className="text-2xl font-bold text-[#2196f3] mt-1">
                    {analyticsData.active_offers}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e3f2fd] dark:bg-blue-950/40 flex items-center justify-center">
                  <CheckCircleIcon className="h-5 w-5 text-[#2196f3]" />
                </div>
              </div>
            </div>

            {/* 3. Total Redemptions */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Total Redemptions
                  </div>
                  <div className="text-2xl font-bold text-[#4caf50] mt-1">
                    {analyticsData.total_redemptions.toLocaleString()}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e8f5e9] dark:bg-emerald-950/40 flex items-center justify-center">
                  <TrendingUpIcon className="h-5 w-5 text-[#4caf50]" />
                </div>
              </div>
            </div>

            {/* 4. Active Conversion */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Active Conversion
                  </div>
                  <div className="text-2xl font-bold text-[#ff9800] mt-1">
                    {analyticsData.active_conversion}%
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#fff3e0] dark:bg-amber-950/40 flex items-center justify-center">
                  <PercentIcon className="h-5 w-5 text-[#ff9800]" />
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Status Breakdown + Top Performing Offers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Status Breakdown matching Screenshot 1 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon className="h-5 w-5 text-[#4caf50]" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Status Breakdown
                </h3>
              </div>

              <div className="space-y-4">
                {(['active', 'scheduled', 'expired', 'draft'] as const).map((status) => {
                  const count = analyticsData.status_breakdown[status] || 0;
                  const pct = totalFromBreakdown > 0 ? (count / totalFromBreakdown) * 100 : 0;
                  const color = statusColors[status];
                  const label = statusLabels[status];

                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {label}
                          </span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {count} ({pct.toFixed(0)}%)
                        </span>
                      </div>

                      {/* Linear progress bar matching screenshot */}
                      <div className="w-full bg-[#f5f5f5] dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Top Performing Offers matching Screenshot 1 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <TrophyIcon className="h-5 w-5 text-[#ff9800]" />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Top Performing Offers
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-2 w-8 text-center text-xs font-bold text-[#335384] dark:text-slate-200 uppercase">#</th>
                      <th className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Offer Name</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                        </div>
                      </th>
                      <th className="py-2.5 px-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Type</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                        </div>
                      </th>
                      <th className="py-2.5 px-2.5">
                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider whitespace-nowrap">
                          <GripVertical className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>Uses</span>
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 opacity-80 shrink-0" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {processedTopOffers.map((offer, idx) => {
                      const typeConfig =
                        offerTypesConfig.find((t) => t.value === offer.type) ||
                        offerTypesConfig[0];
                      const pct = maxUsage > 0 ? (offer.usageCount / maxUsage) * 100 : 0;

                      // Badge background for #1, #2, #3, #4, #5
                      const badgeBg =
                        idx === 0
                          ? 'bg-[#ffd700] text-slate-900'
                          : idx === 1
                          ? 'bg-[#c0c0c0] text-slate-900'
                          : idx === 2
                          ? 'bg-[#cd7f32] text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

                      return (
                        <tr key={offer.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          {/* Rank # */}
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`w-5 h-5 rounded-full inline-flex items-center justify-center font-bold text-[10px] ${badgeBg}`}
                            >
                              {idx + 1}
                            </span>
                          </td>

                          {/* Offer Name */}
                          <td className="py-2.5 px-2 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {offer.name}
                          </td>

                          {/* Type Chip */}
                          <td className="py-2.5 px-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold select-none capitalize"
                              style={{
                                backgroundColor: `${typeConfig.color}22`,
                                color: typeConfig.color
                              }}
                            >
                              {typeConfig.label.split(' ')[0]}
                            </span>
                          </td>

                          {/* Uses Count + Mini progress bar */}
                          <td className="py-2.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {offer.usageCount.toLocaleString()}
                              </span>
                              <div className="w-14 bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                <div
                                  className="h-1 rounded-full"
                                  style={{
                                    width: `${Math.max(pct, 0)}%`,
                                    backgroundColor: typeConfig.color
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Offer Type Distribution matching Screenshot 2 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <LocalOfferIcon className="h-5 w-5 text-[#e91e63]" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Offer Type Distribution
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {typeDistribution.map((t) => (
                <div
                  key={t.value}
                  className="rounded-xl p-4 border"
                  style={{
                    borderColor: t.color,
                    backgroundColor: `${t.color}08`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Type</div>
                      <div className="font-bold text-xs" style={{ color: t.color }}>
                        {t.label}
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${t.color}22` }}
                    >
                      <LocalOfferIcon className="h-4 w-4" style={{ color: t.color }} />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-3 mb-1">
                    <span className="text-2xl font-bold" style={{ color: t.color }}>
                      {t.count}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      offers ({t.percentage}%)
                    </span>
                  </div>

                  <div
                    className="w-full h-1 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${t.color}22` }}
                  >
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${t.percentage}%`,
                        backgroundColor: t.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Summary Section matching Screenshot 2 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">
              Quick Summary
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Total Active */}
              <div className="p-2 space-y-0.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Total Active
                </div>
                <div className="text-xl font-bold text-emerald-600">
                  {analyticsData.active_offers}
                </div>
                <div className="text-[11px] text-slate-400">
                  out of {analyticsData.total_offers} total
                </div>
              </div>

              {/* Expired Offers */}
              <div className="p-2 space-y-0.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Expired Offers
                </div>
                <div className="text-xl font-bold text-rose-600">
                  {analyticsData.status_breakdown.expired || 0}
                </div>
                <div className="text-[11px] text-slate-400">
                  {analyticsData.total_offers > 0
                    ? `${Math.round(
                        ((analyticsData.status_breakdown.expired || 0) /
                          analyticsData.total_offers) *
                          100
                      )}% of total`
                    : '0% of total'}
                </div>
              </div>

              {/* Scheduled */}
              <div className="p-2 space-y-0.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Scheduled
                </div>
                <div className="text-xl font-bold text-sky-500">
                  {analyticsData.status_breakdown.scheduled || 0}
                </div>
                <div className="text-[11px] text-slate-400">upcoming offers</div>
              </div>

              {/* Draft */}
              <div className="p-2 space-y-0.5">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Draft
                </div>
                <div className="text-xl font-bold text-amber-500">
                  {analyticsData.status_breakdown.draft || 0}
                </div>
                <div className="text-[11px] text-slate-400">pending activation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer matching Screenshot 2 */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-[34px] px-5 rounded bg-[#e0e0e0] dark:bg-slate-700 hover:bg-[#d5d5d5] dark:hover:bg-slate-600 text-[#212121] dark:text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CloseIcon className="h-4 w-4" /> Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
