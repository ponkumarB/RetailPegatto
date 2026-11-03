'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import RoleBasedDashboard from '../../../components/dashboard-components/RoleBasedDashboard';

export default function RoleDashboardPage() {
  const { primaryColor } = useStore();

  return (
    <div
      className="space-y-6"
      style={{ '--theme-primary': primaryColor } as React.CSSProperties}
    >
      <RoleBasedDashboard />
    </div>
  );
}
