'use client';
import { getTenantName } from '@/service/apiClient';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Megaphone,
  Users,
  Building2,
  Target,
  TrendingUp,
  ArrowUpRight,
  Layers,
  PhoneCall,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';

const leadSourceData = [
  { name: 'Organic Search', value: 450, color: '#3b82f6' },
  { name: 'Paid Ads', value: 320, color: '#10b981' },
  { name: 'Email Marketing', value: 240, color: '#8b5cf6' },
  { name: 'Social Media', value: 180, color: '#f59e0b' },
  { name: 'Referral', value: 120, color: '#ec4899' },
];

const monthlyTrendData = [
  { month: 'Jan', Leads: 180, Opportunities: 45, Revenue: 25000 },
  { month: 'Feb', Leads: 220, Opportunities: 55, Revenue: 31000 },
  { month: 'Mar', Leads: 250, Opportunities: 68, Revenue: 42000 },
  { month: 'Apr', Leads: 290, Opportunities: 75, Revenue: 49000 },
  { month: 'May', Leads: 340, Opportunities: 90, Revenue: 62000 },
  { month: 'Jun', Leads: 410, Opportunities: 112, Revenue: 78000 },
];

const campaignPerformance = [
  { name: 'Spring Product Launch', type: 'Email + Paid', leads: 245, ROI: '340%', status: 'Active' },
  { name: 'Q2 Tech Webinar', type: 'Webinar', leads: 189, ROI: '210%', status: 'Active' },
  { name: 'Google Search Ads EMEA', type: 'PPC', leads: 312, ROI: '185%', status: 'Active' },
  { name: 'LinkedIn Brand Awareness', type: 'Social Media', leads: 98, ROI: '95%', status: 'Paused' },
];

export default function MarketingDashboardPage() {
  const { primaryColor } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Marketing Dashboard</h1>
          <p className="text-muted-foreground text-sm">Real-time overview of campaign performance, lead generation, and sales pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button style={{ backgroundColor: primaryColor }} className="text-white font-bold gap-2">
            <Megaphone className="h-4 w-4" /> Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-850 dark:text-white">1,690</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +18.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Opportunities</CardTitle>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
              <Target className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-850 dark:text-white">445</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +12.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Campaigns</CardTitle>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
              <Megaphone className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-850 dark:text-white">8</div>
            <p className="text-xs text-slate-500 mt-1">
              3 launching in next 10 days
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline Revenue</CardTitle>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-850 dark:text-white">€247,000</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3" /> +22.8% vs Q1
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-100 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Lead Generation & Pipeline Trend</CardTitle>
            <CardDescription>Monthly conversion stats for leads generated vs opportunity creation.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Bar dataKey="Leads" fill={primaryColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Opportunities" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-855 dark:text-white">Lead Sources</CardTitle>
            <CardDescription>Top channels driving inbound leads.</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] flex flex-col justify-between">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              {leadSourceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns list & Pipeline stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Campaign Performance</CardTitle>
            <CardDescription>ROI and volume stats for live marketing campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500 text-xs font-bold uppercase tracking-wider pb-2">
                    <th className="py-2">Campaign Name</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-center">Leads</th>
                    <th className="py-2 text-center">ROI</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaignPerformance.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{c.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">{c.type}</td>
                      <td className="py-3 text-center font-mono font-semibold">{c.leads}</td>
                      <td className="py-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">{c.ROI}</td>
                      <td className="py-3 text-right">
                        <Badge variant="outline" className={c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Revenue Pipeline by Stage</CardTitle>
            <CardDescription>Opportunities broken down by deal validation stages.</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex flex-col justify-center">
            <div className="space-y-4">
              {[
                { stage: 'Prospecting / Qualification', count: 184, value: '€42,000', pct: 40, color: 'bg-blue-500' },
                { stage: 'Proposal / Quote', count: 142, value: '€95,000', pct: 65, color: 'bg-purple-500' },
                { stage: 'Negotiation', count: 86, value: '€78,000', pct: 85, color: 'bg-amber-500' },
                { stage: 'Won', count: 33, value: '€32,000', pct: 100, color: 'bg-emerald-500' },
              ].map((stage, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{stage.stage} <span className="text-slate-400">({stage.count} deals)</span></span>
                    <span className="font-mono">{stage.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className={`${stage.color} h-full rounded-full`} style={{ width: `${stage.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
