'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useDeploymentStore } from '@/store/useDeploymentStore';
import { DeploymentRequest } from '@/types/deployment';
import DeploymentForm from '../../components/DeploymentForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EditDeploymentPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = params.id as string;
  const { requests, updateRequest } = useDeploymentStore();

  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    return (
      <div className="max-w-[1000px] mx-auto p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Deployment Request Not Found</h2>
        <p className="text-sm text-slate-500">The request you are trying to edit does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/system/application-deployment')} className="bg-blue-600 text-white font-bold h-9">
          Go Back to List
        </Button>
      </div>
    );
  }

  const handleEditSubmit = (formData: Omit<DeploymentRequest, 'id' | 'status' | 'approvals'>) => {
    updateRequest(request.id, formData);
    toast.success('Deployment Request updated successfully');
    router.push('/system/application-deployment');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1600px] mx-auto p-1"
    >
      <DeploymentForm
        key={request.id}
        initialData={request}
        isEditMode={true}
        onSubmit={handleEditSubmit}
        onCancel={() => router.push('/system/application-deployment')}
      />
    </motion.div>
  );
}
