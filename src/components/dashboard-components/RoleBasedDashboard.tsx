'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { PeriodFilter } from '@/components/ui/PeriodFilter';
import AdminDashboard from './roles/AdminDashboard';
import RegionalManagerDashboard from './roles/RegionalManagerDashboard';
import CEODashboard from './roles/CEODashboard';
import StoreManagerDashboard from './roles/StoreManagerDashboard';
import InventoryManagerDashboard from './roles/InventoryManagerDashboard';
import SalesAssociateDashboard from './roles/SalesAssociateDashboard';
import { parseDateString } from './roles/utils';
import { usePermission } from '@/hooks/usePermission';

export default function RoleBasedDashboard({ roleOverride }: { roleOverride?: string } = {}) {
  const { user, primaryColor } = useStore();
  const [dateRange, setDateRange] = useState('24 Jun 2024 - 24 Jun 2026');
  const [selectedRole] = useState<string | null>(null);
  const [period, setPeriod] = useState('Custom');

  const {
    canViewAdminDashboardOverview,
    canViewStoreManagerDashboardOverview,
    canViewSalesAssociateDashboardOverview,
    canViewRegionalManagerDashboardOverview,
    canViewInventoryManagerDashboardOverview,
    canViewCeoDashboardOverview,
    isLoaded: isPermissionLoaded
  } = usePermission();

  const rolesList = [
    'System Administrator',
    'Admin',
    'Store Manager',
    'Sales Associate',
    'Regional Manager',
    'Inventory Manager',
    'CEO'
  ];

  const getActiveDashboardRole = (): string => {
    if (selectedRole) return selectedRole;
    if (roleOverride) return roleOverride;

    // 1. Check permission codes first (if permissions are loaded)
    if (isPermissionLoaded) {
      if (canViewAdminDashboardOverview) return 'Admin';
      if (canViewStoreManagerDashboardOverview) return 'Store Manager';
      if (canViewSalesAssociateDashboardOverview) return 'Sales Associate';
      if (canViewRegionalManagerDashboardOverview) return 'Regional Manager';
      if (canViewInventoryManagerDashboardOverview) return 'Inventory Manager';
      if (canViewCeoDashboardOverview) return 'CEO';
    }

    // 2. Fall back to role name from user profile (designation)
    if (user?.role) {
      if (rolesList.includes(user.role)) {
        return user.role;
      }
      // Map 'System Administrator' to 'Admin'
      if (user.role === 'System Administrator') {
        return 'Admin';
      }
    }

    // 3. Fall back to Sales Associate Dashboard
    return 'Sales Associate';
  };

  const activeRole = getActiveDashboardRole();

  React.useEffect(() => {
    const today = new Date();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    const formatDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    };

    setDateRange(`${formatDate(twoYearsAgo)} - ${formatDate(today)}`);
  }, []);

  const [startPart = '', endPart = ''] = dateRange.split(' - ');
  const startDate = parseDateString(startPart) || '2024-06-24';
  const endDate = parseDateString(endPart) || '2026-06-24';
  const createdBy = typeof window !== 'undefined' ? (Number(localStorage.getItem('userId') || localStorage.getItem('UserId')) || 72) : 72;

  const renderDashboardByRole = () => {
    switch (activeRole) {
      case 'System Administrator':
      case 'Admin':
        return (
          <AdminDashboard
            startDate={startDate}
            endDate={endDate}
            primaryColor={primaryColor}
            period={period}
          />
        );
      case 'Regional Manager':
        return (
          <RegionalManagerDashboard
            startDate={startDate}
            endDate={endDate}
            primaryColor={primaryColor}
            period={period}
          />
        );
      case 'CEO':
        return (
          <CEODashboard
            startDate={startDate}
            endDate={endDate}
            createdBy={createdBy}
            primaryColor={primaryColor}
            period={period}
          />
        );
      case 'Store Manager':
        return (
          <StoreManagerDashboard
            startDate={startDate}
            endDate={endDate}
            createdBy={createdBy}
            primaryColor={primaryColor}
            period={period}
          />
        );
      case 'Inventory Manager':
        return (
          <InventoryManagerDashboard
            startDate={startDate}
            endDate={endDate}
            createdBy={createdBy}
            primaryColor={primaryColor}
            period={period}
          />
        );
      case 'Sales Associate':
      default:
        return (
          <SalesAssociateDashboard
            startDate={startDate}
            endDate={endDate}
            createdBy={createdBy}
            primaryColor={primaryColor}
            period={period}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Dashboard heading and filters */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-1">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Welcome back, {user?.name || 'User'}!
          </h1>
          <p className="text-sm text-slate-450 mt-1">Here's what's happening with your business today.</p>
        </div>

        {/* Reusable Period Filter */}
        <PeriodFilter
          value={dateRange}
          period={period}
          onChange={(newRange, newPeriod) => {
            setDateRange(newRange);
            setPeriod(newPeriod);
          }}
        />
      </div>

      {/* Active Role Dashboard */}
      <div className="transition-all duration-300">
        {renderDashboardByRole()}
      </div>
    </div>
  );
}
