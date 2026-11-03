'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import AllTasks from '@/components/tasks/AllTasks';
import { toast } from 'sonner';

export default function AllTasksPage() {
  const router = useRouter();
  const { canViewTaskListOverview, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTaskListOverview) {
      toast.error('You do not have permission to view Task List.');
      router.push('/');
    }
  }, [canViewTaskListOverview, isLoaded, router]);

  if (isLoaded && !canViewTaskListOverview) {
    return null;
  }

  return <AllTasks />;
}
