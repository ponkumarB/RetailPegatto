'use client';

import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { CompetitorTrackingTab } from './CompetitorTrackingTab';
import { PriceTrackingTab } from './PriceTrackingTab';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'sonner';

export default function CompetitorTrackingPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const { canViewCompetitorTrackingOverview, isLoaded } = usePermission();
  const [activeSubtab, setActiveSubtab] = useState<'competitor' | 'price'>('competitor');

  useEffect(() => {
    if (isLoaded && !canViewCompetitorTrackingOverview) {
      toast.error('You do not have permission to view this page.');
      router.push('/');
    }
  }, [canViewCompetitorTrackingOverview, isLoaded, router]);

  if (isLoaded && !canViewCompetitorTrackingOverview) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 text-left pb-24">
      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-655 transition-colors">Administration</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink 
              href="/administration/competitor-tracking" 
              onClick={(e) => {
                e.preventDefault();
                setActiveSubtab('competitor');
              }}
              className="hover:text-slate-655 transition-colors"
            >
              Competitor Tracking
            </BreadcrumbLink>
          </BreadcrumbItem>
          {activeSubtab === 'price' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Price Tracking</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* 2. Subtabs Switcher */}
      <div className="flex border-b dark:border-slate-800 gap-6 text-xs font-bold text-slate-400 select-none pb-0.5 mt-2">
        <button
          onClick={() => setActiveSubtab('competitor')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubtab === 'competitor'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          style={activeSubtab === 'competitor' ? { borderBottomColor: primaryColor } : undefined}
        >
          Competitor Tracking
        </button>
        <button
          onClick={() => setActiveSubtab('price')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubtab === 'price'
              ? 'text-slate-900 dark:text-white font-extrabold'
              : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          style={activeSubtab === 'price' ? { borderBottomColor: primaryColor } : undefined}
        >
          price tracking
        </button>
      </div>

      {/* 3. Subtab Content */}
      <div className="mt-2">
        {activeSubtab === 'competitor' ? (
          <CompetitorTrackingTab />
        ) : (
          <PriceTrackingTab />
        )}
      </div>
    </div>
  );
}
