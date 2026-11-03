'use client';

import React, { useState, useEffect } from 'react';
import { fetchMailConfiguration, saveMailConfiguration } from '@/service/api/useradmin/api';
import { toast } from 'sonner';
import { Eye, EyeOff, Save, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MailConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MailConfigurationModal({ isOpen, onClose }: MailConfigurationModalProps) {
  const [userId, setUserId] = useState<number>(0);
  const [orgId, setOrgId] = useState<number>(1);
  const [id, setId] = useState<number | null>(null);

  const [mailId, setMailId] = useState('');
  const [mailPassword, setMailPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const uId = localStorage.getItem('userId') || localStorage.getItem('UserId');
      const oId = localStorage.getItem('OrganizationId') || localStorage.getItem('Organization_Id');
      setUserId(Number(uId));
      setOrgId(Number(oId));
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadConfig = async () => {
      setIsLoading(true);
      try {
        const res = await fetchMailConfiguration(userId);
        // Backend might return an array, single object, or empty response.
        const data = Array.isArray(res) ? res[0] : res;
        if (data && (data.id || data.MailId)) {
          setId(data.id || null);
          setMailId(data.MailId || '');
          setMailPassword(data.MailPassword || '');
          setSmtpHost(data.SMTPHost || '');
          setSmtpPort(data.SMTPPort || '');
          setImapHost(data.IMAPHost || '');
          setImapPort(data.IMAPPort || '');
        } else {
          // Reset fields if no configuration exists yet
          setId(null);
          setMailId('');
          setMailPassword('');
          setSmtpHost('');
          setSmtpPort('');
          setImapHost('');
          setImapPort('');
        }
      } catch (error) {
        console.error('Failed to load mail configuration:', error);
        // Do not toast error since it might just be that the config doesn't exist yet (404/empty)
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [isOpen, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailId || !mailPassword || !smtpHost || !smtpPort || !imapHost || !imapPort) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload = {
      ...(id ? { id } : {}),
      SMTPHost: smtpHost,
      SMTPPort: smtpPort,
      IMAPHost: imapHost,
      IMAPPort: imapPort,
      MailId: mailId,
      MailPassword: mailPassword,
      Organization_Id: orgId,
      User_Id: userId,
      Created_By: userId,
      Updated_By: userId,
    };

    setIsSaving(true);
    try {
      await saveMailConfiguration(payload);
      toast.success('Mail configuration saved successfully');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || 'Failed to save mail configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="max-w-lg p-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 bg-slate-50/20 dark:bg-slate-900/50">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Mail Configuration</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border-none bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-650" />
            <span className="text-xs text-slate-400 font-semibold">Loading configuration...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <div className="p-6 space-y-4 overflow-y-auto max-h-[55vh] text-xs font-semibold text-slate-705 dark:text-slate-300">
              
              {/* Mail ID */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  Mail Id <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={mailId}
                  onChange={(e) => setMailId(e.target.value)}
                  placeholder="karthik@foyertech.com"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-all duration-200"
                  required
                />
              </div>

              {/* Mail Password */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  Mail Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={mailPassword}
                    onChange={(e) => setMailPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full pl-4 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer border-none bg-transparent"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* SMTP Host */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtpout.secureserver.net"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-all duration-200"
                  required
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  SMTP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="465"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-all duration-200"
                  required
                />
              </div>

              {/* IMAP Host */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  IMAP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.secureserver.net"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-all duration-200"
                  required
                />
              </div>

              {/* IMAP Port */}
              <div className="space-y-1.5 text-left">
                <label className="text-slate-600 dark:text-slate-400 block font-bold">
                  IMAP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  placeholder="993"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-655 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-200 transition-all duration-200"
                  required
                />
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 p-5 flex items-center justify-center gap-3 bg-slate-50/20 dark:bg-slate-900/50">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-800 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}

      </DialogContent>
    </Dialog>
  );
}
