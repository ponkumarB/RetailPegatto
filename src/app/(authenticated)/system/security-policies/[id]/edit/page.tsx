'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function EditSecurityPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = typeof params?.id === 'string' ? params.id : '';
  const policyId = parseInt(idStr, 10);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Authentication');
  const [status, setStatus] = useState('Active');
  const [priority, setPriority] = useState('Medium');
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('crm_security_policies');
    if (stored) {
      const parsedPolicies = JSON.parse(stored);
      setPolicies(parsedPolicies);
      
      const policy = parsedPolicies.find((p: any) => p.id === policyId);
      if (policy) {
        setName(policy.name || '');
        setDesc(policy.desc || '');
        setCat(policy.cat || 'Authentication');
        setStatus(policy.status || 'Active');
        setPriority(policy.priority || 'Medium');
      } else {
        toast.error('Security policy not found');
        router.push('/system/security-policies');
      }
    } else {
      toast.error('No policies database found');
      router.push('/system/security-policies');
    }
    setLoading(false);
  }, [policyId, router]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Policy Name is required');
      return;
    }
    if (!desc.trim()) {
      toast.error('Description is required');
      return;
    }

    const updatedPolicies = policies.map((p: any) => {
      if (p.id === policyId) {
        return {
          ...p,
          name: name.trim(),
          desc: desc.trim(),
          cat,
          status,
          priority,
          updated: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
      }
      return p;
    });

    localStorage.setItem('crm_security_policies', JSON.stringify(updatedPolicies));
    toast.success('Security policy updated successfully!');
    router.push('/system/security-policies');
  };

  if (loading) {
    return <div className="py-12 text-center text-xs font-bold text-slate-400">Loading policy details...</div>;
  }

  return (
    <div className="space-y-6 text-left max-w-2xl mx-auto pt-4">
      {/* Back button */}
      <button
        onClick={() => router.push('/system/security-policies')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Policies
      </button>

      <Card className="border dark:border-slate-800 rounded-2xl shadow-sm">
        <CardHeader className="border-b dark:border-slate-800 pb-4">
          <CardTitle className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5.5 w-5.5 text-blue-600" /> Edit Security Policy
          </CardTitle>
          <CardDescription className="text-xs">
            Modify the security policy constraints, priority, and category configurations.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleUpdate} className="space-y-4">
            
            {/* Policy Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Policy Name *</label>
              <input
                type="text"
                placeholder="e.g. Enforce Hardware Tokens"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Description *</label>
              <textarea
                placeholder="Describe the enforcement scope and constraints of this security policy..."
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Category *</label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none cursor-pointer"
              >
                <option value="Authentication">Authentication</option>
                <option value="Session Management">Session Management</option>
                <option value="Access Control">Access Control</option>
                <option value="Data Protection">Data Protection</option>
                <option value="Device Management">Device Management</option>
              </select>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Enforcement Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-55 dark:bg-slate-950 rounded-xl outline-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Priority *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-55 dark:bg-slate-955 rounded-xl outline-none cursor-pointer"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-slate-800 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/system/security-policies')}
                className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer flex items-center px-4 py-2 hover:bg-slate-105"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-bold text-xs gap-1.5 bg-blue-600 hover:bg-blue-750 text-white cursor-pointer flex items-center px-4 py-2"
              >
                <Save className="h-4 w-4" /> Update Policy
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
