'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  RefreshCw,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  Building,
  User,
  Mail,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// Safe dynamic import for Recharts to avoid SSR hydration warnings in Next.js
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DealPredictionPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [score, setScore] = useState(78);

  // Trigger Skeleton loader on mount
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const trendData = [
    { date: '20 Apr', prob: 50 },
    { date: '27 Apr', prob: 54 },
    { date: '04 May', prob: 60 },
    { date: '11 May', prob: 70 },
    { date: '18 May', prob: 75 },
    { date: '20 May', prob: 78 }
  ];

  // Refresh prediction simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    toast.loading('Analyzing updated deal activities...', { id: 'predict' });

    setTimeout(() => {
      setScore(81);
      setIsRefreshing(false);
      toast.success('Likelihood updated to 81% (+3%) based on recent Solution Fit improvements!', { id: 'predict' });
    }, 1500);
  };

  // SVG Gauge calculations
  const radius = 70;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // semi-circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* SKELETON LOADING VIEW */}
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Breadcrumb skeleton */}
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />

            {/* Title / Action bar skeleton */}
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2">
                <div className="h-8 w-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
              </div>
            </div>

            {/* Split layout skeletons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs h-60 animate-pulse" />
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs h-80 animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs h-40 animate-pulse" />
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs h-64 animate-pulse" />
              </div>
            </div>
          </motion.div>
        )}

        {/* FULL DASHBOARD VIEW */}
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.push('/Deal')} className="cursor-pointer hover:text-slate-600">Deals</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-slate-405">Acme Corp - CRM Implementation</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Deal Prediction</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header Title & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b dark:border-slate-900">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Deal Prediction
                  </h1>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40 rounded-md font-bold uppercase text-[9px] tracking-wide py-0.5 px-2">
                    Active
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm">AI-powered prediction of deal success based on deal factors and historical data.</p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl gap-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} /> 
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => toast.info('Share panel loaded.')}
                  className="h-9 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs rounded-xl gap-1.5 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800">
                      <MoreHorizontal className="h-4.5 w-4.5 text-slate-500" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800 text-xs font-semibold">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/Settings/deal-prediction-setup')}>
                      Configure Model
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info('Prediction report exported.')}>
                      Export Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Split Page Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {/* Prediction Score gauge card */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    
                    {/* SVG Gauge block */}
                    <div className="flex flex-col items-center py-2 border-r dark:border-slate-900 pr-6">
                      <div className="relative h-36 w-48 flex items-center justify-center">
                        <svg className="absolute top-2 overflow-visible" width="160" height="100" viewBox="0 0 160 80">
                          {/* Gauge Backpath */}
                          <path
                            d="M 10 80 A 70 70 0 0 1 150 80"
                            fill="none"
                            stroke="#e2e8f0"
                            className="dark:stroke-slate-800"
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                          />
                          {/* Active filled path */}
                          <path
                            d="M 10 80 A 70 70 0 0 1 150 80"
                            fill="none"
                            stroke={score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444'}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        
                        {/* Centered value digits */}
                        <div className="text-center mt-12 space-y-0.5">
                          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-850 dark:text-white block font-mono">
                            {score}%
                          </span>
                          <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                            Likely to Win
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold text-center mt-2">
                        This deal has a high probability of closing successfully.
                      </p>
                    </div>

                    {/* Deal Metadata Details */}
                    <div className="space-y-4 text-xs font-semibold">
                      <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Predicted Close Date</span>
                        <span className="text-slate-800 dark:text-white font-bold font-mono">30 Jun 2024</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Deal Value</span>
                        <span className="text-slate-800 dark:text-white font-bold font-mono">₹ 1,250,000</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Pipeline</span>
                        <span className="text-slate-800 dark:text-white font-bold">IT Services</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><Building className="h-3.5 w-3.5" /> Deal Stage</span>
                        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-150 py-0 px-2 rounded uppercase text-[9px] font-bold">
                          Proposal
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-slate-400 font-medium flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Last Updated</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">20 May 2024 10:30 AM</span>
                      </div>
                    </div>

                  </div>

                  {/* Confidence alert box */}
                  <div className="flex items-center gap-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 text-xs font-semibold text-emerald-805 dark:text-emerald-400 text-left mt-5">
                    <span className="h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">✓</span>
                    <span>
                      <strong>Model Confidence: High.</strong> Based on 86% of data completeness and strong factor signals.
                    </span>
                  </div>
                </div>

                {/* Factor Breakdown table Card */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b dark:border-slate-900 pb-2">
                    Factor Breakdown
                  </h3>
                  <div className="overflow-x-auto border dark:border-slate-900 rounded-xl">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-b dark:border-slate-900">
                          <TableHead className="text-xs font-extrabold uppercase text-slate-450 py-3">Factor</TableHead>
                          <TableHead className="text-xs font-extrabold uppercase text-slate-450 py-3">Impact</TableHead>
                          <TableHead className="text-xs font-extrabold uppercase text-slate-450 py-3">Weightage</TableHead>
                          <TableHead className="text-xs font-extrabold uppercase text-slate-450 py-3">Your Score</TableHead>
                          <TableHead className="text-xs font-extrabold uppercase text-slate-450 py-3 text-right pr-6">Weighted Impact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-xs font-semibold">
                        {[
                          { name: 'Customer Need', impact: 'High', weight: '1.5x', score: '8 / 10', wImpact: '1.20', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100' },
                          { name: 'Budget Fit', impact: 'High', weight: '1.5x', score: '7 / 10', wImpact: '1.05', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100' },
                          { name: 'Decision Maker Engagement', impact: 'High', weight: '1.5x', score: '8 / 10', wImpact: '1.20', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100' },
                          { name: 'Timeline', impact: 'Medium', weight: '1.0x', score: '5 / 10', wImpact: '0.50', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100' },
                          { name: 'Competitive Position', impact: 'Medium', weight: '1.0x', score: '4 / 10', wImpact: '0.40', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100' },
                          { name: 'Relationship Strength', impact: 'Low', weight: '0.5x', score: '6 / 10', wImpact: '0.30', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100' },
                          { name: 'Solution Fit', impact: 'High', weight: '1.5x', score: '8 / 10', wImpact: '1.20', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100' },
                        ].map((row, idx) => (
                          <TableRow key={idx} className="border-b last:border-b-0 dark:border-slate-900 hover:bg-slate-50/30">
                            <td className="py-3 font-bold text-slate-800 dark:text-white">{row.name}</td>
                            <td className="py-3">
                              <Badge variant="outline" className={`rounded text-[10px] font-bold py-0.5 px-2 uppercase ${row.badge}`}>
                                {row.impact}
                              </Badge>
                            </td>
                            <td className="py-3 font-mono text-slate-400">{row.weight}</td>
                            <td className="py-3 font-mono">{row.score}</td>
                            <td className="py-3 text-right pr-6 font-mono font-bold text-slate-800 dark:text-white">{row.wImpact}</td>
                          </TableRow>
                        ))}
                        <TableRow className="bg-slate-50/70 dark:bg-slate-900/40 font-bold border-t dark:border-slate-800">
                          <td className="py-3 pl-4 text-slate-800 dark:text-white text-sm" colSpan={4}>Total</td>
                          <td className="py-3 text-right pr-6 text-sm font-mono text-blue-600 dark:text-blue-400 font-extrabold">7.85 / 10 (Normalized)</td>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] font-semibold text-slate-400 text-left pt-1">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>Impact is determined by the importance of the factor. Your score is based on current deal data.</span>
                  </div>
                </div>

              </div>

              {/* Right Column (1/3 width) - Insights, charts & history */}
              <div className="space-y-6">
                
                {/* Key Insights Card */}
                <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-900 pb-2">
                    Key Insights
                  </h3>
                  <ul className="space-y-4 text-[11px] font-semibold text-slate-650 dark:text-slate-400">
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                      <span>Customer Need, Solution Fit and Decision Maker Engagement are driving a positive prediction.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <span>Budget Fit and Timeline have moderate impact on the deal.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 bg-blue-50 dark:bg-blue-950/20 text-blue-605 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                      <span>Strengthen Competitive Position to improve the likelihood.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-5 w-5 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Lightbulb className="h-3.5 w-3.5" />
                      </span>
                      <span>Overall trend for similar deals is 76% win rate.</span>
                    </li>
                  </ul>
                </div>

                {/* Prediction Trend chart card */}
                <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-900 pb-2">
                    Prediction Trend
                  </h3>
                  
                  {/* Recharts chart wrapper */}
                  <div className="w-full flex items-center justify-center pt-2">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis domain={[40, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                            labelStyle={{ fontWeight: 'bold' }} 
                          />
                          <Line type="monotone" dataKey="prob" stroke={primaryColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 1 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[160px] w-full bg-slate-50 dark:bg-slate-900 animate-pulse rounded-xl" />
                    )}
                  </div>
                </div>

                {/* Prediction History Log table card */}
                <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                  <div className="flex justify-between items-center border-b dark:border-slate-900 pb-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455">Prediction History</h3>
                    <span className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => toast.info('Detailed historical ledger')}>
                      View all
                    </span>
                  </div>
                  <div className="overflow-hidden border dark:border-slate-900 rounded-lg text-[10px] font-semibold">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-900 text-slate-400 uppercase text-[8px] tracking-wider">
                          <th className="p-2">Date</th>
                          <th className="p-2">Score</th>
                          <th className="p-2">Change</th>
                          <th className="p-2">Key Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-900">
                        <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                          <td className="p-2 text-slate-500 font-mono">20 May 2024</td>
                          <td className="p-2 font-bold font-mono">78%</td>
                          <td className="p-2 text-emerald-600 font-bold font-mono">+5%</td>
                          <td className="p-2 truncate max-w-[80px]">Solution Fit improved</td>
                        </tr>
                        <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                          <td className="p-2 text-slate-500 font-mono">13 May 2024</td>
                          <td className="p-2 font-bold font-mono">73%</td>
                          <td className="p-2 text-emerald-600 font-bold font-mono">+7%</td>
                          <td className="p-2 truncate max-w-[80px]">Budget Fit improved</td>
                        </tr>
                        <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                          <td className="p-2 text-slate-500 font-mono">06 May 2024</td>
                          <td className="p-2 font-bold font-mono">66%</td>
                          <td className="p-2 text-emerald-600 font-bold font-mono">+4%</td>
                          <td className="p-2 truncate max-w-[80px]">Decision Maker engaged</td>
                        </tr>
                        <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                          <td className="p-2 text-slate-500 font-mono">29 Apr 2024</td>
                          <td className="p-2 font-bold font-mono">62%</td>
                          <td className="p-2 text-slate-400 font-mono">-</td>
                          <td className="p-2 text-slate-400">No significant change</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
