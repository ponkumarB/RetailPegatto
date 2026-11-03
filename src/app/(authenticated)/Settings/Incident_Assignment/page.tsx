'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  Search,
  Filter,
  Info,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import {
  fetchIncidentManagementList,
  fetchIncidentAssignmentDashboardCards,
  IncidentManagementModel
} from '@/service/api/Incident/api';

export default function IncidentAssignmentListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [incidents, setIncidents] = useState<IncidentManagementModel[]>([]);
  const [cardsData, setCardsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '72' : '72';

      const [incidentRes, cardsRes] = await Promise.all([
        fetchIncidentManagementList().catch(() => null) as Promise<any>,
        fetchIncidentAssignmentDashboardCards(userId).catch(() => null) as Promise<any>
      ]);

      // Incidents list
      let incidentList: IncidentManagementModel[] = [];
      if (incidentRes && Array.isArray(incidentRes)) {
        incidentList = incidentRes;
      } else if (incidentRes && Array.isArray(incidentRes.data)) {
        incidentList = incidentRes.data;
      } else if (incidentRes && Array.isArray(incidentRes.results)) {
        incidentList = incidentRes.results;
      }
      setIncidents(incidentList.length > 0 ? incidentList : []);

      // Dashboard cards
      if (cardsRes && cardsRes.status && Array.isArray(cardsRes.data)) {
        setCardsData(cardsRes.data);
      } else if (cardsRes && Array.isArray(cardsRes)) {
        setCardsData(cardsRes);
      } else {
        setCardsData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading page details, using mock data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredIncidents = incidents.filter(inc => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (inc.IncidentManagement_Id || '').toLowerCase().includes(q) ||
      (inc.Summary || '').toLowerCase().includes(q) ||
      (inc.Category || '').toLowerCase().includes(q) ||
      (inc.Priority || '').toLowerCase().includes(q)
    );
  });

  // Extract count from API response
  const getCardCount = (metricName: string, fallbackVal: number) => {
    if (!cardsData || !Array.isArray(cardsData) || cardsData.length === 0) return fallbackVal;
    const card = cardsData.find(c => c.Metric === metricName);
    return card ? card.Count : fallbackVal;
  };

  // Style helpers
  const getPriorityStyle = (p?: string) => {
    const val = (p || '').toLowerCase();
    if (val === 'high' || val === 'critical') return 'bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
    if (val === 'medium') return 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
    return 'bg-emerald-50 text-emerald-500 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
  };

  const getStatusStyle = (s?: string) => {
    const val = (s || '').toLowerCase();
    if (val === 'open') return 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200 dark:border-sky-900';
    if (val === 'in progress') return 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] space-y-6 text-left"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[5px] border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-[5px]">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Incident Assignment</h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">Select an incident to route or assign it to a team/agent.</p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-start md:self-center">
          <span>Incident Management</span>
          <span className="mx-1.5">›</span>
          <span className="text-slate-800 dark:text-slate-200">Incident Assignment</span>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Unassigned Incidents', val: getCardCount('unassigned_incidents', 0), icon: Users, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50' },
          { title: 'Assigned Incidents', val: getCardCount('assigned_incidents', 0), icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50' },
          { title: 'Overdue Incidents', val: getCardCount('overdue_incidents', 0), icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50' },
          { title: 'Due Today', val: getCardCount('due_today_incidents', 0), icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-[5px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-[5px] flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{kpi.title}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white my-1">{kpi.val}</p>
              <p className="text-[10px] font-bold text-blue-650 dark:text-blue-400 flex items-center gap-1 cursor-pointer">
                View List <ArrowRight className="h-3 w-3" />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card wrapper */}
      <div className="bg-white dark:bg-slate-900 rounded-[5px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Search Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Incidents</span>
            <Badge variant="secondary" className="rounded-[5px] px-2 py-0.5 text-[10px] font-bold">
              {filteredIncidents.length} Total
            </Badge>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Input 
                placeholder="Search incident ID, summary..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pr-10 text-xs font-semibold border-slate-200 rounded-[5px] dark:border-slate-700 dark:bg-slate-950"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <Button variant="outline" className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-955 dark:border-slate-700 rounded-[5px] text-xs font-bold shadow-sm">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-slate-700 dark:text-slate-300">
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Incident ID</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Summary / Title</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Category</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Priority</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Status</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Assignee</th>
                <th className="p-4 text-[11px] font-extrabold uppercase tracking-wider">Reported On</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      <span className="text-xs font-semibold text-slate-500">Loading incident data...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-semibold text-slate-400">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map(inc => {
                  const assignee = inc.Assigned_Person || inc.Team || '';
                  return (
                    <tr
                      key={inc.id} 
                      onClick={() => router.push(`/Settings/Incident_Assignment/${inc.id}`)}
                      className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-xs font-bold text-blue-600">{inc.IncidentManagement_Id || `INC-${inc.id}`}</td>
                      <td className="p-4 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[280px] truncate" title={inc.Summary}>
                        {inc.Summary}
                      </td>
                      <td className="p-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{inc.Category}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`font-extrabold text-[10px] px-2 py-0.5 rounded-[5px] border ${getPriorityStyle(inc.Priority)}`}>
                          {inc.Priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-[5px] ${getStatusStyle(inc.Status)}`}>
                          {inc.Status}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        {assignee ? (
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span>{assignee}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 text-slate-500 text-[10px] font-bold rounded-[5px]">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {inc.Reported_On ? new Date(inc.Reported_On).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <span>Showing 1 to {filteredIncidents.length} of {filteredIncidents.length} incidents</span>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 rounded-[5px] border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">&lt;</button>
            <button className="h-8 w-8 rounded-[5px] text-white font-bold flex items-center justify-center" style={{ backgroundColor: primaryColor }}>1</button>
            <button className="h-8 w-8 rounded-[5px] border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">&gt;</button>
          </div>
        </div>
      </div>

      {/* Info Notice bar */}
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900 px-4 py-3 rounded-[5px] border border-slate-200 dark:border-slate-800 shadow-sm mt-4 w-max">
        <Info className="h-4 w-4 text-blue-500 shrink-0" />
        <span>
          <span className="text-blue-600 dark:text-blue-400 font-extrabold mr-1">Tip:</span> Click on any incident row in the table to open its dedicated assignment route.
        </span>
      </div>

    </motion.div>
  );
}
