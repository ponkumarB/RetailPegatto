'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  fetchKnowlarityConfig,
  fetchKnowlarityAgents,
  makeKnowlarityCall,
  fetchKnowlarityCallLogs,
  saveCallcenterActivity
} from '@/service/api/Leads/api';
import { useStore } from '@/store/useStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff, Loader2, X } from 'lucide-react';

interface KnowlarityConfig {
  API_Key: string;
  Header_Key: string;
  Knowlarity_Number: string;
  Knowlarity_CallerId: string;
}

interface ActiveLead {
  id: number | string;
  phone: string;
  name: string;
  organizationId?: number | string;
  companyName?: string;
  module?: string;
}

interface KnowlarityContextType {
  config: KnowlarityConfig | null;
  loading: boolean;
  isPlacingCall: boolean;
  activeLead: ActiveLead | null;
  makeCall: (phone: string, name: string, leadId: number | string, orgId?: number | string, companyName?: string, module?: string) => Promise<void>;
  isCallingOpen: boolean;
  setIsCallingOpen: (open: boolean) => void;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
}

const KnowlarityContext = createContext<KnowlarityContextType | undefined>(undefined);

export function KnowlarityProvider({ children }: { children: React.ReactNode }) {
  const { primaryColor } = useStore();
  const { isAuthenticated } = useAuthStore();
  const [config, setConfig] = useState<KnowlarityConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlacingCall, setIsPlacingCall] = useState(false);
  const [activeLead, setActiveLead] = useState<ActiveLead | null>(null);
  const [matchedAgentPhone, setMatchedAgentPhone] = useState<string | null>(null);
  const [isCallingOpen, setIsCallingOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Speaker and Mic active/mute state variables for UI controls
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOff, setIsMicOff] = useState(false);

  // Calling overlay status state
  const [callStatus, setCallStatus] = useState<'Connecting...' | 'Calling...' | 'Connected' | 'Hanging up...'>('Connecting...');

  // Call details returned from logs
  const [latestCallLog, setLatestCallLog] = useState<{
    duration: number;
    recording: string;
    uuid: string;
    businessCallType?: string;
  } | null>(null);

  // Form states
  const [formValues, setFormValues] = useState({
    status: 'Phone',
    conversationStatus: '',
    duration: 0,
    context: '',
    busyHour: 'No',
    nextScheduledDate: '',
    notes: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Load config on login time or mount
  useEffect(() => {
    const loadConfig = async () => {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      if (!userId) {
        setConfig(null);
        return;
      }

      setLoading(true);
      try {
        const res = await fetchKnowlarityConfig(userId);
        if (!res) {
          setConfig(null);
          return;
        }
        const configData = res?.results?.[0] || res?.[0] || res;
        if (configData && (configData.API_Key || configData.api_key || configData.apiKey)) {
          setConfig({
            API_Key: configData.API_Key || configData.api_key || configData.apiKey,
            Header_Key: configData.Header_Key || configData.header_key || configData.headerKey || 'Authorization',
            Knowlarity_Number: configData.Knowlarity_Number || configData.knowlarity_number || configData.knowlarityNumber,
            Knowlarity_CallerId: configData.Knowlarity_CallerId || configData.knowlarity_callerid || configData.knowlarityCallerId || configData.Knowlarity_Callerid,
          });
        } else {
          setConfig(null);
        }
      } catch (err: any) {
        const errorMsg = String(err?.message || err || '');
        if (!errorMsg.includes('matching query does not exist') && !errorMsg.includes('does not exist')) {
          console.warn('Failed to load Knowlarity config:', err);
        }
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [isAuthenticated]);

  const makeCall = async (phone: string, name: string, leadId: number | string, orgId?: number | string, companyName?: string, module?: string) => {
    if (!config) {
      toast.error('Knowlarity configuration not found. Please log in again or check system settings.');
      return;
    }

    setIsPlacingCall(true);
    // Reset toggle states on call initiation
    setIsMuted(false);
    setIsMicOff(false);

    try {
      // 1. Get agents
      const agentsRes = await fetchKnowlarityAgents(config.API_Key, config.Header_Key);
      const agents = agentsRes?.data?.objects || agentsRes?.objects || agentsRes?.agents || agentsRes?.data || agentsRes?.results || (Array.isArray(agentsRes) ? agentsRes : []);

      // 2. Identify agent
      const userDataStr = localStorage.getItem('userData');
      const userDetailsStr = localStorage.getItem('UserDetails');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;
      const userPhone = userDetails?.PhoneNo || userDetails?.phone || userData?.phone || userData?.PhoneNo || '';

      const normalizePhone = (num: any) => {
        if (!num) return '';
        const str = String(num);
        let clean = str.replace(/\D/g, '');
        if (clean.length > 10 && clean.startsWith('91')) {
          clean = clean.slice(2);
        }
        if (clean.length > 10) {
          clean = clean.slice(-10);
        }
        return clean;
      };

      const normalizedUserPhone = normalizePhone(userPhone);
      if (!normalizedUserPhone) {
        throw new Error('Your phone number is missing in user profile.');
      }

      const matchedAgent = agents.find((agent: any) =>
        normalizePhone(agent.phone || agent.phone_number || agent.number || agent.agent_number) === normalizedUserPhone
      );
      if (!matchedAgent) {
        throw new Error('Current user is not configured as a Knowlarity Agent.');
      }

      let matchedPhone = '';
      if (matchedAgent.country_code && matchedAgent.phone) {
        matchedPhone = matchedAgent.country_code + matchedAgent.phone;
      } else {
        matchedPhone = matchedAgent.phone || matchedAgent.phone_number || matchedAgent.number || matchedAgent.agent_number || '';
      }
      setMatchedAgentPhone(matchedPhone);
      setActiveLead({ id: leadId, phone, name, organizationId: orgId, companyName, module });

      // 3. Make call
      const cleanCustomerPhone = phone.replace(/\D/g, '');
      const formattedCustomerPhone = cleanCustomerPhone.length === 10 ? `+91${cleanCustomerPhone}` : `+${cleanCustomerPhone}`;

      const payload = {
        k_number: config.Knowlarity_Number,
        agent_number: matchedPhone,
        customer_number: formattedCustomerPhone,
        caller_id: config.Knowlarity_CallerId,
        caller_name: userData?.name || userData?.username || userDetails?.Username || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Agent'
      };

      const makeCallRes = await makeKnowlarityCall(payload, config.API_Key, config.Header_Key);
      if (makeCallRes && (makeCallRes.success === false || makeCallRes.status === 'error' || makeCallRes.response?.status === 'error')) {
        throw new Error(makeCallRes.message || makeCallRes.error || 'Knowlarity Make Call API returned a failure status.');
      }

      // Open popup on success
      setCallStatus('Connecting...');
      setIsCallingOpen(true);
      toast.success('Call placed successfully. Connecting...');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place call via Knowlarity');
      console.error(err);
    } finally {
      setIsPlacingCall(false);
    }
  };

  const handleHangUp = () => {
    setCallStatus('Hanging up...');
    setTimeout(() => {
      setIsCallingOpen(false);
    }, 1000);
  };

  // Watch isCallingOpen transition from true -> false to fetch call logs (Step 4 & 5)
  const prevCallingOpenRef = useRef(isCallingOpen);
  useEffect(() => {
    const fetchLogsAndOpenForm = async () => {
      toast.info('Fetching latest call logs...');
      try {
        const today = new Date().toISOString().split('T')[0];
        const userId = localStorage.getItem('userId') || '1';

        const logs = await fetchKnowlarityCallLogs({
          start_Date: today,
          end_Date: today,
          UserId: userId,
          Module: 'Lead'
        });

        const logsArray = Array.isArray(logs) ? logs : logs?.results || [];

        // Filter logs by agent phone as in the old project
        const userDetailsStr = localStorage.getItem('UserDetails');
        const userDataStr = localStorage.getItem('userData');
        const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : null;
        const userData = userDataStr ? JSON.parse(userDataStr) : null;
        const userPhone = userDetails?.PhoneNo || userDetails?.phone || userData?.phone || userData?.PhoneNo || '';

        const filteredLogs = userPhone
          ? logsArray.filter((item: any) => {
            const agentNum = item.Agent_Number || item.agent_number || item.AgentNumber || '';
            return String(agentNum).includes(userPhone);
          })
          : logsArray;

        const latestLog = filteredLogs[0] || logsArray[0];

        if (latestLog) {
          const durationVal = latestLog.CallDuration || latestLog.call_duration || latestLog.duration || latestLog.Call_Duration;
          const duration = typeof durationVal === 'number' ? durationVal : parseInt(durationVal || '0', 10);
          const recording = latestLog.CallRecording || latestLog.call_recording || latestLog.recording || latestLog.Call_Recording || '';
          const uuid = latestLog.UUID || latestLog.uuid || latestLog.Uuid || '';
          const businessCallType = latestLog.BusinessCallType || latestLog.business_call_type || latestLog.businessCallType || latestLog.Business_Call_Type || '';

          setLatestCallLog({
            duration,
            recording,
            uuid,
            businessCallType
          });

          // Autofill form
          setFormValues({
            status: 'Phone',
            conversationStatus: 'Connected',
            duration: duration,
            context: 'Follow-up',
            busyHour: 'No',
            nextScheduledDate: '',
            notes: ''
          });
        } else {
          // Defaults if no log record found
          setLatestCallLog(null);
          setFormValues({
            status: 'Phone',
            conversationStatus: '',
            duration: 0,
            context: '',
            busyHour: 'No',
            nextScheduledDate: '',
            notes: ''
          });
        }

        // Open activity form
        setIsFormOpen(true);
      } catch (err: any) {
        toast.error('Failed to fetch latest call logs. Opening form with defaults.');
        setLatestCallLog(null);
        setFormValues({
          status: 'Phone',
          conversationStatus: '',
          duration: 0,
          context: '',
          busyHour: 'No',
          nextScheduledDate: '',
          notes: ''
        });
        setIsFormOpen(true);
      }
    };

    if (prevCallingOpenRef.current && !isCallingOpen) {
      fetchLogsAndOpenForm();
    }
    prevCallingOpenRef.current = isCallingOpen;
  }, [isCallingOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.conversationStatus) {
      toast.error('Please select call conversation status.');
      return;
    }
    if (!formValues.context) {
      toast.error('Please select call context.');
      return;
    }

    setFormSubmitting(true);
    try {
      const userIdStr = localStorage.getItem('userId') || '1';
      const userId = parseInt(userIdStr, 10);
      const orgId = activeLead?.organizationId ? Number(activeLead.organizationId) : 1;

      const relates = activeLead?.module || 'Lead';
      const recordIdNum = activeLead?.id ? Number(activeLead.id) : null;

      const payload = {
        CallCenter_Id: latestCallLog?.uuid || '',
        Company_Name: activeLead?.companyName || '',
        Activity_relates: relates,
        Receiver_Name: activeLead?.name || '',
        Call_Duration: formValues.duration,
        Call_Recording: latestCallLog?.recording || '',
        Missed_Rank: 0,
        Call_Context: formValues.context,
        Call_Con_Status: formValues.conversationStatus,
        Call_Busy_hour: formValues.busyHour,
        Details: formValues.notes,
        Contact_Number: activeLead?.phone || '',
        Selected_Date: new Date().toISOString().split('T')[0],
        Select_Status: latestCallLog?.businessCallType || 'Phone',
        Next_SheduledTime: formValues.nextScheduledDate ? `${formValues.nextScheduledDate}:00Z` : new Date().toISOString(),
        Activity_Type: 'Call',
        Organization_Id: orgId,

        // ID fields: only the corresponding ID holds a value, all others null
        EducationalLead_Id: relates === 'EducationalLead' ? recordIdNum : null,
        EducationalDeal_Id: relates === 'EducationalDeal' ? recordIdNum : null,
        Contact_Id: relates === 'Contact' ? recordIdNum : null,
        Account_Id: relates === 'Company/Account' ? recordIdNum : null,
        Lead_Id: relates === 'Lead' ? recordIdNum : null,
        Leadunqual_Id: relates === 'Leadunqual' ? recordIdNum : null,
        RealestateLad_Id: (relates === 'RealestateLead' || relates === 'RealestateLad') ? recordIdNum : null,
        Deal_Id: relates === 'Deal' ? recordIdNum : null,
        RealestateDeal_Id: relates === 'RealestateDeal' ? recordIdNum : null,
        Reminder_Id: relates === 'Reminder' ? recordIdNum : null,
        Reminder_Payload: null,

        Created_By: userId,
        Updated_By: userId
      };

      await saveCallcenterActivity(payload);
      toast.success('Call activity saved successfully.');
      setIsFormOpen(false);
      setActiveLead(null);
      setLatestCallLog(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save call activity.');
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'AR';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <KnowlarityContext.Provider
      value={{
        config,
        loading,
        isPlacingCall,
        activeLead,
        makeCall,
        isCallingOpen,
        setIsCallingOpen,
        isFormOpen,
        setIsFormOpen
      }}
    >
      {children}

      {/* Premium Glassmorphic Calling Popup Modal */}
      <Dialog open={isCallingOpen} onOpenChange={setIsCallingOpen}>
        <DialogContent className="max-w-xs border-0 bg-transparent shadow-none p-0 flex flex-col items-center justify-center pointer-events-auto focus:outline-none">
          <div className="w-[310px] h-[390px] bg-slate-900 bg-opacity-95 backdrop-blur-2xl border border-white/10 rounded-[2.25rem] p-8 flex flex-col items-center justify-between text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/15 rounded-full blur-[80px] pointer-events-none" />

            {/* Top Close Button */}
            <button
              onClick={() => setIsCallingOpen(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white/80 transition-all cursor-pointer border-none bg-transparent outline-none p-1.5 rounded-full hover:bg-white/5"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Pulsing Avatar Area */}
            <div className="relative flex items-center justify-center w-28 h-28 mt-4">
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping [animation-duration:3s]" />
              <div className="absolute inset-2 rounded-full bg-indigo-500/15 animate-ping [animation-duration:2.5s] [animation-delay:0.5s]" />
              <div className="absolute inset-4 rounded-full bg-sky-500/20 animate-ping [animation-duration:2s] [animation-delay:1s]" />
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-2 border-white/20 text-white font-extrabold text-2xl shadow-xl relative z-10 flex items-center justify-center">
                {activeLead ? getInitials(activeLead.name) : 'AR'}
              </div>
            </div>

            {/* User details */}
            <div className="text-center space-y-1 z-10">
              <h2 className="text-xl font-bold tracking-tight text-white capitalize drop-shadow-md">
                {activeLead ? activeLead.name : 'Unknown'}
              </h2>
              <p className="text-xs font-semibold text-slate-350 tracking-wide mt-1">
                {activeLead ? activeLead.phone : ''}
              </p>
            </div>

            {/* Connecting status */}
            <div className="text-center z-10 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-blue-400/90 flex items-center gap-1.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                {callStatus}
              </span>
            </div>

            {/* Premium Control buttons */}
            <div className="flex items-center gap-6 mb-4 z-10">
              {/* Speaker button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-white/25 active:scale-95 cursor-pointer ${isMuted ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-400/20' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>

              {/* End call button (red hangup) */}
              <button
                type="button"
                onClick={handleHangUp}
                className="h-15 w-15 rounded-full bg-red-500 hover:bg-red-650 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)] border-none transition-all hover:scale-105 active:scale-95 cursor-pointer text-white"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              {/* Mute button */}
              <button
                type="button"
                onClick={() => setIsMicOff(!isMicOff)}
                className={`h-11 w-11 rounded-full flex items-center justify-center transition-all border border-white/10 hover:border-white/25 active:scale-95 cursor-pointer ${isMicOff ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)] border-amber-400/20' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                {isMicOff ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Call Activity Form Modal (Create Call Notes) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl dark:bg-slate-900 dark:border-slate-800 border border-slate-200 bg-white p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold dark:text-white text-left tracking-tight text-slate-900">
              Create Call Notes
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-left text-xs font-semibold mt-1">
              Log call details for <span className="text-blue-600 dark:text-blue-400 font-bold">{activeLead?.name}</span> ({activeLead?.phone})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs py-2 text-left">
            <div className="grid grid-cols-2 gap-4">
              {/* Call Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Call Status
                </label>
                <Input
                  value="Phone"
                  disabled
                  className="h-10 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 cursor-not-allowed font-semibold text-slate-500"
                />
              </div>

              {/* Call Conversation Status */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Call Conversation Status <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formValues.conversationStatus}
                  onValueChange={(val) => setFormValues({ ...formValues, conversationStatus: val || '' })}
                >
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-400">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="Connected" className="font-semibold text-xs">Connected</SelectItem>
                    <SelectItem value="Busy" className="font-semibold text-xs">Busy</SelectItem>
                    <SelectItem value="No Answer" className="font-semibold text-xs">No Answer</SelectItem>
                    <SelectItem value="Wrong Number" className="font-semibold text-xs">Wrong Number</SelectItem>
                    <SelectItem value="Follow-up Required" className="font-semibold text-xs">Follow-up Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Call Duration (Seconds) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Call Duration (Seconds)
                </label>
                <Input
                  type="number"
                  placeholder="Duration in seconds"
                  value={formValues.duration || ''}
                  onChange={(e) => setFormValues({ ...formValues, duration: parseInt(e.target.value, 10) || 0 })}
                  className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                />
              </div>

              {/* Call Context */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Call Context <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formValues.context}
                  onValueChange={(val) => setFormValues({ ...formValues, context: val || '' })}
                >
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/50 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-400">
                    <SelectValue placeholder="Select Context" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="Lead Inquiry" className="font-semibold text-xs">Lead Inquiry</SelectItem>
                    <SelectItem value="Follow-up" className="font-semibold text-xs">Follow-up</SelectItem>
                    <SelectItem value="Sales Pitch" className="font-semibold text-xs">Sales Pitch</SelectItem>
                    <SelectItem value="Feedback" className="font-semibold text-xs">Feedback</SelectItem>
                    <SelectItem value="Support" className="font-semibold text-xs">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Call Busy Hour */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Call Busy Hour <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formValues.busyHour}
                  onValueChange={(val) => setFormValues({ ...formValues, busyHour: val || '' })}
                >
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-slate-400">
                    <SelectValue placeholder="Select Busy Hour" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="Yes" className="font-semibold text-xs">Yes</SelectItem>
                    <SelectItem value="No" className="font-semibold text-xs">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Scheduled Date */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                  Next Scheduled Date
                </label>
                <Input
                  type="datetime-local"
                  value={formValues.nextScheduledDate}
                  onChange={(e) => setFormValues({ ...formValues, nextScheduledDate: e.target.value })}
                  className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Notes
              </label>
              <textarea
                placeholder="Enter call notes here..."
                value={formValues.notes}
                onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[100px] focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
              />
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormOpen(false)}
                className="font-semibold text-xs rounded-lg h-9 border-slate-200 dark:border-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold text-xs rounded-lg h-9 hover:opacity-90 active:scale-95 transition-all shadow-md"
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </KnowlarityContext.Provider>
  );
}

export function useKnowlarity() {
  const context = useContext(KnowlarityContext);
  if (context === undefined) {
    throw new Error('useKnowlarity must be used within a KnowlarityProvider');
  }
  return context;
}
