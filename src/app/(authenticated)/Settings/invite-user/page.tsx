'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  ShieldCheck, 
  Users, 
  Mail, 
  User, 
  ChevronDown, 
  Send, 
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';

export default function InviteUserPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  // Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address.');
      return;
    }
    if (!role) {
      toast.error('Please select a role.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast.success(`Invitation successfully sent to ${email} as ${role}!`);
      setEmail('');
      setRole('');
    }, 1500);
  };

  return (
    <div className="max-w-[1300px] mx-auto h-full lg:h-[calc(100vh-105px)] lg:max-h-[calc(100vh-105px)] lg:overflow-hidden flex items-center justify-center p-4 lg:p-6 font-sans text-left">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full h-full">
        
        {/* Left Side Panel: Marketing & Features */}
        <div className="lg:col-span-6 space-y-4 flex flex-col justify-between h-full py-2">
          
          <div className="space-y-4">
            {/* Header Icon */}
            <div 
              className="h-10 w-10 rounded-[5px] flex items-center justify-center border"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}
            >
              <Users className="h-5.5 w-5.5" />
            </div>

            {/* Title Block */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Invite Users. <br />
                <span style={{ color: primaryColor }}>Build Together.</span>
              </h1>
              <div className="h-1 w-12 bg-slate-350 dark:bg-slate-700 mt-2.5 rounded-[5px]" style={{ backgroundColor: primaryColor }} />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-md">
              Invite your team members by entering their email ID and assigning a role. 
              Let's collaborate and achieve more together! 😊
            </p>

            {/* Features List */}
            <div className="space-y-3.5 pt-2">
              
              {/* Feature 1 */}
              <div className="flex items-start gap-3">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border"
                  style={{ color: primaryColor, backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}
                >
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Grow Your Team</h4>
                  <p className="text-[10px] text-slate-450 font-semibold mt-0.5">Add the right people to your workspace.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Assign Roles</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-0.5">Give appropriate access and responsibilities.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-450 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-900/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Work Better Together</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-0.5">Empower your team to do great things together.</p>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Collaboration Illustration */}
          <div className="pt-2 flex justify-center lg:justify-start flex-1 min-h-0">
            <img 
              src="/invite_team_collaboration.png" 
              alt="Team Collaboration" 
              className="w-full lg:max-h-[340px] max-h-[200px] object-contain select-none"
            />
          </div>

        </div>

        {/* Right Side Panel: Form Card */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center h-full py-1">
          
          <Card className="w-full max-w-[420px] border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-md overflow-hidden py-2">
            <CardContent className="p-6 space-y-4 flex flex-col items-center text-center">
              
              {/* Header Icon */}
              <div 
                className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
              >
                <UserPlus className="h-7 w-7" />
              </div>

              {/* Header Title */}
              <div className="space-y-0.5">
                <h2 className="text-xl font-extrabold text-slate-850 dark:text-white tracking-tight">Invite a User</h2>
                <p className="text-[10px] text-slate-450 font-semibold max-w-[280px]">
                  Enter the details below to invite a new user.
                </p>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleSendInvitation} className="w-full space-y-4">
                
                {/* Email input */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="email" className="text-[11px] font-bold text-slate-700 dark:text-slate-205">Email ID *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter user email ID"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:border-slate-400"
                    />
                  </div>
                </div>

                {/* Role Dropdown */}
                <div className="space-y-1.5 text-left">
                  <label htmlFor="role" className="text-[11px] font-bold text-slate-700 dark:text-slate-205">Role *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <User className="h-4 w-4" />
                    </span>
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-9 pl-9 pr-9 border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a role</option>
                      <option value="Admin">Admin</option>
                      <option value="CEO">CEO</option>
                      <option value="Delivery Manager">Delivery Manager</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Project Lead">Project Lead</option>
                      <option value="Test Lead">Test Lead</option>
                      <option value="Developer">Developer</option>
                    </select>
                    <span className="absolute right-3.5 top-3 text-slate-400 pointer-events-none">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  type="submit"
                  disabled={isSending}
                  className="w-full h-9 text-xs font-bold text-white transition-opacity duration-200 flex items-center justify-center gap-2 rounded-[5px] border-none shadow-sm cursor-pointer mt-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSending ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>

              </form>

              {/* Alert Notice */}
              <div 
                className="flex items-start gap-2 p-3 rounded-[5px] text-[11px] font-semibold text-left border mt-2.5 w-full"
                style={{ color: primaryColor, backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
              >
                <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: primaryColor }} />
                <span className="leading-relaxed">An invitation email will be sent to the user with instructions to get started.</span>
              </div>

            </CardContent>
          </Card>

          {/* Footer Notice */}
          <div className="mt-4 text-center space-y-0.5 select-none">
            <p className="text-xs text-slate-450 italic font-medium">Great teams start with the right people.</p>
            <p className="text-base font-bold tracking-tight" style={{ color: primaryColor }}>
              ÷ Invite today! ÷
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
