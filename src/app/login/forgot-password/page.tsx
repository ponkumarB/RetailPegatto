'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Shield,
  Activity,
  Layers,
  User,
  TrendingUp,
  CheckCircle2,
  Users,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  Check
} from 'lucide-react';

// Custom high-fidelity Potted Plant SVG illustration
const PlantIcon = () => (
  <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-20 h-24 drop-shadow-xl select-none">
    {/* Leaves - Theme Blue (#0565FD) */}
    {/* Left Leaf */}
    <path d="M48 95 C15 75 8 50 25 20 C42 45 42 70 48 95 Z" fill="#0565FD" opacity="0.9" />
    <path d="M48 95 C25 75 20 60 30 35 C40 55 42 72 48 95 Z" fill="#0251cd" />

    {/* Tall Center Leaf */}
    <path d="M60 95 C45 60 45 30 60 5 C75 30 75 60 60 95 Z" fill="#0251cd" />
    <path d="M60 95 C52 65 52 40 60 18 C68 40 68 65 60 95 Z" fill="#013fa0" />

    {/* Right Leaf */}
    <path d="M72 95 C105 75 112 50 95 20 C78 45 78 70 72 95 Z" fill="#3b88ff" opacity="0.9" />
    <path d="M72 95 C95 75 100 60 90 35 C80 55 78 72 72 95 Z" fill="#0565FD" />

    {/* Front Left Small Leaf */}
    <path d="M52 95 C35 85 30 75 40 55 C48 70 50 82 52 95 Z" fill="#73a9ff" />

    {/* Front Right Small Leaf */}
    <path d="M68 95 C85 85 90 75 80 55 C72 70 70 82 68 95 Z" fill="#5397ff" />

    {/* Pot */}
    <path d="M42 95 C42 95 38 128 38 130 C38 133 42 135 48 135 H72 C78 135 82 133 82 130 C82 128 78 95 78 95 H42 Z" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
    <path d="M38 95 H82 V99 H38 V95 Z" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

// Custom background cloud component
const BackgroundCloud = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);

// Padlock with paper airplane SVG illustration
const PadlockIllustration = () => (
  <div className="relative w-28 h-28 flex items-center justify-center select-none animate-pulse">
    {/* Soft blue background circle */}
    <div className="w-20 h-20 rounded-full bg-blue-50/80 dark:bg-blue-950/40 flex items-center justify-center relative shadow-inner">
      {/* Padlock Icon */}
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 text-blue-600 dark:text-blue-500">
        <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" />
        <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="12" cy="15" r="1.5" fill="white" />
        <path d="M12 16.5V18" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Small floating paper airplane */}
      <div className="absolute -top-1 -right-2 scale-90">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-blue-400">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" />
        </svg>
      </div>

      {/* Dotted curve trail */}
      <svg className="absolute -top-3 -right-3 w-14 h-14 pointer-events-none" viewBox="0 0 60 60" fill="none">
        <path d="M10 50 C25 40 45 35 50 15" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  </div>
);

export default function ForgotPasswordPage() {
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timer, setTimer] = useState(59);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Password reset state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { primaryColor } = useStore();

  // Timer Countdown logic for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (forgotStep === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotStep, timer]);

  // Dynamic Password validation constraints
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const matchedCount = [hasMinLength, hasMixedCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  let strengthLabel = 'Weak';
  let strengthColor = 'text-rose-500';
  if (matchedCount === 3) {
    strengthLabel = 'Medium';
    strengthColor = 'text-amber-500';
  } else if (matchedCount === 4) {
    strengthLabel = 'Strong';
    strengthColor = 'text-emerald-500';
  }

  // OTP focus shift handler
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Shift focus to next input field if filled
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('OTP verification code sent to your email');
      setForgotStep('otp');
      setTimer(59);
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fullCode = otp.join('');
    if (fullCode.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Identity verified successfully');
      setForgotStep('reset');
    }, 1000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (matchedCount < 3) {
      setError('Password is too weak. Please meet at least 3 requirements');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password updated successfully');
      router.push('/login');
    }, 1200);
  };

  const handleResendOtp = () => {
    if (timer > 0) return;
    setOtp(Array(6).fill(''));
    setTimer(59);
    toast.success('A new verification code has been sent');
  };

  const handleGoogleSignIn = () => {
    toast.info('Google integration is not configured yet');
  };

  return (
    <div
      className="min-h-screen lg:h-screen w-full flex bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 overflow-y-auto lg:overflow-hidden relative"
      style={{ '--primary-custom': primaryColor } as React.CSSProperties}
    >
      {/* 1. Left Brand Showcase Pane */}
      <div className="hidden lg:flex w-[45%] flex-col justify-between items-center p-10 xl:p-12 bg-gradient-to-tr from-[#d2e4fc] via-[#e5f0fe] to-[#c6dcf8] relative overflow-hidden h-full select-none">

        {/* Subtle grid of dots in the top-left */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-[radial-gradient(#b8d4f7_1.5px,transparent_1.5px)] [background-size:16px_16px] opacity-35 pointer-events-none m-4 z-0" />

        {/* Layered clouds/waves background */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          {/* Top-right soft light cloud/gradient blur */}
          <div className="absolute top-10 right-0 w-80 h-80 bg-white/55 rounded-full blur-3xl" />

          {/* Floating clouds in the background */}
          <BackgroundCloud className="absolute top-[6%] left-[10%] w-20 h-12 text-white/50 blur-[2.5px] pointer-events-none" />
          <BackgroundCloud className="absolute top-[12%] right-[18%] w-24 h-16 text-white/55 blur-[3px] pointer-events-none" />
          <BackgroundCloud className="absolute top-[18%] left-[30%] w-22 h-14 text-white/45 blur-[2px] pointer-events-none" />
          <BackgroundCloud className="absolute top-[52%] right-[6%] w-26 h-16 text-white/55 blur-[2.5px] pointer-events-none" />
          <BackgroundCloud className="absolute top-[59%] right-[12%] w-22 h-14 text-white/50 blur-[2px] pointer-events-none" />
          <BackgroundCloud className="absolute bottom-[22%] left-[4%] w-28 h-18 text-white/50 blur-[2.5px] pointer-events-none" />
          <BackgroundCloud className="absolute bottom-[14%] right-[8%] w-24 h-15 text-white/45 blur-[3px] pointer-events-none" />
          <BackgroundCloud className="absolute bottom-[6%] left-[24%] w-20 h-12 text-white/40 blur-[2px] pointer-events-none" />

          {/* Layer 5 wave */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[52%] translate-y-2">
            <path d="M0,280 C200,220 500,360 800,260 C1100,160 1300,300 1440,240 L1440,600 L0,600 Z" fill="#ffffff" opacity="0.4" />
          </svg>

          {/* Layer 4 wave */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[45%] translate-y-2">
            <path d="M0,320 C240,260 480,380 720,300 C960,220 1200,340 1440,280 L1440,600 L0,600 Z" fill="#f1f6fc" opacity="0.9" />
          </svg>

          {/* Layer 3 wave */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[37%] translate-y-2">
            <path d="M0,350 C280,290 560,400 840,330 C1120,260 1280,360 1440,310 L1440,600 L0,600 Z" fill="#e7effa" />
          </svg>

          {/* Layer 2 wave */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[30%] translate-y-2">
            <path d="M0,390 C320,320 640,440 960,370 C1280,300 1360,390 1440,360 L1440,600 L0,600 Z" fill="#dae7f6" />
          </svg>

          {/* Layer 1 wave */}
          <svg viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[22%] translate-y-2">
            <path d="M0,450 C360,390 720,490 1080,420 C1260,385 1350,440 1440,420 L1440,600 L0,600 Z" fill="#cbdff3" />
          </svg>
        </div>

        {/* Outer Layout wrapper */}
        <div className="flex flex-col justify-between h-full z-10 relative">

          {/* Stage 1: Top Logo Container */}
          <div className="flex items-center gap-2 select-none shrink-0">
            <img src="/logo_blue.png" alt="CRMFarm IT Logo" className="w-8 h-8 object-contain" />
            <span className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
              CRMFarm <span className="text-blue-500">IT</span>
            </span>
          </div>

          {/* Stage 2: Slogan & Features */}
          <div className="my-auto py-4 max-w-[490px] w-full shrink-0">
            {/* Slogan block */}
            <div className="space-y-3">
              <h1 className="text-3xl xl:text-[35px] font-extrabold tracking-tight text-[#0f172a] leading-[1.15]">
                Smart <span className="text-blue-500">CRM.</span><br />
                Stronger Relationships.<br />
                Better Growth.
              </h1>
              <p className="text-slate-500 text-xs xl:text-sm leading-relaxed mt-1.5">
                Manage leads, contacts, projects, tasks and your entire business in one place.
              </p>
            </div>

            {/* 2x2 Features Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mt-2">
              {[
                {
                  icon: Users,
                  title: 'Manage Contacts',
                  desc: 'Organize and nurture customer relationships.',
                },
                {
                  icon: TrendingUp,
                  title: 'Track Projects',
                  desc: 'Plan, monitor and deliver projects efficiently.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Automate Tasks',
                  desc: 'Automate workflows and improve productivity.',
                },
                {
                  icon: BarChart3,
                  title: 'Powerful Reports',
                  desc: 'Get real-time insights and make data-driven decisions.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-sm border border-blue-50/30 shrink-0">
                    <div className="flex items-center justify-center w-7.5 h-7.5 rounded-full bg-blue-50 text-blue-600">
                      <item.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs xl:text-sm text-[#0f172a]">{item.title}</h3>
                    <p className="text-[10px] xl:text-xs text-slate-500 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 3: Bottom Mockup */}
          <div className="relative w-full max-w-[490px] shrink-0 mt-auto pb-4">
            <div className="absolute bottom-0 left-0 z-10 scale-120 origin-bottom-left">
              <PlantIcon />
            </div>

            {/* Mock Browser Card */}
            <div className="w-full bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/80 overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-100/80 px-4 py-2 flex items-center gap-1.5 shrink-0 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-350"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-350"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-350"></div>
              </div>

              {/* Main mockup workspace */}
              <div className="flex h-[235px] text-[10px] text-slate-650 select-none">
                {/* Sidebar */}
                <div className="w-11 bg-[#161b26] flex flex-col items-center py-3.5 gap-4 border-r border-slate-800 shrink-0">
                  <div className="w-5.5 h-5.5 rounded-md bg-blue-600 flex items-center justify-center text-white">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                  </div>
                  <div className="w-5.5 h-5.5 rounded-md bg-slate-850 flex items-center justify-center text-blue-500">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-hidden bg-slate-50/50">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="font-bold text-slate-800 text-[11px] leading-none">Dashboard</div>
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-2 rounded bg-slate-200/60"></div>
                      <div className="w-4 h-2 rounded bg-slate-350/30"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="bg-white border border-slate-100 rounded-lg p-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                      <div className="text-[7.5px] text-slate-400 font-medium leading-none">Total Leads</div>
                      <div className="font-bold text-slate-800 text-[12px] mt-1.5 leading-none">1,248</div>
                      <div className="text-[6.5px] text-emerald-500 font-semibold mt-1 flex items-center leading-none">↑ 15.8%</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-lg p-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                      <div className="text-[7.5px] text-slate-400 font-medium leading-none">Active Deals</div>
                      <div className="font-bold text-slate-800 text-[12px] mt-1.5 leading-none">842</div>
                      <div className="text-[6.5px] text-emerald-500 font-semibold mt-1 flex items-center leading-none">↑ 11.3%</div>
                    </div>
                    <div className="bg-white border border-slate-100 rounded-lg p-2 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                      <div className="text-[7.5px] text-slate-400 font-medium leading-none">Won Deals</div>
                      <div className="font-bold text-slate-800 text-[12px] mt-1.5 leading-none">328</div>
                      <div className="text-[6.5px] text-emerald-500 font-semibold mt-1 flex items-center leading-none">↑ 9.8%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2.5 flex-1 min-h-0">
                    {/* Left stats */}
                    <div className="col-span-3 bg-white border border-slate-100 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
                      <div>
                        <div className="text-[8.5px] font-bold text-slate-700 leading-none">Lead Source</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <svg viewBox="0 0 100 100" className="w-8 h-8 shrink-0">
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="66" transform="rotate(-90 50 50)" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="165" transform="rotate(18 50 50)" />
                            <circle cx="50" cy="50" r="35" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="219.9" strokeDashoffset="195" transform="rotate(108 50 50)" />
                          </svg>
                          <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[5.5px] text-slate-400 font-medium shrink-0">
                            <div className="flex items-center gap-0.5"><span className="w-0.5 h-0.5 rounded-full bg-blue-500"></span>Website</div>
                            <div className="flex items-center gap-0.5"><span className="w-0.5 h-0.5 rounded-full bg-emerald-500"></span>Referral</div>
                            <div className="flex items-center gap-0.5"><span className="w-0.5 h-0.5 rounded-full bg-amber-500"></span>Social</div>
                            <div className="flex items-center gap-0.5"><span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>Other</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-50 pt-1">
                        <div className="text-[8px] font-bold text-slate-700 leading-none">Sales Pipeline</div>
                        <div className="space-y-0.5 mt-1">
                          <div className="h-0.5 w-full bg-blue-500 rounded-sm"></div>
                          <div className="h-0.5 w-[80%] bg-blue-400 rounded-sm"></div>
                          <div className="h-0.5 w-[55%] bg-emerald-400 rounded-sm"></div>
                          <div className="h-0.5 w-[35%] bg-blue-200 rounded-sm"></div>
                        </div>
                      </div>
                    </div>

                    {/* Right activities list */}
                    <div className="col-span-2 bg-white border border-slate-100 rounded-lg p-2 flex flex-col gap-1.5 overflow-hidden">
                      <div className="text-[8.5px] font-bold text-slate-700 leading-none">Recent Activities</div>
                      <div className="space-y-2 flex-1 overflow-hidden mt-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-slate-800 text-white font-bold text-[5.5px] flex items-center justify-center shrink-0">AR</div>
                            <div className="min-w-0 leading-none scale-85 origin-left">
                              <div className="font-semibold text-slate-755 truncate">Aarav Rao</div>
                              <div className="text-[4.5px] text-slate-400 mt-0.5">created a new deal</div>
                            </div>
                          </div>
                          <div className="text-[4.5px] text-slate-400 shrink-0 font-medium scale-90">2m ago</div>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-slate-500 text-white font-bold text-[5.5px] flex items-center justify-center shrink-0">PN</div>
                            <div className="min-w-0 leading-none scale-85 origin-left">
                              <div className="font-semibold text-slate-755 truncate">Priya Nair</div>
                              <div className="text-[4.5px] text-slate-400 mt-0.5">updated a contact</div>
                            </div>
                          </div>
                          <div className="text-[4.5px] text-slate-400 shrink-0 font-medium scale-90">15m ago</div>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[5.5px] flex items-center justify-center shrink-0">VJ</div>
                            <div className="min-w-0 leading-none scale-85 origin-left">
                              <div className="font-semibold text-slate-755 truncate">Vikram Joshi</div>
                              <div className="text-[4.5px] text-slate-400 mt-0.5">completed a task</div>
                            </div>
                          </div>
                          <div className="text-[4.5px] text-slate-400 shrink-0 font-medium scale-90">1h ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Forgot Password Pane */}
      <div className="w-full lg:w-[55%] flex flex-col justify-between items-center py-6 px-4 sm:px-8 md:px-12 lg:px-14 bg-[#f8fafc] dark:bg-slate-955 relative min-h-screen lg:h-full lg:overflow-y-auto select-none">

        {/* Main Content Area: centered card */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-8 md:py-12">

          {/* Mobile Logo Branding (visible only on mobile) */}
          <div className="flex lg:hidden items-center gap-2 mb-6 select-none">
            <img src="/logo_blue.png" alt="CRMFarm IT Logo" className="w-7 h-7 object-contain" />
            <span className="text-xl font-extrabold text-[#0f172a] dark:text-slate-100 tracking-tight">
              CRMFarm <span className="text-blue-600">IT</span>
            </span>
          </div>

          {/* Form Card Container */}
          <div className="w-full bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.035)] border border-slate-100/80 dark:border-slate-850 p-5 sm:p-6 md:p-8 flex flex-col shrink-0 max-w-[500px] relative min-h-[500px] lg:h-[530px]">
            <AnimatePresence mode="wait">
              {forgotStep === 'email' ? (
                <motion.div
                  key="email-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  {/* Back to Sign In Link inside card */}
                  <button
                    onClick={() => router.push('/login')}
                    className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 focus:outline-none cursor-pointer transition-colors z-20"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Sign In
                  </button>

                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    <div className="flex flex-col items-center mt-3">
                      {/* Padlock Illustration */}
                      <PadlockIllustration />

                      <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-[#0f172a] dark:text-slate-100 text-center tracking-tight leading-none mt-3">Forgot Password?</h2>
                      <p className="text-slate-400 text-xs xl:text-sm mt-2 mb-4 text-center font-medium leading-relaxed max-w-[320px]">
                        No worries! Enter your email address and we&apos;ll send you a link to reset your password.
                      </p>
                    </div>

                    <form onSubmit={handleSendResetLink} className="space-y-4">
                      {/* Email Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400"
                          />
                        </div>
                      </div>

                      {/* Error Box */}
                      {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-455 text-xs">
                          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-semibold py-2.5 h-11 rounded-full shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer mt-3 flex items-center justify-center disabled:opacity-70"
                      >
                        {loading ? 'Sending Link...' : 'Send Reset Link'}
                      </button>
                    </form>

                    {/* Or Divider */}
                    <div className="relative my-4 text-center select-none">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200/80 dark:border-slate-800"></div>
                      </div>
                      <span className="relative px-3 bg-white dark:bg-slate-900 text-slate-400 text-[11px] font-semibold">or</span>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-full transition-all flex items-center justify-center gap-2 text-xs xl:text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer active:scale-[0.99]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      Send Reset Link with Google
                    </button>
                  </div>

                  {/* Secure & Protected Footer Banner inside card */}
                  <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl p-3 flex items-start gap-3 mt-4 shrink-0">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-bold text-xs text-[#0f172a] dark:text-slate-200 leading-none">Secure & Protected</h4>
                      <p className="text-[10px] xl:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        We take your security seriously. Your information is safe with us.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : forgotStep === 'otp' ? (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  {/* Back to Email Link inside card */}
                  <button
                    onClick={() => {
                      setError('');
                      setForgotStep('email');
                    }}
                    className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 focus:outline-none cursor-pointer transition-colors z-20"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  <div className="flex-1 flex flex-col justify-center space-y-5">
                    <div className="flex flex-col items-center mt-3">
                      <PadlockIllustration />
                      <h2 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-[#0f172a] dark:text-slate-100 text-center tracking-tight leading-none mt-3">Enter OTP Code</h2>
                      <p className="text-slate-400 text-xs xl:text-sm mt-2 mb-6 text-center font-medium leading-relaxed max-w-[320px]">
                        We sent a 6-digit verification code to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                      {/* 6 Segmented Input fields */}
                      <div className="flex justify-between items-center gap-2 max-w-[340px] mx-auto">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => { otpInputsRef.current[idx] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target, idx)}
                            onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                            className="w-11 h-11 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-center text-lg font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all bg-white dark:bg-slate-900"
                          />
                        ))}
                      </div>

                      {/* Error Box */}
                      {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs">
                          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Resend Cooldown Counter */}
                      <div className="text-center text-xs font-semibold text-slate-400">
                        {timer > 0 ? (
                          <span>Resend code in <span className="text-blue-600 font-mono">00:{timer < 10 ? `0${timer}` : timer}</span></span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-semibold py-2.5 h-11 rounded-full shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer flex items-center justify-center disabled:opacity-70"
                      >
                        {loading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </form>
                  </div>

                  {/* Secure & Protected Footer Banner inside card (OTP step) */}
                  <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl p-3 flex items-start gap-3 mt-4 shrink-0">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-bold text-xs text-[#0f172a] dark:text-slate-200 leading-none">Secure & Protected</h4>
                      <p className="text-[10px] xl:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        We take your security seriously. Your information is safe with us.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="reset-step"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full flex flex-col justify-between"
                >
                  <div className="flex-1 flex flex-col justify-center space-y-4">
                    {/* Change password header - image layout */}
                    <div className="flex items-center gap-3 w-full border-b dark:border-slate-800 pb-3 mb-4 text-left">
                      <div className="w-10 h-10 rounded-full bg-blue-50/80 dark:bg-blue-950/45 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 dark:text-blue-400">
                          <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" />
                          <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="15" r="1.5" fill="white" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-[#0f172a] dark:text-white leading-tight">Change Password</h2>
                        <p className="text-[10px] xl:text-xs text-slate-400 font-semibold mt-0.5 leading-none">Update your password to keep your account secure.</p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4 text-left">
                      {/* New Password Input */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">New Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-2 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-450"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Password Strength Indicator */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">Password Strength:</span>
                          <span className={strengthColor}>{strengthLabel}</span>
                        </div>
                        {/* Strength Bars */}
                        <div className="flex gap-1 pt-1">
                          {[1, 2, 3, 4].map((barIdx) => {
                            const isFilled = matchedCount >= barIdx;
                            let barColorClass = 'bg-slate-200 dark:bg-slate-800';
                            if (isFilled) {
                              if (strengthLabel === 'Weak') barColorClass = 'bg-rose-500';
                              else if (strengthLabel === 'Medium') barColorClass = 'bg-amber-500';
                              else barColorClass = 'bg-emerald-500';
                            }
                            return (
                              <div key={barIdx} className={`h-1 flex-1 rounded-sm transition-all duration-300 ${barColorClass}`} />
                            );
                          })}
                        </div>

                        {/* Constraints list */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2.5 text-[10px] xl:text-xs font-semibold text-slate-450">
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={hasMinLength ? 'text-slate-700 dark:text-slate-350' : 'text-slate-400'}>At least 8 characters long</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={hasNumber ? 'text-slate-700 dark:text-slate-350' : 'text-slate-400'}>Contains a number</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${hasMixedCase ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={hasMixedCase ? 'text-slate-700 dark:text-slate-350' : 'text-slate-400'}>Uppercase and lowercase</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Check className={`w-3.5 h-3.5 ${hasSpecialChar ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className={hasSpecialChar ? 'text-slate-700 dark:text-slate-350' : 'text-slate-400'}>Special character (e.g. !)</span>
                          </div>
                        </div>
                      </div>

                      {/* Confirm New Password Input */}
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Confirm New Password</label>
                        <div className="relative">
                          <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-11 pr-11 py-2 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all text-xs xl:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-450"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Error Box */}
                      {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-455 text-xs">
                          <Shield className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Action buttons side-by-side */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-bold py-2 rounded-lg shadow-lg shadow-blue-500/10 transition-all text-xs xl:text-sm cursor-pointer h-10 flex items-center justify-center disabled:opacity-70"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push('/login')}
                          className="flex-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all font-bold text-xs xl:text-sm text-slate-700 dark:text-slate-350 cursor-pointer h-10 active:scale-[0.99]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Shield Tip Footer Banner inside card */}
                  <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-2xl p-3 flex items-start gap-3 mt-4 text-left shrink-0">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] xl:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">Keeping your password strong helps protect your account and sensitive data. Avoid using personal information or common words.</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer section */}
        <div className="w-full max-w-[500px] mx-auto px-4 md:px-0 flex flex-col md:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-900 text-[9px] text-slate-400 font-medium select-none z-10 shrink-0 pb-1">
          <span>&copy; 2024 CRMFarm IT. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-slate-650 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  );
}
