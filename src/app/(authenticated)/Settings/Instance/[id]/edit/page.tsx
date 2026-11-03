'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Info, Eye, EyeOff, Shield, Users, HardDrive, Mail, BarChart, Smartphone, Cloud, Database, FileText, Server, Star, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function EditInstancePage() {
  const router = useRouter();
  const { id } = useParams();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [category, setCategory] = useState('Education');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 text-left"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Instance</h1>
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-wider">
            <span className="text-slate-400">Dashboard</span>
            <span>›</span>
            <span className="text-slate-400">Instances</span>
            <span>›</span>
            <span className="text-blue-600">Edit Instance</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 text-blue-600 border-blue-200 hover:text-blue-700 text-xs font-bold shadow-sm cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Instances
        </Button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Left Form Area */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Section 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-6">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">1</span>
              Instance Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Instance Name <span className="text-rose-500">*</span> <Info className="h-3 w-3 text-blue-500" />
                </label>
                <Input defaultValue="Greenfield International School" className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Customer / Organization <span className="text-rose-500">*</span> <Info className="h-3 w-3 text-blue-500" />
                </label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Greenfield Education Trust</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Subdomain (Unique) <span className="text-rose-500">*</span> <Info className="h-3 w-3 text-blue-500" />
                </label>
                <div className="flex items-center">
                  <Input defaultValue="greenfield-school" className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-r-none border-r-0" />
                  <div className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-r-lg flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    .crmfarm.in
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Primary Contact Email <span className="text-rose-500">*</span>
                </label>
                <Input defaultValue="admin@greenfieldschool.edu.in" className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Select Template <span className="text-rose-500">*</span> <Info className="h-3 w-3 text-blue-500" />
                </label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>CRMFarm - Education</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1 px-3 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-10 shrink-0 text-xs font-bold cursor-pointer">
                    🇮🇳 <span>+91</span>
                  </div>
                  <input type="text" defaultValue="98765 43210" className="flex-1 h-10 px-3 text-xs font-semibold bg-transparent focus:outline-none" />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Time Zone <span className="text-rose-500">*</span>
                </label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>(GMT+05:30) Asia/Kolkata</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-6">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">2</span>
              Instance Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {[
                { id: 'Education', icon: '🎓', title: 'Education', desc: 'For Schools, Colleges & Institutes' },
                { id: 'IT', icon: '🏢', title: 'IT & SaaS', desc: 'For IT Companies & Startups' },
                { id: 'RealEstate', icon: '🏢', title: 'Real Estate', desc: 'For Builders & Property Dealers' },
                { id: 'Retail', icon: '🛒', title: 'Retail', desc: 'For Retail Stores & Chains' },
                { id: 'Custom', icon: '⚙️', title: 'Custom', desc: 'Custom Configuration' }
              ].map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${category === cat.id ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <input type="radio" checked={category === cat.id} readOnly className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{cat.title}</span>
                  </div>
                  <p className="text-[9px] font-semibold text-slate-500 mt-1 pl-5.5">{cat.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">Database Server</label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>AWS - Mumbai (ap-south-1)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">Plan / Edition</label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>Professional</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">Data Retention (Months)</label>
                <select className="w-full h-10 px-3 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option>12 Months</option>
                </select>
              </div>
            </div>

          </div>

          {/* Section 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-6">
              <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px]">3</span>
              Administrator Account
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Admin Name <span className="text-rose-500">*</span>
                </label>
                <Input defaultValue="Admin User" className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Admin Email <span className="text-rose-500">*</span>
                </label>
                <Input defaultValue="admin@greenfieldschool.edu.in" className="h-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} defaultValue="password123" className="h-10 pr-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input type={showConfirm ? 'text' : 'password'} defaultValue="password123" className="h-10 pr-10 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            


          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full xl:w-[380px] shrink-0 space-y-6">
          
          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-blue-600 flex items-center gap-2 mb-5">
              <FileText className="h-4 w-4" /> Instance Summary
            </h3>
            
            <div className="space-y-4">
              {[
                { icon: FileText, label: 'Instance Name', val: 'Greenfield International School' },
                { icon: Server, label: 'Subdomain', val: 'greenfield-school.crmfarm.in' },
                { icon: Users, label: 'Customer / Organization', val: 'Greenfield Education Trust' },
                { icon: Sparkles, label: 'Template', val: 'CRMFarm - Education' },
                { icon: Star, label: 'Edition / Plan', val: 'Professional' },
                { icon: Database, label: 'Database Server', val: 'AWS - Mumbai (ap-south-1)' },
                { icon: Clock, label: 'Time Zone', val: '(GMT+05:30) Asia/Kolkata' },
                { icon: HardDrive, label: 'Data Retention', val: '12 Months' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <item.icon className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500">{item.label}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-500 leading-relaxed">
                Changes will be synced instantly and securely across all integrated nodes.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden">
            <h3 className="text-sm font-bold text-blue-600 mb-5">Features Included</h3>
            <div className="space-y-3 relative z-10">
              {[
                'AI Powered CRM',
                'Role Based Access Control',
                'Data Security & Backup',
                'Email & SMS Integration',
                'Reports & Dashboards',
                'Mobile App Access'
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{feat}</span>
                </div>
              ))}
            </div>
            {/* Cloud Illustration */}
            <div className="absolute -bottom-4 -right-4 opacity-10 dark:opacity-5 pointer-events-none">
              <Cloud className="h-40 w-40 text-blue-600" />
            </div>
          </div>

        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 mt-6">
        <Button variant="outline" className="h-10 px-6 gap-2 text-xs font-bold border-slate-200 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button className="h-10 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm">
          Save Changes
        </Button>
      </div>

    </motion.div>
  );
}
