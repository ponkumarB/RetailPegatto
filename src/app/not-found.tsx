'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

export default function NotFound() {
  const { primaryColor, user } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userRole = user?.role || 'CEO';

  const dashboardPath = (() => {
    switch (userRole) {
      case 'Admin':
        return '/role-dashboard/admin';
      case 'CEO':
        return '/role-dashboard/ceo';
      case 'Delivery Manager':
        return '/role-dashboard/delivery';
      case 'Project Manager':
        return '/role-dashboard/pm';
      case 'Project Lead':
        return '/role-dashboard/project-lead';
      case 'Test Lead':
        return '/role-dashboard/test-lead';
      case 'Developer':
        return '/role-dashboard/developer';
      default:
        return '/role-dashboard/ceo';
    }
  })();

  // Server default values to match initial SSR
  const defaultHref = '/role-dashboard/ceo';
  const defaultBg = '#0565FD';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-slate-500 mb-6">Could not find the requested resource.</p>
      <Link
        href={mounted ? dashboardPath : defaultHref}
        className="px-4 py-2 text-white rounded-md font-medium transition-all hover:opacity-90"
        style={{ backgroundColor: mounted ? (primaryColor || defaultBg) : defaultBg }}
      >
        Return Home
      </Link>
    </div>
  );
}
