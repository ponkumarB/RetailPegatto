'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, Server, Users, FileText, Database, Clock, HardDrive, CheckCircle, Pencil, Activity, Settings, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InstanceOverviewPage() {
  const router = useRouter();
  const { id } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 text-left"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Greenfield International School</h1>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] font-bold px-2 py-0">Active</Badge>
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-wider">
            <span className="text-slate-400">Dashboard</span>
            <span>›</span>
            <span className="text-slate-400">Instances</span>
            <span>›</span>
            <span className="text-blue-600">Overview</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()} className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 text-slate-600 text-xs font-bold shadow-sm cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>
          <Button onClick={() => router.push(`/Settings/Instance/${id}/edit`)} className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer">
            <Pencil className="h-3.5 w-3.5" /> Edit Instance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
              <FileText className="h-4 w-4 text-blue-500" />
              General Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Instance Name</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Greenfield International School</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Subdomain</p>
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">greenfield-school.crmfarm.in</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Customer / Organization</p>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Greenfield Education Trust</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Template</p>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">CRMFarm - Education</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Created On</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">25 June 2025</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Time Zone</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">(GMT+05:30) Asia/Kolkata</p>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration & Resources */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
              <Settings className="h-4 w-4 text-blue-500" />
              Configuration & Resources
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Plan / Edition</p>
                <p className="text-sm font-bold text-blue-600">Professional</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Database Server</p>
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">AWS - Mumbai (ap-south-1)</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Data Retention</p>
                <div className="flex items-center gap-2">
                  <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">12 Months</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 mb-1">Resource Allocation</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Standard Tier</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Admin & Quick Stats */}
        <div className="space-y-6">
          
          {/* Administrator Contact */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
              <Users className="h-4 w-4 text-blue-500" />
              Primary Contact
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold">
                  AU
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Admin User</p>
                  <p className="text-[10px] font-bold text-slate-500">System Administrator</p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">admin@greenfieldschool.edu.in</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Health Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6">
              <Activity className="h-4 w-4 text-blue-500" />
              Instance Health
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Database Storage</p>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">45%</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[45%]" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Monthly API Usage</p>
                  <p className="text-[11px] font-bold text-slate-900 dark:text-white">82%</p>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[82%]" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All systems operational</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
