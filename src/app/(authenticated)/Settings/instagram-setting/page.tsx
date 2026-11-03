'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  HelpCircle, 
  Save, 
  Trash2, 
  CheckCircle2, 
  User, 
  RefreshCw, 
  Clock, 
  Info, 
  ChevronDown, 
  Plus,
  ShieldCheck,
  Send,
  MessageSquare,
  Instagram,
  Heart,
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

// Custom Instagram Logo SVG with gradient
const InstagramLogo = () => (
  <svg className="h-9 w-9 shrink-0" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="instagram-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f9ce34" />
        <stop offset="50%" stopColor="#ee2a7b" />
        <stop offset="100%" stopColor="#6228d7" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#instagram-grad)" />
    <path 
      d="M12 7.5c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5zm0 7.4c-1.602 0-2.9-1.298-2.9-2.9 0-1.602 1.298-2.9 2.9-2.9 1.602 0 2.9 1.298 2.9 2.9 0 1.602-1.298 2.9-2.9 2.9zm4.9-7.9c0 .58-.47 1.05-1.05 1.05s-1.05-.47-1.05-1.05.47-1.05 1.05-1.05 1.05.47 1.05 1.05zm1.1 2.5c-.044-1.127-.2-2.127-1.025-2.952-.826-.826-1.826-.982-2.953-1.026-1.161-.067-4.643-.067-5.804 0-1.126.044-2.126.2-2.952 1.025-.826.826-.982 1.826-1.026 2.953-.067 1.161-.067 4.643 0 5.804.044 1.126.2 2.126 1.025 2.952.826.826 1.826.982 2.953 1.026 1.161.067 4.643.067 5.804 0 1.126-.044 2.126-.2 2.952-1.025.826-.826.982-1.826 1.026-2.953.067-1.161.067-4.643 0-5.804zm-1.8 7.15c-.246.619-.723 1.096-1.343 1.343-1.002.398-3.38.306-4.857.306-1.478 0-3.856.091-4.857-.306-.619-.247-1.096-.724-1.343-1.343-.398-1.002-.306-3.38-.306-4.857 0-1.478-.091-3.856.306-4.857.247-.619.724-1.096 1.343-1.343 1.002-.398 3.38-.306 4.857-.306 1.478 0 3.856-.091 4.857.306.62.247 1.097.724 1.343 1.343.398 1.002.306 3.38.306 4.857 0 1.478.091 3.856-.306 4.857z" 
      fill="white" 
    />
  </svg>
);

export default function InstagramConfigurationPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  // State Management
  const [isConnected, setIsConnected] = useState(true);
  const [syncMessages, setSyncMessages] = useState(true);
  const [syncComments, setSyncComments] = useState(true);
  const [syncStoryMentions, setSyncStoryMentions] = useState(true);
  const [syncShoppingQueries, setSyncShoppingQueries] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('Every 15 Minutes');
  const [selectedProfile, setSelectedProfile] = useState('crmfarm_it');
  
  const [testSent, setTestSent] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDisconnect = () => {
    toast.warning("Are you sure you want to disconnect Ajay Kumar's Instagram Business account?", {
      action: {
        label: 'Disconnect',
        onClick: () => {
          setIsConnected(false);
          toast.success('Instagram Business account disconnected.');
        }
      }
    });
  };

  const handleConnect = () => {
    setIsConnected(true);
    toast.success('Instagram Business account connected successfully.');
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTestSent(false);
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSent(true);
      toast.success('Test comment reply verification succeeded!');
    }, 1200);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Instagram configuration saved.');
    }, 1000);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <InstagramLogo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Instagram Setting
            </h1>
            <p className="text-xs text-slate-455 font-semibold mt-0.5">
              Connect and manage Instagram Business page sync and direct communications.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-705 dark:text-slate-350"
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
        
        {/* Left Section: Account settings, placements, toggle switches */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Connect Account */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">1. Connect Instagram Business Account</h3>
                <p className="text-[11px] text-slate-450 font-semibold mt-1">
                  Connect your Professional/Business Instagram account via Facebook Link.
                </p>
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/10">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        AJ
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">crmfarm_it</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[9px] font-bold border" style={{ color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}>
                            Connected
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Linked with Facebook Page "CRMFarm IT"</p>
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
                  <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-455">
                    <Instagram className="h-6 w-6 text-pink-650" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-705 dark:text-slate-205">No Instagram Connected</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Connect Ajay Kumar's Instagram Professional account via Facebook page Link.</p>
                  </div>
                  <Button 
                    onClick={handleConnect}
                    className="h-9 px-5 rounded-[5px] text-xs font-bold text-white hover:opacity-95 border-none"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Connect Instagram Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Select Instagram Profile */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">2. Active Instagram Profile</h3>
                <p className="text-[11px] text-slate-450 font-semibold mt-1">
                  Instagram Professional profile configured for lead extraction.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative w-full max-w-md">
                  <div className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-[8.5px] border dark:border-slate-800 shrink-0">
                        IG
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-200">CRMFarm IT Business</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">@crmfarm_it</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Sync Settings / Placements */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">3. Sync Settings & Placements</h3>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                {[
                  { label: 'Sync Direct Messages', desc: 'Import Instagram inbox messages into CRM.', state: syncMessages, setter: setSyncMessages },
                  { label: 'Sync Feed Comments', desc: 'Track comments on posts as potential leads.', state: syncComments, setter: setSyncComments },
                  { label: 'Sync Story Mentions', desc: 'Create alerts when users tag your handle in Stories.', state: syncStoryMentions, setter: setSyncStoryMentions },
                  { label: 'Sync Shopping Queries', desc: 'Sync customer chats from Instagram Shop products.', state: syncShoppingQueries, setter: setSyncShoppingQueries }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b dark:border-slate-850 last:border-b-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                      <p className="text-[10px] text-slate-450 font-semibold mt-0.5">{item.desc}</p>
                    </div>
                    
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

              {/* Frequency dropdown */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-205">Sync Frequency</label>
                <p className="text-[10px] text-slate-450 font-semibold">Choose frequency of Instagram feed scan.</p>
                
                <div className="relative w-full max-w-md">
                  <select
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value)}
                    disabled={!isConnected}
                    className="w-full h-9.5 px-3 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none appearance-none"
                  >
                    <option>Every 15 Minutes</option>
                    <option>Every 30 Minutes</option>
                    <option>Hourly</option>
                    <option>Daily</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 text-slate-455 pointer-events-none" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Section: Summary & Test Connections */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Configuration Summary */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-950/20 px-5 py-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configuration Summary</h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              {[
                { label: 'User', value: 'Ajay Kumar', icon: User, badge: 'Active', badgeStyle: 'theme' },
                { label: 'Instagram Profile', value: isConnected ? '@crmfarm_it' : 'None', icon: Instagram, badge: isConnected ? 'Connected' : 'Disconnected', badgeStyle: isConnected ? 'theme' : 'bg-rose-50 text-rose-700 dark:bg-rose-955/20 border' },
                { label: 'Connected Page Link', value: isConnected ? 'CRMFarm IT (Facebook)' : 'None', icon: ShieldCheck, badge: isConnected ? 'Verified' : 'Offline', badgeStyle: isConnected ? 'theme' : 'bg-slate-50 border dark:bg-slate-800' },
                { label: 'Sync Status', value: isConnected ? 'Running' : 'Stopped', icon: RefreshCw, badge: isConnected ? 'Active' : 'Inactive', badgeStyle: isConnected ? 'theme' : 'bg-slate-50 border dark:bg-slate-800' },
                { label: 'Last Synced', value: isConnected ? 'May 14, 2024 10:30 AM' : '-', icon: Clock, badge: isConnected ? 'Success' : 'Offline', badgeStyle: isConnected ? 'theme' : 'bg-slate-50 border dark:bg-slate-800' },
                { label: 'Comments Tracked', value: isConnected ? '415' : '0', icon: Heart, info: true },
                { label: 'Messages Synced', value: isConnected ? '98' : '0', icon: MessageSquare, info: true }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b dark:border-slate-850 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-950/30 flex items-center justify-center text-slate-400 border dark:border-slate-850 shrink-0">
                      <row.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-405">{row.label}</span>
                      <p className="text-xs font-bold text-slate-705 dark:text-slate-300 mt-0.5">{row.value}</p>
                    </div>
                  </div>

                  {row.badge && (
                    <span 
                      className={cn("px-2 py-0.5 rounded-[5px] text-[9.5px] font-bold shrink-0 border", row.badgeStyle !== 'theme' && row.badgeStyle)}
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
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-205 uppercase tracking-wider">Test Instagram Sync</h3>
                <p className="text-[10px] text-slate-450 font-semibold mt-1">
                  Trigger a test reply to check API read/write scopes.
                </p>
              </div>

              <Button 
                variant="outline"
                onClick={handleSendTest}
                disabled={!isConnected || isSendingTest}
                className="w-full h-9 rounded-[5px] text-xs font-semibold gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                {isSendingTest ? 'Testing...' : 'Send Test Comment Verification'}
              </Button>

              {testSent && isConnected && (
                <div className="flex items-start gap-2 p-3 border rounded-lg text-xs font-semibold mt-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-bold">Test connection verified successfully!</p>
                    <p className="text-[10px] font-medium mt-0.5 opacity-90">Instagram Graph API integration is active.</p>
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
        <span>Ensure your Facebook-linked Instagram account has Allow Access to Messages enabled in the Instagram App.</span>
      </div>

    </div>
  );
}
