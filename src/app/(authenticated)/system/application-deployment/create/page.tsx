'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { useDeploymentStore } from '@/store/useDeploymentStore';
import { DeploymentRequest } from '@/types/deployment';
import DeploymentForm from '../components/DeploymentForm';
import { toast } from 'sonner';

export default function CreateDeploymentPage() {
  const router = useRouter();
  const { addRequest } = useDeploymentStore();

  const handleCreateSubmit = (formData: Omit<DeploymentRequest, 'id' | 'status' | 'approvals'>) => {
    const newRequest: DeploymentRequest = {
      ...formData,
      id: `APP-DEP-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Pending',
      approvals: [
        { step: 1, approver: 'Aaray Rao', role: 'Project Manager', avatar: 'AR', status: 'Pending' },
        { step: 2, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Pending' },
        { step: 3, approver: 'Neha Bansal', role: 'Application Owner', avatar: 'NB', status: 'Pending' },
        { step: 4, approver: 'Vikram Tiwari', role: 'Infrastructure Head', avatar: 'VK', status: 'Pending' }
      ]
    };

    addRequest(newRequest);
    toast.success('Deployment Request submitted successfully');
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
        isEditMode={false}
        onSubmit={handleCreateSubmit}
        onCancel={() => router.push('/system/application-deployment')}
      />
    </motion.div>
  );
}
