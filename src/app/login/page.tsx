'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '@/store/useAuthStore';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { loginUser, fetchUserProfile } from '@/service/api/login/api';
import { getTenantSubscriptionListAPI } from '@/service/api/add-ons/superadmin-addon/api';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Shield,
  Activity,
  Layers,
  TrendingUp,
  CheckCircle2,
  LockKeyhole,
  Users,
  BarChart3
} from 'lucide-react';

// Custom high-fidelity Potted Plant SVG illustration
const PlantIcon = () => (
  <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-20 xl:w-20 xl:h-24 drop-shadow-xl select-none">
    <path d="M48 95 C15 75 8 50 25 20 C42 45 42 70 48 95 Z" fill="#0565FD" opacity="0.9" />
    <path d="M48 95 C25 75 20 60 30 35 C40 55 42 72 48 95 Z" fill="#0251cd" />
    <path d="M60 95 C45 60 45 30 60 5 C75 30 75 60 60 95 Z" fill="#0251cd" />
    <path d="M60 95 C52 65 52 40 60 18 C68 40 68 65 60 95 Z" fill="#013fa0" />
    <path d="M72 95 C105 75 112 50 95 20 C78 45 78 70 72 95 Z" fill="#3b88ff" opacity="0.9" />
    <path d="M72 95 C95 75 100 60 90 35 C80 55 78 72 72 95 Z" fill="#0565FD" />
    <path d="M52 95 C35 85 30 75 40 55 C48 70 50 82 52 95 Z" fill="#73a9ff" />
    <path d="M68 95 C85 85 90 75 80 55 C72 70 70 82 68 95 Z" fill="#5397ff" />
    <path d="M42 95 C42 95 38 128 38 130 C38 133 42 135 48 135 H72 C78 135 82 133 82 130 C82 128 78 95 78 95 H42 Z" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
    <path d="M38 95 H82 V99 H38 V95 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const BackgroundCloud = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);

const DASHBOARD_ROUTES: Record<string, string> = {
  'Admin': '/role-dashboard/admin',
  'CEO': '/role-dashboard/ceo',
  'Delivery Manager': '/role-dashboard/delivery',
  'Project Manager': '/role-dashboard/pm',
  'Project Lead': '/role-dashboard/project-lead',
  'Test Lead': '/role-dashboard/test-lead',
  'Developer': '/role-dashboard/developer',
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'reset'>('none');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useStore((state) => state.user);
  const { primaryColor, updateUserProfile } = useStore();

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      router.push(DASHBOARD_ROUTES[user.role] || '/');
    }
  }, [isAuthenticated, user?.role, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      // 1. Call auth_token endpoint via loginUser helper
      const loginData = await loginUser({ username: trimmedUsername, password }).catch((err: any) => {
        const errMsg = err.message || '';
        if (errMsg.includes('No active account found') || errMsg.includes('credentials')) {
          throw new Error('Invalid username or password');
        }
        if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
          throw new Error('Unable to connect to the authentication server. Please check your connection or tenant configuration.');
        }
        throw new Error(errMsg || 'Invalid username or password');
      });

      const token = loginData.access;
      if (!token) {
        throw new Error('Authentication token not received');
      }

      // 2. Save token to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', loginData.refresh);
      }

      // 3. Call UserCRUD_GET via fetchUserProfile helper
      const profileData = await fetchUserProfile(trimmedUsername, token).catch(() => {
        throw new Error('Failed to retrieve user profile details');
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('userId', profileData.id.toString());
        if (profileData.Organization_Id !== undefined && profileData.Organization_Id !== null) {
          localStorage.setItem('orgDetail', profileData.Organization_Id.toString());
          localStorage.setItem('Organization_Id', profileData.Organization_Id.toString());
        }
      }

      // 4. Fetch tenant subscription list and store Plan_Id
      try {
        const subscriptionData = await getTenantSubscriptionListAPI();
        if (typeof window !== 'undefined') {
          const results = subscriptionData?.results || subscriptionData?.data;
          const planId = (Array.isArray(results) && results.length > 0) ? results[0]?.Plan_Id : null;
          localStorage.setItem('Plan_Id', planId ? planId.toString() : '18');
        }
      } catch (subErr) {
        console.error('Failed to fetch tenant subscription list on login:', subErr);
        if (typeof window !== 'undefined') {
          localStorage.setItem('Plan_Id', '18');
        }
      }

      // 5. Update the user profile in store
      const updatedProfile = {
        id: profileData.id,
        name: [profileData.first_name, profileData.last_name].filter(Boolean).join(' ') || profileData.username || 'User',
        email: profileData.email || '',
        avatarUrl: profileData.User_Photo
          ? (profileData.User_Photo.startsWith('http') ? profileData.User_Photo : `https://backend.crmfarm.app${profileData.User_Photo}`)
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        jobTitle: profileData.Designation || '',
        role: profileData.Designation || '',
        phone: profileData.PhoneNo || '',
        location: [profileData.City, profileData.State, profileData.Country].filter(Boolean).join(', ') || 'India',
        workspace: profileData.Url || 'igrid-muthu/pegatto_erp_fe',
        workspaceRole: profileData.UserType || (profileData.is_superuser ? 'Administrator' : 'Member'),
        bio: profileData.bio || `Team ${profileData.Designation || ''} at Complete Business Solution.`,
        organizationId: profileData.Organization_Id,
      };

      updateUserProfile(updatedProfile);

      // 6. Set authenticated state
      login();

      toast.success(`Signed in successfully as ${updatedProfile.name}`);

      // 7. Route to dashboard
      const dashboardRoute = DASHBOARD_ROUTES[updatedProfile.role] || '/';
      router.push(dashboardRoute);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'An error occurred during login';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    setError('');
    toast.success('OTP sent to your email');
    setForgotStep('reset');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Please enter a new password'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    toast.success('Password updated successfully');
    setForgotStep('none');
  };

  const handleGoogleSignIn = () => {
    toast.info('Google Sign-In is not configured yet');
  };


  return (
    // Root: full viewport, no page scroll on desktop, completely responsive
    <div
      className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 overflow-y-auto lg:overflow-hidden"
      style={{ '--primary-custom': primaryColor } as React.CSSProperties}
    >

      {/* ═══════════════════════════════════════════════
          LEFT BRAND PANE — hidden on mobile/tablet, visible lg+
          Uses overflow-hidden + flex column to never overflow
      ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[54%] flex-col bg-gradient-to-tr from-[#d2e4fc] via-[#e5f0fe] to-[#c6dcf8] relative overflow-hidden h-full">

        {/* Dot grid top-left */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-[radial-gradient(#b8d4f7_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-35 pointer-events-none m-4 z-0" />

        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <div className="absolute top-10 right-0 w-80 h-80 bg-white/55 rounded-full blur-3xl" />

          {/* Clouds */}
          <BackgroundCloud className="absolute top-[6%] left-[10%] w-20 h-12 text-white/50 blur-[2.5px]" />
          <BackgroundCloud className="absolute top-[12%] right-[18%] w-24 h-16 text-white/55 blur-[3px]" />
          <BackgroundCloud className="absolute top-[18%] left-[30%] w-22 h-14 text-white/45 blur-[2px]" />
          <BackgroundCloud className="absolute top-[52%] right-[6%] w-26 h-16 text-white/55 blur-[2.5px]" />
          <BackgroundCloud className="absolute top-[59%] right-[12%] w-22 h-14 text-white/50 blur-[2px]" />
          <BackgroundCloud className="absolute bottom-[22%] left-[4%] w-28 h-18 text-white/50 blur-[2.5px]" />
          <BackgroundCloud className="absolute bottom-[14%] right-[8%] w-24 h-15 text-white/45 blur-[3px]" />
          <BackgroundCloud className="absolute bottom-[6%] left-[24%] w-20 h-12 text-white/40 blur-[2px]" />

          {/* Wave layers */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[52%]">
            <path d="M0,280 C200,220 500,360 800,260 C1100,160 1300,300 1440,240 L1440,600 L0,600 Z" fill="#ffffff" opacity="0.4" />
          </svg>
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[45%]">
            <path d="M0,320 C240,260 480,380 720,300 C960,220 1200,340 1440,280 L1440,600 L0,600 Z" fill="#f1f6fc" opacity="0.9" />
          </svg>
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[37%]">
            <path d="M0,350 C280,290 560,400 840,330 C1120,260 1280,360 1440,310 L1440,600 L0,600 Z" fill="#e7effa" />
          </svg>
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[30%]">
            <path d="M0,390 C320,320 640,440 960,370 C1280,300 1360,390 1440,360 L1440,600 L0,600 Z" fill="#dae7f6" />
          </svg>
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[22%]">
            <path d="M0,450 C360,390 720,490 1080,420 C1260,385 1350,440 1440,420 L1440,600 L0,600 Z" fill="#cbdff3" />
          </svg>
        </div>

        {/* Content column: logo → slogan+features → mockup */}
        <div className="relative z-10 flex flex-col justify-between h-full px-6 xl:px-10 py-3 sm:py-4 xl:py-6">

          {/* Logo */}
          <div className="flex items-center gap-2 select-none shrink-0">
            <img src="/login/logo.png" alt="Complete Business Solution Logo" className="h-8 xl:h-10 w-auto object-contain" />
            <span className="text-lg xl:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Complete Business <span className="text-blue-500">Solution</span>
            </span>
          </div>

          {/* Slogan + Features — grows to fill middle space */}
          <div className="flex-1 flex flex-col min-h-0 py-1 xl:py-2.5 justify-center">
            <div className="my-auto">
              <div className="space-y-1">
                <h1 className="text-[15px] lg:text-[17px] xl:text-[21px] font-extrabold tracking-tight text-[#0f172a] leading-[1.18]">
                  Smart <span className="text-blue-500">CRM.</span><br />
                  Stronger Relationships.<br />
                  Better Growth.
                </h1>
                <p className="text-slate-500 text-[10px] xl:text-xs leading-relaxed mt-0.5">
                  Manage leads, contacts, projects, tasks and your entire business in one place.
                </p>
              </div>

              {/* 2×2 Features Grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 xl:mt-3">
                {[
                  { icon: Users, title: 'Manage Contacts', desc: 'Organize and nurture customer relationships.' },
                  { icon: TrendingUp, title: 'Track Projects', desc: 'Plan, monitor and deliver projects efficiently.' },
                  { icon: CheckCircle2, title: 'Automate Tasks', desc: 'Automate workflows and improve productivity.' },
                  { icon: BarChart3, title: 'Powerful Reports', desc: 'Get real-time insights and make data-driven decisions.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-6 h-6 xl:w-8 xl:h-8 rounded-full bg-white shadow-sm border border-blue-50/30 shrink-0">
                      <div className="flex items-center justify-center w-3.5 h-3.5 xl:w-5 xl:h-5 rounded-full bg-blue-50 text-blue-600">
                        <item.icon className="w-2.5 h-2.5 xl:w-3 xl:h-3" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[10px] xl:text-xs text-[#0f172a]">{item.title}</h3>
                      <p className="text-[8.5px] xl:text-[10px] text-slate-500 leading-snug mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mock browser card — responsive height, never grows */}
          <div className="relative w-full shrink-0 mt-auto">
            {/* Plant decoration — sits at bottom-left of card area */}
            <div className="absolute bottom-0 -left-4 z-10 origin-bottom-left scale-80 xl:scale-95">
              <PlantIcon />
            </div>

            {/* Mock browser card */}
            <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/80 overflow-hidden ml-8 xl:ml-10"
              style={{ width: '82%' }}>
              {/* Browser bar */}
              <div className="bg-slate-50 border-b border-slate-100/80 px-4 py-1 flex items-center gap-1.5 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
              </div>

              {/* Dashboard mockup */}
              <div className="flex h-[125px] lg:h-[135px] xl:h-[175px] text-[10px] text-slate-650 select-none">
                {/* Sidebar */}
                <div className="w-10 xl:w-11 bg-[#161b26] flex flex-col items-center py-3.5 gap-3.5 border-r border-slate-800 shrink-0">
                  <div className="w-5 h-5 rounded-md bg-blue-600 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center text-blue-500">
                    <Layers className="w-3 h-3" />
                  </div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500">
                    <User className="w-3 h-3" />
                  </div>
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500">
                    <Activity className="w-3 h-3" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-2.5 xl:p-3 flex flex-col gap-2 overflow-hidden bg-slate-50/50">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="font-bold text-slate-800 text-[11px]">Dashboard</div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-2 rounded bg-slate-200/60"></div>
                      <div className="w-4 h-2 rounded bg-slate-300/30"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 xl:gap-2 shrink-0">
                    {[
                      { label: 'Total Leads', value: '1,248', growth: '↑ 15.8%' },
                      { label: 'Active Deals', value: '842', growth: '↑ 11.3%' },
                      { label: 'Won Deals', value: '328', growth: '↑ 9.8%' },
                    ].map((card, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-lg p-1.5 xl:p-2">
                        <div className="text-[7px] text-slate-400 font-medium leading-none">{card.label}</div>
                        <div className="font-bold text-slate-800 text-[11px] mt-1 leading-none">{card.value}</div>
                        <div className="text-[6px] text-emerald-500 font-semibold mt-0.5">{card.growth}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-5 gap-2 flex-1 min-h-0">
                    <div className="col-span-3 bg-white border border-slate-100 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="text-[8px] font-bold text-slate-700 leading-none">Lead Source</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <svg viewBox="0 0 100 100" className="w-7 h-7 xl:w-8 xl:h-8 shrink-0">
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="66" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="165" transform="rotate(18 50 50)" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="195" transform="rotate(108 50 50)" />
                          </svg>
                          <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 text-[5px] text-slate-400 font-medium">
                            <div className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-blue-500 shrink-0"></span>Website</div>
                            <div className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0"></span>Referral</div>
                            <div className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>Social</div>
                            <div className="flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>Other</div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-slate-50 pt-1">
                        <div className="text-[7px] font-bold text-slate-700">Sales Pipeline</div>
                        <div className="space-y-0.5 mt-0.5">
                          <div className="h-0.5 w-full bg-blue-500 rounded-sm"></div>
                          <div className="h-0.5 w-[80%] bg-blue-400 rounded-sm"></div>
                          <div className="h-0.5 w-[55%] bg-emerald-400 rounded-sm"></div>
                          <div className="h-0.5 w-[35%] bg-blue-200 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 bg-white border border-slate-100 rounded-lg p-2 flex flex-col gap-1 overflow-hidden">
                      <div className="text-[8px] font-bold text-slate-700 leading-none">Recent Activity</div>
                      <div className="space-y-1.5 mt-0.5">
                        {[
                          { initials: 'AR', name: 'Aarav Rao', action: 'created a deal', time: '2m ago', bg: 'bg-slate-800' },
                          { initials: 'PN', name: 'Priya Nair', action: 'updated contact', time: '15m ago', bg: 'bg-slate-500' },
                          { initials: 'VJ', name: 'Vikram J.', action: 'completed task', time: '1h ago', bg: 'bg-slate-900' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <div className={`w-4 h-4 rounded-full ${item.bg} text-white font-bold text-[5px] flex items-center justify-center shrink-0`}>{item.initials}</div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-700 text-[6px] truncate">{item.name}</div>
                                <div className="text-[5px] text-slate-400">{item.action}</div>
                              </div>
                            </div>
                            <div className="text-[5px] text-slate-400 shrink-0">{item.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT LOGIN PANE — full width on mobile/tablet, 46-50% on lg+
          Strictly no scrolling on desktop, fully responsive fit
      ═══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-between bg-[#f8fafc] dark:bg-slate-950 overflow-hidden h-full min-h-screen lg:min-h-0 lg:h-screen">

        {/* Inner wrapper: vertically centers the card without overflow */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-2 sm:py-3 w-full min-h-0">

          {/* Mobile logo — only shown below lg */}
          <div className="flex lg:hidden items-center gap-2 mb-3 select-none">
            <img src="/login/logo.png" alt="Complete Business Solution Logo" className="h-8 sm:h-9 w-auto object-contain" />
            <span className="text-base sm:text-lg font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
              Complete Business <span className="text-blue-600">Solution</span>
            </span>
          </div>

          {/* Form card */}
          <div className="w-full max-w-[340px] sm:max-w-[370px] xl:max-w-[400px] bg-white dark:bg-slate-900 rounded-[20px] sm:rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.035)] border border-slate-100/80 dark:border-slate-800 p-4 sm:p-5 lg:p-5.5 xl:p-7 transition-all">

            <AnimatePresence mode="wait">
              {forgotStep === 'none' ? (
                <motion.div
                  key="login-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-slate-100 text-center tracking-tight">Welcome Back!</h2>
                  <p className="text-slate-400 text-xs mt-0.5 mb-3 sm:mb-4 text-center font-medium">Login to your Complete Business Solution account</p>

                  <form onSubmit={handleLogin} className="space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Username</label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 h-9 sm:h-9.5 xl:h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Password</label>
                        <button
                          type="button"
                          onClick={() => router.push('/login/forgot-password')}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-9 py-1.5 h-9 sm:h-9.5 xl:h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="remember-me"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="remember-me" className="text-[11px] xl:text-xs font-medium text-slate-500 dark:text-slate-400 select-none cursor-pointer">
                        Remember me
                      </label>
                    </div>

                    {error && (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight">{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-semibold rounded-full shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer mt-1 disabled:opacity-75 h-9 sm:h-9.5 xl:h-10 flex items-center justify-center"
                    >
                      {loading ? 'Logging in...' : 'Login'}
                    </button>
                  </form>
                </motion.div>

              ) : forgotStep === 'email' ? (
                <motion.div
                  key="forgot-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-slate-100 text-center tracking-tight">Forgot Password</h2>
                  <p className="text-slate-400 text-xs mt-0.5 mb-3 sm:mb-4 text-center font-medium">Enter your email to receive an OTP code</p>

                  <form onSubmit={handleGenerateOTP} className="space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Email Address</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 h-9 sm:h-9.5 xl:h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                        />
                      </div>
                    </div>
                    {error && (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight">{error}</span>
                      </div>
                    )}
                    <button type="submit" className="w-full bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-semibold rounded-full shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer mt-1 h-9 sm:h-9.5 xl:h-10 flex items-center justify-center">
                      Generate OTP
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <button type="button" onClick={() => { setError(''); setForgotStep('none'); }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </button>
                  </div>
                </motion.div>

              ) : (
                <motion.div
                  key="reset-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] dark:text-slate-100 text-center tracking-tight">Reset Password</h2>
                  <p className="text-slate-400 text-xs mt-0.5 mb-3 sm:mb-4 text-center font-medium">Choose a strong password for your account</p>

                  <form onSubmit={handleSavePassword} className="space-y-2.5 sm:space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">New Password</label>
                      <div className="relative">
                        <LockKeyhole className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input type="password" placeholder="Enter new password" value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 h-9 sm:h-9.5 xl:h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Confirm Password</label>
                      <div className="relative">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-9 pr-4 py-1.5 h-9 sm:h-9.5 xl:h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400" />
                      </div>
                    </div>
                    {error && (
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight">{error}</span>
                      </div>
                    )}
                    <button type="submit" className="w-full bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-semibold rounded-full shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer mt-1 h-9 sm:h-9.5 xl:h-10 flex items-center justify-center">
                      Save Password
                    </button>
                  </form>

                  <div className="text-center mt-3">
                    <button type="button" onClick={() => { setError(''); setForgotStep('none'); }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer — always visible at the bottom of the right pane */}
        <div className="w-full px-4 sm:px-6 py-2 xl:py-2.5 border-t border-slate-100 dark:border-slate-900 shrink-0 bg-transparent">
          <div className="max-w-[340px] sm:max-w-[370px] xl:max-w-[400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 text-[10px] xl:text-[11px] text-slate-400 font-medium select-none text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Complete Business Solution.</span>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}