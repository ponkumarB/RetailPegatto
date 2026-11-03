'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mail, 
  HelpCircle, 
  Save, 
  Trash2, 
  CheckCircle2, 
  User, 
  RefreshCw, 
  Clock, 
  Paperclip, 
  Info, 
  ChevronDown, 
  Send,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

// Custom Gmail Logo SVG
const GmailLogo = () => (
  <svg className="h-9 w-9 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#E0E0E0" />
    <path d="M20 4H18V14L12 9.5L6 14V4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h2V8.5L12 13L18 8.5V20h2c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" fill="#CF3E2E" />
    <path d="M18 20H20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H18V20Z" fill="#B13124" />
    <path d="M2 6V18c0 1.1.9 2 2 2H6V4H4C2.9 4 2 4.9 2 6Z" fill="#F44336" />
    <path d="M12 13L20 7V6L12 12L4 6v1l8 6Z" fill="#ECEFF1" />
  </svg>
);

export default function GmailConfigurationPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  // Interactive UI State
  const [syncEmails, setSyncEmails] = useState(true);
  const [syncSentEmails, setSyncSentEmails] = useState(true);
  const [syncAttachments, setSyncAttachments] = useState(true);
  const [syncFrequency, setSyncFrequency] = useState('Every 15 Minutes');
  const [defaultFrom, setDefaultFrom] = useState('ajay.kumar@gmail.com');
  const [signature, setSignature] = useState("Thanks & Regards,\nAjay Kumar\nCRMFarm IT");
  
  const [isConnected, setIsConnected] = useState(true);
  const [testSent, setTestSent] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDisconnect = () => {
    toast.warning("Are you sure you want to disconnect Ajay Kumar's Gmail account?", {
      action: {
        label: 'Disconnect',
        onClick: () => {
          setIsConnected(false);
          toast.success('Gmail account disconnected successfully.');
        }
      }
    });
  };

  const handleConnect = () => {
    setIsConnected(true);
    toast.success('Gmail account connected successfully via OAuth 2.0.');
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTestSent(false);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSent(true);
      toast.success('Test email sent to ajay.kumar@gmail.com');
    }, 1200);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Gmail configuration saved successfully.');
    }, 1000);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <GmailLogo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gmail Configuration
            </h1>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">
              Connect and configure Gmail for this user.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-605 dark:text-slate-350"
            onClick={() => toast.info('Help manual loading...')}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>

          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="h-9.5 px-4 rounded-[5px] text-xs font-bold text-white hover:opacity-90 transition-all gap-1.5 cursor-pointer border-none"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Inputs & Toggles */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Connect Gmail Account */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">1. Connect Gmail Account</h3>
                <p className="text-[11px] text-slate-450 font-semibold mt-1">
                  Connect the user's Gmail account using secure OAuth 2.0 authentication.
                </p>
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: primaryColor }}>
                        AJ
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">ajay.kumar@gmail.com</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[9px] font-bold border" style={{ color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}>
                            Connected
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Ajay Kumar</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleDisconnect}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg h-9 w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button 
                    variant="outline"
                    onClick={handleDisconnect}
                    className="h-8.5 rounded-[5px] text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50/50 hover:text-rose-700 bg-white"
                  >
                    Disconnect Account
                  </Button>
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-3 dark:border-slate-800">
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-450">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-205">No Account Connected</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Please connect Ajay Kumar's Gmail account to enable sync features.</p>
                  </div>
                  <Button 
                    onClick={handleConnect}
                    className="h-9 px-5 rounded-[5px] text-xs font-bold text-white hover:opacity-95 border-none"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Connect Gmail Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Sync Settings */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">2. Sync Settings</h3>
              </div>

              {/* Sync toggles */}
              <div className="space-y-4">
                {[
                  { 
                    label: 'Sync Emails', 
                    desc: 'Automatically sync emails to CRMFarm IT.', 
                    state: syncEmails, 
                    setter: setSyncEmails 
                  },
                  { 
                    label: 'Sync Sent Emails', 
                    desc: 'Save sent emails in CRMFarm IT.', 
                    state: syncSentEmails, 
                    setter: setSyncSentEmails 
                  },
                  { 
                    label: 'Sync Attachments', 
                    desc: 'Download and store email attachments.', 
                    state: syncAttachments, 
                    setter: setSyncAttachments 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b dark:border-slate-850 last:border-b-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{item.desc}</p>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => item.setter(!item.state)}
                      disabled={!isConnected}
                      className={cn(
                        "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none",
                        !(item.state && isConnected) && "bg-slate-200 dark:bg-slate-700",
                        !isConnected && "opacity-50 cursor-not-allowed"
                      )}
                      style={item.state && isConnected ? { backgroundColor: primaryColor } : undefined}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          item.state && isConnected ? "translate-x-4.5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* Sync Frequency dropdown */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-205">Sync Frequency</label>
                <p className="text-[10px] text-slate-450 font-semibold">Choose how often emails should be synced.</p>
                <div className="relative w-full max-w-md">
                  <select
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value)}
                    disabled={!isConnected}
                    className="w-full h-9.5 px-3 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none appearance-none"
                  >
                    <option>Every 15 Minutes</option>
                    <option>Every 30 Minutes</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-450 pointer-events-none" />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Card 3: Default Settings */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">3. Default Settings</h3>
              </div>

              {/* Default From selector */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-205">Default From Email</label>
                  <span title="The default address emails will be sent from.">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </span>
                </div>
                
                <div className="relative w-full max-w-md">
                  <select
                    value={defaultFrom}
                    onChange={(e) => setDefaultFrom(e.target.value)}
                    disabled={!isConnected}
                    className="w-full h-9.5 px-3 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none appearance-none"
                  >
                    <option value="ajay.kumar@gmail.com">ajay.kumar@gmail.com</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-3.5 w-3.5 text-slate-450 pointer-events-none" />
                </div>
              </div>

              {/* Default Signature textarea */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-205">Default Signature</label>
                  <span title="HTML or text signature appended to sent emails.">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </span>
                </div>
                <textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  disabled={!isConnected}
                  rows={4}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none focus:border-slate-400"
                />
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Section: Summary & Tester */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Configuration Summary */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-950/20 px-5 py-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configuration Summary</h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              {[
                { 
                  label: 'User', 
                  value: 'Ajay Kumar', 
                  icon: User, 
                  badge: 'Active', 
                  badgeStyle: 'theme' 
                },
                { 
                  label: 'Connected Email', 
                  value: isConnected ? 'ajay.kumar@gmail.com' : 'None', 
                  icon: Mail, 
                  badge: isConnected ? 'Connected' : 'Disconnected', 
                  badgeStyle: isConnected ? 'theme' : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' 
                },
                { 
                  label: 'Sync Status', 
                  value: isConnected ? 'Running' : 'Stopped', 
                  icon: RefreshCw, 
                  badge: isConnected ? 'Active' : 'Inactive', 
                  badgeStyle: isConnected ? 'theme' : 'bg-slate-50 text-slate-500 border dark:bg-slate-800' 
                },
                { 
                  label: 'Last Synced', 
                  value: isConnected ? 'May 14, 2024 10:30 AM' : '-', 
                  icon: Clock, 
                  badge: isConnected ? 'Success' : 'Offline', 
                  badgeStyle: isConnected ? 'theme' : 'bg-slate-50 text-slate-500 border dark:bg-slate-800' 
                },
                { 
                  label: 'Emails Synced', 
                  value: isConnected ? '1,256' : '0', 
                  icon: Mail, 
                  info: true 
                },
                { 
                  label: 'Attachments Synced', 
                  value: isConnected ? '342' : '0', 
                  icon: Paperclip, 
                  info: true 
                }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b dark:border-slate-850 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-950/30 flex items-center justify-center text-slate-400 shrink-0 border dark:border-slate-850">
                      <row.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.label}</span>
                      <p className="text-xs font-bold text-slate-705 dark:text-slate-300 mt-0.5">{row.value}</p>
                    </div>
                  </div>

                  {row.badge && (
                    <span 
                      className={cn("px-2 py-0.5 rounded-[5px] text-[9px] font-bold shrink-0 border", row.badgeStyle !== 'theme' && row.badgeStyle)}
                      style={row.badgeStyle === 'theme' ? { color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` } : undefined}
                    >
                      {row.badge}
                    </span>
                  )}
                  {row.info && (
                    <span title="Statistics counter" className="shrink-0">
                      <HelpCircle className="h-3.5 w-3.5 text-slate-350 cursor-pointer" />
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card: Test Connection */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-wider">Test Connection</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-1">
                  Send a test email to verify your Gmail configuration.
                </p>
              </div>

              <Button 
                variant="outline"
                onClick={handleSendTest}
                disabled={!isConnected || isSendingTest}
                className="w-full h-9 rounded-[5px] text-xs font-semibold gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                {isSendingTest ? 'Sending...' : 'Send Test Email'}
              </Button>

              {testSent && isConnected && (
                <div className="flex items-start gap-2 p-3 border rounded-lg text-xs font-semibold mt-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-bold">Test email sent successfully!</p>
                    <p className="text-[10px] font-medium mt-0.5 opacity-90">Check your inbox to confirm.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Footer Info Banner */}
      <div className="flex items-center gap-2 p-4 bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs font-semibold text-blue-700 dark:text-blue-400">
        <Info className="h-4.5 w-4.5 text-blue-500 shrink-0" />
        <span>Click Save Configuration to apply these settings to Ajay Kumar.</span>
      </div>

    </div>
  );
}
