'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createContact, ContactModel } from '@/service/api/contacts/api';
import { toast } from 'sonner';
import ContactForm from '../components/ContactForm';
import { usePermission } from '@/hooks/usePermission';

export default function CreateContactPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canCreateContact } = usePermission();

  useEffect(() => {
    if (!canCreateContact) {
      toast.error('You do not have permission to access the Create Contact page.');
      router.push('/contacts');
    }
  }, [canCreateContact, router]);

  if (!canCreateContact) {
    return null;
  }

  const createMutation = useMutation({
    mutationFn: (payload: ContactModel) => createContact(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactsDashboardCards'] });
      const fullName = `${variables.FirstName} ${variables.LastName}`.trim();
      toast.success(`Contact "${fullName}" saved successfully!`);
      router.push('/contacts');
    },
    onError: (err: any) => {
      toast.error(`Failed to save contact: ${err.message}`);
    }
  });

  const handleSaveContact = (payload: ContactModel) => {
    createMutation.mutate(payload);
  };

  return (
    <ContactForm 
      onSubmit={handleSaveContact} 
      onCancel={() => router.push('/contacts')}
      isSubmitting={createMutation.isPending}
      submitButtonText="Save Contact"
      cancelButtonText="Cancel"
    />
  );
}
