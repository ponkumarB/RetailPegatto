'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { fetchDealsByPipelineStage, updateDealApi, ApiDeal } from '../../../service/api/deal/api';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Search, BarChart2, DollarSign, TrendingUp, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const STAGES = [
  { id: 'Enquiry', label: 'Enquiry', color: 'bg-blue-50', borderColor: 'border-blue-500' },
  { id: 'Qualifying', label: 'Qualifying', color: 'bg-green-50', borderColor: 'border-green-500' },
  { id: 'Proposal', label: 'Proposal', color: 'bg-orange-50', borderColor: 'border-orange-500' },
  { id: 'Negotiation', label: 'Negotiation', color: 'bg-purple-50', borderColor: 'border-purple-500' }
];

export default function DealPipelinePage() {
  const { user, primaryColor } = useStore();
  const queryClient = useQueryClient();
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggingDealId, setDraggingDealId] = useState<number | null>(null);

  const dealQueries = useQueries({
    queries: STAGES.map(stage => ({
      queryKey: ['deals', 'pipeline', stage.id],
      queryFn: () => fetchDealsByPipelineStage(stage.id),
      staleTime: 60000,
    }))
  });

  const isLoading = dealQueries.some(q => q.isLoading);

  useEffect(() => {
    if (!isLoading && dealQueries.every(q => q.isSuccess)) {
      let allDeals: ApiDeal[] = [];
      dealQueries.forEach(q => {
        if (q.data && Array.isArray(q.data)) {
          allDeals = [...allDeals, ...q.data];
        } else if (q.data && q.data.results && Array.isArray(q.data.results)) {
          allDeals = [...allDeals, ...q.data.results];
        }
      });
      // We only update local state if length or ids changed to prevent resetting optimistic updates 
      // on background refetches, or simply trust local state for fast UI until full refresh
      setDeals(allDeals);
    }
  }, [isLoading, dealQueries.map(q => q.isSuccess).join(',')]);

  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals;
    const lowerQuery = searchQuery.toLowerCase();
    return deals.filter(d => 
      d.Deal_Name?.toLowerCase().includes(lowerQuery) ||
      d.Account_Name?.toLowerCase().includes(lowerQuery)
    );
  }, [deals, searchQuery]);

  // Calculate KPIs
  const totalDeals = filteredDeals.length;
  const totalValue = filteredDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);
  const averageDeal = totalDeals > 0 ? totalValue / totalDeals : 0;
  
  // Win rate logic (mock logic based on stages if won stage exists, else 0 for now)
  const wonDealsCount = filteredDeals.filter(d => d.Deal_Stage?.toLowerCase() === 'won').length;
  const winRate = totalDeals > 0 ? (wonDealsCount / totalDeals) * 100 : 0;

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const grouped: Record<string, ApiDeal[]> = {};
    STAGES.forEach(s => grouped[s.id] = []);
    
    filteredDeals.forEach(deal => {
      // Normalize stage string to match our predefined stages, default to Enquiry if not matching
      const stage = STAGES.find(s => s.id.toLowerCase() === deal.Deal_Stage?.toLowerCase())?.id || 'Enquiry';
      grouped[stage].push(deal);
    });
    return grouped;
  }, [filteredDeals]);

  const handleDragStart = (e: React.DragEvent, dealId: number) => {
    setDraggingDealId(dealId);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires some data to be set
    e.dataTransfer.setData('text/plain', dealId.toString()); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    if (!draggingDealId) return;

    const deal = deals.find(d => d.id === draggingDealId);
    if (!deal) {
      setDraggingDealId(null);
      return;
    }

    // Determine current visual stage
    const currentStage = STAGES.find(s => s.id.toLowerCase() === deal.Deal_Stage?.toLowerCase())?.id || 'Enquiry';

    if (currentStage === newStage) {
      setDraggingDealId(null);
      return; // No change
    }

    // Optimistic UI update
    setDeals(prevDeals => prevDeals.map(d => 
      d.id === draggingDealId ? { ...d, Deal_Stage: newStage } : d
    ));
    setDraggingDealId(null);

    // Backend update
    try {
      await updateDealApi(draggingDealId, { Deal_Stage: newStage });
      toast.success(`Deal moved to ${newStage}`);
      // Invalidate queries so it refetches cleanly in background
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Failed to move deal');
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: ['deals', 'pipeline'] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Deal Pipeline</h1>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Search deals..." 
            className="pl-9 h-9 bg-slate-50 dark:bg-slate-900/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Deals</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalDeals}</h3>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <BarChart2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Average Deal</p>
            <h3 className="text-xl font-bold text-orange-500 dark:text-orange-400">₹{averageDeal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Win Rate</p>
            <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">{winRate.toFixed(0)}%</h3>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1">
        {STAGES.map(stage => {
          const stageDeals = dealsByStage[stage.id];
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.Amount || 0), 0);
          
          return (
            <div 
              key={stage.id} 
              className={cn(
                "flex-shrink-0 w-[280px] rounded-xl overflow-hidden flex flex-col bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800",
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className={cn("p-3 bg-white dark:bg-slate-900 border-b-2 shadow-xs", stage.borderColor)}>
                <h3 className={cn("text-sm font-bold text-slate-700 dark:text-slate-200")}>{stage.label}</h3>
                <p className="text-xs font-bold mt-0.5">₹{stageTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>

              {/* Deals List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[400px]">
                {stageDeals.length === 0 ? (
                  <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg min-h-[100px]">
                    <p className="text-xs text-slate-400 font-medium">Drop deals here</p>
                  </div>
                ) : (
                  stageDeals.map(deal => (
                    <div 
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className={cn(
                        "bg-white dark:bg-slate-900 p-3 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:hover:border-slate-600 transition-colors",
                        draggingDealId === deal.id ? "opacity-50 border-dashed" : ""
                      )}
                    >
                      <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-1.5 leading-snug">{deal.Deal_Name}</h4>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 truncate pr-2">
                          {deal.Account_Name || deal.Lead_Name || 'Unknown Account'}
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                          ₹{(deal.Amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
