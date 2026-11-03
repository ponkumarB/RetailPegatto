'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Info, 
  ArrowUp, 
  ArrowUpRight, 
  Minus, 
  ArrowDownRight, 
  ArrowDown, 
  Sparkles,
  RefreshCw,
  HelpCircle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function DealPredictionSetupPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [isLoading, setIsLoading] = useState(true);

  // Trigger Skeleton loader on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Tabs configuration
  const [activeTab, setActiveTab] = useState('Overview');

  // Prediction Settings States
  const [isTraining, setIsTraining] = useState(false);
  const [enablePrediction, setEnablePrediction] = useState(true);
  const [modelType, setModelType] = useState('AI Based (Recommended)');
  const [visibility, setVisibility] = useState('All Sales Users');
  const [scoreDisplay, setScoreDisplay] = useState('Percentage (0 - 100%)');
  const [updateFrequency, setUpdateFrequency] = useState('Daily');

  // Calculation Settings States
  const [dataSource, setDataSource] = useState('CRM Data (Deals, Activities, Contacts)');
  const [includeHistorical, setIncludeHistorical] = useState(true);
  const [lookbackPeriod, setLookbackPeriod] = useState('18 Months');
  const [minActivities, setMinActivities] = useState('5');

  // Retrain model simulator
  const handleRetrain = () => {
    setIsTraining(true);
    toast.loading('Initializing training datasets...', { id: 'train' });

    setTimeout(() => {
      toast.loading('Analyzing historical win rate regressions...', { id: 'train' });
    }, 1000);

    setTimeout(() => {
      setIsTraining(false);
      toast.success('Model training completed! Accuracy improved to 94.2%', { id: 'train' });
    }, 2500);
  };

  const handleSaveChanges = () => {
    toast.success('Calculation thresholds updated successfully!');
  };

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
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />

            {/* Header Title skeleton */}
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>

            {/* Grid Layout skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* FULL CONTENT VIEW */}
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
                  <BreadcrumbLink onClick={() => router.push('/')} className="cursor-pointer hover:text-slate-600">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-slate-400">Sales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-355">Deal Prediction Setup</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Title / Header block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b dark:border-slate-900">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Deal Prediction Setup</h1>
                <p className="text-muted-foreground text-xs md:text-sm">Configure how deal predictions are calculated and displayed in CRM.</p>
              </div>
              <Button 
                onClick={handleSaveChanges}
                style={{ backgroundColor: primaryColor }} 
                className="h-10 px-6 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-all shadow-xs"
              >
                Save Changes
              </Button>
            </div>

            {/* Tab Menu Horizontal Bar */}
            <div className="border-b dark:border-slate-900 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {['Overview', 'Scoring Model', 'Factors', 'Weightages', 'History'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                      isActive ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-slate-405 dark:text-slate-500'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Tab Panel */}
            {activeTab === 'Overview' && (
              <div className="space-y-6">
                
                {/* Upper Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Prediction Model Card */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-5">
                    <div className="space-y-4 text-left">
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b dark:border-slate-900 pb-2">
                        Prediction Model
                      </h3>
                      <p className="text-[11px] font-semibold text-slate-400">Select and configure the model used to predict deal success.</p>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model Type</label>
                        <select
                          value={modelType}
                          onChange={(e) => setModelType(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                        >
                          <option value="AI Based (Recommended)">AI Based (Recommended)</option>
                          <option value="Rule Based">Rule Based (Static weights)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</label>
                        <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border dark:border-slate-850 font-semibold text-slate-600 dark:text-slate-400 leading-relaxed">
                          Our AI model analyzes deal factors, historical data and trends to predict the likelihood of deal success.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3.5 rounded-xl text-xs font-semibold mt-3 text-left">
                      <div className="flex gap-2">
                        <span className="h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">✓</span>
                        <div className="space-y-0.5">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold block">Model Status: Active</span>
                          <span className="text-[10px] text-slate-405 block">Last trained on 20 May 2024 10:00 AM</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleRetrain}
                        disabled={isTraining}
                        className="h-8.5 rounded-lg border-emerald-200 dark:border-emerald-900 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 gap-1.5 shrink-0 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${isTraining ? 'animate-spin' : ''}`} /> 
                        {isTraining ? 'Training...' : 'Retrain Model'}
                      </Button>
                    </div>
                  </div>

                  {/* Prediction Settings Card */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b dark:border-slate-900 pb-2 text-left">
                      Prediction Settings
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 text-left">Define general settings for deal prediction.</p>
                    
                    <div className="flex items-center justify-between py-1 text-left">
                      <div className="space-y-0.5 font-semibold">
                        <span className="text-xs text-slate-800 dark:text-white font-bold block">Enable Deal Prediction</span>
                        <span className="text-[10px] text-slate-450 block">Deal prediction is active for all pipelines.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnablePrediction(!enablePrediction)}
                        className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          enablePrediction ? 'bg-blue-605' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            enablePrediction ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prediction Visibility</label>
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-semibold"
                        >
                          <option value="All Sales Users">All Sales Users</option>
                          <option value="Managers & Admins Only">Managers & Admins Only</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prediction Score Display</label>
                        <select
                          value={scoreDisplay}
                          onChange={(e) => setScoreDisplay(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-semibold"
                        >
                          <option value="Percentage (0 - 100%)">Percentage (0 - 100%)</option>
                          <option value="Points (0 - 10)">Points (0 - 10)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto Prediction Update</label>
                      <select
                        value={updateFrequency}
                        onChange={(e) => setUpdateFrequency(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-semibold"
                      >
                        <option value="Daily">Daily</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Lower Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Prediction Score Scale Card */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b dark:border-slate-900 pb-2 text-left">
                      Prediction Score Scale
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 text-left">Define the score range and categories used to indicate deal success likelihood.</p>
                    
                    <div className="overflow-hidden border dark:border-slate-900 rounded-xl text-xs font-semibold">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-900 text-slate-450 uppercase text-[10px] tracking-wider">
                            <th className="p-2.5">Range (%)</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5 text-center">Indicator</th>
                            <th className="p-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-900">
                          <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                            <td className="p-2.5 font-mono font-bold">80 - 100</td>
                            <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-extrabold">Highly Likely</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex h-5 w-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 items-center justify-center">
                                <ArrowUp className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">Very high chance of closing successfully</td>
                          </tr>
                          <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                            <td className="p-2.5 font-mono font-bold">60 - 79</td>
                            <td className="p-2.5 text-emerald-500 dark:text-emerald-400 font-bold">Likely</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex h-5 w-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 items-center justify-center">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">High chance of closing successfully</td>
                          </tr>
                          <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                            <td className="p-2.5 font-mono font-bold">40 - 59</td>
                            <td className="p-2.5 text-amber-500 font-bold">Possible</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex h-5 w-5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 items-center justify-center">
                                <Minus className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">Moderate chance of closing</td>
                          </tr>
                          <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                            <td className="p-2.5 font-mono font-bold">20 - 39</td>
                            <td className="p-2.5 text-orange-500 font-bold">Unlikely</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex h-5 w-5 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 items-center justify-center">
                                <ArrowDownRight className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">Low chance of closing</td>
                          </tr>
                          <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-900/20">
                            <td className="p-2.5 font-mono font-bold">0 - 19</td>
                            <td className="p-2.5 text-rose-500 font-bold">Very Unlikely</td>
                            <td className="p-2.5 text-center">
                              <span className="inline-flex h-5 w-5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 items-center justify-center">
                                <ArrowDown className="h-3.5 w-3.5" />
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 dark:text-slate-400">Very low chance of closing</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Data & Calculation Settings Card */}
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b dark:border-slate-900 pb-2 text-left">
                      Data & Calculation Settings
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400 text-left">Configure data sources and calculation preferences.</p>
                    
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Source</label>
                      <select
                        value={dataSource}
                        onChange={(e) => setDataSource(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-semibold"
                      >
                        <option value="CRM Data (Deals, Activities, Contacts)">CRM Data (Deals, Activities, Contacts)</option>
                        <option value="Sales Cloud Log Database">Sales Cloud Log Database</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-1 text-left">
                      <div className="space-y-0.5 font-semibold">
                        <span className="text-xs text-slate-800 dark:text-white font-bold block">Include Closed Won/Lost Data</span>
                        <span className="text-[10px] text-slate-450 block">Use historical outcomes to improve accuracy.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeHistorical(!includeHistorical)}
                        className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          includeHistorical ? 'bg-blue-605' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            includeHistorical ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lookback Period</label>
                        <select
                          value={lookbackPeriod}
                          onChange={(e) => setLookbackPeriod(e.target.value)}
                          className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none font-semibold"
                        >
                          <option value="18 Months">18 Months</option>
                          <option value="12 Months">12 Months</option>
                          <option value="24 Months">24 Months</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Minimum Data for Prediction</label>
                        <Input 
                          placeholder="5" 
                          type="number"
                          value={minActivities} 
                          onChange={(e) => setMinActivities(e.target.value)} 
                          className="h-9.5 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold"
                        />
                        <span className="text-[10px] text-slate-405 font-semibold">Minimum number of activities required.</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* About Deal Prediction Callout */}
                <div className="flex items-start gap-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 text-xs font-semibold text-slate-650 dark:text-slate-400 leading-relaxed text-left">
                  <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-0.5">About Deal Prediction</h4>
                    <span>Deal Prediction in CRM uses AI and machine learning to analyze multiple factors and historical data to predict the likelihood of deal success. Ensure factors, weightages and deal data are up-to-date for accurate predictions.</span>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
