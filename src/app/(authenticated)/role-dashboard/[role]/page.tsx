'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import RoleBasedDashboard from '../../../../components/dashboard-components/RoleBasedDashboard';
import { toast } from 'sonner';

// Mapping URL friendly parameters to exact dashboard role names
const urlToRoleMap: Record<string, string> = {
  'admin': 'System Administrator',
  'ceo': 'CEO',
  'delivery': 'Delivery Manager',
  'pm': 'Project Manager',
  'project-lead': 'Project Lead',
  'test-lead': 'Test Lead',
  'developer': 'Developer'
};

export default function DynamicRoleDashboardPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const params = useParams();
  const roleParam = typeof params?.role === 'string' ? params.role.toLowerCase() : 'admin';
  const roleName = urlToRoleMap[roleParam] || 'System Administrator';

  const {
    canViewAdminDashboardOverview,
    canViewCeoDashboardOverview,
    canViewDeliveryDashboardOverview,
    canViewPmDashboardOverview,
    canViewProjectLeadDashboardOverview,
    canViewTestLeadDashboardOverview,
    canViewDeveloperDashboardOverview,
    isLoaded
  } = usePermission();

  const hasPermission = React.useMemo(() => {
    switch (roleParam) {
      case 'admin': return canViewAdminDashboardOverview;
      case 'ceo': return canViewCeoDashboardOverview;
      case 'delivery': return canViewDeliveryDashboardOverview;
      case 'pm': return canViewPmDashboardOverview;
      case 'project-lead': return canViewProjectLeadDashboardOverview;
      case 'test-lead': return canViewTestLeadDashboardOverview;
      case 'developer': return canViewDeveloperDashboardOverview;
      default: return canViewAdminDashboardOverview;
    }
  }, [
    roleParam,
    canViewAdminDashboardOverview,
    canViewCeoDashboardOverview,
    canViewDeliveryDashboardOverview,
    canViewPmDashboardOverview,
    canViewProjectLeadDashboardOverview,
    canViewTestLeadDashboardOverview,
    canViewDeveloperDashboardOverview
  ]);

  useEffect(() => {
    if (isLoaded && !hasPermission) {
      toast.error(`You do not have permission to view the ${roleName} Dashboard.`);
      router.push('/');
    }
  }, [hasPermission, isLoaded, roleName, router]);

  if (isLoaded && !hasPermission) {
    return null;
  }

  return (
    <div
      className="space-y-6"
      style={{ '--theme-primary': primaryColor } as React.CSSProperties}
    >
      <RoleBasedDashboard roleOverride={roleName} />
    </div>
  );
}
