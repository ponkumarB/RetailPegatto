'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, X, Loader2, Landmark, Store, Globe, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { fetchTallyConfiguration, saveTallyConfiguration, fetchStoreMasterList } from '@/api/transactions';

interface TallyConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TallyConfigurationModal({ isOpen, onClose }: TallyConfigurationModalProps) {
  const [userId, setUserId] = useState<number>(0);
  const [orgId, setOrgId] = useState<number>(1);
  const [id, setId] = useState<number | null>(null);

  const [tallyUrl, setTallyUrl] = useState('');
  const [companyName, setCompanyName] = useState('Foyer');
  const [storeId, setStoreId] = useState<string>('');
  const [storeList, setStoreList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uId = localStorage.getItem('userId') || localStorage.getItem('UserId') || '1';
      const oId = localStorage.getItem('OrganizationId') || localStorage.getItem('Organization_Id') || localStorage.getItem('orgDetail') || '1';
      setUserId(Number(uId));
      setOrgId(Number(oId));
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const oId = typeof window !== 'undefined'
          ? (localStorage.getItem('OrganizationId') || localStorage.getItem('Organization_Id') || localStorage.getItem('orgDetail') || '1')
          : '1';

        // Fetch stores list and current config in parallel
        const [storesRes, configRes] = await Promise.allSettled([
          fetchStoreMasterList(),
          fetchTallyConfiguration(oId)
        ]);

        if (storesRes.status === 'fulfilled' && storesRes.value) {
          const raw = storesRes.value;
          const list = Array.isArray(raw) ? raw : (raw?.results || raw?.data || raw?.Result || []);
          setStoreList(list);
        }

        if (configRes.status === 'fulfilled' && configRes.value) {
          const rawConfig = configRes.value;
          const data = Array.isArray(rawConfig) ? rawConfig[0] : (rawConfig?.data || rawConfig?.result || rawConfig);
          if (data && (data.id || data.Tally_Url)) {
            setId(data.id || null);
            setTallyUrl(data.Tally_Url || '');
            setCompanyName(data.Company_Name || 'Foyer');
            setStoreId(data.Store_Id ? String(data.Store_Id) : '');
          } else {
            setId(null);
            setTallyUrl('');
            setCompanyName('Foyer');
            setStoreId('');
          }
        } else {
          setId(null);
          setTallyUrl('');
          setCompanyName('Foyer');
          setStoreId('');
        }
      } catch (error) {
        console.error('Failed to load Tally configuration:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = tallyUrl.trim();
    const trimmedCompany = companyName.trim();

    if (!trimmedUrl) {
      toast.error('Please enter Tally Server URL');
      return;
    }

    if (!trimmedCompany) {
      toast.error('Please enter Tally Company Name');
      return;
    }

    const payload: Record<string, any> = {
      ...(id ? { id } : {}),
      Tally_Url: trimmedUrl,
      Company_Name: trimmedCompany,
      Store_Id: storeId ? Number(storeId) : null,
      Organization_Id: orgId || 1,
      Updated_By: userId || 1,
      ...(!id ? {
        Created_By: userId || 1,
        Created_Date: new Date().toISOString()
      } : {})
    };

    setIsSaving(true);
    try {
      const res = await saveTallyConfiguration(payload);
      if (res?.id) {
        setId(res.id);
      }
      toast.success(id ? 'Tally Configuration updated successfully!' : 'Tally Configuration saved successfully!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || 'Failed to save Tally configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-lg p-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/40 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">Tally Configuration</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Connect and sync invoices with Tally Prime / ERP 9</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs text-slate-400 font-semibold">Loading Tally configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] text-xs font-semibold text-slate-700 dark:text-slate-300">
              
              {/* Tally Server URL */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tally Server URL</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tallyUrl}
                  onChange={(e) => setTallyUrl(e.target.value)}
                  placeholder="e.g. http://localhost:9000 or http://192.168.1.50:9000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all font-mono text-xs"
                  required
                />
                <p className="text-[10px] text-slate-400 font-normal">
                  The local or networked IP address where Tally Prime XML Server is listening (default port is 9000).
                </p>
              </div>

              {/* Tally Company Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Company Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Foyer Technologies or Your Company Name"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all text-xs"
                  required
                />
                <p className="text-[10px] text-slate-400 font-normal">
                  Exact name of the company open in Tally Prime.
                </p>
              </div>

              {/* Store Selection (Optional) */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Store Name (Optional)</span>
                </label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all text-xs cursor-pointer"
                >
                  <option value="">-- All Stores / Default Store --</option>
                  {storeList.map((store: any) => (
                    <option key={store.id} value={String(store.id)}>
                      {store.Store_Name || `Store #${store.id}`}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 font-normal">
                  Optionally bind this configuration to a specific retail branch or store.
                </p>
              </div>

              {/* Status info callout */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  Once configured, GST sales invoices can be synced directly into Tally Prime from the <strong className="text-slate-700 dark:text-slate-200">Tally Sync Report</strong> page.
                </div>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex items-center justify-end gap-2.5 bg-slate-50/30 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{id ? 'Update Configuration' : 'Save Configuration'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}

